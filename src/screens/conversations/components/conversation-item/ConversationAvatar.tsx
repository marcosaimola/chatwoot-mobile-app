import React, { memo } from 'react';
import { ImageURISource } from 'react-native';
import { LinearTransition } from 'react-native-reanimated';
import { isEqual } from 'lodash';

import { Avatar, AvatarStatusType } from '@/components-next/common';
import { AnimatedNativeView } from '@/components-next/native-components';
import { tailwind } from '@/theme';
import { AvailabilityStatus } from '@/types';

type ConversationAvatarProps = {
  src: ImageURISource;
  name: string;
  status: AvailabilityStatus;
};

const checkIfPropsAreSame = (prev: ConversationAvatarProps, next: ConversationAvatarProps) => {
  const arePropsEqual = isEqual(prev, next);
  return arePropsEqual;
};

export const ConversationAvatar = memo((props: ConversationAvatarProps) => {
  const { src, name, status } = props;
  
  // Optimize image props for better performance
  const optimizedImageProps = {
    cachePolicy: 'memory-disk' as const,
    recyclingKey: typeof src === 'object' && 'uri' in src ? src.uri : undefined,
    placeholder: { blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' },
    transition: 200,
  };
  
  return (
    <AnimatedNativeView
      style={tailwind.style('')}
      layout={LinearTransition.springify().damping(28).stiffness(200)}>
      <Avatar 
        size="4xl" 
        {...{ src, name, status: status as AvatarStatusType }} 
        imageProps={optimizedImageProps}
      />
    </AnimatedNativeView>
  );
}, checkIfPropsAreSame);

ConversationAvatar.displayName = 'ConversationAvatar';
