import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStudents } from "@/hooks/useStudents";
import ProgramsStudentsTab from "./students/ProgramsStudentsTab";
import AttendanceTab from "./students/AttendanceTab";
import AttendanceSummaryTab from "./students/AttendanceSummaryTab";
import StudentReportTab from "./students/StudentReportTab";
import CheckInOutLogTab from "./students/CheckInOutLogTab";

const AdminStudents = () => {
  const [activeTab, setActiveTab] = useState("programs");
  const {
    programs, students, enrollments, attendance, loading,
    addProgram, updateProgram, deleteProgram,
    addStudent, updateStudent, updateStudentEnrollments, deleteStudent,
    saveAttendance, refetch,
  } = useStudents();

  if (loading) {
    return <div className="flex justify-center items-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Students Management</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="programs">Programs & Students</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="attendance-summary">Attendance Summary</TabsTrigger>
          <TabsTrigger value="report">Student Report</TabsTrigger>
          <TabsTrigger value="checkinout">Check-In/Out Log</TabsTrigger>
        </TabsList>
        <TabsContent value="programs">
          <ProgramsStudentsTab
            programs={programs} students={students}
            addProgram={addProgram} updateProgram={updateProgram} deleteProgram={deleteProgram}
            addStudent={addStudent} updateStudent={updateStudent} updateStudentEnrollments={updateStudentEnrollments} deleteStudent={deleteStudent}
            refetch={refetch}
          />
        </TabsContent>
        <TabsContent value="attendance">
          <AttendanceTab
            programs={programs} students={students} enrollments={enrollments}
            attendance={attendance} saveAttendance={saveAttendance} refetch={refetch}
          />
        </TabsContent>
        <TabsContent value="attendance-summary">
          <AttendanceSummaryTab
            programs={programs} students={students} enrollments={enrollments} attendance={attendance}
          />
        </TabsContent>
        <TabsContent value="report">
          <StudentReportTab
            programs={programs} students={students} enrollments={enrollments} attendance={attendance}
          />
        </TabsContent>
        <TabsContent value="checkinout">
          <CheckInOutLogTab programs={programs} students={students} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminStudents;
