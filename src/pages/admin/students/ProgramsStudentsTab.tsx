import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { ClassProgram, Student } from "@/hooks/useStudents";
import { format } from "date-fns";

type Props = {
  programs: ClassProgram[];
  students: Student[];
  addProgram: (p: Omit<ClassProgram, "id">) => Promise<void>;
  updateProgram: (id: string, p: Partial<ClassProgram>) => Promise<void>;
  deleteProgram: (id: string) => Promise<void>;
  addStudent: (name: string, programIds: string[]) => Promise<void>;
  updateStudentEnrollments: (studentId: string, programIds: string[]) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
};

export default function ProgramsStudentsTab({
  programs, students, addProgram, updateProgram, deleteProgram,
  addStudent, updateStudentEnrollments, deleteStudent,
}: Props) {
  // Program form
  const [progName, setProgName] = useState("");
  const [progMeetings, setProgMeetings] = useState(1);
  const [progStart, setProgStart] = useState("");
  const [progEnd, setProgEnd] = useState("");
  const [editingProg, setEditingProg] = useState<ClassProgram | null>(null);

  // Student form
  const [studentName, setStudentName] = useState("");
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editPrograms, setEditPrograms] = useState<string[]>([]);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);

  const handleAddProgram = async () => {
    if (!progName || !progStart || !progEnd) return;
    if (editingProg) {
      await updateProgram(editingProg.id, { name: progName, num_meetings: progMeetings, start_date: progStart, end_date: progEnd });
      setEditingProg(null);
    } else {
      await addProgram({ name: progName, num_meetings: progMeetings, start_date: progStart, end_date: progEnd });
    }
    setProgName(""); setProgMeetings(1); setProgStart(""); setProgEnd("");
  };

  const handleAddStudent = async () => {
    if (!studentName) return;
    await addStudent(studentName, selectedPrograms);
    setStudentName(""); setSelectedPrograms([]);
  };

  const openEditEnrollments = (s: Student) => {
    setEditingStudent(s);
    setEditPrograms(s.enrolled_programs);
    setEnrollDialogOpen(true);
  };

  const saveEnrollments = async () => {
    if (!editingStudent) return;
    await updateStudentEnrollments(editingStudent.id, editPrograms);
    setEnrollDialogOpen(false);
    setEditingStudent(null);
  };

  return (
    <div className="space-y-6">
      {/* Programs Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Class Programs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div>
              <Label>Program Name</Label>
              <Input value={progName} onChange={e => setProgName(e.target.value)} placeholder="Program name" />
            </div>
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
                <TableHead>Meetings</TableHead>
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
                        setEditingProg(p); setProgName(p.name); setProgMeetings(p.num_meetings);
                        setProgStart(p.start_date); setProgEnd(p.end_date);
                      }}><Edit2 className="h-4 w-4" /></Button>
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
            <DialogTitle>Edit Enrollments — {editingStudent?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
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
          <Button onClick={saveEnrollments} className="mt-4 w-full">Save Enrollments</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
