import React from 'react';
import { View, ScrollView, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { useAppSelector } from '@/hooks';
import { Icon } from '@/components-next/common/icon';
import { Button } from '@/components-next/button/Button';
import { TickIcon, CloseIcon } from '@/svg-icons';

interface ContactImportAttempt {
  contactName: string;
  phoneNumber: string;
  success: boolean;
  error?: string;
}

/**
 * Truncate text to max length
 */
function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

type AttemptItemProps = {
  attempt: ContactImportAttempt;
  index: number;
  isLast: boolean;
  colors: {
    textPrimary: string;
    textSecondary: string;
    borderPrimary: string;
  };
  isDark: boolean;
};

const AttemptItem = ({ attempt, index, isLast, colors, isDark }: AttemptItemProps) => {
  const truncatedName = truncateText(attempt.contactName, 30);

  return (
    <Animated.View
      style={tailwind.style(
        'flex-row items-center py-[11px] px-4',
        !isLast && `border-b-[1px] ${colors.borderPrimary}`,
      )}>
      {attempt.success ? (
        <Icon
          icon={<TickIcon stroke={isDark ? '#10B981' : '#059669'} />}
          size={20}
        />
      ) : (
        <Icon
          icon={<CloseIcon stroke={isDark ? '#EF4444' : '#DC2626'} />}
          size={20}
        />
      )}
      <Animated.View style={tailwind.style('flex-1 ml-3')}>
        <Animated.Text
          style={tailwind.style(
            `text-base font-inter-420-20 leading-[21px] tracking-[0.16px] ${colors.textPrimary}`,
          )}>
          {truncatedName}
        </Animated.Text>
        {!attempt.success && attempt.error && (
          <Animated.Text
            style={tailwind.style(
              `text-xs font-inter-normal-20 mt-0.5 ${colors.textSecondary}`,
            )}>
            {attempt.error}
          </Animated.Text>
        )}
      </Animated.View>
    </Animated.View>
  );
};

type ContactImportProgressProps = {
  onReprocess?: () => void;
};

export const ContactImportProgress = ({ onReprocess }: ContactImportProgressProps) => {
  const { colors, isDark } = useThemeContext();
  const { isImporting, progress, totalContacts, importedCount, failedCount, attempts, currentContactName } =
    useAppSelector(state => state.contactImport);

  // Get last 10 attempts (most recent first)
  const lastAttempts = [...attempts].reverse().slice(0, 10);

  // Show loading state when no data yet
  const isLoading = !isImporting && totalContacts === 0 && attempts.length === 0;

  return (
    <Animated.View style={tailwind.style('flex-1', colors.bgPrimary, 'min-h-[300px]')}>
      {isLoading ? (
        <Animated.View style={tailwind.style('flex-1 items-center justify-center py-8')}>
          <Animated.Text
            style={tailwind.style(
              'text-sm font-inter-medium-24 mb-2',
              colors.textPrimary,
            )}>
            Preparando importação...
          </Animated.Text>
          <Animated.Text
            style={tailwind.style(
              'text-xs font-inter-normal-20',
              colors.textSecondary,
            )}>
            Buscando contatos do dispositivo
          </Animated.Text>
          <Animated.View style={tailwind.style('mt-3')}>
            <ActivityIndicator size="small" color={tailwind.color(colors.textSecondary)} />
          </Animated.View>
        </Animated.View>
      ) : isImporting ? (
        <>
          <Animated.View style={tailwind.style('px-4 py-3 mb-2')}>
            <Animated.Text
              style={tailwind.style(
                'text-sm font-inter-medium-24 mb-1',
                colors.textPrimary,
              )}>
              Importando contatos...
            </Animated.Text>
            <Animated.Text
              style={tailwind.style(
                'text-xs font-inter-normal-20',
                colors.textSecondary,
              )}>
              {currentContactName ? `Processando: ${truncateText(currentContactName, 30)}` : `${importedCount + failedCount} de ${totalContacts}`}
            </Animated.Text>
          </Animated.View>

          {/* Progress Bar */}
          <Animated.View
            style={tailwind.style(
              'h-2 mx-4 mb-3 rounded-full overflow-hidden',
              colors.bgTertiary,
            )}>
            <Animated.View
              style={[
                tailwind.style('h-full bg-blue-600'),
                { width: `${progress}%` },
              ]}
            />
          </Animated.View>

          <Animated.View
            style={tailwind.style('flex-row justify-between px-4 mb-2')}>
            <Animated.Text
              style={tailwind.style(
                'text-xs font-inter-normal-20',
                colors.textSecondary,
              )}>
              {importedCount} importados
            </Animated.Text>
            <Animated.Text
              style={tailwind.style(
                'text-xs font-inter-normal-20',
                colors.textSecondary,
              )}>
              {failedCount} falhas
            </Animated.Text>
          </Animated.View>
        </>
      ) : (
        <>
          <Animated.View style={tailwind.style('px-4 py-3 mb-2')}>
            <Animated.Text
              style={tailwind.style(
                'text-sm font-inter-medium-24',
                colors.textPrimary,
              )}>
              Importação concluída
            </Animated.Text>
            <Animated.Text
              style={tailwind.style(
                'text-xs font-inter-normal-20 mt-1',
                colors.textSecondary,
              )}>
              {importedCount} contatos importados com sucesso
              {failedCount > 0 && `, ${failedCount} falharam`}
            </Animated.Text>
          </Animated.View>

          {totalContacts > 0 && onReprocess && (
            <Animated.View style={tailwind.style('px-4 pb-3')}>
              <Button text="Limpar e reprocessar" variant="secondary" handlePress={onReprocess} />
            </Animated.View>
          )}
        </>
      )}

      {/* Attempts List - Show during and after import */}
      {lastAttempts.length > 0 && (
        <Animated.View style={tailwind.style('flex-1 mt-2')}>
          <Animated.Text
            style={tailwind.style(
              'text-xs font-inter-medium-24 px-4 py-2',
              colors.textSecondary,
            )}>
            Últimas tentativas ({lastAttempts.length})
          </Animated.Text>
          <ScrollView
            style={tailwind.style('flex-1')}
            contentContainerStyle={tailwind.style('pb-2')}
            showsVerticalScrollIndicator={true}>
            {lastAttempts.map((attempt, index) => (
              <AttemptItem
                key={`${attempt.phoneNumber}-${index}`}
                attempt={attempt}
                index={index}
                isLast={index === lastAttempts.length - 1}
                colors={colors}
                isDark={isDark}
              />
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </Animated.View>
  );
};
