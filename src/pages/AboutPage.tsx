
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Linkedin } from "lucide-react";

const AboutPage = () => {
  const { language } = useLanguage();

  const team = [
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {team.map((member) => (
            <div key={member.name} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-64 overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-athfal-pink">
                  {member.name}
                </h3>
                <p className="text-gray-600 mb-2">{member.title}</p>
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-athfal-green hover:text-athfal-green/80"
                >
                  <Linkedin className="h-4 w-4 mr-1" />
                  <span>{language === "id" ? "Profil LinkedIn" : "LinkedIn Profile"}</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
