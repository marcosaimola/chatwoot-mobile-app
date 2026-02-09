import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { useAppDispatch, useAppSelector } from '@/hooks';
import {
  selectIsForwardMode,
  selectSelectedMessagesArray,
  selectSelectedContactsArray,
  selectForwardMessageText,
  selectShowInboxSelector,
  clearForwardState,
  setShowInboxSelector,
} from '@/store/conversation/forwardMessageSlice';
import { addRecentContacts } from '@/store/contact/recentContactsSlice';
import { ForwardBar } from '../forward-bar';
import { ForwardInboxSheet, ForwardInboxSheetHandle } from '../forward-inbox';
import { Inbox, Contact } from '@/types';
import { conversationActions } from '@/store/conversation/conversationActions';
import { showToast } from '@/utils/toastUtils';
import i18n from '@/i18n';

// Helper to get mime type from file type
const getMimeType = (fileType: string, extension?: string): string => {
  // Try to get more specific mime type from extension
  if (extension) {
    const ext = extension.toLowerCase();
    if (['jpg', 'jpeg'].includes(ext)) return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    if (ext === 'gif') return 'image/gif';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'mp4') return 'video/mp4';
    if (ext === 'webm') return 'video/webm';
    if (ext === 'mov') return 'video/quicktime';
    if (ext === 'mp3') return 'audio/mpeg';
    if (ext === 'ogg') return 'audio/ogg';
    if (ext === 'wav') return 'audio/wav';
    if (ext === 'm4a') return 'audio/mp4';
    if (ext === 'aac') return 'audio/aac';
    if (ext === 'pdf') return 'application/pdf';
  }
  
  switch (fileType) {
    case 'image':
      return 'image/jpeg';
    case 'video':
      return 'video/mp4';
    case 'audio':
      return 'audio/ogg'; // WhatsApp commonly uses ogg
    case 'file':
    default:
      return 'application/octet-stream';
  }
};

// Helper to get file extension from URL or file type
const getExtensionFromUrl = (url: string, fileType: string): string => {
  const urlExtension = url.split('.').pop()?.split('?')[0]?.toLowerCase();
  if (urlExtension && urlExtension.length <= 5) {
    return urlExtension;
  }
  switch (fileType) {
    case 'image':
      return 'jpg';
    case 'video':
      return 'mp4';
    case 'audio':
      return 'ogg';
    case 'file':
    default:
      return 'bin';
  }
};

// Download a remote file to local cache and return the local URI
const downloadFileToCache = async (remoteUrl: string, fileName: string): Promise<string> => {
  const cacheDir = FileSystem.cacheDirectory;
  const localUri = `${cacheDir}${fileName}`;
  
  try {
    const downloadResult = await FileSystem.downloadAsync(remoteUrl, localUri);
    return downloadResult.uri;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

// Delete a file from cache
const deleteFileFromCache = async (fileUri: string): Promise<void> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
  } catch (error) {
    console.error('Error deleting cached file:', error);
  }
};

// Type for forward message item
interface ForwardMessageItem {
  type: 'text' | 'attachment';
  content?: string;
  file?: {
    uri: string;
    type: string;
    fileName: string;
  };
}

export const ForwardBarWrapper = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const isForwardMode = useAppSelector(selectIsForwardMode);
  const selectedMessages = useAppSelector(selectSelectedMessagesArray);
  const selectedContacts = useAppSelector(selectSelectedContactsArray);
  const forwardMessage = useAppSelector(selectForwardMessageText);
  const showInboxSelector = useAppSelector(selectShowInboxSelector);

  const inboxSheetRef = useRef<ForwardInboxSheetHandle>(null);

  const [isForwarding, setIsForwarding] = useState(false);

  // Show inbox selector when flag is set
  useEffect(() => {
    if (showInboxSelector && selectedContacts.length > 0) {
      dispatch(setShowInboxSelector(false));
      inboxSheetRef.current?.present();
    }
  }, [showInboxSelector, selectedContacts.length, dispatch]);

  const handleSharePress = useCallback(() => {
    if (selectedMessages.length === 0) {
      showToast({ message: i18n.t('FORWARD.NO_MESSAGES_SELECTED') });
      return;
    }
    // Navigate to ForwardContacts screen
    navigation.navigate('ForwardContacts');
  }, [selectedMessages.length, navigation]);

  const handleInboxSelect = useCallback(
    async (inbox: Inbox) => {
      setIsForwarding(true);
      
      // Track downloaded files for cleanup
      const downloadedFiles: string[] = [];

      try {
        // Build individual messages to forward
        const messagesToSend: ForwardMessageItem[] = [];
        
        // Sort messages by ID (chronological order - oldest first)
        const sortedMessages = [...selectedMessages].sort((a, b) => a.id - b.id);
        
        // Add each selected message separately
        for (const msg of sortedMessages) {
          if (msg.content) {
            // Text message - send as is without prefix
            messagesToSend.push({
              type: 'text',
              content: msg.content,
            });
          }
          
          // Handle attachments
          if (msg.attachments && msg.attachments.length > 0) {
            for (const attachment of msg.attachments) {
              const extension = getExtensionFromUrl(attachment.dataUrl, attachment.fileType);
              const fileName = `forwarded_${Date.now()}_${Math.random().toString(36).substring(7)}.${extension}`;
              
              try {
                // Download the file to local cache first
                const localUri = await downloadFileToCache(attachment.dataUrl, fileName);
                downloadedFiles.push(localUri); // Track for cleanup
                
                messagesToSend.push({
                  type: 'attachment',
                  file: {
                    uri: localUri,
                    type: getMimeType(attachment.fileType, extension),
                    fileName: fileName,
                  },
                });
              } catch (downloadError) {
                console.error('Failed to download attachment:', downloadError);
                // Skip this attachment if download fails
              }
            }
          }
        }
        
        // Add user's custom message last (if any)
        if (forwardMessage.trim()) {
          messagesToSend.push({
            type: 'text',
            content: forwardMessage.trim(),
          });
        }

        // Send to each selected contact
        for (const contact of selectedContacts) {
          await sendMessagesToContact(contact, inbox, messagesToSend);
        }

        // Save contacts as recent for future use
        dispatch(addRecentContacts(selectedContacts));

        showToast({ message: i18n.t('FORWARD.SUCCESS') });
        dispatch(clearForwardState());
        inboxSheetRef.current?.dismiss();
      } catch (error) {
        console.error('Forward error:', error);
        showToast({ message: i18n.t('FORWARD.ERROR') });
      } finally {
        // Clean up downloaded files from cache
        for (const fileUri of downloadedFiles) {
          await deleteFileFromCache(fileUri);
        }
        setIsForwarding(false);
      }
    },
    [selectedMessages, selectedContacts, forwardMessage, dispatch],
  );

  const sendMessagesToContact = async (contact: Contact, inbox: Inbox, messages: ForwardMessageItem[]) => {
    const phoneNumber = contact.phoneNumber || '';

    if (!phoneNumber) {
      console.warn('Contact has no phone number:', contact);
      return;
    }

    try {
      // Create conversation for contact
      const result = await dispatch(
        conversationActions.createConversationForContact({
          phoneNumber,
          inboxId: inbox.id,
          contactId: contact.id,
        }),
      ).unwrap();

      if (result.conversationId) {
        // Send each message separately
        for (const messageItem of messages) {
          if (messageItem.type === 'text' && messageItem.content) {
            // Send text message
            await dispatch(
              conversationActions.sendMessage({
                conversationId: result.conversationId,
                message: messageItem.content,
                private: false,
                sender: {
                  id: 0,
                  thumbnail: '',
                },
              }),
            );
          } else if (messageItem.type === 'attachment' && messageItem.file) {
            // Send attachment
            await dispatch(
              conversationActions.sendMessage({
                conversationId: result.conversationId,
                message: '',
                private: false,
                sender: {
                  id: 0,
                  thumbnail: '',
                },
                // @ts-expect-error - File type is compatible with the expected format
                file: messageItem.file,
              }),
            );
          }
          
          // Small delay between messages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    } catch (error) {
      console.warn('Error creating conversation:', error);
      throw error;
    }
  };

  if (!isForwardMode) {
    return null;
  }

  return (
    <>
      <ForwardBar onSharePress={handleSharePress} />
      <ForwardInboxSheet
        ref={inboxSheetRef}
        onInboxSelect={handleInboxSelect}
        isForwarding={isForwarding}
      />
    </>
  );
};

export default ForwardBarWrapper;
