
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Linkedin } from "lucide-react";
import { ManagementSlider } from "@/components/ManagementSlider";

const AboutPage = () => {
  const { language } = useLanguage();

  // Expanded team data for slider
  const teamMembers = [
    {
      name: "Fadhilah Ramadhannisa",
      title: language === "id" ? "Pendiri & CEO" : "Founder & CEO",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
      linkedin: "https://linkedin.com/in/fadhilahramadhannisa",
    },
    {
      name: "Ahmad Rifqi",
      title: language === "id" ? "Kepala Kurikulum" : "Head of Curriculum",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
      linkedin: "https://linkedin.com",
    },
    {
      name: "Siti Fatimah",
      title: language === "id" ? "Kepala Psikolog" : "Head Psychologist",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
      linkedin: "https://linkedin.com",
    },
    {
      name: "Budi Santoso",
      title: language === "id" ? "Manajer Operasional" : "Operations Manager",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
      linkedin: "https://linkedin.com",
    },
    {
      name: "Dian Pertiwi",
      title: language === "id" ? "Spesialis Pendidikan Anak Usia Dini" : "Early Childhood Education Specialist",
      image: "https://images.unsplash.com/photo-1580489944761-15a19d654956",
      linkedin: "https://linkedin.com",
    },
    {
      name: "Arif Wicaksono",
      title: language === "id" ? "Pengembangan Bisnis" : "Business Development",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      linkedin: "https://linkedin.com",
    },
    {
      name: "Ratna Dewi",
      title: language === "id" ? "Manajer Keuangan" : "Finance Manager",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
      linkedin: "https://linkedin.com",
    },
    {
      name: "Andika Pratama",
      title: language === "id" ? "Desainer Pengalaman Bermain" : "Play Experience Designer",
      image: "https://images.unsplash.com/photo-1531891437562-4301cf35b7e4",
      linkedin: "https://linkedin.com",
    },
    {
      name: "Maya Safira",
      title: language === "id" ? "Guru Senior" : "Senior Teacher",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2",
      linkedin: "https://linkedin.com",
    },
    {
      name: "Taufik Rahman",
      title: language === "id" ? "Pengembang Kurikulum" : "Curriculum Developer",
      image: "https://images.unsplash.com/photo-1560250097-0b93528c311a",
      linkedin: "https://linkedin.com",
    },
    {
      name: "Indah Permata",
      title: language === "id" ? "Psikolog Anak" : "Child Psychologist",
      image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f",
      linkedin: "https://linkedin.com",
    },
    {
      name: "Gunawan Setiadi",
      title: language === "id" ? "Manajer Pemasaran" : "Marketing Manager",
      image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
      linkedin: "https://linkedin.com",
    },
    {
      name: "Putri Handayani",
      title: language === "id" ? "Spesialis Media Sosial" : "Social Media Specialist",
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
      linkedin: "https://linkedin.com",
    },
    {
      name: "Rizky Pratama",
      title: language === "id" ? "Manajer Pengembangan Produk" : "Product Development Manager",
      image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7",
      linkedin: "https://linkedin.com",
    },
    {
      name: "Anisa Wijaya",
      title: language === "id" ? "Koordinator Program" : "Program Coordinator",
      image: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04",
      linkedin: "https://linkedin.com",
    },
  ];

  return (
    <div className="min-h-screen">
      <div className="athfal-container py-12">
        <h1 className="text-3xl font-bold text-athfal-pink mb-8">
          {language === "id" ? "Tentang Kami" : "About Us"}
        </h1>

        <div className="bg-athfal-peach/10 rounded-3xl p-8 mb-12">
          <h2 className="text-2xl font-semibold text-athfal-green mb-4">
            {language === "id" ? "Visi Kami" : "Our Vision"}
          </h2>
          <p className="text-gray-700 mb-6">
            {language === "id"
              ? "Menjadi pusat edukasi anak terkemuka yang menginspirasi kreativitas, kecintaan pada Islam, dan pembelajaran seumur hidup."
              : "To be a leading children's education center that inspires creativity, love for Islam, and lifelong learning."}
          </p>

          <h2 className="text-2xl font-semibold text-athfal-green mb-4">
            {language === "id" ? "Misi Kami" : "Our Mission"}
          </h2>
          <p className="text-gray-700">
            {language === "id"
              ? "Menyediakan lingkungan belajar yang menyenangkan dan inklusif di mana anak-anak dapat mengembangkan potensi penuh mereka melalui bermain, eksplorasi, dan penemuan yang dibimbing."
              : "To provide a fun and inclusive learning environment where children can develop their full potential through play, exploration, and guided discovery."}
          </p>
        </div>

        <h2 className="text-2xl font-bold text-athfal-pink mb-6">
          {language === "id" ? "Tim Manajemen Kami" : "Our Management Team"}
        </h2>
        
        {/* Management Team Slider */}
        <ManagementSlider members={teamMembers} />
      </div>
    </div>
  );
};

export default AboutPage;
