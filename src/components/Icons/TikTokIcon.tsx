import { SVGProps } from 'react';

export const TikTokIcon = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* TikTok logo — EXACTLY matches Lucide Instagram/Facebook height & weight */}
      <path d="M12 3v9a3 3 0 1 0 3 3V9a5 5 0 0 0 5-5h-2a3 3 0 0 1-3 3V3" />
      <path d="M12 3v6" />
    </svg>
  );
};