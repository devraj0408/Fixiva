/* eslint-disable react-refresh/only-export-components */
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Automatically scrolls down to the feature content container
 * whenever route path or tab query parameters change.
 */
export const scrollToFeatureContent = () => {
  setTimeout(() => {
    // Look for target feature workspace containers
    const targetElement = 
      document.getElementById('admin-panel-content') ||
      document.getElementById('dashboard-main-content') ||
      document.getElementById('feature-content') ||
      document.getElementById('main-content') ||
      document.querySelector('main');

    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      // Offset by sticky navbar height (~70px) so feature container is perfectly visible right below navbar
      const targetY = Math.max(0, rect.top + scrollTop - 75);

      window.scrollTo({
        top: targetY,
        left: 0,
        behavior: 'smooth'
      });
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    }
  }, 60);
};

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // If user clicks home logo directly without parameters, go to top
    if (pathname === '/' && !search) {
      window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    } else {
      scrollToFeatureContent();
    }
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;
