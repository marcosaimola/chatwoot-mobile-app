import React, { PropsWithChildren } from 'react';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const BottomSheetWrapper = (props: PropsWithChildren) => {
  const { children } = props;
  const insets = useSafeAreaInsets();
  
  // Add bottom padding for iOS safe area, with a minimum of 16px
  const bottomPadding = Math.max(insets.bottom, 16);
  
  return (
    <BottomSheetView style={{ paddingBottom: bottomPadding }}>
      {children}
    </BottomSheetView>
  );
};
