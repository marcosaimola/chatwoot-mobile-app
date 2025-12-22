import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Asset } from 'react-native-image-picker';
import { Message } from '@/types';
import { RootState } from '@/store';

interface SendMessageState {
  messageContent: string;
  isPrivateMessage: boolean;
  attachments: Asset[];
  quoteMessage: Message | null;
}

const initialState: SendMessageState = {
  messageContent: '',
  isPrivateMessage: false,
  attachments: [],
  quoteMessage: null,
};

const sendMessageSlice = createSlice({
  name: 'sendMessage',
  initialState,
  reducers: {
    setMessageContent: (state, action: PayloadAction<string>) => {
      state.messageContent = action.payload;
    },
    togglePrivateMessage: (state, action: PayloadAction<boolean>) => {
      state.isPrivateMessage = action.payload;
    },
    updateAttachments: (state, action: PayloadAction<Asset[]>) => {
      const MAX_IMAGES = 10;
      const newAttachments = action.payload;
      
      // Separate current attachments into images and non-images
      const currentImages = state.attachments.filter(att => att.type?.includes('image'));
      const currentNonImages = state.attachments.filter(att => !att.type?.includes('image'));
      
      // Separate new attachments into images and non-images
      const newImages = newAttachments.filter(att => att.type?.includes('image'));
      const newNonImages = newAttachments.filter(att => !att.type?.includes('image'));
      
      // Validate images limit (max 10 total)
      const totalImages = currentImages.length + newImages.length;
      if (totalImages > MAX_IMAGES) {
        // Only add images up to the limit
        const imagesToAdd = newImages.slice(0, MAX_IMAGES - currentImages.length);
        state.attachments = [...currentImages, ...imagesToAdd, ...currentNonImages];
        // Note: Error message should be shown by the caller
        return;
      }
      
      // Validate non-images limit (max 1 total)
      if (newNonImages.length > 0) {
        if (currentNonImages.length > 0) {
          // Replace existing non-image with new one
          state.attachments = [...currentImages, ...newNonImages];
          return;
        }
        // Add new non-image
        state.attachments = [...currentImages, ...newImages, ...newNonImages];
        return;
      }
      
      // Add new images (already validated limit above)
      state.attachments = [...currentImages, ...newImages, ...currentNonImages];
    },
    deleteAttachment: (state, action: PayloadAction<number>) => {
      state.attachments.splice(action.payload, 1);
    },
    resetAttachments: state => {
      state.attachments = [];
    },
    setQuoteMessage: (state, action: PayloadAction<Message | null>) => {
      state.quoteMessage = action.payload;
    },
    resetSentMessage: state => {
      state.attachments = [];
      state.quoteMessage = null;
      state.messageContent = '';
    },
  },
});

export const selectMessageContent = (state: RootState) => state.sendMessage.messageContent;
export const selectIsPrivateMessage = (state: RootState) => state.sendMessage.isPrivateMessage;
export const selectAttachments = (state: RootState) => state.sendMessage.attachments;
export const selectQuoteMessage = (state: RootState) => state.sendMessage.quoteMessage;

export const {
  setMessageContent,
  togglePrivateMessage,
  updateAttachments,
  deleteAttachment,
  resetAttachments,
  setQuoteMessage,
  resetSentMessage,
} = sendMessageSlice.actions;

export default sendMessageSlice.reducer;
