import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';

type Tab = {
  key: string;
  label: string;
  component: React.ReactNode;
};

type ContactTabsProps = {
  tabs: Tab[];
  initialTab?: number;
};

export const ContactTabs = (props: ContactTabsProps) => {
  const { tabs, initialTab = 0 } = props;
  const { colors } = useThemeContext();
  const [activeIndex, setActiveIndex] = useState(initialTab);

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <View style={tailwind.style('flex-1')}>
      {/* Tab Header */}
      <View
        style={tailwind.style(
          `flex-row border-b-[1px] ${colors.borderPrimary} bg-transparent`,
        )}>
        {tabs.map((tab, index) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveIndex(index)}
            style={tailwind.style('flex-1 py-3')}>
            <Animated.View
              style={tailwind.style(
                'items-center',
                activeIndex === index && `border-b-2 border-blue-600`,
              )}>
              <Animated.Text
                style={tailwind.style(
                  `text-sm font-inter-medium-24 ${
                    activeIndex === index ? colors.textPrimary : colors.textSecondary
                  }`,
                )}>
                {tab.label}
              </Animated.Text>
            </Animated.View>
          </Pressable>
        ))}
      </View>

      {/* Tab Content - Show only active tab */}
      <View style={tailwind.style('flex-1')}>
        {tabs[activeIndex]?.component}
      </View>
    </View>
  );
};
