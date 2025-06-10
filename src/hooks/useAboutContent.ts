
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

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
  teamMembers: TeamMember[];
}

const DEFAULT_CONTENT: AboutContent = {
  heroTitle: {
    id: "Tentang Athfal Playhouse",
    en: "About Athfal Playhouse",
  },
  heroSubtitle: {
    id: "Mengenal lebih dekat visi, misi, dan nilai-nilai kami",
    en: "Get to know our vision, mission, and values",
  },
  missionTitle: {
    id: "Misi Kami",
    en: "Our Mission",
  },
  missionDescription: {
    id: "Menyediakan lingkungan belajar yang aman, menyenangkan, dan inspiratif untuk anak-anak Muslim dengan menggabungkan metode bermain sambil belajar dengan nilai-nilai Islam.",
    en: "Providing a safe, fun, and inspiring learning environment for Muslim children by combining play-based learning methods with Islamic values.",
  },
  visionTitle: {
    id: "Visi Kami",
    en: "Our Vision",
  },
  visionDescription: {
    id: "Menjadi pusat edukasi anak terdepan yang mengembangkan generasi Muslim yang cerdas, kreatif, dan berakhlak mulia.",
    en: "To become a leading children's education center that develops intelligent, creative, and noble Muslim generations.",
  },
  valuesTitle: {
    id: "Nilai-Nilai Kami",
    en: "Our Values",
  },
  valuesDescription: {
    id: "Pendidikan Islami, Kreativitas, Keamanan, dan Kesenangan dalam belajar.",
    en: "Islamic Education, Creativity, Safety, and Fun in learning.",
  },
  teamTitle: {
    id: "Tim Kami",
    en: "Our Team",
  },
  teamDescription: {
    id: "Tim profesional yang berpengalaman dan berdedikasi dalam pendidikan anak.",
    en: "Professional team experienced and dedicated in children's education.",
  },
  heroImage: "https://images.unsplash.com/photo-1635107510862-53886e926b74?w=800&h=600&fit=crop&auto=format",
  teamMembers: [
    {
      id: "1",
      name: "Fadhilah Ramadhannisa",
      title: "Founder & CEO",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
      linkedin: "https://linkedin.com/in/fadhilahramadhannisa",
    },
    {
      id: "2",
      name: "Ahmad Rifqi",
      title: "Head of Curriculum",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
      linkedin: "https://linkedin.com",
    },
    {
      id: "3",
      name: "Siti Fatimah",
      title: "Head Psychologist",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      linkedin: "https://linkedin.com",
    }
  ]
};

export const useAboutContent = () => {
  const [content, setContent] = useState<AboutContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const saveContent = async (newContent: AboutContent) => {
    try {
      setLoading(true);
      // In a real implementation, this would save to database
      // For now, we'll use localStorage
      localStorage.setItem('aboutContent', JSON.stringify(newContent));
      setContent(newContent);
      
      toast({
        title: "Success",
        description: "About content saved successfully"
      });
    } catch (error) {
      console.error('Error saving about content:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save about content"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTeamMember = (member: Omit<TeamMember, 'id'>) => {
    const newMember: TeamMember = {
      ...member,
      id: Date.now().toString()
    };
    const updatedContent = {
      ...content,
      teamMembers: [...content.teamMembers, newMember]
    };
    saveContent(updatedContent);
  };

  const updateTeamMember = (id: string, updatedMember: Partial<TeamMember>) => {
    const updatedContent = {
      ...content,
      teamMembers: content.teamMembers.map(member =>
        member.id === id ? { ...member, ...updatedMember } : member
      )
    };
    saveContent(updatedContent);
  };

  const deleteTeamMember = (id: string) => {
    const updatedContent = {
      ...content,
      teamMembers: content.teamMembers.filter(member => member.id !== id)
    };
    saveContent(updatedContent);
  };

  useEffect(() => {
    try {
      const savedContent = localStorage.getItem('aboutContent');
      if (savedContent) {
        setContent(JSON.parse(savedContent));
      }
    } catch (error) {
      console.error('Error loading about content:', error);
    }
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
