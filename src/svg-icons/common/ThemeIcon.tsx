import * as React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

type ThemeIconProps = {
  stroke?: string;
  fill?: string;
};

export const ThemeIcon = ({ stroke = '#394150', fill = 'none' }: ThemeIconProps) => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill={fill}>
    <Circle cx="12" cy="12" r="4" stroke={stroke} strokeWidth="1.5" />
    <Path
      d="M12 2V4M12 20V22M4 12H2M22 12H20M19.78 19.78L18.36 18.36M5.64 5.64L4.22 4.22M19.78 4.22L18.36 5.64M5.64 18.36L4.22 19.78"
      stroke={stroke}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </Svg>
);
