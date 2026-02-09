import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@/store';

export const selectContactListState = (state: RootState) => state.contactList;

export const selectContactList = createSelector(
  selectContactListState,
  state => state.contacts,
);

export const selectIsLoadingContacts = createSelector(
  selectContactListState,
  state => state.isLoading,
);

export const selectContactListError = createSelector(
  selectContactListState,
  state => state.error,
);

export const selectContactListMeta = createSelector(
  selectContactListState,
  state => state.meta,
);

export const selectIsAllContactsFetched = createSelector(
  selectContactListState,
  state => state.isAllContactsFetched,
);

export const selectSearchQuery = createSelector(
  selectContactListState,
  state => state.searchQuery,
);
