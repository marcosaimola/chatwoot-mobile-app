import React, { useCallback } from 'react';
import { Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { StackActions } from '@react-navigation/native';
import { Avatar } from '@/components-next';
import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { AnimatedNativeView, NativeView } from '@/components-next/native-components';
import { Contact } from '@/types/Contact';
import { formatWhatsAppStyleTime } from '@/utils/dateTimeUtils';

type ContactItemProps = {
  item?: Contact;
  contact?: Contact;
};

export const ContactItemComponent = (props: ContactItemProps) => {
  const { item, contact } = props;
  const { colors } = useThemeContext();
  const navigation = useNavigation();

  // Support both 'item' and 'contact' props for compatibility
  const contactData = item || contact;

  // Safety check - return null if contact data is invalid
  if (!contactData || !contactData.id) {
    return null;
  }

  const lastActivityAt = () => {
    if (!contactData.lastActivityAt) return '';
    return formatWhatsAppStyleTime(contactData.lastActivityAt);
  };

  const displayName = contactData.name || contactData.email || contactData.phoneNumber || 'Sem nome';
  const subtitle = contactData.phoneNumber || contactData.email || '';

  const handlePress = useCallback(() => {
    const pushToContactDetails = StackActions.push('ContactDetails', {
      contactId: contactData.id,
    });
    navigation.dispatch(pushToContactDetails);
  }, [navigation, contactData.id]);

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={tailwind.style(`ml-3 py-3 pr-4 border-b-[1px] ${colors.borderPrimary}`)}>
        <Animated.View style={tailwind.style('flex flex-row items-center gap-3')}>
          <Avatar
            src={contactData.thumbnail ? { uri: contactData.thumbnail } : undefined}
            size="md"
            name={displayName}
          />
          <Animated.View style={tailwind.style('flex-1')}>
            <Animated.Text
              numberOfLines={1}
              style={tailwind.style(
                `text-base font-inter-medium-24 tracking-[0.24px] ${colors.textPrimary}`,
              )}>
              {displayName}
            </Animated.Text>
            {subtitle ? (
              <Animated.Text
                numberOfLines={1}
                style={tailwind.style(
                  `text-sm font-inter-420-20 ${colors.textSecondary} mt-0.5`,
                )}>
                {subtitle}
              </Animated.Text>
            ) : null}
          </Animated.View>
          {contactData.lastActivityAt && (
            <AnimatedNativeView>
              <Animated.Text
                style={tailwind.style(
                  `text-sm font-inter-420-20 leading-[16px] tracking-[0.32px] ${colors.textSecondary}`,
                )}>
                {lastActivityAt()}
              </Animated.Text>
            </AnimatedNativeView>
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

ContactItemComponent.displayName = 'ContactItem';
export const ContactItem = React.memo(ContactItemComponent);
