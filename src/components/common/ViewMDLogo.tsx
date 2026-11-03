import React from 'react';

interface ViewMDLogoProps {
  className?: string;
  size?: number;
}

export const ViewMDLogo: React.FC<ViewMDLogoProps> = ({ className = 'w-5 h-5', size }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      width={size}
      height={size}
      className={className}
      aria-label="ViewMD Logo"
    >
      <defs>
        <linearGradient id="viewmd-app-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="viewmd-app-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#93c5fd" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* Squircle with subtle gradient */}
      <rect x="16" y="16" width="224" height="224" rx="54" fill="url(#viewmd-app-grad)" />
      <rect
        x="17.5"
        y="17.5"
        width="221"
        height="221"
        rx="52.5"
        fill="none"
        stroke="url(#viewmd-app-stroke)"
        strokeWidth="3"
      />

      {/* Markdown Emblem */}
      <g fill="#ffffff">
        <path d="M40 86 h18 l28 34 l28 -34 h18 v84 h-18 v-48 l-28 34 l-28 -34 v48 h-18 z" />
        <path d="M175 86 h18 v48 h23 l-32 36 l-32 -36 h23 z" />
      </g>
    </svg>
  );
};
