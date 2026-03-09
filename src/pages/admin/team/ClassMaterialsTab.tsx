import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, ExternalLink, Save, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type ClassProgram = {
  id: string;
  name: string;
};

type ClassMaterial = {
  id: string;
  program_id: string;
  detail: string;
  link: string;
  created_at: string;
  updated_at: string;
};

export default function ClassMaterialsTab() {
  const { toast } = useToast();
  const [materials, setMaterials] = useState<ClassMaterial[]>([]);
  const [programs, setPrograms] = useState<ClassProgram[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filterProgramId, setFilterProgramId] = useState<string>("all");

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formProgramId, setFormProgramId] = useState("");
  const [formDetail, setFormDetail] = useState("");
  const [formLink, setFormLink] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filteredMaterials = filterProgramId === "all"
    ? materials
    : materials.filter(m => m.program_id === filterProgramId);

  const fetchData = async () => {
    setLoading(true);
    const [matRes, progRes] = await Promise.all([
      supabase.from("class_materials").select("*").order("created_at", { ascending: false }),
      supabase.from("class_programs").select("id, name").order("name"),
    ]);
    if (matRes.data) setMaterials(matRes.data as ClassMaterial[]);
    if (progRes.data) setPrograms(progRes.data as ClassProgram[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setEditingId(null);
    setFormProgramId("");
    setFormDetail("");
    setFormLink("");
    setShowForm(false);
  };

  const handleEdit = (m: ClassMaterial) => {
    setEditingId(m.id);
    setFormProgramId(m.program_id);
    setFormDetail(m.detail);
    setFormLink(m.link);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formProgramId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a class." });
      return;
    }
    if (!formDetail.trim()) {
      toast({ variant: "destructive", title: "Error", description: "Please enter a detail." });
      return;
    }

    const payload = {
      program_id: formProgramId,
      detail: formDetail.trim(),
      link: formLink.trim(),
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("class_materials").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("class_materials").insert(payload));
    }

    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Saved", description: editingId ? "Material updated." : "Material added." });
      resetForm();
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("class_materials").delete().eq("id", id);
    if (error) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } else {
      toast({ title: "Deleted", description: "Material removed." });
      fetchData();
    }
  };

  const getProgramName = (programId: string) => {
    return programs.find(p => p.id === programId)?.name || "Unknown";
  };

  if (loading) return <div className="p-4 text-center text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Class Materials</CardTitle>
            {!showForm && (
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Add Material
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add / Edit Form */}
          {showForm && (
            <Card className="bg-muted/40">
              <CardContent className="pt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Class (Program) *</Label>
                    <Select value={formProgramId} onValueChange={setFormProgramId}>
                      <SelectTrigger><SelectValue placeholder="Select a class..." /></SelectTrigger>
                      <SelectContent>
                        {programs.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Link</Label>
                    <Input
                      value={formLink}
                      onChange={e => setFormLink(e.target.value)}
                      placeholder="https://drive.google.com/..."
                    />
                  </div>
                </div>
                <div>
                  <Label>Detail *</Label>
                  <Textarea
                    value={formDetail}
                    onChange={e => setFormDetail(e.target.value)}
                    placeholder="Describe the material..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="gap-2">
                    <Save className="w-4 h-4" /> {editingId ? "Update" : "Save"}
                  </Button>
                  <Button variant="ghost" onClick={resetForm} className="gap-2">
                    <X className="w-4 h-4" /> Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Materials Table */}
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Detail</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materials.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium whitespace-nowrap">{getProgramName(m.program_id)}</TableCell>
                    <TableCell className="max-w-[300px]">{m.detail || "-"}</TableCell>
                    <TableCell>
                      {m.link ? (
                        <a
                          href={m.link.startsWith("http") ? m.link : `https://${m.link}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline inline-flex items-center gap-1 text-sm"
                        >
                          Open <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(m)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete material?</AlertDialogTitle>
                              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(m.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {materials.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No materials added yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
