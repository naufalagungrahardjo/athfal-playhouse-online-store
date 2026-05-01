import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Trash2, Edit2, Download, ChevronDown, X, RefreshCw } from "lucide-react";
import { ClassProgram, Student } from "@/hooks/useStudents";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

type Props = {
  programs: ClassProgram[];
  students: Student[];
  addProgram: (p: Omit<ClassProgram, "id">) => Promise<string | null | void>;
  updateProgram: (id: string, p: Partial<ClassProgram>) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
  addStudent: (name: string, programIds: string[]) => Promise<void>;
  updateStudent: (id: string, name: string) => Promise<void>;
  updateStudentEnrollments: (studentId: string, programIds: string[]) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
};

export default function ProgramsStudentsTab({
  programs, students, addProgram, updateProgram, deleteProgram,
  addStudent, updateStudent, updateStudentEnrollments, deleteStudent,
}: Props) {
  const { products } = useProducts();
  const { toast } = useToast();
  const productNameOptions = Array.from(new Set(products.map(p => p.name).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );
  // Program form
  const [progName, setProgName] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [customProgName, setCustomProgName] = useState("");
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [progMeetings, setProgMeetings] = useState(1);
  const [progStart, setProgStart] = useState("");
  const [progEnd, setProgEnd] = useState("");
  const [editingProg, setEditingProg] = useState<ClassProgram | null>(null);

  // Student form
  const [studentName, setStudentName] = useState("");
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editPrograms, setEditPrograms] = useState<string[]>([]);
  const [editStudentName, setEditStudentName] = useState("");
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);

  const handleAddProgram = async () => {
    const finalName = (customProgName.trim() || selectedProducts.join(" + ") || progName).trim();
    if (!finalName || !progStart || !progEnd) return;
    if (editingProg) {
      await updateProgram(editingProg.id, { name: finalName, num_meetings: progMeetings, start_date: progStart, end_date: progEnd });
      setEditingProg(null);
    } else {
      const newProgramId = await addProgram({ name: finalName, num_meetings: progMeetings, start_date: progStart, end_date: progEnd });
      // Auto-enroll children from orders that purchased any of the selected products
      if (newProgramId && selectedProducts.length > 0) {
        try {
          const { data: ordersData } = await supabase
            .from("orders")
            .select("id, child_name, status")
            .not("child_name", "is", null)
            .neq("status", "cancelled");
          const orderIds = (ordersData || []).map(o => o.id);
          let matchedOrderIds = new Set<string>();
          if (orderIds.length > 0) {
            // Batch in chunks of 200 to avoid URL length limits
            const chunks: string[][] = [];
            for (let i = 0; i < orderIds.length; i += 200) chunks.push(orderIds.slice(i, i + 200));
            const itemsData: { order_id: string; product_name: string }[] = [];
            for (const ch of chunks) {
              const { data } = await supabase
                .from("order_items")
                .select("order_id, product_name")
                .in("order_id", ch);
              if (data) itemsData.push(...(data as any));
            }
            // Normalize: lowercase + collapse whitespace; match by prefix so variant suffixes
            // like " - Cicilan 3x" or " - Pembayaran Lunas" are included.
            const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
            const selectedNorm = selectedProducts.map(norm);
            itemsData.forEach(it => {
              if (!it.product_name) return;
              const itName = norm(it.product_name);
              if (selectedNorm.some(sel => itName === sel || itName.startsWith(sel))) {
                matchedOrderIds.add(it.order_id);
              }
            });
          }
          // Collect unique child names
          const childNames = new Set<string>();
          (ordersData || []).forEach(o => {
            if (matchedOrderIds.has(o.id) && o.child_name?.trim()) {
              childNames.add(o.child_name.trim());
            }
          });
          if (childNames.size > 0) {
            // Find existing students by name
            const { data: existingStudents } = await supabase
              .from("students" as any)
              .select("id, name")
              .in("name", Array.from(childNames));
            const existingMap = new Map<string, string>();
            ((existingStudents as any) || []).forEach((s: any) => existingMap.set(s.name, s.id));
            // Insert missing students
            const toInsert = Array.from(childNames).filter(n => !existingMap.has(n)).map(name => ({ name }));
            if (toInsert.length > 0) {
              const { data: inserted } = await supabase
                .from("students" as any)
                .insert(toInsert as any)
                .select();
              ((inserted as any) || []).forEach((s: any) => existingMap.set(s.name, s.id));
            }
            // Insert enrollments
            const enrollRows = Array.from(childNames).map(name => ({
              student_id: existingMap.get(name)!,
              program_id: newProgramId,
            })).filter(r => r.student_id);
            if (enrollRows.length > 0) {
              await supabase.from("student_enrollments" as any).insert(enrollRows as any);
            }
            toast({ title: "Auto-enrolled", description: `${childNames.size} child(ren) enrolled from orders.` });
          } else {
            toast({ title: "No children found", description: "No orders with child names matched the selected products." });
          }
        } catch (err: any) {
          toast({ title: "Auto-enroll failed", description: err.message, variant: "destructive" });
        }
      }
    }
    setProgName(""); setSelectedProducts([]); setCustomProgName("");
    setProgMeetings(1); setProgStart(""); setProgEnd("");
  };

  // Retroactively sync students for an existing program based on currently selected products.
  // Useful when a program was created before auto-enroll worked, or to refresh enrollments.
  const syncProgramFromProducts = async (programId: string, productNames: string[]) => {
    if (productNames.length === 0) {
      toast({ title: "Select products first", description: "Pick products in the form above, then click Sync.", variant: "destructive" });
      return;
    }
    try {
      const { data: ordersData } = await supabase
        .from("orders")
        .select("id, child_name, status")
        .not("child_name", "is", null)
        .neq("status", "cancelled");
      const orderIds = (ordersData || []).map(o => o.id);
      const matchedOrderIds = new Set<string>();
      if (orderIds.length > 0) {
        const chunks: string[][] = [];
        for (let i = 0; i < orderIds.length; i += 200) chunks.push(orderIds.slice(i, i + 200));
        const itemsData: { order_id: string; product_name: string }[] = [];
        for (const ch of chunks) {
          const { data } = await supabase.from("order_items").select("order_id, product_name").in("order_id", ch);
          if (data) itemsData.push(...(data as any));
        }
        const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
        const selectedNorm = productNames.map(norm);
        itemsData.forEach(it => {
          if (!it.product_name) return;
          const itName = norm(it.product_name);
          if (selectedNorm.some(sel => itName === sel || itName.startsWith(sel))) {
            matchedOrderIds.add(it.order_id);
          }
        });
      }
      const childNames = new Set<string>();
      (ordersData || []).forEach(o => {
        if (matchedOrderIds.has(o.id) && o.child_name?.trim()) childNames.add(o.child_name.trim());
      });
      if (childNames.size === 0) {
        toast({ title: "No matching children", description: "No orders with child names matched the selected products." });
        return;
      }
      const { data: existingStudents } = await supabase
        .from("students" as any).select("id, name").in("name", Array.from(childNames));
      const existingMap = new Map<string, string>();
      ((existingStudents as any) || []).forEach((s: any) => existingMap.set(s.name, s.id));
      const toInsert = Array.from(childNames).filter(n => !existingMap.has(n)).map(name => ({ name }));
      if (toInsert.length > 0) {
        const { data: inserted } = await supabase.from("students" as any).insert(toInsert as any).select();
        ((inserted as any) || []).forEach((s: any) => existingMap.set(s.name, s.id));
      }
      // Find existing enrollments to avoid duplicates
      const studentIds = Array.from(childNames).map(n => existingMap.get(n)).filter(Boolean) as string[];
      const { data: existingEnroll } = await supabase
        .from("student_enrollments" as any)
        .select("student_id")
        .eq("program_id", programId)
        .in("student_id", studentIds);
      const enrolledSet = new Set(((existingEnroll as any) || []).map((e: any) => e.student_id));
      const enrollRows = studentIds.filter(sid => !enrolledSet.has(sid)).map(sid => ({ student_id: sid, program_id: programId }));
      if (enrollRows.length > 0) {
        await supabase.from("student_enrollments" as any).insert(enrollRows as any);
      }
      toast({ title: "Sync complete", description: `${enrollRows.length} new student(s) enrolled (${childNames.size} matched).` });
    } catch (err: any) {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    }
  };

  const handleAddStudent = async () => {
    if (!studentName) return;
    await addStudent(studentName, selectedPrograms);
    setStudentName(""); setSelectedPrograms([]);
  };

  const openEditEnrollments = (s: Student) => {
    setEditingStudent(s);
    setEditStudentName(s.name);
    setEditPrograms(s.enrolled_programs);
    setEnrollDialogOpen(true);
  };

  const saveStudentEdit = async () => {
    if (!editingStudent) return;
    if (editStudentName.trim() && editStudentName !== editingStudent.name) {
      await updateStudent(editingStudent.id, editStudentName.trim());
    }
    await updateStudentEnrollments(editingStudent.id, editPrograms);
    setEnrollDialogOpen(false);
    setEditingStudent(null);
  };

  const exportCSV = () => {
    const headers = ["Student Name", "Enrolled Programs"];
    const rows = students.map(s => [
      s.name,
      s.enrolled_programs.map(pid => programs.find(p => p.id === pid)?.name || pid).join("; "),
    ]);
    const progHeaders = ["Program Name", "Sessions", "Start Date", "End Date"];
    const progRows = programs.map(p => [p.name, String(p.num_meetings), p.start_date, p.end_date]);
    const csv = [
      "=== Programs ===", progHeaders.join(","),
      ...progRows.map(r => r.map(f => `"${(f || "").replace(/"/g, '""')}"`).join(",")),
      "", "=== Students ===", headers.join(","),
      ...rows.map(r => r.map(f => `"${(f || "").replace(/"/g, '""')}"`).join(",")),
    ].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "programs_students.csv";
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
      </div>
      {/* Programs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Class Programs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-start">
            <div>
              <Label>Combine Products</Label>
              <Popover open={productPickerOpen} onOpenChange={setProductPickerOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    <span className="truncate">
                      {selectedProducts.length === 0
                        ? "Select products to combine"
                        : `${selectedProducts.length} product(s) selected`}
                    </span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[320px] p-2" align="start">
                  <Input
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="mb-2 h-8"
                  />
                  <div className="flex justify-between mb-2 text-xs">
                    <button type="button" className="text-primary hover:underline" onClick={() => setSelectedProducts(productNameOptions)}>Select all</button>
                    <button type="button" className="text-muted-foreground hover:underline" onClick={() => setSelectedProducts([])}>Clear</button>
                  </div>
                  <ScrollArea className="h-[240px]">
                    <div className="space-y-1 pr-2">
                      {productNameOptions.filter(n => n.toLowerCase().includes(productSearch.toLowerCase())).map(name => (
                        <label key={name} className="flex items-start gap-2 text-sm py-1 cursor-pointer hover:bg-muted/50 rounded px-1">
                          <Checkbox
                            checked={selectedProducts.includes(name)}
                            onCheckedChange={checked => {
                              setSelectedProducts(prev => checked ? [...prev, name] : prev.filter(x => x !== name));
                            }}
                          />
                          <span className="flex-1">{name}</span>
                        </label>
                      ))}
                      {productNameOptions.length === 0 && (
                        <div className="text-sm text-muted-foreground px-1 py-2">No products available</div>
                      )}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
              {selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedProducts.map(name => (
                    <span key={name} className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-xs">
                      {name}
                      <button type="button" onClick={() => setSelectedProducts(prev => prev.filter(x => x !== name))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div>
              <Label>Program Name (descriptive)</Label>
              <Input
                value={customProgName}
                onChange={e => setCustomProgName(e.target.value)}
                placeholder={selectedProducts.length > 0 ? selectedProducts.join(" + ") : "e.g. Bumi Vol. E Combined Class"}
              />
              <p className="text-xs text-muted-foreground mt-1">Leave blank to auto-name from selected products.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div>
              <Label>Number of Sessions</Label>
              <Input type="number" min={1} value={progMeetings} onChange={e => setProgMeetings(Number(e.target.value))} />
            </div>
            <div>
              <Label>Start Date</Label>
              <Input type="date" value={progStart} onChange={e => setProgStart(e.target.value)} />
            </div>
            <div>
              <Label>End Date</Label>
              <Input type="date" value={progEnd} onChange={e => setProgEnd(e.target.value)} />
            </div>
            <Button onClick={handleAddProgram}>
              <Plus className="h-4 w-4 mr-1" /> {editingProg ? "Update" : "Add"} Program
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Sessions</TableHead>
                <TableHead>Period</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.num_meetings}</TableCell>
                  <TableCell>{format(new Date(p.start_date), "dd MMM yyyy")} — {format(new Date(p.end_date), "dd MMM yyyy")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => {
                        setEditingProg(p);
                        setCustomProgName(p.name);
                        setSelectedProducts([]);
                        setProgName(p.name);
                        setProgMeetings(p.num_meetings);
                        setProgStart(p.start_date); setProgEnd(p.end_date);
                      }}><Edit2 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" title="Sync students from selected products in form above" onClick={() => syncProgramFromProducts(p.id, selectedProducts)}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteProgram(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {programs.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No programs yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Students Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Students</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <Label>Student Name</Label>
              <Input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Student name" />
            </div>
            <div>
              <Label>Enroll in Programs</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {programs.map(p => (
                  <label key={p.id} className="flex items-center gap-1 text-sm">
                    <Checkbox
                      checked={selectedPrograms.includes(p.id)}
                      onCheckedChange={checked => {
                        setSelectedPrograms(prev => checked ? [...prev, p.id] : prev.filter(x => x !== p.id));
                      }}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={handleAddStudent}><Plus className="h-4 w-4 mr-1" /> Add Student</Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Enrolled Programs</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {s.enrolled_programs.map(pid => {
                        const prog = programs.find(p => p.id === pid);
                        return prog ? <span key={pid} className="bg-muted px-2 py-0.5 rounded text-xs">{prog.name}</span> : null;
                      })}
                      {s.enrolled_programs.length === 0 && <span className="text-muted-foreground text-xs">None</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEditEnrollments(s)}><Edit2 className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteStudent(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No students yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Enrollments Dialog */}
      <Dialog open={enrollDialogOpen} onOpenChange={setEnrollDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Student Name</Label>
              <Input value={editStudentName} onChange={e => setEditStudentName(e.target.value)} placeholder="Student name" />
            </div>
            <div>
              <Label>Enrolled Programs</Label>
              <div className="space-y-2 mt-1">
                {programs.map(p => (
                  <label key={p.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={editPrograms.includes(p.id)}
                      onCheckedChange={checked => {
                        setEditPrograms(prev => checked ? [...prev, p.id] : prev.filter(x => x !== p.id));
                      }}
                    />
                    {p.name}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <Button onClick={saveStudentEdit} className="mt-4 w-full">Save Changes</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
