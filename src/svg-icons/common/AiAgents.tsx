import React from 'react';
import Svg, { Path } from 'react-native-svg';

import { IconProps } from '../../types';

export const AiAgentsIcon = ({ stroke = '#858585' }: IconProps): JSX.Element => {
  return (
    <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM6 10C6.55 10 7 10.45 7 11C7 11.55 6.55 12 6 12C5.45 12 5 11.55 5 11C5 10.45 5.45 10 6 10ZM18 10C18.55 10 19 10.45 19 11C19 11.55 18.55 12 18 12C17.45 12 17 11.55 17 11C17 10.45 17.45 10 18 10ZM8 18C8.55 18 9 18.45 9 19C9 19.55 8.55 20 8 20C7.45 20 7 19.55 7 19C7 18.45 7.45 18 8 18ZM16 18C16.55 18 17 18.45 17 19C17 19.55 16.55 20 16 20C15.45 20 15 19.55 15 19C15 18.45 15.45 18 16 18ZM12 7C14.67 7 19 8.33 19 11V13C19 14.1 18.1 15 17 15H7C5.9 15 5 14.1 5 13V11C5 8.33 9.33 7 12 7ZM12 8C9.29 8 6 9.19 6 11V13C6 13.55 6.45 14 7 14H17C17.55 14 18 13.55 18 13V11C18 9.19 14.71 8 12 8Z"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={stroke}
      />
    </Svg>
  );
};
