import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useParentMessageThreads } from "@/hooks/useParentMessages";
import { useAuth } from "@/contexts/AuthContext";
import ThreadView from "@/components/messaging/ThreadView";
import { getAdminRole } from "./helpers/getAdminRole";

const AdminInbox = () => {
  const { user } = useAuth();
  const { threads, reads } = useParentMessageThreads("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const role = getAdminRole(user) || "admin";
  const openThread = threads.find(t => t.id === openId);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Inbox</CardTitle></CardHeader>
        <CardContent>
          {threads.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No messages yet</p>
          ) : (
            <ul className="space-y-2">
              {threads.map(t => {
                const lastRead = reads[t.id];
                const unread = !lastRead || new Date(t.last_activity_at) > new Date(lastRead);
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => setOpenId(t.id)}
                      className="w-full text-left border rounded-lg p-3 hover:bg-accent transition"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{t.message_type}</Badge>
                          <Badge variant="secondary">{t.topic}</Badge>
                          <span className="font-medium">{t.subject}</span>
                          {(t.recipient_teacher_name || t.recipient_teacher_email) && (
                            <Badge variant="outline" className="text-xs">→ {t.recipient_teacher_name || t.recipient_teacher_email}</Badge>
                          )}
                        </div>
                        {unread && <Badge className="bg-athfal-pink text-white">New</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t.parent_name || t.parent_email} • {new Date(t.last_activity_at).toLocaleString()}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!openThread} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>Conversation</DialogTitle></DialogHeader>
          {openThread && <ThreadView thread={openThread} viewerRole="staff" staffRole={role} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInbox;