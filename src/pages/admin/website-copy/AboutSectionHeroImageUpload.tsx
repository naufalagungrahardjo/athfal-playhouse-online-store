
import React from "react";
import { ImageUpload } from "@/components/ImageUpload";

interface AboutSectionHeroImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

const AboutSectionHeroImageUpload: React.FC<AboutSectionHeroImageUploadProps> = ({
  value,
  onChange,
}) => (
  <div className="mt-6">
    <ImageUpload
      value={value}
      onChange={onChange}
      label="Hero Image (Main Large Image)"
    />
  </div>
);

export default AboutSectionHeroImageUpload;
