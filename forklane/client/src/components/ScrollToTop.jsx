import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    // Disable browser automatic scroll restoration so SPA navigations always start at top
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    if (!hash) {
      const resetScroll = () => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      };

      resetScroll();
      requestAnimationFrame(resetScroll);
      const timer = setTimeout(resetScroll, 50);
      return () => clearTimeout(timer);
    }
  }, [pathname, search, hash]);

  return null;
};

export default ScrollToTop;
