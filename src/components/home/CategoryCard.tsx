
import { Link } from 'react-router-dom';

interface CategoryCardProps {
  title: string;
  href: string;
  image: string;
  bgColor: string;
}

export const CategoryCard = ({ title, href, image, bgColor }: CategoryCardProps) => {
  return (
    <Link to={href} className="group">
      <div className="bg-white rounded-3xl shadow-md p-6 flex flex-col items-center text-center hover:shadow-lg transition-shadow duration-200">
        <div className={`${bgColor} rounded-full p-4 mb-4 group-hover:scale-105 transition-transform`}>
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
