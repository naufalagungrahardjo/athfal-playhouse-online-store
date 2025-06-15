
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { FileUploadInput } from "@/components/FileUploadInput";
import { useCollaborators } from "@/hooks/useCollaborators";

export default function CollaboratorsEditor() {
  const { collaborators, loading, addCollaborator, removeCollaborator } = useCollaborators();
  const [name, setName] = useState("");
  const [logo, setLogo] = useState("");
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!name.trim() || !logo) return;
    setAdding(true);
    await addCollaborator(name, logo);
    setName("");
    setLogo("");
    setAdding(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Partners / Collaborators Logos</CardTitle>
        <p className="text-sm text-gray-500">Manage the logos for partners shown in the homepage slider.</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-3 flex-col md:flex-row md:items-end">
          <div>
            <Label>Partner/Company Name</Label>
            <Input value={name} className="w-full" onChange={e => setName(e.target.value)} placeholder="Company or Partner Name" />
          </div>
          <div>
            <Label>Logo Image</Label>
            <FileUploadInput onUpload={setLogo} />
            {logo && (
              <img src={logo} alt="preview" className="h-10 mt-2 bg-white border rounded shadow" />
            )}
          </div>
          <Button
            className="mt-2"
            disabled={!name.trim() || !logo || adding}
            onClick={handleAdd}
            type="button"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Partner
          </Button>
        </div>
        <div>
          <Label>Current Partners:</Label>
          <div className="flex flex-wrap gap-4 mt-2">
            {loading && <span className="text-gray-500 text-sm">Loading...</span>}
            {!loading && collaborators.length === 0 && (
              <span className="text-gray-400 text-sm">No partners added yet.</span>
            )}
            {collaborators.map(c => (
              <div key={c.id} className="flex flex-col items-center gap-2 border rounded-lg p-3 bg-white shadow">
                <img src={c.logo} alt={c.name} className="h-12 w-36 object-contain bg-white rounded" style={{ maxWidth: 140 }} />
                <span className="text-xs font-semibold">{c.name}</span>
                <Button
                  variant="destructive"
                  size="icon"
                  className="mt-1"
                  onClick={() => removeCollaborator(c.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
