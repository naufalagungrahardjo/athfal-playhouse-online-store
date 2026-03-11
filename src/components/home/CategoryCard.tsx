import { Link } from 'react-router-dom';
import { getOptimizedImageUrl } from '@/utils/imageOptimizer';

interface CategoryCardProps {
  title: string;
  href: string;
  image: string;
  bgColor: string;
}

export const CategoryCard = ({ title, href, image, bgColor }: CategoryCardProps) => {
  const isHex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(bgColor);
  const pastel = "#eecdc4";
  const bg = isHex ? bgColor : pastel;

  return (
    <Link to={href} className="group shrink-0 snap-start w-40 md:w-48">
      <div
        className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-200 aspect-square flex flex-col items-center justify-end"
        style={{ background: bg }}
      >
        {/* Category image */}
        <img
          src={getOptimizedImageUrl(image, { width: 300, quality: 80 })}
          alt={title}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          width={300}
          height={300}
        />
        {/* Title overlay */}
        <div className="relative z-10 w-full bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
          <h3 className="font-semibold text-white text-sm md:text-base text-center leading-tight">
            {title}
          </h3>
        </div>
      </div>
    </Link>
  );
};
