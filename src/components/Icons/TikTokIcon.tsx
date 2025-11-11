import { SVGProps } from 'react';

export const TikTokIcon = (props: SVGProps<SVGSVGElement>) => {
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
      {/* Official TikTok “note” – scaled to fill the 24×24 box */}
      <path d="M12 3.5v8a3.5 3.5 0 1 0 3.5 3.5V8.5a5.5 5.5 0 0 0 5.5-5.5h-2a3.5 3.5 0 0 1-3.5 3.5V3.5" />
    </svg>
  );
};