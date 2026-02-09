import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Platform, Pressable, StatusBar } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import camelCase from 'camelcase';

import { TAB_BAR_HEIGHT } from '@/constants';
import {
  CallIcon,
  CloseIcon,
  EmailIcon,
  LocationIcon,
  CompanyIcon,
  MessengerFilledIcon,
  XFilledIcon,
  TelegramFilledIcon,
  InstagramFilledIcon,
  GithubIcon,
  LinkedinIcon,
} from '@/svg-icons';
import { Icon } from '@/components-next/common';
import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { AttributeListType, Contact, CustomAttribute, GenericListType } from '@/types';

import {
  ContactDetailsScreenHeader,
  ContactBasicActions,
  ContactMetaInformation,
  ContactEditForm,
  ContactConversationsTab,
  ContactNotesTab,
} from './components';
import { AttributeList, ContactTabs } from '@/components-next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TabBarExcludedScreenParamList } from '@/navigation/tabs/AppTabs';
import { selectConversationById } from '@/store/conversation/conversationSelectors';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { contactLabelActions } from '@/store/contact/contactLabelActions';
import { updateContact as updateContactInStore } from '@/store/contact/contactSlice';
import { getContactCustomAttributes } from '@/store/custom-attribute/customAttributeSlice';
import { selectContactById } from '@/store/contact/contactSelectors';
import { ContactConversationService } from '@/services/ContactConversationService';
import { selectContactList } from '@/store/contact/contactListSelectors';
import i18n from '@/i18n';
import { CreateConversationSheet, CreateConversationSheetHandle } from '@/screens/conversations/components';
import { normalizeToE164 } from '@/utils/phoneUtils';

type ContactDetailsScreenProps = NativeStackScreenProps<
  TabBarExcludedScreenParamList,
  'ContactDetails'
>;

const allSocialMediaProfiles: GenericListType[] = [
  {
    icon: <MessengerFilledIcon />,
    subtitle: 'Facebook',
    title: 'Facebook',
    subtitleType: 'dark',
    key: 'facebook',
    link: 'https://fb.com/',
  },
  {
    icon: <XFilledIcon />,
    subtitle: 'Twitter',
    title: 'Twitter',
    subtitleType: 'dark',
    key: 'twitter',
    link: 'https://x.com/',
  },
  {
    icon: <GithubIcon />,
    subtitle: 'Github',
    title: 'Github',
    subtitleType: 'dark',
    key: 'github',
    link: 'https://github.com/',
  },
  {
    icon: <LinkedinIcon />,
    subtitle: 'Linkedin',
    title: 'Linkedin',
    subtitleType: 'dark',
    key: 'linkedin',
    link: 'https://linkedin.com/',
  },
  {
    icon: <InstagramFilledIcon />,
    subtitle: 'Instagram',
    title: 'Instagram',
    subtitleType: 'dark',
    key: 'instagram',
    link: 'https://instagram/',
  },
  {
    icon: <TelegramFilledIcon />,
    subtitle: 'Telegram',
    title: 'Telegram',
    subtitleType: 'dark',
    key: 'telegram',
    link: 'https://t.me/',
  },
];

const processContactAttributes = (
  attributes: CustomAttribute[],
  customAttributes: Record<string, string>,
  filterCondition: (key: string, custom: Record<string, string>) => boolean,
) => {
  if (!attributes.length || !customAttributes) {
    return [];
  }

  return attributes.reduce<(CustomAttribute & { value: string })[]>((result, attribute) => {
    const { attributeKey } = attribute;
    const meetsCondition = filterCondition(camelCase(attributeKey), customAttributes);

    if (meetsCondition) {
      result.push({
        ...attribute,
        value: customAttributes[camelCase(attributeKey)] ?? '',
      });
    }

    return result;
  }, []);
};

const ContactDetailsScreen = (props: ContactDetailsScreenProps) => {
  const { conversationId, contactId: paramContactId } = props.route.params;
  const dispatch = useAppDispatch();
  const { isDark, colors } = useThemeContext();
  const { top: safeTop } = useSafeAreaInsets();
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const createConversationSheetRef = useRef<CreateConversationSheetHandle>(null);

  // Get contactId from either param or conversation
  let contactId: number | undefined = paramContactId;
  if (!contactId && conversationId) {
  const conversation = useAppSelector(state => selectConversationById(state, conversationId));
    contactId = conversation?.meta?.sender?.id;
  }

  // Try to get contact from main store first
  const contact = useAppSelector(state => (contactId ? selectContactById(state, contactId) : null));
  
  // If not found in main store, try to get from contact list (search results)
  const contactList = useAppSelector(selectContactList);
  const contactFromList = contactId ? contactList.find(c => c.id === contactId) : null;
  
  // Use contact from list as fallback if not in main store
  const finalContact = contact || contactFromList;

  const { name: contactName, thumbnail: contactThumbnail, phoneNumber, email } = finalContact || {};
  const normalizedPhoneNumber = phoneNumber ? normalizeToE164(phoneNumber) : '';

  const {
    city,
    country,
    description,
    location = '',
    companyName = '',
    socialProfiles,
    twitterScreenName,
    telegramUsername,
  } = finalContact?.additionalAttributes || {};

  const contactCustomAttributes = useAppSelector(getContactCustomAttributes);

  const usedContactCustomAttributes = processContactAttributes(
    contactCustomAttributes,
    finalContact?.customAttributes || {},
    (key, custom) => key in custom,
  );

  const socialMediaProfiles = {
    twitter: twitterScreenName,
    telegram: telegramUsername,
    ...(socialProfiles || {}),
  };

  const hasContactCustomAttributes = usedContactCustomAttributes.length > 0;
  const canStartConversation = Boolean(contactId && normalizedPhoneNumber);

  useEffect(() => {
    if (contactId) {
      dispatch(contactLabelActions.getContactLabels({ contactId }));
      ContactConversationService.getContact(contactId)
        .then(({ contact }) => dispatch(updateContactInStore(contact)))
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contactId]);

  const socialMediaDetails = allSocialMediaProfiles
    .filter(profile => socialMediaProfiles?.[profile.key as keyof typeof socialMediaProfiles])
    .map(profile => ({
      ...profile,
      subtitle: `${profile.link}${socialMediaProfiles?.[profile.key as keyof typeof socialMediaProfiles]}`,
      type: 'link',
    }));

  const fullLocation =
    location || city || country !== undefined
      ? location || `${city}${city ? ',' : ''} ${country}`
      : null;

  const userDetails: GenericListType[] = [
    {
      icon: <LocationIcon />,
      subtitle: fullLocation || i18n.t('CONTACT_DETAILS.VALUE_UNAVAILABLE'),
      title: i18n.t('CONTACT_EDIT.FIELDS.LOCATION'),
      subtitleType: 'dark',
    },
    {
      icon: <CallIcon />,
      subtitle: phoneNumber || i18n.t('CONTACT_DETAILS.VALUE_UNAVAILABLE'),
      title: i18n.t('CONTACT_EDIT.FIELDS.PHONE'),
      subtitleType: 'dark',
    },
    {
      icon: <EmailIcon />,
      subtitle: email || i18n.t('CONTACT_DETAILS.VALUE_UNAVAILABLE'),
      title: i18n.t('CONTACT_EDIT.FIELDS.EMAIL'),
      subtitleType: 'dark',
    },
    {
      icon: <CompanyIcon />,
      subtitle: companyName || i18n.t('CONTACT_DETAILS.VALUE_UNAVAILABLE'),
      title: i18n.t('CONTACT_EDIT.FIELDS.COMPANY'),
      subtitleType: 'dark',
    },
  ];

  const allDetails = [...userDetails, ...socialMediaDetails];

  const handleEditPress = useCallback(() => {
    setActiveTab(0);
    setIsEditMode(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
  }, []);

  const handleSaveContact = useCallback((updatedContact: Contact) => {
    setIsEditMode(false);
  }, []);

  const handleChatPress = useCallback(() => {
    if (!normalizedPhoneNumber || !contactId) return;
    createConversationSheetRef.current?.present(normalizedPhoneNumber, contactId);
  }, [contactId, normalizedPhoneNumber]);

  // Create a contact object for the edit form
  const contactForEdit: Contact = finalContact || {
    id: contactId || 0,
    name: contactName || '',
    email: email || '',
    phoneNumber: phoneNumber || '',
    thumbnail: contactThumbnail || '',
    identifier: null,
    type: 'contact',
    createdAt: 0,
    lastActivityAt: null,
    additionalAttributes: {
      description,
      companyName,
      city,
      country,
      location,
    },
    customAttributes: {},
  };

  // Edit mode view
  if (isEditMode && finalContact) {
    return (
      <View
        style={tailwind.style(
          'flex-1',
          isDark ? 'bg-gray-950' : 'bg-white',
        )}>
        {/* Edit Header with safe area */}
        <View
          style={[
            tailwind.style(
              'flex-row items-center px-4 py-3 border-b',
              isDark ? 'border-gray-800' : 'border-gray-200',
            ),
            { paddingTop: safeTop + 12 },
          ]}>
          <Pressable onPress={handleCancelEdit} hitSlop={16} style={tailwind.style('flex-1')}>
            <Icon icon={<CloseIcon stroke={isDark ? '#FFFFFF' : undefined} />} size={24} />
          </Pressable>
          <Animated.Text
            style={tailwind.style(
              'text-lg font-inter-semibold-20 text-center',
              isDark ? 'text-gray-100' : 'text-gray-900',
            )}>
            {i18n.t('CONTACT_EDIT.TITLE')}
          </Animated.Text>
          <View style={tailwind.style('flex-1')} />
        </View>

        <ContactEditForm
          contact={contactForEdit}
          onSave={handleSaveContact}
          onCancel={handleCancelEdit}
        />
      </View>
    );
  }

  if (!contactId || !finalContact) {
    return (
      <SafeAreaView edges={['top']} style={tailwind.style(`flex-1 ${isDark ? 'bg-gray-950' : 'bg-white'}`)}>
        <StatusBar
          translucent
          backgroundColor={tailwind.color(isDark ? 'bg-gray-950' : 'bg-white')}
          barStyle={isDark ? 'light-content' : 'dark-content'}
        />
        <ContactDetailsScreenHeader
          name=""
          thumbnail=""
          bio=""
        />
        <View
          style={tailwind.style(
            'flex-1 items-center justify-center',
            isDark ? 'bg-gray-950' : 'bg-white',
          )}>
          <Animated.Text style={tailwind.style(`text-md ${colors.textSecondary}`)}>
            {i18n.t('CONTACT_DETAILS.CONTACT_NOT_FOUND')}
          </Animated.Text>
        </View>
      </SafeAreaView>
    );
  }

  const tabs = [
    {
      key: 'edit',
      label: i18n.t('CONTACT_DETAILS.TAB_EDIT') || 'Editar',
      component: (
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tailwind.style(`pb-[${TAB_BAR_HEIGHT}]`)}>
        {email || phoneNumber || canStartConversation ? (
          <Animated.View style={tailwind.style('mt-[23px] px-4')}>
            <ContactBasicActions
              phoneNumber={phoneNumber || ''}
              email={email || ''}
              onChatPress={canStartConversation ? handleChatPress : undefined}
            />
          </Animated.View>
        ) : null}
        <Animated.View style={tailwind.style('pt-10')}>
          <AttributeList list={allDetails as AttributeListType[]} />
        </Animated.View>
        {hasContactCustomAttributes && (
          <Animated.View style={tailwind.style('pt-10')}>
            <ContactMetaInformation attributes={usedContactCustomAttributes} />
          </Animated.View>
        )}
      </Animated.ScrollView>
      ),
    },
    {
      key: 'conversations',
      label: i18n.t('CONTACT_DETAILS.TAB_CONVERSATIONS') || 'Conversas',
      component: <ContactConversationsTab contactId={contactId} />,
    },
    {
      key: 'notes',
      label: i18n.t('CONTACT_DETAILS.TAB_NOTES') || 'Notas',
      component: <ContactNotesTab contactId={contactId} />,
    },
  ];

  return (
    <SafeAreaView edges={['top']} style={tailwind.style(`flex-1 ${isDark ? 'bg-gray-950' : 'bg-white'}`)}>
      <StatusBar
        translucent
        backgroundColor={tailwind.color(isDark ? 'bg-gray-950' : 'bg-white')}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />
      <ContactDetailsScreenHeader
        name={contactName || ''}
        thumbnail={contactThumbnail || ''}
        bio={description || ''}
        onEditPress={handleEditPress}
      />
      <ContactTabs tabs={tabs} initialTab={activeTab} />
      <CreateConversationSheet ref={createConversationSheetRef} />
    </SafeAreaView>
  );
};

export default ContactDetailsScreen;
