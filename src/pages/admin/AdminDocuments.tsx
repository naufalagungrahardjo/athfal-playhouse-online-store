import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FileText, FileImage, Trash2, Upload, FilePlus, Search, Users } from "lucide-react";
import { format } from "date-fns";

interface ParentDocument {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_name: string | null;
  created_at: string;
  recipient_emails: string[] | null;
}

interface Recipient {
  email: string;
  name: string;
  child_names: string | null;
}

const AdminDocuments = () => {
  const [docs, setDocs] = useState<ParentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
  const [recipientSearch, setRecipientSearch] = useState("");

  const fetchDocs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("parent_documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load documents");
    setDocs((data as ParentDocument[]) || []);
    setLoading(false);
  };

  const fetchRecipients = async () => {
    const { data } = await supabase.rpc("list_parent_document_recipients" as any);
    setRecipients((data as Recipient[]) || []);
  };

  useEffect(() => {
    fetchDocs();
    fetchRecipients();
  }, []);

  const toggleEmail = (email: string) => {
    setSelectedEmails((prev) =>
      prev.includes(email) ? prev.filter((e) => e !== email) : [...prev, email]
    );
  };

  const filteredRecipients = recipients.filter((r) => {
    const q = recipientSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      r.email.toLowerCase().includes(q) ||
      r.name.toLowerCase().includes(q) ||
      (r.child_names || "").toLowerCase().includes(q)
    );
  });

  const handleUpload = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    if (!file) {
      toast.error("Please select a file (image or PDF)");
      return;
    }
    if (selectedEmails.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }
    const isPdf = file.type === "application/pdf";
    const isImage = file.type.startsWith("image/");
    if (!isPdf && !isImage) {
      toast.error("Only image or PDF files are allowed");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `parent-documents/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("images")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("images").getPublicUrl(path);
      const { error: insErr } = await supabase.from("parent_documents").insert({
        title: title.trim(),
        description: description.trim() || null,
        file_url: pub.publicUrl,
        file_type: isPdf ? "pdf" : "image",
        file_name: file.name,
        recipient_emails: selectedEmails,
      } as any);
      if (insErr) throw insErr;
      toast.success("Document uploaded");
      setTitle("");
      setDescription("");
      setFile(null);
      setSelectedEmails([]);
      setRecipientSearch("");
      if (fileRef.current) fileRef.current.value = "";
      fetchDocs();
    } catch (e: any) {
      toast.error("Upload failed: " + (e.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    const { error } = await supabase.from("parent_documents").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Document deleted");
    fetchDocs();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
        <p className="text-gray-600">
          Upload documents (images or PDF) for eligible customers to view and download.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FilePlus className="h-5 w-5 text-athfal-pink" /> Upload New Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Monthly Report June 2026"
            />
          </div>
          <div>
            <Label htmlFor="doc-desc">Description (optional)</Label>
            <Textarea
              id="doc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short note about this document"
            />
          </div>
          <div>
            <Label htmlFor="doc-file">File (image or PDF)</Label>
            <Input
              id="doc-file"
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4 text-athfal-pink" />
              Recipients ({selectedEmails.length} selected)
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Select which customers can see and download this document.
            </p>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or child..."
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-56 overflow-y-auto rounded-lg border divide-y">
              {filteredRecipients.length === 0 ? (
                <p className="p-3 text-sm text-muted-foreground">
                  No eligible customers found.
                </p>
              ) : (
                filteredRecipients.map((r) => (
                  <label
                    key={r.email}
                    className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={selectedEmails.includes(r.email)}
                      onCheckedChange={() => toggleEmail(r.email)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium break-words">{r.name}</p>
                      <p className="text-xs text-muted-foreground break-words">
                        {r.email}
                      </p>
                      {r.child_names && (
                        <p className="text-[11px] text-muted-foreground break-words">
                          Child: {r.child_names}
                        </p>
                      )}
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-athfal-pink hover:bg-athfal-pink/90"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload Document"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Uploaded Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : docs.length === 0 ? (
            <p className="text-muted-foreground">No documents uploaded yet.</p>
          ) : (
            <div className="space-y-2">
              {docs.map((d) => {
                const Icon = d.file_type === "image" ? FileImage : FileText;
                return (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <Icon className="h-5 w-5 text-athfal-pink shrink-0" />
                    <div className="min-w-0 flex-1">
                      <a
                        href={d.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-sm hover:underline break-words"
                      >
                        {d.title}
                      </a>
                      {d.description && (
                        <p className="text-xs text-muted-foreground break-words">
                          {d.description}
                        </p>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        {format(new Date(d.created_at), "MMM d, yyyy")} ·{" "}
                        {d.file_type.toUpperCase()}
                      </p>
                      <p className="text-[11px] text-muted-foreground break-words">
                        {d.recipient_emails && d.recipient_emails.length > 0
                          ? `Recipients: ${d.recipient_emails.join(", ")}`
                          : "Visible to all eligible customers"}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(d.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDocuments;
