import React, { useState, useEffect, useCallback } from 'react';
import { Pressable, TextInput } from 'react-native';
import Animated from 'react-native-reanimated';

import { tailwind } from '@/theme';
import { useThemeContext } from '@/context';
import { Button } from '@/components-next';
import {
  KanbanItem,
  KanbanFunnel,
  KanbanItemFormData,
  Product,
  ProductRow,
} from '../types/KanbanTypes';
import { showToast } from '@/utils/toastUtils';
import { Dropdown } from './Dropdown';
import { webhookService } from '@/services/WebhookService';
import { useAppSelector } from '@/hooks';
import { selectConversationById } from '@/store/conversation/conversationSelectors';
import { formatCurrency, parseCurrency, applyCurrencyMask } from '@/utils/currencyUtils';
import i18n from '@/i18n';

interface KanbanItemFormProps {
  conversationId: number;
  item?: KanbanItem | null;
  funnels: KanbanFunnel[];
  contactName?: string;
  onSubmit: () => void;
  onCancel: () => void;
}

export const KanbanItemForm: React.FC<KanbanItemFormProps> = ({
  conversationId,
  item,
  funnels,
  contactName,
  onSubmit,
  onCancel,
}) => {
  const [title, setTitle] = useState(item?.title || contactName || '');
  const [description, setDescription] = useState(item?.description || '');
  const [value, setValue] = useState(item?.value?.toString() || '0');
  const [loading, setLoading] = useState(false);
  const [selectedFunnel, setSelectedFunnel] = useState<KanbanFunnel | null>(null);
  const [selectedStage, setSelectedStage] = useState<any>(null);
  const { colors, isDark } = useThemeContext();

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [productRows, setProductRows] = useState<ProductRow[]>([]);

  const conversation = useAppSelector(state => selectConversationById(state, conversationId));

  // Load available products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Prefill form with existing item data
  useEffect(() => {
    if (item) {
      setTitle(item.title);
      const funnel = funnels.find(f => f.funnel_id === item.funnel_id);
      const stage = funnel?.stages.find(s => s.stage_id === item.stage_id);
      setSelectedFunnel(funnel || null);
      setSelectedStage(stage || null);
    } else {
      if (funnels.length > 0) {
        const firstFunnel = funnels[0];
        setSelectedFunnel(firstFunnel);
        setSelectedStage(firstFunnel.stages[0] || null);
      }
    }
  }, [item, funnels, contactName]);

  // Prefill product rows when editing and products are loaded
  useEffect(() => {
    if (item?.funnel_item_products && item.funnel_item_products.length > 0 && products.length > 0) {
      const rows: ProductRow[] = item.funnel_item_products
        .filter(fp => products.some(p => p.id === fp.product_id))
        .map(fp => ({
          productId: fp.product_id,
          quantity: fp.quantity,
          unitValue: fp.unit_value,
        }));
      setProductRows(rows);
    }
  }, [item, products]);

  const loadProducts = async () => {
    try {
      const response = await webhookService.get<Product[]>('produtos/listar-mobile');
      const data = response.data || [];
      const activeProducts = data.filter(p => p.active);
      setProducts(activeProducts);
    } catch (error) {
      setProducts([]);
    }
  };

  const handleAddProductRow = useCallback(() => {
    setProductRows(prev => [
      ...prev,
      { productId: '', quantity: 1, unitValue: 0 },
    ]);
  }, []);

  const handleRemoveProductRow = useCallback((index: number) => {
    setProductRows(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleProductSelect = useCallback((index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setProductRows(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        productId: product.id,
        unitValue: parseFloat(product.fixed_price) || 0,
      };
      return updated;
    });
  }, [products]);

  const handleQuantityChange = useCallback((index: number, text: string) => {
    // Allow empty string while editing, treat as 0 temporarily
    const cleaned = text.replace(/\D/g, '');
    const qty = cleaned === '' ? 0 : parseInt(cleaned, 10);
    setProductRows(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantity: qty,
      };
      return updated;
    });
  }, []);

  const handleUnitValueChange = useCallback((index: number, text: string) => {
    const numValue = parseCurrency(text);
    setProductRows(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        unitValue: numValue,
      };
      return updated;
    });
  }, []);

  const getProductById = useCallback((productId: string): Product | undefined => {
    return products.find(p => p.id === productId);
  }, [products]);

  const handleSubmit = async () => {
    if (!title || !selectedFunnel || !selectedStage) {
      showToast({ message: i18n.t('KANBAN.MESSAGES.REQUIRED_FIELDS') });
      return;
    }

    if (loading) return;

    // Proteção contra múltiplas execuções
    if (Date.now() - (handleSubmit as any).lastExecution < 1000) return;
    (handleSubmit as any).lastExecution = Date.now();

    try {
      setLoading(true);

      let contactId = 0;
      let contactPhoneNumber = '';

      if (conversation?.meta?.sender) {
        contactId = conversation.meta.sender.id || 0;
        contactPhoneNumber = conversation.meta.sender.phone_number || '';
      } else {
        showToast({ message: i18n.t('KANBAN.MESSAGES.CONTACT_NOT_FOUND') });
        return;
      }

      // Build funnel_item_products from product rows (only complete rows)
      const funnelItemProducts = productRows
        .filter(row => row.productId && row.quantity > 0)
        .map(row => ({
          ...(item?.id ? { funnel_item_id: item.id } : {}),
          product_id: row.productId,
          quantity: row.quantity,
          unit_value: row.unitValue,
        }));

      const formData = {
        funnel_id: selectedFunnel.funnel_id,
        stage_id: selectedStage.stage_id,
        title,
        description,
        value: parseFloat(value) || 0,
        priority: 'medium',
        conversation_id: conversationId,
        contact: {
          id: contactId,
          phone_number: contactPhoneNumber,
        },
        funnel_item_products: funnelItemProducts,
      };

      if (item) {
        await webhookService.post('kanban/mobile-salvar', {
          ...formData,
          id: item.id,
        });
        showToast({ message: i18n.t('KANBAN.MESSAGES.ITEM_UPDATED') });
      } else {
        await webhookService.post('kanban/mobile-salvar', formData);
        showToast({ message: i18n.t('KANBAN.MESSAGES.ITEM_CREATED') });
      }

      onSubmit();
    } catch (error) {
      showToast({ message: i18n.t('KANBAN.MESSAGES.ITEM_SAVE_ERROR') });
    } finally {
      setLoading(false);
    }
  };

  // Shared input styles using theme colors
  const inputStyle = `border rounded-lg px-2.5 py-1.5 text-sm ${colors.textPrimary} ${colors.borderPrimary} ${colors.bgInput}`;
  const labelStyle = `text-xs font-inter-medium-24 mb-1 ${colors.textSecondary}`;
  const placeholderColor = isDark ? '#9CA3AF' : '#9CA3AF';

  const renderProductRow = (row: ProductRow, index: number) => {
    const product = getProductById(row.productId);
    const canEditPrice = product?.allow_price_override === true;
    const lineTotal = row.unitValue * row.quantity;

    return (
      <Animated.View
        key={index}
        style={tailwind.style(`mb-3 p-2.5 rounded-lg border ${colors.borderSecondary} ${colors.bgSecondary}`)}>
        {/* Product dropdown */}
        <Dropdown
          label={i18n.t('KANBAN.FORM.PRODUCT')}
          options={products.map(p => ({ id: p.id, name: p.name }))}
          selectedOption={product ? { id: product.id, name: product.name } : null}
          onSelect={(option) => handleProductSelect(index, option.id)}
          placeholder={i18n.t('KANBAN.FORM.PRODUCT_PLACEHOLDER')}
        />

        {/* Quantity and Unit Value side by side */}
        {row.productId !== '' && (
          <>
            <Animated.View style={tailwind.style('flex-row mb-2')}>
              {/* Quantity */}
              <Animated.View style={tailwind.style('flex-1 mr-2')}>
                <Animated.Text style={tailwind.style(labelStyle)}>
                  {i18n.t('KANBAN.FORM.QUANTITY')}
                </Animated.Text>
                <TextInput
                  style={tailwind.style(inputStyle)}
                  value={row.quantity === 0 ? '' : row.quantity.toString()}
                  onChangeText={(text) => handleQuantityChange(index, text)}
                  onBlur={() => {
                    // Ensure minimum 1 on blur
                    if (row.quantity < 1) {
                      handleQuantityChange(index, '1');
                    }
                  }}
                  placeholder={i18n.t('KANBAN.FORM.QUANTITY_PLACEHOLDER')}
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  selectTextOnFocus
                />
              </Animated.View>

              {/* Unit Value */}
              <Animated.View style={tailwind.style('flex-1 ml-2')}>
                <Animated.Text style={tailwind.style(labelStyle)}>
                  {i18n.t('KANBAN.FORM.UNIT_VALUE')}
                </Animated.Text>
                <TextInput
                  style={tailwind.style(
                    inputStyle,
                    !canEditPrice && 'opacity-60',
                  )}
                  value={applyCurrencyMask((row.unitValue * 100).toFixed(0))}
                  onChangeText={(text) => {
                    if (canEditPrice) {
                      const masked = applyCurrencyMask(text);
                      handleUnitValueChange(index, masked);
                    }
                  }}
                  placeholder={i18n.t('KANBAN.FORM.UNIT_VALUE_PLACEHOLDER')}
                  placeholderTextColor={placeholderColor}
                  keyboardType="numeric"
                  editable={canEditPrice}
                  selectTextOnFocus
                />
              </Animated.View>
            </Animated.View>

            {/* Line total */}
            <Animated.View style={tailwind.style('flex-row justify-between items-center')}>
              <Animated.Text style={tailwind.style(`text-xs font-inter-medium-24 ${colors.textSecondary}`)}>
                {i18n.t('KANBAN.FORM.TOTAL')}: {formatCurrency(lineTotal)}
              </Animated.Text>
              <Pressable onPress={() => handleRemoveProductRow(index)}>
                <Animated.Text style={tailwind.style('text-xs font-inter-medium-24 text-red-500')}>
                  {i18n.t('KANBAN.FORM.REMOVE_PRODUCT')}
                </Animated.Text>
              </Pressable>
            </Animated.View>
          </>
        )}

        {/* Show remove button even if no product selected */}
        {row.productId === '' && (
          <Animated.View style={tailwind.style('flex-row justify-end')}>
            <Pressable onPress={() => handleRemoveProductRow(index)}>
              <Animated.Text style={tailwind.style('text-xs font-inter-medium-24 text-red-500')}>
                {i18n.t('KANBAN.FORM.REMOVE_PRODUCT')}
              </Animated.Text>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  return (
    <Animated.View style={tailwind.style(`${colors.bgPrimary} px-4 pb-6`)}>
      {/* Header */}
      <Animated.View style={tailwind.style('flex-row justify-between items-center mb-4')}>
        <Animated.Text style={tailwind.style(`text-lg font-inter-medium-24 ${colors.textPrimary}`)}>
          {item ? i18n.t('KANBAN.EDIT_ITEM') : i18n.t('KANBAN.ADD_ITEM')}
        </Animated.Text>
        <Pressable onPress={onCancel}>
          <Animated.Text style={tailwind.style(`font-inter-medium-24 ${isDark ? 'text-blue-400' : 'text-blue-600'}`)}>
            ✕
          </Animated.Text>
        </Pressable>
      </Animated.View>

      {/* Título */}
      <Animated.View style={tailwind.style('mb-3')}>
        <Animated.Text style={tailwind.style(labelStyle)}>
          {i18n.t('KANBAN.FORM.TITLE')} *
        </Animated.Text>
        <TextInput
          style={tailwind.style(inputStyle)}
          value={title}
          onChangeText={setTitle}
          placeholder={i18n.t('KANBAN.FORM.TITLE_PLACEHOLDER')}
          placeholderTextColor={placeholderColor}
        />
      </Animated.View>

      {/* Descrição */}
      <Animated.View style={tailwind.style('mb-3')}>
        <Animated.Text style={tailwind.style(labelStyle)}>
          {i18n.t('KANBAN.FORM.DESCRIPTION')}
        </Animated.Text>
        <TextInput
          style={tailwind.style(inputStyle, 'h-14')}
          value={description}
          onChangeText={setDescription}
          placeholder={i18n.t('KANBAN.FORM.DESCRIPTION_PLACEHOLDER')}
          placeholderTextColor={placeholderColor}
          multiline
        />
      </Animated.View>

      {/* Funil */}
      <Dropdown
        label={`${i18n.t('KANBAN.FORM.FUNNEL')} *`}
        options={funnels.map(funnel => ({ id: funnel.funnel_id, name: funnel.funnel_name }))}
        selectedOption={selectedFunnel ? { id: selectedFunnel.funnel_id, name: selectedFunnel.funnel_name } : null}
        onSelect={(option) => {
          const funnel = funnels.find(f => f.funnel_id === option.id);
          if (funnel) {
            setSelectedFunnel(funnel);
            setSelectedStage(funnel.stages[0] || null);
          }
        }}
        placeholder={i18n.t('KANBAN.FORM.FUNNEL_PLACEHOLDER')}
      />

      {/* Estágio */}
      {selectedFunnel && (
        <Dropdown
          label={`${i18n.t('KANBAN.FORM.STAGE')} *`}
          options={selectedFunnel.stages.map(stage => ({ id: stage.stage_id, name: stage.stage_name }))}
          selectedOption={selectedStage ? { id: selectedStage.stage_id, name: selectedStage.stage_name } : null}
          onSelect={(option) => {
            const stage = selectedFunnel.stages.find(s => s.stage_id === option.id);
            if (stage) {
              setSelectedStage(stage);
            }
          }}
          placeholder={i18n.t('KANBAN.FORM.STAGE_PLACEHOLDER')}
        />
      )}

      {/* Valor */}
      <Animated.View style={tailwind.style('mb-4')}>
        <Animated.Text style={tailwind.style(labelStyle)}>
          {i18n.t('KANBAN.FORM.VALUE')}
        </Animated.Text>
        <TextInput
          style={tailwind.style(inputStyle)}
          value={value}
          onChangeText={setValue}
          placeholder={i18n.t('KANBAN.FORM.VALUE_PLACEHOLDER')}
          placeholderTextColor={placeholderColor}
          keyboardType="numeric"
          selectTextOnFocus
        />
      </Animated.View>

      {/* Produtos - only show when products are available */}
      {products.length > 0 && (
        <Animated.View style={tailwind.style('mb-4')}>
          <Animated.Text style={tailwind.style(`text-xs font-inter-medium-24 mb-2 ${colors.textSecondary}`)}>
            {i18n.t('KANBAN.FORM.PRODUCTS')}
          </Animated.Text>

          {/* Product rows */}
          {productRows.map((row, index) => renderProductRow(row, index))}

          {/* Add product button */}
          <Pressable
            onPress={handleAddProductRow}
            style={tailwind.style(`flex-row items-center justify-center rounded-lg p-2.5 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`)}>
            <Animated.Text style={tailwind.style(`text-sm font-inter-medium-24 ${isDark ? 'text-blue-400' : 'text-blue-600'}`)}>
              {i18n.t('KANBAN.FORM.ADD_PRODUCT')}
            </Animated.Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Botões */}
      <Animated.View style={tailwind.style('flex-row mt-2')}>
        <Animated.View style={tailwind.style('flex-1 mr-3')}>
          <Button
            variant="secondary"
            handlePress={onCancel}
            text={i18n.t('KANBAN.FORM.CANCEL')}
          />
        </Animated.View>
        <Animated.View style={tailwind.style('flex-1')}>
          <Button
            variant="primary"
            handlePress={handleSubmit}
            text={loading ? i18n.t('KANBAN.FORM.SAVING') : item ? i18n.t('KANBAN.FORM.UPDATE') : i18n.t('KANBAN.FORM.CREATE')}
            disabled={loading}
          />
        </Animated.View>
      </Animated.View>
    </Animated.View>
  );
};
