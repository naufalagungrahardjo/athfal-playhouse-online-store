
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * This component forces scroll to top on every route change,
 * and disables browser's default scroll restoration.
 */
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Force browser to always restore scroll to top on navigation
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    // Clean up (not strictly needed, but for completeness)
    return () => {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "auto";
      }
    };
  }, [pathname]);

  return null;
};

export default ScrollToTop;
