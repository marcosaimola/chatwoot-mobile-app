import React from 'react';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

export const AdaptiveIcon = () => {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 64 64" fill="none">
      <Defs>
        <LinearGradient
          id="adaptiveIconGradient"
          x1="0"
          y1="0"
          x2="64"
          y2="0"
          gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#3b82f6" />
          <Stop offset="50%" stopColor="#8b5cf6" />
          <Stop offset="100%" stopColor="#ec4899" />
        </LinearGradient>
      </Defs>
      {/* Outer gradient stroke */}
      <Rect
        x="4"
        y="8"
        width="56"
        height="40"
        rx="12"
        ry="12"
        fill="none"
        stroke="url(#adaptiveIconGradient)"
        strokeWidth="4"
      />
      {/* Inner white stroke */}
      <Rect
        x="8"
        y="12"
        width="48"
        height="32"
        rx="10"
        ry="10"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
      />
      {/* Black interior */}
      <Rect x="9" y="13" width="46" height="30" rx="9" ry="9" fill="black" />
      {/* Three dots */}
      <Circle
        cx="26"
        cy="28"
        r="4"
        fill="#3b82f6"
        stroke="white"
        strokeWidth="0.8"
      />
      <Circle
        cx="32"
        cy="28"
        r="4"
        fill="#8b5cf6"
        stroke="white"
        strokeWidth="0.8"
      />
      <Circle
        cx="38"
        cy="28"
        r="4"
        fill="#ec4899"
        stroke="white"
        strokeWidth="0.8"
      />
    </Svg>
  );
};
