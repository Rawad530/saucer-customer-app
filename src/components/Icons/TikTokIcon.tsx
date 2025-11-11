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
  } as const; // <-- This 'as const' fixes the TypeScript type error

  return (
    <svg {...defaultProps} {...props}>
      <path d="M16 4.99a6.5 6.5 0 1 1-13 0a6.5 6.5 0 0 1 13 0z" />
      <path d="M16 4.99v-1.5h-5.5a2.5 2.5 0 1 0 0 5h5.5v-1.5" />
    </svg>
  );
};