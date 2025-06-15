
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';

// Dummy logos - swap these with actual URLs as needed!
const collaborators = [
  {
    name: 'Techify Inc.',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg',
  },
  {
    name: 'EduWorld',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Icon-Vue.png',
  },
  {
    name: 'Coders LTD',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d9/Node.js_logo.svg',
  },
  {
    name: 'Jane Studios',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/9/96/Solidity.svg',
  },
  {
    name: 'NextLeap',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/8/8e/Nextjs-logo.svg',
  },
  {
    name: 'DesignLab',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg',
  },
];

export default function CollaboratorsSlider() {
  return (
    <section className="py-6 bg-white">
      <div className="athfal-container">
        <h3 className="text-center font-semibold text-gray-500 text-base mb-4">
          Telah bekerjasama dengan / In collaboration with
        </h3>
        <Carousel
          opts={{
            align: 'start',
            loop: true,
            dragFree: true,
            slidesToScroll: 'auto',
            containScroll: 'trimSnaps',
            // speed: 10, // <-- Removed invalid property
          }}
          className="relative w-full max-w-5xl mx-auto"
        >
          <CarouselContent>
            {collaborators.map((c, idx) => (
              <CarouselItem
                key={c.name + idx}
                className="basis-auto px-4 flex items-center justify-center"
                style={{ width: 220, maxWidth: 240 }} // around 210 + padding
              >
                <img
                  src={c.logo}
                  alt={c.name}
                  title={c.name}
                  className="object-contain transition-all h-[35px] w-[210px] sm:h-[38px] sm:w-[220px] bg-white rounded-lg shadow border border-gray-100 hover:scale-105"
                  style={{ minWidth: 120, minHeight: 25 }}
                />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  );
}

