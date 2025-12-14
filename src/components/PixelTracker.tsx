import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const PixelTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // This fires a 'PageView' event every time the URL changes
    // @ts-ignore
    if (window.fbq) {
      // @ts-ignore
      window.fbq('track', 'PageView');
    }
  }, [location]);

  return null; // This component doesn't render anything visible
};