'use client';

import { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import type { z } from 'zod';
import type { orderFormSchema } from '../../../../../../components/Shop/CheckoutPage';
import { cn } from '@/lib/utils';
import { Check, CheckIcon } from 'lucide-react';
import { useCheckout } from '../useCheckout';
import { useUpdateAttributes } from '../hooks/useUpdateAttributes';
import type { Attribute, AttributeValue } from '@/types/product';

interface AttributeSelectorProps {
  attributes: Attribute[];
}

export function AttributeSelector({ attributes }: AttributeSelectorProps) {
  const { setValue, watch, getValues } = useFormContext<z.infer<typeof orderFormSchema>>();
  const selectedAttributeValueIds = watch('attributeValueIds') || [];

  const { isUpdateAttributesLoading, updateAttributes } = useUpdateAttributes();

  const { pendingOrder } = useCheckout();

  // Initialize selected values with the first value of each attribute
  useEffect(() => {
    const initialSelectedIds = attributes
      .map((attr) => attr.attributeValues[0]?.id)
      .filter(Boolean);
    setValue('attributeValueIds', initialSelectedIds);
  }, [attributes, setValue]);

  const handleAttributeValueSelect = (attributeId: number, valueId: number) => {
    // Remove any previously selected value for this attribute
    const filteredIds = selectedAttributeValueIds.filter((id) => {
      const attributeValue = attributes
        .flatMap((attr) => attr.attributeValues)
        .find((av) => av.id === id);

      return attributeValue?.attributeId !== attributeId;
    });

    // Add the newly selected value
    setValue('attributeValueIds', [...filteredIds, valueId]);

    // Update attributes when order exist
    if (pendingOrder) {
      updateAttributes(getValues('attributeValueIds'));
    }
  };

  const isSelected = (valueId: number) => {
    return selectedAttributeValueIds.includes(valueId);
  };

  const isDisabled = pendingOrder?.status === 'payment';

  if (!attributes || attributes.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {attributes.map((attribute) => (
        <div key={attribute.id} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">{attribute.title}</h3>

          <div className="flex flex-wrap gap-2">
            {attribute.style === 'color'
              ? // Color selector
                attribute.attributeValues.map((value) => (
                  <button
                    disabled={isDisabled}
                    key={value.id}
                    type="button"
                    onClick={() => handleAttributeValueSelect(attribute.id, value.id)}
                    className={cn(
                      'relative flex h-8 w-8 items-center justify-center rounded-full',
                      isDisabled ? 'cursor-not-allowed opacity-50' : '',
                    )}
                    style={{ backgroundColor: value.colorHex || undefined }}
                    title={value.label}
                  >
                    {isSelected(value.id) && (
                      <CheckIcon className="h-4 w-4 text-white drop-shadow-[0_0_1px_rgba(0,0,0,0.5)]" />
                    )}
                  </button>
                ))
              : // Button selector
                attribute.attributeValues.map((value) => (
                  <button
                    disabled={isDisabled}
                    key={value.id}
                    type="button"
                    onClick={() => handleAttributeValueSelect(attribute.id, value.id)}
                    className={cn(
                      'text-primary flex size-9 items-center justify-center rounded-full border pt-1 text-sm leading-none font-medium',
                      isSelected(value.id)
                        ? 'bg-primary/80 text-primary-foreground border-primary'
                        : 'bg-background border-input hover:bg-muted',
                      isDisabled ? 'cursor-not-allowed opacity-50' : '',
                    )}
                  >
                    {value.label}
                  </button>
                ))}
          </div>
        </div>
      ))}
    </div>
  );
}
