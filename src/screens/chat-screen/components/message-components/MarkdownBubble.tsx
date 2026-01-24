import React from 'react';
import { StyleSheet } from 'react-native';
import Markdown, { MarkdownIt } from 'react-native-markdown-display';
import { openURL } from '@/utils/urlUtils';

import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { MESSAGE_VARIANTS } from '@/constants';

type MarkdownBubbleProps = {
  messageContent: string;
  variant: string;
};

const getVariantTextMap = (isDark: boolean) => ({
  [MESSAGE_VARIANTS.AGENT]: isDark ? 'text-gray-200' : 'text-gray-950',
  [MESSAGE_VARIANTS.USER]: 'text-white',
  [MESSAGE_VARIANTS.BOT]: isDark ? 'text-gray-200' : 'text-gray-950',
  [MESSAGE_VARIANTS.TEMPLATE]: isDark ? 'text-gray-200' : 'text-gray-950',
  [MESSAGE_VARIANTS.ERROR]: 'text-white',
  [MESSAGE_VARIANTS.PRIVATE]: isDark ? 'text-amber-200 font-inter-medium-24' : 'text-amber-950 font-inter-medium-24',
});

export const MarkdownBubble = (props: MarkdownBubbleProps) => {
  const { messageContent, variant } = props;
  const { isDark } = useThemeContext();
  const variantTextMap = getVariantTextMap(isDark);

  const handleURL = (url: string) => {
    openURL({ URL: url });
    return true;
  };

  const textStyle = tailwind.style(variantTextMap[variant]);

  const styles = StyleSheet.create({
    text: {
      fontSize: 16,
      letterSpacing: 0.32,
      lineHeight: 22,
      ...textStyle,
    },
    strong: {
      fontFamily: 'Inter-600-20',
      fontWeight: '600',
    },
    em: {
      fontStyle: 'italic',
    },
    paragraph: {
      marginTop: 0,
      marginBottom: 0,
      fontFamily: 'Inter-400-20',
    },
    bullet_list: {
      minWidth: 200,
    },
    ordered_list: {
      minWidth: 200,
    },
    list_item: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'center',
      ...textStyle,
    },
    bullet_list_icon: {
      marginLeft: 0,
      marginRight: 8,
      fontWeight: '900',
      ...textStyle,
    },
    ordered_list_icon: {
      marginLeft: 0,
      marginRight: 8,
      fontWeight: '900',
      ...textStyle,
    },
  });
  return (
    <Markdown
      mergeStyle
      markdownit={MarkdownIt({
        linkify: true,
        typographer: true,
      })}
      onLinkPress={handleURL}
      style={styles}>
      {messageContent}
    </Markdown>
  );
};
