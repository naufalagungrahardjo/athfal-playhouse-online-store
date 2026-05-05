import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useParentMessageThreads, MessageType, MessageTopic } from "@/hooks/useParentMessages";
import ThreadView from "@/components/messaging/ThreadView";
import { toast } from "sonner";
import { Plus, MessageSquare } from "lucide-react";
import { z } from "zod";

const TYPES: MessageType[] = ["Request", "Concern", "Compliment"];
const TOPICS: MessageTopic[] = ["Admin", "Attendance", "Health & Care", "Safety & Security", "Learning", "Fee", "Others"];

const newSchema = z.object({
  subject: z.string().trim().min(1, "Judul wajib diisi").max(200),
  body: z.string().trim().min(1, "Pesan wajib diisi").max(2000),
});

const TalkToSchoolPanel = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { threads, reads } = useParentMessageThreads("mine");
  const [openId, setOpenId] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const [teachers, setTeachers] = useState<{ email: string; name: string }[]>([]);

  const [type, setType] = useState<MessageType>("Request");
  const [topic, setTopic] = useState<MessageTopic>("Admin");
  const [recipient, setRecipient] = useState<string>("admin_only");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSendingState] = useState(false);

  useEffect(() => {
    supabase.rpc("list_teacher_recipients" as any).then(({ data }) => {
      setTeachers(((data as any[]) || []).map(r => ({ email: r.email, name: r.name || r.email })));
    });
  }, []);

  if (!user) return null;

  const submit = async () => {
    const parsed = newSchema.safeParse({ subject, body });
    if (!parsed.success) { toast.error(parsed.error.issues[0].message); return; }
    setSendingState(true);
    const teacherObj = teachers.find(t => t.email === recipient);
    const { error } = await supabase.from("parent_messages" as any).insert({
      parent_user_id: user.id,
      parent_email: user.email,
      parent_name: user.name,
      recipient_teacher_email: recipient === "admin_only" ? null : recipient,
      recipient_teacher_name: recipient === "admin_only" ? null : (teacherObj?.name || null),
      message_type: type,
      topic,
      subject: parsed.data.subject,
      body: parsed.data.body,
    } as any);
    setSendingState(false);
    if (error) { toast.error(error.message); return; }
    toast.success(language === "id" ? "Pesan terkirim" : "Message sent");
    setComposing(false);
    setSubject(""); setBody(""); setRecipient("admin_only");
  };

  const openThread = threads.find(t => t.id === openId);

  return (
    <div>
      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
        <h2 className="text-lg font-semibold">{language === "id" ? "Pesan Anda" : "Your Messages"}</h2>
        <Button onClick={() => setComposing(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {language === "id" ? "Pesan Baru" : "New Message"}
        </Button>
      </div>
      {threads.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          {language === "id" ? "Belum ada pesan" : "No messages yet"}
        </p>
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
                    </div>
                    {unread && <Badge className="bg-athfal-pink text-white">New</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(t.last_activity_at).toLocaleString()}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={composing} onOpenChange={setComposing}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === "id" ? "Pesan Baru" : "New Message"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">{language === "id" ? "Ini adalah" : "This is a"}</label>
              <div className="flex gap-2 flex-wrap">
                {TYPES.map(t => (
                  <Button key={t} type="button" variant={type === t ? "default" : "outline"} size="sm" onClick={() => setType(t)}>{t}</Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{language === "id" ? "Tentang" : "On"}</label>
              <div className="flex gap-2 flex-wrap">
                {TOPICS.map(t => (
                  <Button key={t} type="button" variant={topic === t ? "default" : "outline"} size="sm" onClick={() => setTopic(t)}>{t}</Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{language === "id" ? "Kepada" : "To"}</label>
              <Select value={recipient} onValueChange={setRecipient}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_only">{language === "id" ? "Admin saja" : "Admin only"}</SelectItem>
                  {teachers.map(t => <SelectItem key={t.email} value={t.email}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {language === "id" ? "Admin selalu menerima pesan ini." : "Admins always receive this message."}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{language === "id" ? "Judul" : "Subject"}</label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} maxLength={200} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">{language === "id" ? "Pesan" : "Message"}</label>
              <Textarea value={body} onChange={e => setBody(e.target.value)} rows={5} maxLength={2000} />
            </div>
            <Button onClick={submit} disabled={sending} className="w-full">
              <MessageSquare className="h-4 w-4 mr-2" />
              {language === "id" ? "Kirim" : "Send"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!openThread} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>{language === "id" ? "Percakapan" : "Conversation"}</DialogTitle></DialogHeader>
          {openThread && <ThreadView thread={openThread} viewerRole="parent" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TalkToSchoolPanel;
