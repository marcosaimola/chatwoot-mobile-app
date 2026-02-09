import React, { PropsWithChildren } from 'react';
import { Platform, Pressable, View, Text } from 'react-native';
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
import { selectTotalUnreadCount } from '@/store/conversation/conversationSelectors';

import {
  AiAgentsIconFilled,
  AiAgentsIconOutline,
  ConversationIconFilled,
  ConversationIconOutline,
  ContactsIconFilled,
  ContactsIconOutline,
  SettingsIconFilled,
  SettingsIconOutline,
} from '@/svg-icons';
import { tailwind } from '@/theme';
import { useTheme } from '@/theme/useTheme';
import { useHaptic, useScaleAnimation, useTabBarHeight } from '@/utils';

import { TabParamList } from './AppTabs';
import { useAppSelector } from '@/hooks';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const tabExitSpringConfig = { damping: 20, stiffness: 360, mass: 1 };
const tabEnterSpringConfig = { damping: 30, stiffness: 360, mass: 1 };

type TabBarIconsProps = {
  focused: boolean;
  route: RouteProp<TabParamList, keyof TabParamList>;
  iconColor?: string;
};

const TabBarIcons = ({ focused, route, iconColor }: TabBarIconsProps) => {
  switch (route.name) {
    case 'Conversations':
      return focused ? <ConversationIconFilled color={iconColor} /> : <ConversationIconOutline color={iconColor} />;
    case 'Inbox':
      return focused ? <ContactsIconFilled color={iconColor} /> : <ContactsIconOutline color={iconColor} />;
    case 'Contacts':
      return focused ? <ContactsIconFilled color={iconColor} /> : <ContactsIconOutline color={iconColor} />;
    case 'AiAgents':
      return focused ? <AiAgentsIconFilled color={iconColor} /> : <AiAgentsIconOutline color={iconColor} />;
    case 'Settings':
      return focused ? <SettingsIconFilled color={iconColor} /> : <SettingsIconOutline color={iconColor} />;
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
  const totalUnreadCount = useAppSelector(selectTotalUnreadCount);
  const { isDark } = useTheme();

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

  const showBadge = route.name === 'Conversations' && totalUnreadCount > 0;

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
        <View style={tailwind.style('relative')}>
        <TabBarIcons 
          focused={isFocused} 
          route={route} 
          iconColor={
            isFocused 
              ? (isDark ? '#0A84FF' : '#171717') // Azul no dark quando ativo, preto no light
              : (isDark ? '#FFFFFF' : '#171717') // Branco no dark quando inativo, preto no light
          } 
        />
          {showBadge && (
            <View
              style={[
                tailwind.style('absolute h-5 min-w-[20px] px-1.5 flex justify-center items-center rounded-full bg-blue-700'),
                { top: -3, right: -3 },
              ]}>
              <Text
                style={tailwind.style(
                  'text-[10px] font-inter-semibold-20 leading-none text-center text-white',
                )}>
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount.toString()}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

export const BottomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const tabBarHeight = useTabBarHeight();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

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
      pointerEvents="box-none"
      style={[
        tailwind.style('absolute w-full'),
        Platform.select({
          ios: { bottom: 0 },
          android: { 
            bottom: 0,
            backgroundColor: isDark ? '#2C2C2E' : '#FFFFFF',
            paddingBottom: insets.bottom,
          },
        }),
      ]}>
      <TabBarBackground
        blurAmount={25}
        blurType={isDark ? 'dark' : 'light'}
        style={Platform.select({
          ios: [
            tailwind.style(
              'flex flex-row w-full pl-[72px] pr-[71px] pt-[11px] pb-8',
              isDark ? 'bg-[#2C2C2E80]' : 'bg-[#00000009]',
              `h-[${tabBarHeight}px]`,
            ),
          ],
          android: [
            tailwind.style(
              'flex flex-row w-full pl-[72px] pr-[71px] pt-[11px] pb-[11px]',
              isDark ? 'bg-grayDark-100' : 'bg-white',
              `h-[${tabBarHeight}px]`,
            ),
          ],
        })}>
        <Animated.View style={tailwind.style('absolute inset-0 h-[1px]', colors.borderPrimary)} />
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
