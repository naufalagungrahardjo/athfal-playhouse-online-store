
import { Link } from "react-router-dom";
import React from "react";

type NavProps = {
  language: "id" | "en";
  nav: Record<string, { id: string; en: string }>;
  extraClass?: string;
  includeLinks?: ("home"|"products"|"gallery"|"about"|"blog"|"faq")[];
  children?: React.ReactNode;
};

export const NavigationLinks: React.FC<NavProps> = ({
  language,
  nav,
  extraClass = "",
  includeLinks = ["home","products","gallery","about","blog","faq"],
  children
}) => {
  const navItemClass = `text-athfal-pink font-medium hover:text-athfal-pink/80 text-sm ${extraClass}`;
  return (
    <>
      {includeLinks.includes("home") && (
        <Link to="/" className={navItemClass}>
          {language === "id" ? nav.home.id : nav.home.en}
        </Link>
      )}
      {children}
      {includeLinks.includes("gallery") && (
        <Link to="/gallery" className={navItemClass}>
          {language === "id" ? nav.gallery.id : nav.gallery.en}
        </Link>
      )}
      {includeLinks.includes("about") && (
        <Link to="/about" className={navItemClass}>
          {language === "id" ? nav.about.id : nav.about.en}
        </Link>
      )}
      {includeLinks.includes("blog") && (
        <Link to="/blog" className={navItemClass}>
          {language === "id" ? nav.blog.id : nav.blog.en}
        </Link>
      )}
      {includeLinks.includes("faq") && (
        <Link to="/faq" className={navItemClass}>
          {language === "id" ? nav.faq.id : nav.faq.en}
        </Link>
      )}
    </>
  );
};
