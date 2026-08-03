'use client';

import { cn } from '@/lib/utils';
import { ProductFieldTypeEnum } from '@/types/product.enum';
import { onInputP2EHandler } from '@/utils/p2eNumber';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { z } from 'zod';
import useOrder from '../hooks/useOrder';
import useUpdateContact from '../hooks/useUpdateContact';
import { useCheckout } from '../useCheckout';

import { orderFormSchema } from '@/components/Shop/CheckoutPage';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Textarea,
} from '@/components/ui';
import { ButtonLoading } from '@/components/ui-custom/ButtonLoading';
import { ErrorMessage } from '@/components/ui-custom/ErrorMessage';
import { UserRectangleIcon } from '@phosphor-icons/react/dist/ssr/UserRectangle';

export default function CustomerDetails() {
  const t = useTranslations('Checkout');

  const { pendingOrder, product } = useCheckout();
  const { createOrder, loading: isCreateOrderLoading } = useOrder();
  const { updateContact, loading: isUpdateContactLoading } = useUpdateContact();

  const {
    register,
    control,
    formState: { errors },
    trigger,
    clearErrors,
    watch,
  } = useFormContext<z.infer<typeof orderFormSchema>>();

  const [isProductFieldsError, setIsProductFieldsError] = useState<{
    [key: number]: boolean;
  }>({});

  const createOrderHandler = async () => {
    // Validate required fields
    const isFirstNameValid = await trigger('firstname');
    const isLastNameValid = await trigger('lastname');
    const isMobileValid = await trigger('mobile');

    let isProductFieldsValid = true;
    const productFieldValues = watch('productFieldValues');
    if ((product?.fields?.length || 0) > 0) {
      productFieldValues?.forEach((pf, index) => {
        if (pf.isRequired && !pf.value) {
          setIsProductFieldsError((prevState: any) => ({
            ...prevState,
            [index]: true,
          }));
          isProductFieldsValid = false;
        }
      });
    }

    if (!isFirstNameValid || !isLastNameValid || !isMobileValid || !isProductFieldsValid) {
      return;
    }

    if (pendingOrder) {
      await updateContact();
      clearErrors();
      return;
    }

    await createOrder();
    clearErrors();
  };

  return (
    <div className="_customer-details px-4 pb-6">
      <h2 className="text-primary mb-2 flex items-center gap-2 border-b pb-2 text-lg font-semibold md:mb-4">
        <UserRectangleIcon size={28} weight="duotone" className="text-primary" />
        {t('customerDetails')}
      </h2>

      <div className="grid gap-3 md:grid-cols-3">
        <FormField
          control={control}
          name="firstname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('firstName')}</FormLabel>
              <FormControl>
                <Input
                  id="firstname"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    trigger('firstname');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="lastname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('lastName')}</FormLabel>
              <FormControl>
                <Input
                  id="lastname"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    trigger('lastname');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('mobile')}</FormLabel>
              <FormControl>
                <Input
                  id="mobile"
                  type="tel"
                  maxLength={11}
                  onInput={onInputP2EHandler}
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    trigger('mobile');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {watch('productFieldValues')?.map((f, index) => (
          <FormField
            key={index}
            control={control}
            name={`productFieldValues.${index}.value`}
            render={({ field, fieldState: { error } }) => (
              <FormItem>
                <FormLabel className={cn(isProductFieldsError[index] && 'text-destructive')}>
                  {f.label}
                </FormLabel>
                <FormControl>
                  {f.type === ProductFieldTypeEnum.TEXTAREA ? (
                    <Textarea
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (e.target.value) {
                          setIsProductFieldsError((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors[index];
                            return newErrors;
                          });
                        }
                      }}
                      aria-invalid={isProductFieldsError[index]}
                    />
                  ) : (
                    f.type === ProductFieldTypeEnum.TEXT && (
                      <Input
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          if (e.target.value) {
                            setIsProductFieldsError((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors[index];
                              return newErrors;
                            });
                          }
                        }}
                        aria-invalid={isProductFieldsError[index]}
                      />
                    )
                  )}
                </FormControl>
                {isProductFieldsError[index] && <ErrorMessage>{t('required')}</ErrorMessage>}
              </FormItem>
            )}
          />
        ))}
      </div>

      <div className="mt-6 flex w-full items-center justify-center gap-x-2">
        <ButtonLoading
          onClick={createOrderHandler}
          isLoading={isCreateOrderLoading}
          className="w-full"
          type="button"
          disabled={!product?.isInfinite && product?.quantity === 0}
        >
          {t('nextStep')}
        </ButtonLoading>
      </div>
    </div>
  );
}
