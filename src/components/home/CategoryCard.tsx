
import { Link } from 'react-router-dom';

interface CategoryCardProps {
  title: string;
  href: string;
  image: string;
  bgColor: string;
}

export const CategoryCard = ({ title, href, image, bgColor }: CategoryCardProps) => {
  // If bgColor is a hex color, apply it; else fallback to pastel color
  const isHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(bgColor);
  const pastel = "#eecdc4";

  return (
    <Link to={href} className="group">
      <div className="bg-white rounded-3xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-200">
        <div
          className="relative rounded-full p-4 mb-4 group-hover:scale-105 transition-transform flex items-center justify-center"
          style={{ width: 56, height: 56 }}
        >
          {/* Background layer, explicitly behind */}
          <div
            className="absolute inset-0 rounded-full z-0"
            style={{
              background: isHex ? bgColor : pastel,
              opacity: 0.20,
            }}
          />
          {/* Image layer, explicitly above */}
          <img
            src={image}
            alt={title}
            className="relative w-10 h-10 object-cover rounded-full z-10"
            style={{
              display: "block",
              margin: "auto",
            }}
          />
        </div>
        <h3 className="font-semibold text-athfal-pink">{title}</h3>
      </div>
    </Link>
  );
};
