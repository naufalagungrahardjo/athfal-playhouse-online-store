
import { Link } from "react-router-dom";

const Logo = () => (
  <Link to="/" className="flex items-center">
    <img
      src="/lovable-uploads/bcf7e399-f8e5-4001-8bfe-dd335c021c8e.png"
      alt="Athfal Playhouse Logo"
      className="h-10 md:h-12"
      width={48}
      height={48}
    />
  </Link>
);

export default Logo;
