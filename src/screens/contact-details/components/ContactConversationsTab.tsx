import React, { useEffect, useCallback } from 'react';
import { ActivityIndicator, RefreshControl } from 'react-native';
import Animated from 'react-native-reanimated';
import { FlashList, ListRenderItem } from '@shopify/flash-list';

import { TAB_BAR_HEIGHT } from '@/constants';
import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { contactConversationActions } from '@/store/contact/contactConversationActions';
import { selectContactConversations } from '@/store/contact/contactConversationSlice';
import { Conversation } from '@/types/Conversation';
import { ContactConversationItem } from './ContactConversationItem';
import { EmptyStateIcon } from '@/svg-icons';
import i18n from '@/i18n';

type ContactConversationsTabProps = {
  contactId: number;
};

const AnimatedFlashlist = Animated.createAnimatedComponent(FlashList<Conversation>);

export const ContactConversationsTab = (props: ContactConversationsTabProps) => {
  const { contactId } = props;
  const { colors, isDark } = useThemeContext();
  const dispatch = useAppDispatch();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const conversationsMap = useAppSelector(selectContactConversations);
  const conversations = conversationsMap[contactId] || [];

  useEffect(() => {
    fetchConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  const fetchConversations = useCallback(async () => {
    await dispatch(contactConversationActions.getContactConversations({ contactId }));
  }, [dispatch, contactId]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchConversations();
    setIsRefreshing(false);
  }, [fetchConversations]);

  const handleRender: ListRenderItem<Conversation> = ({ item }) => {
    return <ContactConversationItem conversation={item} />;
  };

  if (conversations.length === 0) {
    return (
      <Animated.ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        contentContainerStyle={tailwind.style(
          'flex-1 items-center justify-center',
          `pb-[${TAB_BAR_HEIGHT}px]`,
        )}>
        <EmptyStateIcon stroke={isDark ? '#6B7280' : '#9CA3AF'} />
        <Animated.Text style={tailwind.style(`pt-6 text-md tracking-[0.32px] ${colors.textSecondary}`)}>
          {i18n.t('CONTACT_DETAILS.NO_CONVERSATIONS')}
        </Animated.Text>
      </Animated.ScrollView>
    );
  }

  return (
    <AnimatedFlashlist
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      data={conversations}
      estimatedItemSize={71}
      renderItem={handleRender}
      contentContainerStyle={tailwind.style(`pb-[${TAB_BAR_HEIGHT - 1}px]`)}
      keyboardShouldPersistTaps="handled"
      keyExtractor={item => item.id.toString()}
    />
  );
};
