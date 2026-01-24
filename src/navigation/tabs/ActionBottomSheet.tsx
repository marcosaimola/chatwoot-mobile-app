import React, { useMemo } from 'react';
import { BottomSheetModal, useBottomSheetSpringConfigs } from '@gorhom/bottom-sheet';
import { tailwind } from '@/theme';
import { BottomSheetBackdrop } from '@/components-next';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  resetActionState,
  selectCurrentActionState,
} from '@/store/conversation/conversationActionSlice';

import { useRefsContext, useThemeContext } from '@/context';
import {
  UpdateAssignee,
  UpdateStatus,
  UpdateLabels,
  UpdateTeam,
  UpdatePriority,
} from '@/screens/conversations/components/conversation-actions';

const ActionBottomSheet = () => {
  const dispatch = useAppDispatch();
  const currentActionState = useAppSelector(selectCurrentActionState);
  const { isDark } = useThemeContext();

  const animationConfigs = useBottomSheetSpringConfigs({
    mass: 1,
    stiffness: 420,
    damping: 30,
  });

  const { actionsModalSheetRef } = useRefsContext();

  const actionSnapPoints = useMemo(() => {
    switch (currentActionState) {
      case 'Assign':
        return ['50%'];
      case 'Status':
        return [350]; // Aumentado de 250 para 350 para acomodar o botão
      case 'Label':
        return [368];
      case 'Priority':
        return [300];
      case 'TeamAssign':
        return ['50%'];
      default:
        return [250];
    }
  }, [currentActionState]);

  const handleOnDismiss = () => {
    dispatch(resetActionState());
  };

  return (
    <BottomSheetModal
      ref={actionsModalSheetRef}
      backdropComponent={BottomSheetBackdrop}
      backgroundStyle={tailwind.style(isDark ? 'bg-gray-950' : 'bg-white')}
      handleIndicatorStyle={tailwind.style(`overflow-hidden w-8 h-1 rounded-[11px] ${isDark ? 'bg-gray-600' : 'bg-blackA-A6'}`)}
      handleStyle={tailwind.style('p-0 h-4 pt-[5px]')}
      style={tailwind.style('rounded-[26px] overflow-hidden')}
      animationConfigs={animationConfigs}
      enablePanDownToClose
      snapPoints={actionSnapPoints}
      onDismiss={handleOnDismiss}>
      {currentActionState === 'Assign' ? <UpdateAssignee /> : null}
      {currentActionState === 'TeamAssign' ? <UpdateTeam /> : null}
      {currentActionState === 'Status' ? <UpdateStatus /> : null}
      {currentActionState === 'Label' ? <UpdateLabels /> : null}
      {currentActionState === 'Priority' ? <UpdatePriority /> : null}
    </BottomSheetModal>
  );
};

export default ActionBottomSheet;
