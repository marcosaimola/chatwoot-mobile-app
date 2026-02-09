import React, { useMemo } from 'react';
import { Pressable, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { useHaptic } from '@/utils';
import { Icon } from '@/components-next/common/icon';
import { TickIcon } from '@/svg-icons';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setSortBy, setSortOrder } from '@/store/contact/contactListSlice';
import i18n from '@/i18n';

type SortOption = {
  key: string;
  label: string;
  value: string;
};

type OrderOption = {
  key: 'asc' | 'desc';
  label: string;
};

function getSortOptions(): SortOption[] {
  return [
    { key: 'name', label: i18n.t('CONTACTS.SORT.NAME'), value: 'name' },
    { key: 'email', label: i18n.t('CONTACTS.SORT.EMAIL'), value: 'email' },
    { key: 'city', label: i18n.t('CONTACTS.SORT.CITY'), value: 'city' },
    { key: 'last_activity_at', label: i18n.t('CONTACTS.SORT.LAST_ACTIVITY'), value: 'last_activity_at' },
    { key: 'created_at', label: i18n.t('CONTACTS.SORT.CREATED_AT'), value: 'created_at' },
  ];
}

function getOrderOptions(): OrderOption[] {
  return [
    { key: 'asc', label: i18n.t('CONTACTS.SORT.ASCENDING') },
    { key: 'desc', label: i18n.t('CONTACTS.SORT.DESCENDING') },
  ];
}

type SortCellProps = {
  option: SortOption;
  index: number;
  isLast: boolean;
  isSelected: boolean;
  onPress: () => void;
  colors: {
    textPrimary: string;
    borderPrimary: string;
  };
};

const SortCell = ({ option, index, isLast, isSelected, onPress, colors }: SortCellProps) => {
  const hapticSelection = useHaptic();

  const handlePress = () => {
    hapticSelection?.();
    onPress();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={tailwind.style(
          'flex-row items-center py-[15px] px-4',
          !isLast && `border-b-[1px] ${colors.borderPrimary}`,
        )}>
        <Text
          style={tailwind.style(
            `flex-1 text-base font-inter-420-20 leading-[21px] tracking-[0.16px] ${colors.textPrimary}`,
          )}>
          {option.label}
        </Text>
        {isSelected && <Icon icon={<TickIcon />} size={20} />}
      </Animated.View>
    </Pressable>
  );
};

type OrderCellProps = {
  option: OrderOption;
  index: number;
  isLast: boolean;
  isSelected: boolean;
  onPress: () => void;
  colors: {
    textPrimary: string;
    borderPrimary: string;
  };
};

const OrderCell = ({ option, index, isLast, isSelected, onPress, colors }: OrderCellProps) => {
  const hapticSelection = useHaptic();

  const handlePress = () => {
    hapticSelection?.();
    onPress();
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        style={tailwind.style(
          'flex-row items-center py-[15px] px-4',
          !isLast && `border-b-[1px] ${colors.borderPrimary}`,
        )}>
        <Text
          style={tailwind.style(
            `flex-1 text-base font-inter-420-20 leading-[21px] tracking-[0.16px] ${colors.textPrimary}`,
          )}>
          {option.label}
        </Text>
        {isSelected && <Icon icon={<TickIcon />} size={20} />}
      </Animated.View>
    </Pressable>
  );
};

export const ContactSortSheet = ({ onDismiss }: { onDismiss: () => void }) => {
  const { colors } = useThemeContext();
  const dispatch = useAppDispatch();
  const { sortBy, sortOrder } = useAppSelector(state => state.contactList);

  // Get translated options inside the component
  const sortOptions = useMemo(() => getSortOptions(), []);
  const orderOptions = useMemo(() => getOrderOptions(), []);

  const handleSortByPress = (value: string) => {
    dispatch(setSortBy(value));
  };

  const handleSortOrderPress = (value: 'asc' | 'desc') => {
    dispatch(setSortOrder(value));
    // Dismiss after selecting order
    setTimeout(() => {
      onDismiss();
    }, 100);
  };

  return (
    <Animated.View style={tailwind.style('py-1')}>
      {/* Classificar por */}
      <Animated.View style={tailwind.style('px-4 py-2')}>
        <Animated.Text
          style={tailwind.style(
            `text-sm font-inter-medium-24 mb-2 ${colors.textSecondary}`,
          )}>
          {i18n.t('CONTACTS.SORT.SORT_BY')}
        </Animated.Text>
        {sortOptions.map((option, index) => (
          <SortCell
            key={option.key}
            option={option}
            index={index}
            isLast={index === sortOptions.length - 1}
            isSelected={sortBy === option.value}
            onPress={() => handleSortByPress(option.value)}
            colors={colors}
          />
        ))}
      </Animated.View>

      {/* Ordenação */}
      <Animated.View style={tailwind.style('px-4 py-2 mt-2', `border-t-[1px] ${colors.borderPrimary}`)}>
        <Animated.Text
          style={tailwind.style(
            `text-sm font-inter-medium-24 mb-2 ${colors.textSecondary}`,
          )}>
          {i18n.t('CONTACTS.SORT.ORDER')}
        </Animated.Text>
        {orderOptions.map((option, index) => (
          <OrderCell
            key={option.key}
            option={option}
            index={index}
            isLast={index === orderOptions.length - 1}
            isSelected={sortOrder === option.key}
            onPress={() => handleSortOrderPress(option.key)}
            colors={colors}
          />
        ))}
      </Animated.View>
    </Animated.View>
  );
};
