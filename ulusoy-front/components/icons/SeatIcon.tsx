import React from "react";

export const SeatIcon = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 100 100"
    fill="currentColor"
    className={className}
    {...props}
  >
    {/* Koltuk Sırtı */}
    <path d="M20 30 C 20 15, 80 15, 80 30 L 80 80 C 80 90, 20 90, 20 80 Z" stroke="currentColor" strokeWidth="4" fill="none" />
    {/* Kafalık */}
    <path d="M30 10 C 30 0, 70 0, 70 10 L 70 25 L 30 25 Z" stroke="currentColor" strokeWidth="4" fill="currentColor" fillOpacity="0.2" />
    {/* Sağ Kolçak */}
    <rect x="82" y="45" width="8" height="40" rx="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
    {/* Sol Kolçak */}
    <rect x="10" y="45" width="8" height="40" rx="4" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
    {/* Oturma Yeri */}
    <rect x="25" y="45" width="50" height="40" rx="5" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);
