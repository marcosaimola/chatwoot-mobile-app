import React, { PropsWithChildren } from 'react';
import { BottomSheetView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeContext } from '@/context';
import { tailwind } from '@/theme';

interface BottomSheetWrapperProps extends PropsWithChildren {
  fillHeight?: boolean;
}

export const BottomSheetWrapper = (props: BottomSheetWrapperProps) => {
  const { children, fillHeight = false } = props;
  const insets = useSafeAreaInsets();
  const { colors } = useThemeContext();
  
  // Add bottom padding for iOS safe area, with a minimum of 16px
  const bottomPadding = Math.max(insets.bottom, 16);
  
  return (
    <BottomSheetView style={[
      tailwind.style(colors.bgPrimary),
      { paddingBottom: bottomPadding },
      fillHeight && { flex: 1 },
    ]}>
      {children}
    </BottomSheetView>
  );
};
