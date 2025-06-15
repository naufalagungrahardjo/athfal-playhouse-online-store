
import { Link } from 'react-router-dom';

interface CategoryCardProps {
  title: string;
  href: string;
  image: string;
  bgColor: string;
}

export const CategoryCard = ({ title, href, image, bgColor }: CategoryCardProps) => {
  // If bgColor is a hex color, apply it with reduced opacity; else fallback to default pastel
  const isHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(bgColor);
  const pastel = "#eecdc4";

  return (
    <Link to={href} className="group">
      <div className="bg-white rounded-3xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-200">
        <div
          className="rounded-full p-4 mb-4 group-hover:scale-105 transition-transform flex items-center justify-center"
          style={{
            background: isHex ? bgColor : pastel,
            opacity: 0.20,
          }}
        >
          <img 
            src={image} 
            alt={title} 
            className="w-10 h-10 object-cover rounded-full" 
          />
        </div>
        <h3 className="font-semibold text-athfal-pink">{title}</h3>
      </div>
    </Link>
  );
};
