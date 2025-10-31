import React from 'react';
import Svg, { Path, Defs, ClipPath, G, Rect } from 'react-native-svg';

export const AiAgentsIconOutline = () => {
  return (
    <Svg width="55" height="50" viewBox="0 4 49 40" fill="none">
      <G clipPath="url(#clip0_robot)">
        <Path
          d="M24.5 10C18.7 10 14 13.9 14 19C14 20.6 14.3 21.9 14.8 22.9C15.3 23.8 16.1 24.5 17.3 25C19.3 25.9 21.8 26.1 24.5 26.1C27.2 26.1 29.7 25.9 31.7 25C32.9 24.5 33.7 23.8 34.2 22.9C34.7 21.9 35 20.6 35 19C35 13.9 30.3 10 24.5 10Z"
          stroke="#171717"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path d="M20 15V18M29 15V18" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M24.5 7V9" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M24.5 28C21.4 28 18.4 28.3 15.5 28.9" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <Path d="M24.5 28C27.6 28 30.6 28.3 33.5 28.9" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </G>
      <Defs>
        <ClipPath id="clip0_robot">
          <Rect width="24" height="24" fill="white" transform="translate(12 8)" />
        </ClipPath>
      </Defs>
    </Svg>
  );
};


export const AiAgentsIconFilled = () => {
  return (
    <Svg width="55" height="50" viewBox="0 4 49 40" fill="none">
      <G clipPath="url(#clip0_robot)">
        <Path
          d="M24.5 10C18.7 10 14 13.9 14 19C14 20.6 14.3 21.9 14.8 22.9C15.3 23.8 16.1 24.5 17.3 25C19.3 25.9 21.8 26.1 24.5 26.1C27.2 26.1 29.7 25.9 31.7 25C32.9 24.5 33.7 23.8 34.2 22.9C34.7 21.9 35 20.6 35 19C35 13.9 30.3 10 24.5 10Z"
          fill="#171717"
        />
        <Path
          d="M20 15C20.5523 15 21 15.4477 21 16V17C21 17.5523 20.5523 18 20 18C19.4477 18 19 17.5523 19 17V16C19 15.4477 19.4477 15 20 15ZM29 15C29.5523 15 30 15.4477 30 16V17C30 17.5523 29.5523 18 29 18C28.4477 18 28 17.5523 28 17V16C28 15.4477 28.4477 15 29 15Z"
          fill="#FFFFFF"
        />
        <Path
          d="M24.5 7C24.7761 7 25 7.22386 25 7.5V9.5C25 9.77614 24.7761 10 24.5 10C24.2239 10 24 9.77614 24 9.5V7.5C24 7.22386 24.2239 7 24.5 7Z"
          fill="#171717"
        />
        <Path
          d="M15.5 28.9C18.4 28.3 21.4 28 24.5 28C27.6 28 30.6 28.3 33.5 28.9C33.8 29 33.9 29.4 33.7 29.7C33.5 30 33.1 30.1 32.8 30C29.9 29.4 27 29.1 24.5 29.1C22 29.1 19.1 29.4 16.2 30C15.9 30.1 15.5 30 15.3 29.7C15.1 29.4 15.2 29 15.5 28.9Z"
          fill="#171717"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_robot">
          <Rect width="24" height="24" fill="white" transform="translate(12 8)" />
        </ClipPath>
      </Defs>
    </Svg>
  );
};