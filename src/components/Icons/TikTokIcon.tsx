import { SVGProps } from 'react';

// This component mimics the props of a lucide-react icon
export const TikTokIcon = (props: SVGProps<SVGSVGElement>) => {
  // Default Lucide props that can be overridden by `props`
  const defaultProps = {
    xmlns: "http://www.w3.org/2000/svg",
    width: "24",
    height: "24",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  } as const; 

  return (
    <svg {...defaultProps} {...props}>
      {/* --- CORRECTED TIKTOK SVG PATH --- */}
      <path d="M9 12a4 4 0 1 0 4 4v-12a5 5 0 0 0 5 5" />
    </svg>
  );
};