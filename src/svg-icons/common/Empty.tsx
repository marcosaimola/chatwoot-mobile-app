import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface EmptyStateIconProps {
  stroke?: string;
}

export const EmptyStateIcon = ({ stroke = '#9CA3AF' }: EmptyStateIconProps) => {
  return (
    <Svg width="64" height="64" viewBox="0 0 64 64" fill="none">
      {/* Box base - front face */}
      <Path
        d="M8 24L32 12L56 24V48L32 60L8 48V24Z"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Box inner line - center vertical */}
      <Path
        d="M32 36V60"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Box top - left flap */}
      <Path
        d="M8 24L32 36L56 24"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Open box flap - left */}
      <Path
        d="M8 24L20 8L32 16"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Open box flap - right */}
      <Path
        d="M56 24L44 8L32 16"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dashed lines inside to indicate empty */}
      <Path
        d="M24 42L28 44"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 3"
        opacity="0.5"
      />
      <Path
        d="M36 44L40 42"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 3"
        opacity="0.5"
      />
    </Svg>
  );
};
