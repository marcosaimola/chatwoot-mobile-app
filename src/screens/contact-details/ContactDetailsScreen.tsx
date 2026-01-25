import React, { useEffect, useState, useCallback } from 'react';
import { View, Platform, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import camelCase from 'camelcase';

import { TAB_BAR_HEIGHT } from '@/constants';
import {
  CallIcon,
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
import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { AttributeListType, Contact, CustomAttribute, GenericListType } from '@/types';

import {
  ContactDetailsScreenHeader,
  ContactBasicActions,
  ContactMetaInformation,
  ContactEditForm,
} from './components';
import { AttributeList } from '@/components-next';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { TabBarExcludedScreenParamList } from '@/navigation/tabs/AppTabs';
import { selectConversationById } from '@/store/conversation/conversationSelectors';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { contactLabelActions } from '@/store/contact/contactLabelActions';
import { getContactCustomAttributes } from '@/store/custom-attribute/customAttributeSlice';
import { selectContactById } from '@/store/contact/contactSelectors';
import i18n from '@/i18n';

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
  const { conversationId } = props.route.params;
  const dispatch = useAppDispatch();
  const { isDark, colors } = useThemeContext();
  const [isEditMode, setIsEditMode] = useState(false);

  const conversation = useAppSelector(state => selectConversationById(state, conversationId));

  const {
    meta: {
      sender: { email, id: contactId, name, thumbnail },
    },
  } = conversation || { meta: { sender: { name: '', thumbnail: '' } } };

  const contact = useAppSelector(state => (contactId ? selectContactById(state, contactId) : null));

  const { name: contactName, thumbnail: contactThumbnail, phoneNumber } = contact || {};

  const {
    city,
    country,
    description,
    location = '',
    companyName = '',
    socialProfiles,
    twitterScreenName,
    telegramUsername,
  } = contact?.additionalAttributes || {};

  const contactCustomAttributes = useAppSelector(getContactCustomAttributes);

  const usedContactCustomAttributes = processContactAttributes(
    contactCustomAttributes,
    contact?.customAttributes || {},
    (key, custom) => key in custom,
  );

  const socialMediaProfiles = {
    twitter: twitterScreenName,
    telegram: telegramUsername,
    ...(socialProfiles || {}),
  };

  const hasContactCustomAttributes = usedContactCustomAttributes.length > 0;

  useEffect(() => {
    if (contactId) {
      dispatch(contactLabelActions.getContactLabels({ contactId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setIsEditMode(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
  }, []);

  const handleSaveContact = useCallback((updatedContact: Contact) => {
    setIsEditMode(false);
  }, []);

  // Create a contact object for the edit form
  const contactForEdit: Contact = contact || {
    id: contactId || 0,
    name: name || contactName || '',
    email: email || '',
    phoneNumber: phoneNumber || '',
    thumbnail: thumbnail || contactThumbnail || '',
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
  if (isEditMode && contact) {
    return (
      <View
        style={tailwind.style(
          'flex-1',
          isDark ? 'bg-gray-950' : 'bg-white',
          Platform.OS === 'android' ? 'pt-12' : 'pt-6',
        )}>
        {/* Edit Header */}
        <View
          style={tailwind.style(
            'flex-row items-center justify-between px-4 py-3 border-b',
            isDark ? 'border-gray-800' : 'border-gray-200',
          )}>
          <Pressable onPress={handleCancelEdit} hitSlop={16}>
            <Animated.Text
              style={tailwind.style(
                'text-md font-inter-medium-24',
                isDark ? 'text-blue-400' : 'text-blue-600',
              )}>
              {i18n.t('CONTACT_EDIT.CANCEL')}
            </Animated.Text>
          </Pressable>
          <Animated.Text
            style={tailwind.style(
              'text-lg font-inter-semibold-20',
              isDark ? 'text-gray-100' : 'text-gray-900',
            )}>
            {i18n.t('CONTACT_EDIT.TITLE')}
          </Animated.Text>
          <View style={tailwind.style('w-16')} />
        </View>

        <ContactEditForm
          contact={contactForEdit}
          onSave={handleSaveContact}
          onCancel={handleCancelEdit}
        />
      </View>
    );
  }

  return (
    <View
      style={tailwind.style(
        'flex-1',
        isDark ? 'bg-gray-950' : 'bg-white',
        Platform.OS === 'android' ? 'pt-12' : 'pt-6',
      )}>
      <ContactDetailsScreenHeader
        name={name || contactName || ''}
        thumbnail={thumbnail || contactThumbnail || ''}
        bio={description || ''}
        onEditPress={contact ? handleEditPress : undefined}
      />
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={tailwind.style(`pb-[${TAB_BAR_HEIGHT}]`)}>
        {email || phoneNumber ? (
          <Animated.View style={tailwind.style('mt-[23px] px-4')}>
            <ContactBasicActions phoneNumber={phoneNumber || ''} email={email || ''} />
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
    </View>
  );
};

export default ContactDetailsScreen;
