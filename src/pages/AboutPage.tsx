
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Linkedin } from "lucide-react";
import { ManagementSlider } from "@/components/ManagementSlider";
import { useAboutContent } from "@/hooks/useAboutContent";
import { SEOHead } from "@/components/SEOHead";

const AboutPage = () => {
  const { language } = useLanguage();
  const { content, loading } = useAboutContent();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-athfal-pink" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <SEOHead title="Tentang Kami" description="Kenali Athfal Playhouse, pusat edukasi anak dengan pendekatan Islami yang menyenangkan." url="/about" />
      <div className="athfal-container py-12">
        <h1 className="text-3xl font-bold text-athfal-pink mb-8">
          {language === "id" ? content.heroTitle.id : content.heroTitle.en}
        </h1>

        <div className="bg-athfal-peach/10 rounded-3xl p-8 mb-12">
          {/* Hero Image */}
          <div className="mb-8 rounded-2xl overflow-hidden">
            <img
              src={content.heroImage}
              alt="About Us"
              className="w-full h-64 object-cover"
            />
          </div>

          <p className="text-gray-700 mb-8">
            {language === "id" ? content.heroSubtitle.id : content.heroSubtitle.en}
          </p>

          <h2 className="text-2xl font-semibold text-athfal-green mb-4">
            {language === "id" ? content.visionTitle.id : content.visionTitle.en}
          </h2>
          <p className="text-gray-700 mb-6">
            {language === "id" ? content.visionDescription.id : content.visionDescription.en}
          </p>

          <h2 className="text-2xl font-semibold text-athfal-green mb-4">
            {language === "id" ? content.missionTitle.id : content.missionTitle.en}
          </h2>
          <p className="text-gray-700 mb-6">
            {language === "id" ? content.missionDescription.id : content.missionDescription.en}
          </p>

          <h2 className="text-2xl font-semibold text-athfal-green mb-4">
            {language === "id" ? content.valuesTitle.id : content.valuesTitle.en}
          </h2>
          <p className="text-gray-700">
            {language === "id" ? content.valuesDescription.id : content.valuesDescription.en}
          </p>
        </div>

        <h2 className="text-2xl font-bold text-athfal-pink mb-6">
          {language === "id" ? content.teamTitle.id : content.teamTitle.en}
        </h2>
        <p className="text-gray-700 mb-8">
          {language === "id" ? content.teamDescription.id : content.teamDescription.en}
        </p>
        
        {/* Management Team Slider */}
        <ManagementSlider members={content.teamMembers.map(member => ({
          ...member,
          title: language === "id" ? member.title : member.title // You can add separate ID/EN titles later
        }))} />
      </div>
    </div>
  );
};

export default AboutPage;
