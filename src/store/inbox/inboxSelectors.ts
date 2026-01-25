import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';
import { inboxAdapter } from './inboxSlice';
import { InboxTypes } from '@/types/common/Channel';

export const selectInboxesState = (state: RootState) => state.inboxes;

export const { selectAll: selectAllInboxes } =
  inboxAdapter.getSelectors<RootState>(selectInboxesState);

export const selectInboxById = (state: RootState, inboxId: number) =>
  selectAllInboxes(state).find(inbox => inbox.id === inboxId);

/**
 * Select inboxes that support creating conversations from phone numbers
 * Only API and WhatsApp inboxes support this feature
 */
export const selectApiAndWhatsAppInboxes = createSelector([selectAllInboxes], inboxes =>
  inboxes.filter(
    inbox =>
      inbox.channelType === InboxTypes.API || inbox.channelType === InboxTypes.WHATSAPP,
  ),
);
