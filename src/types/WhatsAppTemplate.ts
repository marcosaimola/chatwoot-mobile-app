/**
 * WhatsApp Template Types
 * Based on WhatsApp Business API template structure
 */

export type WhatsAppTemplateStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export type WhatsAppTemplateCategory = 'UTILITY' | 'MARKETING' | 'AUTHENTICATION';

export type WhatsAppTemplateHeaderFormat = 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';

export type WhatsAppTemplateComponentType = 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS' | 'CAROUSEL';

export type WhatsAppTemplateButtonType = 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';

export interface WhatsAppTemplateButton {
  type: WhatsAppTemplateButtonType;
  text: string;
  url?: string;
  phoneNumber?: string;
  example?: string[];
}

export interface WhatsAppTemplateComponent {
  type: WhatsAppTemplateComponentType;
  text?: string;
  format?: WhatsAppTemplateHeaderFormat;
  buttons?: WhatsAppTemplateButton[];
  example?: {
    bodyText?: string[][];
    headerHandle?: string[];
  };
  cards?: WhatsAppTemplateCarouselCard[];
}

export interface WhatsAppTemplateCarouselCard {
  components: WhatsAppTemplateComponent[];
}

export interface WhatsAppTemplate {
  id: string;
  name: string;
  status: WhatsAppTemplateStatus;
  category: WhatsAppTemplateCategory;
  language: string;
  components: WhatsAppTemplateComponent[];
  parameterFormat: 'POSITIONAL' | 'NAMED';
  subCategory?: string;
  previousCategory?: string;
}

/**
 * Processed template params for sending message
 * Format matches the web app payload structure
 */
export interface WhatsAppTemplateParams {
  name: string;
  category: WhatsAppTemplateCategory;
  language: string;
  processed_params?: {
    body?: Record<string, string>;
    header?: Record<string, string>;
  };
}

/**
 * Helper type for template variable
 */
export interface TemplateVariable {
  index: number;
  placeholder: string;
  example?: string;
}

/**
 * Check if template has media header
 */
export const templateHasMediaHeader = (template: WhatsAppTemplate): boolean => {
  return template.components.some(
    c => c.type === 'HEADER' && ['IMAGE', 'VIDEO', 'DOCUMENT'].includes(c.format || '')
  );
};

/**
 * Check if template has carousel
 */
export const templateHasCarousel = (template: WhatsAppTemplate): boolean => {
  return template.components.some(c => c.type === 'CAROUSEL');
};

/**
 * Check if template is available for use (approved and no media)
 */
export const isTemplateAvailable = (template: WhatsAppTemplate): boolean => {
  if (template.status !== 'APPROVED') return false;
  if (templateHasMediaHeader(template)) return false;
  if (templateHasCarousel(template)) return false;
  return true;
};

/**
 * Get body text from template
 */
export const getTemplateBodyText = (template: WhatsAppTemplate): string => {
  const bodyComponent = template.components.find(c => c.type === 'BODY');
  return bodyComponent?.text || '';
};

/**
 * Get header text from template (only for TEXT headers)
 */
export const getTemplateHeaderText = (template: WhatsAppTemplate): string | null => {
  const headerComponent = template.components.find(c => c.type === 'HEADER');
  if (headerComponent?.format === 'TEXT') {
    return headerComponent.text || null;
  }
  return null;
};

/**
 * Get footer text from template
 */
export const getTemplateFooterText = (template: WhatsAppTemplate): string | null => {
  const footerComponent = template.components.find(c => c.type === 'FOOTER');
  return footerComponent?.text || null;
};

/**
 * Get buttons from template
 */
export const getTemplateButtons = (template: WhatsAppTemplate): WhatsAppTemplateButton[] => {
  const buttonsComponent = template.components.find(c => c.type === 'BUTTONS');
  return buttonsComponent?.buttons || [];
};

/**
 * Extract variables from template body ({{1}}, {{2}}, etc.)
 */
export const extractTemplateVariables = (template: WhatsAppTemplate): TemplateVariable[] => {
  const bodyText = getTemplateBodyText(template);
  const headerText = getTemplateHeaderText(template);
  const variables: TemplateVariable[] = [];
  
  // Regex to match {{1}}, {{2}}, etc.
  const regex = /\{\{(\d+)\}\}/g;
  let match;
  
  // Extract from body
  while ((match = regex.exec(bodyText)) !== null) {
    const index = parseInt(match[1], 10);
    if (!variables.find(v => v.index === index)) {
      const bodyComponent = template.components.find(c => c.type === 'BODY');
      const examples = bodyComponent?.example?.bodyText?.[0] || [];
      variables.push({
        index,
        placeholder: match[0],
        example: examples[index - 1],
      });
    }
  }
  
  // Extract from header (if text header)
  if (headerText) {
    regex.lastIndex = 0;
    while ((match = regex.exec(headerText)) !== null) {
      const index = parseInt(match[1], 10);
      if (!variables.find(v => v.index === index)) {
        variables.push({
          index,
          placeholder: match[0],
        });
      }
    }
  }
  
  // Sort by index
  return variables.sort((a, b) => a.index - b.index);
};

/**
 * Replace variables in template text
 */
export const replaceTemplateVariables = (
  text: string,
  variables: Record<string, string>
): string => {
  let result = text;
  Object.entries(variables).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
  });
  return result;
};
