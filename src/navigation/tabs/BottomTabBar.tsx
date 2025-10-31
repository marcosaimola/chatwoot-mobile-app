import React, { PropsWithChildren } from 'react';
import { Platform, Pressable } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from 'react-native-reanimated';
import { BlurView, BlurViewProps } from '@react-native-community/blur';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { selectCurrentState } from '@/store/conversation/conversationHeaderSlice';

import {
  AiAgentsIconFilled,
  AiAgentsIconOutline,
  ConversationIconFilled,
  ConversationIconOutline,
  InboxIconFilled,
  InboxIconOutline,
  SettingsIconFilled,
  SettingsIconOutline,
} from '@/svg-icons';
import { tailwind } from '@/theme';
import { useHaptic, useScaleAnimation, useTabBarHeight } from '@/utils';

import { TabParamList } from './AppTabs';
import { useAppSelector } from '@/hooks';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const tabExitSpringConfig = { damping: 20, stiffness: 360, mass: 1 };
const tabEnterSpringConfig = { damping: 30, stiffness: 360, mass: 1 };

type TabBarIconsProps = {
  focused: boolean;
  route: RouteProp<TabParamList, keyof TabParamList>;
};

const TabBarIcons = ({ focused, route }: TabBarIconsProps) => {
  switch (route.name) {
    case 'Conversations':
      return focused ? <ConversationIconFilled /> : <ConversationIconOutline />;
    case 'Inbox':
      return focused ? <InboxIconFilled /> : <InboxIconOutline />;
    case 'AiAgents':
      return focused ? <AiAgentsIconFilled /> : <AiAgentsIconOutline />;
    case 'Settings':
      return focused ? <SettingsIconFilled /> : <SettingsIconOutline />;
  }
};

type TabBarBackgroundProps = BlurViewProps & PropsWithChildren;

const TabBarBackground = (props: TabBarBackgroundProps) => {
  const { children, style, blurAmount, blurType } = props;

  const currentState = useAppSelector(selectCurrentState);

  const tabBarHeight = useTabBarHeight();

  const derivedAnimatedState = useDerivedValue(() =>
    currentState === 'Select'
      ? withSpring(1, tabExitSpringConfig)
      : withSpring(0, tabEnterSpringConfig),
  );

  const animatedTabBarStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(derivedAnimatedState.value, [0, 1], [0, tabBarHeight]),
        },
      ],
    };
  });

  return Platform.OS === 'ios' ? (
    <AnimatedBlurView {...{ blurAmount, blurType }} style={[style, animatedTabBarStyle]}>
      {children}
    </AnimatedBlurView>
  ) : (
    <Animated.View style={[style, animatedTabBarStyle]}>{children}</Animated.View>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TabItem = (props: any) => {
  const { handlers, animatedStyle } = useScaleAnimation();
  const hapticSelection = useHaptic('selection');

  const { onPress, onLongPress, isFocused, options, route } = props;

  // Memoize hitSlop to prevent new object reference on every render
  const hitSlop = React.useMemo(() => ({ top: 2, left: 10, right: 10, bottom: 10 }), []);

  // Use stable object reference for accessibilityState when not focused
  const accessibilityState = React.useMemo(
    () => (isFocused ? { selected: true } : {}),
    [isFocused],
  );

  const handlePress = React.useCallback(() => {
    hapticSelection?.();
    onPress();
  }, [hapticSelection, onPress]);

  return (
    <Animated.View
      style={[tailwind.style('justify-center items-center flex-1 bg-transparent'), animatedStyle]}>
      <Pressable
        hitSlop={hitSlop}
        {...handlers}
        accessibilityRole="button"
        accessibilityState={accessibilityState}
        accessibilityLabel={options.tabBarAccessibilityLabel}
        testID={options.tabBarTestID}
        onPress={handlePress}
        onLongPress={onLongPress}>
        <TabBarIcons focused={isFocused} route={route} />
      </Pressable>
    </Animated.View>
  );
};

export const BottomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const tabBarHeight = useTabBarHeight();
  const insets = useSafeAreaInsets();

  // Memoize press handlers using useCallback
  const createPressHandler = React.useCallback(
    (route: { key: string; name: string; params?: object }, isFocused: boolean) => {
      return () => {
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });

        if (!isFocused && !event.defaultPrevented) {
          navigation.navigate(route.name, route.params);
        }
      };
    },
    [navigation],
  );

  // Memoize long press handler
  const createLongPressHandler = React.useCallback(
    (route: { key: string; name: string; params?: object }) => {
      return () => {
        navigation.emit({
          type: 'tabLongPress',
          target: route.key,
        });
      };
    },
    [navigation],
  );

  return (
    <Animated.View
      style={[
        tailwind.style('absolute w-full'),
        Platform.select({
          ios: { bottom: 0 },
          android: { 
            bottom: 0,
            backgroundColor: 'white',
            paddingBottom: insets.bottom,
          },
        }),
      ]}>
      <TabBarBackground
        blurAmount={25}
        blurType="light"
        style={Platform.select({
          ios: [
            tailwind.style(
              'flex flex-row w-full pl-[72px] pr-[71px] pt-[11px] pb-8 bg-[#00000009]',
              `h-[${tabBarHeight}px]`,
            ),
          ],
          android: [
            tailwind.style(
              'flex flex-row w-full pl-[72px] pr-[71px] pt-[11px] pb-[11px] bg-white',
              `h-[${tabBarHeight}px]`,
            ),
          ],
        })}>
        <Animated.View style={tailwind.style('absolute inset-0 h-[1px] bg-blackA-A3')} />
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          return (
            <TabItem
              key={route.key}
              options={options}
              onPress={createPressHandler(route, isFocused)}
              onLongPress={createLongPressHandler(route)}
              route={route}
              isFocused={isFocused}
            />
          );
        })}
      </TabBarBackground>
    </Animated.View>
  );
};
