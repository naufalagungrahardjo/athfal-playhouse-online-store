import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Search, Trash2, Users, Download, KeyRound } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useUserManagement } from "@/hooks/useUserManagement";
import { useAuth } from "@/contexts/AuthContext";
import { ResetPasswordDialog } from "@/components/admin/ResetPasswordDialog";

const AdminUsers = () => {
  const { users, loading, deleteUser, resetPassword } = useUserManagement();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; email: string } | null>(null);

  const isSuperAdmin = user?.role === 'super_admin';

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"?`)) return;
    await deleteUser(userId);
  };

  const handleResetPassword = (userId: string, userName: string, userEmail: string) => {
    setSelectedUser({ id: userId, name: userName, email: userEmail });
    setResetPasswordDialogOpen(true);
  };

  const handleConfirmResetPassword = async (newPassword: string) => {
    if (!selectedUser) return;
    await resetPassword(selectedUser.id, newPassword);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === "" || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const userDate = new Date(user.created_at);
    const matchesPeriod = (!startDate || userDate >= startDate) && 
                         (!endDate || userDate <= endDate);
    
    return matchesSearch && matchesPeriod;
  });

  // CSV Export function for users
  const exportUsersToCSV = () => {
    const headers = [
      "User ID",
      "Name",
      "Email",
      "Created At",
      "Updated At",
    ];
    const rows = filteredUsers.map(user => [
      user.id,
      user.name,
      user.email,
      user.created_at,
      user.updated_at,
    ]);
    const csvString = [
      headers.join(","),
      ...rows.map(row =>
        row.map(field => {
          if (
            typeof field === "string" &&
            (field.includes(",") || field.includes('"') || field.includes("\n"))
          ) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field ?? "";
        }).join(",")
      ),
    ].join("\r\n");

    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    let dateInfo = "";
    if (startDate) dateInfo += `_from_${startDate.toISOString().slice(0, 10).replace(/-/g, "")}`;
    if (endDate) dateInfo += `_to_${endDate.toISOString().slice(0, 10).replace(/-/g, "")}`;
    a.download = `users${dateInfo}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-athfal-pink" />
          <div>
            <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            <p className="text-gray-600">Manage registered users and view user analytics</p>
          </div>
        </div>
        {/* Download Users CSV Button */}
        <Button onClick={exportUsersToCSV} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Download Users as CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick start date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick end date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          {(startDate || endDate) && (
            <Button 
              variant="outline" 
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
              }}
            >
              Clear Date Filter
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Registered Users ({filteredUsers.length} total)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Registration Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No users found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {format(new Date(user.created_at), "PPP")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {isSuperAdmin && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword(user.id, user.name, user.email)}
                            className="text-primary hover:text-primary"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selectedUser && (
        <ResetPasswordDialog
          open={resetPasswordDialogOpen}
          onOpenChange={setResetPasswordDialogOpen}
          userName={selectedUser.name}
          userEmail={selectedUser.email}
          onConfirm={handleConfirmResetPassword}
        />
      )}
    </div>
  );
};

export default AdminUsers;
