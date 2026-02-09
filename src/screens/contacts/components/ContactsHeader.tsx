import React, { useState, useEffect } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Icon } from '@/components-next/common/icon';
import { SearchIcon, AddIcon, FilterIcon } from '@/svg-icons';
import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { setSearchQuery } from '@/store/contact/contactListSlice';
import { selectSearchQuery } from '@/store/contact/contactListSelectors';

type ContactsHeaderProps = {
  onSearch: (query: string) => void;
  onAddPress?: () => void;
  onSortPress?: () => void;
};

export const ContactsHeader = (props: ContactsHeaderProps) => {
  const { onSearch, onAddPress, onSortPress } = props;
  const { colors, isDark } = useThemeContext();
  const dispatch = useAppDispatch();
  const searchQuery = useAppSelector(selectSearchQuery);
  const [searchText, setSearchText] = useState(searchQuery || '');

  // Sync local state with Redux state when it changes externally
  useEffect(() => {
    setSearchText(searchQuery || '');
  }, [searchQuery]);

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    dispatch(setSearchQuery(text));
    onSearch(text);
  };

  return (
    <Animated.View style={[tailwind.style(`border-b-[1px] ${colors.borderPrimary}`)]}>
      <Animated.View
        style={[tailwind.style('flex flex-row justify-between items-center px-4 pt-2 pb-[12px]')]}>
        {onSortPress ? (
          <Pressable onPress={onSortPress} hitSlop={8}>
            <Icon
              icon={<FilterIcon stroke={isDark ? '#FFFFFF' : '#171717'} />}
              size={24}
            />
          </Pressable>
        ) : (
          <View style={tailwind.style('w-6')} />
        )}
        <Animated.View style={tailwind.style('flex-1')}>
          <Animated.Text
            style={tailwind.style(
              `text-[17px] text-center leading-[17px] tracking-[0.32px] font-inter-medium-24 ${colors.textPrimary}`,
            )}>
            Contatos
          </Animated.Text>
        </Animated.View>
        {onAddPress ? (
          <Pressable onPress={onAddPress} hitSlop={8}>
            <Icon
              icon={<AddIcon stroke={isDark ? '#FFFFFF' : '#171717'} />}
              size={24}
            />
          </Pressable>
        ) : (
          <View style={tailwind.style('w-6')} />
        )}
      </Animated.View>
      <Animated.View style={tailwind.style('px-4 pb-3')}>
        <Animated.View
          style={tailwind.style(
            `flex flex-row items-center px-3 py-2 rounded-lg ${colors.bgSecondary}`,
          )}>
          <Icon icon={<SearchIcon />} size={20} />
          <TextInput
            style={tailwind.style(
              `flex-1 ml-2 text-md font-inter-420-20 ${colors.textPrimary}`,
            )}
            placeholder="Buscar contatos..."
            placeholderTextColor={tailwind.color(colors.textSecondary)}
            value={searchText}
            onChangeText={handleSearchChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};
