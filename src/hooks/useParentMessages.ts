import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type MessageType = "Request" | "Concern" | "Compliment";
export type MessageTopic = "Admin" | "Attendance" | "Health & Care" | "Safety & Security" | "Learning" | "Fee" | "Others";

export type ParentMessageThread = {
  id: string;
  parent_user_id: string | null;
  parent_email: string;
  parent_name: string | null;
  recipient_teacher_email: string | null;
  recipient_teacher_name: string | null;
  message_type: MessageType;
  topic: MessageTopic;
  subject: string;
  body: string;
  last_activity_at: string;
  created_at: string;
};

export type ParentMessageReply = {
  id: string;
  thread_id: string;
  sender_email: string;
  sender_name: string | null;
  sender_role: string;
  body: string;
  created_at: string;
};

export function useParentMessageThreads(scope: "mine" | "all") {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ParentMessageThread[]>([]);
  const [reads, setReads] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) { setThreads([]); setLoading(false); return; }
    setLoading(true);
    let q = supabase.from("parent_messages" as any).select("*").order("last_activity_at", { ascending: false });
    if (scope === "mine") q = q.eq("parent_user_id", user.id);
    const { data } = await q;
    setThreads((data as any) || []);

    const { data: rd } = await supabase.from("parent_message_reads" as any)
      .select("thread_id,last_read_at")
      .eq("user_email", user.email);
    const map: Record<string, string> = {};
    (rd as any[] || []).forEach(r => { map[r.thread_id] = r.last_read_at; });
    setReads(map);
    setLoading(false);
  }, [user, scope]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel(`pm-${scope}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "parent_messages" }, () => fetchData())
      .on("postgres_changes", { event: "*", schema: "public", table: "parent_message_replies" }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, scope, fetchData]);

  return { threads, reads, loading, refetch: fetchData };
}

export function useThreadReplies(threadId: string | null) {
  const [replies, setReplies] = useState<ParentMessageReply[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!threadId) { setReplies([]); return; }
    setLoading(true);
    const { data } = await supabase.from("parent_message_replies" as any)
      .select("*").eq("thread_id", threadId).order("created_at", { ascending: true });
    setReplies((data as any) || []);
    setLoading(false);
  }, [threadId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!threadId) return;
    const ch = supabase.channel(`pm-replies-${threadId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "parent_message_replies", filter: `thread_id=eq.${threadId}` }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [threadId, fetchData]);

  return { replies, loading, refetch: fetchData };
}

export async function markThreadRead(threadId: string, email: string) {
  await supabase.from("parent_message_reads" as any).upsert({
    thread_id: threadId,
    user_email: email,
    last_read_at: new Date().toISOString(),
  } as any, { onConflict: "thread_id,user_email" });
}

export function unreadCount(threads: ParentMessageThread[], reads: Record<string, string>, myEmail: string) {
  return threads.filter(t => {
    const lastRead = reads[t.id];
    // unread if last_activity is newer than last_read AND last activity wasn't by me
    if (!lastRead) return true;
    return new Date(t.last_activity_at).getTime() > new Date(lastRead).getTime();
  }).length;
}