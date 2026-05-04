import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useThreadReplies, markThreadRead, ParentMessageThread } from "@/hooks/useParentMessages";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { z } from "zod";

const replySchema = z.string().trim().min(1, "Pesan tidak boleh kosong").max(2000, "Maksimal 2000 karakter");

type Props = { thread: ParentMessageThread; viewerRole: "parent" | "staff"; staffRole?: string };

const ThreadView = ({ thread, viewerRole, staffRole }: Props) => {
  const { user } = useAuth();
  const { replies } = useThreadReplies(thread.id);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.email) markThreadRead(thread.id, user.email);
  }, [thread.id, user?.email, replies.length]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [replies.length]);

  const send = async () => {
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    if (!user?.email) return;
    setSending(true);
    const role = viewerRole === "parent" ? "parent" : (staffRole || "admin");
    const { error } = await supabase.from("parent_message_replies" as any).insert({
      thread_id: thread.id,
      sender_email: user.email,
      sender_name: user.name,
      sender_role: role,
      body: parsed.data,
    } as any);
    setSending(false);
    if (error) { toast.error(error.message); return; }
    setBody("");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b pb-3 mb-3">
        <div className="flex flex-wrap gap-2 mb-2">
          <Badge variant="outline">{thread.message_type}</Badge>
          <Badge variant="secondary">{thread.topic}</Badge>
          {thread.recipient_teacher_email && (
            <Badge variant="outline">To: {thread.recipient_teacher_email}</Badge>
          )}
        </div>
        <h3 className="font-semibold text-lg">{thread.subject}</h3>
        <p className="text-xs text-muted-foreground">From: {thread.parent_name || thread.parent_email}</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 max-h-[50vh]">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="text-xs text-muted-foreground mb-1">{thread.parent_name || thread.parent_email} • {new Date(thread.created_at).toLocaleString()}</div>
          <p className="whitespace-pre-wrap text-sm">{thread.body}</p>
        </div>
        {replies.map(r => {
          const mine = user?.email && r.sender_email.toLowerCase() === user.email.toLowerCase();
          return (
            <div key={r.id} className={`rounded-lg p-3 ${mine ? "bg-athfal-pink/10 ml-6" : "bg-muted/50 mr-6"}`}>
              <div className="text-xs text-muted-foreground mb-1">
                {r.sender_name || r.sender_email} <span className="opacity-70">({r.sender_role})</span> • {new Date(r.created_at).toLocaleString()}
              </div>
              <p className="whitespace-pre-wrap text-sm">{r.body}</p>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="border-t pt-3 mt-3 space-y-2">
        <Textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Tulis balasan..."
          rows={3}
          maxLength={2000}
        />
        <div className="flex justify-end">
          <Button onClick={send} disabled={sending || !body.trim()}>
            <Send className="h-4 w-4 mr-2" /> Kirim
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ThreadView;