import React, { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { useRefsContext, useThemeContext } from '@/context';
import { TickIcon } from '@/svg-icons';
import { tailwind } from '@/theme';
import { AssigneeTypes } from '@/types';
import { useHaptic } from '@/utils';
import { BottomSheetHeader, Icon } from '@/components-next';
import { selectFilters, setFilters } from '@/store/conversation/conversationFilterSlice';
import { useAppDispatch, useAppSelector } from '@/hooks';
import i18n from '@/i18n';
import { AssigneeOptions } from '@/types';
import { useSelector } from 'react-redux';
import { selectUser } from '@/store/auth/authSelectors';
import { getUserPermissions, getCurrentAccount } from '@/utils/permissionUtils';

type AssigneeTypeCellProps = {
  value: string;
  index: number;
};

const assigneeTypeList = Object.keys(AssigneeOptions) as AssigneeTypes[];

const AssigneeTypeCell = (props: AssigneeTypeCellProps) => {
  const { filtersModalSheetRef } = useRefsContext();
  const { colors } = useThemeContext();
  const { value, index } = props;
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectFilters);
  const hapticSelection = useHaptic();

  const handlePreferredAssigneeTypePress = () => {
    hapticSelection?.();
    dispatch(setFilters({ key: 'assignee_type', value }));
    setTimeout(() => filtersModalSheetRef.current?.dismiss({ overshootClamping: true }), 1);
  };

  return (
    <Pressable
      onPress={handlePreferredAssigneeTypePress}
      style={tailwind.style('flex flex-row items-center')}>
      <Animated.View
        style={tailwind.style(
          'flex-1 ml-3 flex-row justify-between py-[11px] pr-3',
          index !== assigneeTypeList.length - 1 ? `border-b-[1px] ${colors.borderPrimary}` : '',
        )}>
        <Animated.Text
          style={tailwind.style(
            `text-base font-inter-420-20 leading-[21px] tracking-[0.16px] capitalize ${colors.textPrimary}`,
          )}>
          {i18n.t(`CONVERSATION.FILTERS.ASSIGNEE_TYPE.OPTIONS.${value.toUpperCase()}`)}
        </Animated.Text>
        {filters.assignee_type === value ? <Icon icon={<TickIcon />} size={20} /> : null}
      </Animated.View>
    </Pressable>
  );
};

export const AssigneeTypeFilters = () => {
  const dispatch = useAppDispatch();
  const user = useSelector(selectUser);
  const filters = useAppSelector(selectFilters);
  const { account_id: activeAccountId } = user || { account_id: null };

  const userPermissions = user ? getUserPermissions(user, activeAccountId) : [];
  const currentAccount = user ? getCurrentAccount(user, activeAccountId) : undefined;

  // Check if user is administrator
  const isAdmin =
    userPermissions.includes('administrator') ||
    currentAccount?.role === 'administrator';

  let assigneeTypes = assigneeTypeList;

  if (isAdmin) {
    // Administrators can see all assignee types
    assigneeTypes = assigneeTypeList;
  } else {
    // For non-admin users, check the new permission flags
    const canViewAll = currentAccount?.can_view_all_conversations ?? true; // Default to true for backward compatibility
    const canViewUnassigned = currentAccount?.can_view_unassigned_conversations ?? true; // Default to true for backward compatibility

    // Filter based on the new permission flags
    assigneeTypes = assigneeTypeList.filter(type => {
      if (type === 'all' && !canViewAll) {
        return false;
      }
      if (type === 'unassigned' && !canViewUnassigned) {
        return false;
      }
      return true;
    });
  }

  // Auto-correct filter if current selection is not available
  useEffect(() => {
    const currentAssigneeType = filters.assignee_type;
    const isCurrentFilterAvailable = assigneeTypes.includes(currentAssigneeType as AssigneeTypes);
    
    if (!isCurrentFilterAvailable) {
      // If the current filter is not available, reset to 'me'
      dispatch(setFilters({ key: 'assignee_type', value: 'me' }));
    }
  }, [assigneeTypes, filters.assignee_type, dispatch]);

  return (
    <Animated.View>
      <BottomSheetHeader headerText={i18n.t('CONVERSATION.FILTERS.ASSIGNEE_TYPE.TITLE')} />
      <Animated.View style={tailwind.style('py-1 pl-3')}>
        {assigneeTypes.map((value, index) => (
          <AssigneeTypeCell key={index} {...{ value, index }} />
        ))}
      </Animated.View>
    </Animated.View>
  );
};
