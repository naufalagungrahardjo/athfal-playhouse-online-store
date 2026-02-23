import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface TeamMember {
  id: string;
  name: string;
  title: string;
  image: string;
  linkedin: string;
}

export interface AboutContent {
  heroTitle: { id: string; en: string };
  heroSubtitle: { id: string; en: string };
  missionTitle: { id: string; en: string };
  missionDescription: { id: string; en: string };
  visionTitle: { id: string; en: string };
  visionDescription: { id: string; en: string };
  valuesTitle: { id: string; en: string };
  valuesDescription: { id: string; en: string };
  teamTitle: { id: string; en: string };
  teamDescription: { id: string; en: string };
  heroImage: string;
  aboutDecorativeImage?: string;
  teamMembers: TeamMember[];
}

// Default content: used as fallback until data is loaded
const DEFAULT_CONTENT: AboutContent = {
  heroTitle: { id: "Tentang Athfal Playhouse", en: "About Athfal Playhouse" },
  heroSubtitle: { id: "Mengenal lebih dekat visi, misi, dan nilai-nilai kami", en: "Get to know our vision, mission, and values" },
  missionTitle: { id: "Misi Kami", en: "Our Mission" },
  missionDescription: {
    id: "Menyediakan lingkungan belajar yang aman, menyenangkan, dan inspiratif untuk anak-anak Muslim dengan menggabungkan metode bermain sambil belajar dengan nilai-nilai Islam.",
    en: "Providing a safe, fun, and inspiring learning environment for Muslim children by combining play-based learning methods with Islamic values."
  },
  visionTitle: { id: "Visi Kami", en: "Our Vision" },
  visionDescription: {
    id: "Menjadi pusat edukasi anak terdepan yang mengembangkan generasi Muslim yang cerdas, kreatif, dan berakhlak mulia.",
    en: "To become a leading children's education center that develops intelligent, creative, and noble Muslim generations."
  },
  valuesTitle: { id: "Nilai-Nilai Kami", en: "Our Values" },
  valuesDescription: {
    id: "Pendidikan Islami, Kreativitas, Keamanan, dan Kesenangan dalam belajar.",
    en: "Islamic Education, Creativity, Safety, and Fun in learning."
  },
  teamTitle: { id: "Tim Kami", en: "Our Team" },
  teamDescription: { id: "Tim profesional yang berpengalaman dan berdedikasi dalam pendidikan anak.", en: "Professional team experienced and dedicated in children's education." },
  heroImage: "https://images.unsplash.com/photo-1635107510862-53886e926b74?w=800&h=600&fit=crop&auto=format",
  aboutDecorativeImage: "/lovable-uploads/4e490da3-e092-4eec-b20b-d66ed04832e7.png",
  teamMembers: [
    { id: "1", name: "Fadhilah Ramadhannisa", title: "Founder & CEO", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80", linkedin: "https://linkedin.com/in/fadhilahramadhannisa" },
    { id: "2", name: "Ahmad Rifqi", title: "Head of Curriculum", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e", linkedin: "https://linkedin.com" },
    { id: "3", name: "Siti Fatimah", title: "Head Psychologist", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330", linkedin: "https://linkedin.com" }
  ]
};

const ABOUT_DOC_ID = 'main'; // Use a single-row table, fixed id

export const useAboutContent = () => {
  const [content, setContent] = useState<AboutContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch from Supabase (get "main" only row)
  const loadContent = async () => {
    setLoading(true);
    // Use .maybeSingle() to handle empty/first time DB
    const { data, error } = await supabase
      .from('about_content')
      .select('content')
      .eq('id', ABOUT_DOC_ID)
      .maybeSingle();

    if (error) {
      setContent(DEFAULT_CONTENT);
      setLoading(false);
      return;
    }

    if (!data) {
      // Insert default content on first run (for convenience)
      await supabase
        .from('about_content')
        .insert([
          { id: ABOUT_DOC_ID, content: DEFAULT_CONTENT as any }
        ]);
      setContent(DEFAULT_CONTENT);
      setLoading(false);
      return;
    }

    // TS is unsure about the shape here, so cast safely
    setContent((data.content as unknown) as AboutContent);
    setLoading(false);
  };

  // Save to Supabase (upsert, always on id="main")
  const saveContent = async (newContent: AboutContent) => {
    setLoading(true);

    const { error } = await supabase
      .from('about_content')
      .upsert([
        { id: ABOUT_DOC_ID, content: newContent as any }
      ]);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save about content"
      });
      setLoading(false);
      return;
    }
    setContent(newContent);
    toast({ title: "Success", description: "About content saved successfully" });
    setLoading(false);
  };

  // Team management helpers
  const addTeamMember = (member: Omit<TeamMember, 'id'>) => {
    const newMember: TeamMember = {
      ...member,
      id: Date.now().toString()
    };
    const updatedContent: AboutContent = {
      ...content,
      teamMembers: [...content.teamMembers, newMember]
    };
    saveContent(updatedContent);
  };

  const updateTeamMember = (id: string, updatedMember: Partial<TeamMember>) => {
    const updatedContent: AboutContent = {
      ...content,
      teamMembers: content.teamMembers.map(member =>
        member.id === id ? { ...member, ...updatedMember } : member
      )
    };
    saveContent(updatedContent);
  };

  const deleteTeamMember = (id: string) => {
    const updatedContent: AboutContent = {
      ...content,
      teamMembers: content.teamMembers.filter(member => member.id !== id)
    };
    saveContent(updatedContent);
  };

  useEffect(() => {
    loadContent();
    // eslint-disable-next-line
  }, []);

  return {
    content,
    loading,
    saveContent,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember
  };
};
