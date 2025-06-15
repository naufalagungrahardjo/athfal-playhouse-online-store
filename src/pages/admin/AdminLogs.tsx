
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface AdminLog {
  id: string;
  created_at: string;
  email: string;
  role: string;
  action: string;
}

function formatDateTime(dt: string) {
  const d = new Date(dt);
  return d.toLocaleString();
}

function toCSV(rows: AdminLog[]): string {
  const headers = ["Date & Time", "Email", "Role", "Action"];
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(
      [formatDateTime(row.created_at), `"${row.email}"`, row.role, `"${row.action.replace(/"/g, '""')}"`].join(",")
    );
  }
  return lines.join("\n");
}

export default function AdminLogs() {
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("admin_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setLogs(data || []);
        setLoading(false);
      });
  }, []);

  const downloadCSV = () => {
    const csv = toCSV(logs);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "admin_logs.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Admin Change Logs</CardTitle>
          <Button variant="outline" onClick={downloadCSV} disabled={logs.length === 0}>
            Download CSV
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading logs...</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>{formatDateTime(log.created_at)}</TableCell>
                      <TableCell>{log.email}</TableCell>
                      <TableCell>{log.role.replace("_", " ")}</TableCell>
                      <TableCell>{log.action}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
