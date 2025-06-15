
import React from "react";
import { ImageUpload } from "@/components/ImageUpload";

interface AboutSectionDecorativeImageUploadProps {
  value: string;
  onChange: (url: string) => void;
}

const AboutSectionDecorativeImageUpload: React.FC<AboutSectionDecorativeImageUploadProps> = ({
  value,
  onChange,
}) => (
  <div className="mt-6">
    <ImageUpload
      value={value}
      onChange={onChange}
      label="Decorative Image (Yellow Circle - Small Image)"
    />
  </div>
);

export default AboutSectionDecorativeImageUpload;
