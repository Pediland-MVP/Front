"use client"

import { useEffect, useState } from "react"
import useSWR from "swr"
import { useFormContext } from "react-hook-form"
import { Label } from "@/components/theme/ui/label"
import { Button } from "@/components/theme/ui/button"
import { FormItem } from "@/components/theme/ui/form"
import MultipleSelector, { type Option } from "@/components/theme/ui/multi-selector"
import api from "@/hooks/swr/api-client"
import { useTranslations } from "next-intl"
import { Plus, Trash } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/theme/ui/select"

// Types for our API responses
export interface VariationType {
  id: number
  title: string
  style: string
  createDate: string
  updateDate: string
  isLocked: boolean
}

export interface VariationValue {
  id: number
  value: string
  colorHex?: string
  variationTypeId: number
  createDate: string
  updateDate: string
}

export interface ApiResponse<T> {
  items: T[]
  meta: {
    itemCount: number
    currentPage: number
    itemsPerPage: number
    totalItems: number
    totalPages: number
  }
}

// This matches the structure in the product JSON
export interface ProductVariation {
  id?: string
  createDate?: string
  updateDate?: string
  variationValues: VariationValue[]
}

interface ProductVariationManagerProps {
  initialVariations?: ProductVariation[]
}

export default function ProductVariationManager({ initialVariations = [] }: ProductVariationManagerProps) {
  const t = useTranslations("Products.Form")
  const form = useFormContext()

  // Fetch all variation types
  const { data: variationTypesData } = useSWR<ApiResponse<VariationType>>(
    "/variations/variationTypes?page=1&limit=35",
    api,
  )

  // State to track selected variation types and their values
  const [variations, setVariations] = useState<ProductVariation[]>(
    initialVariations.length > 0 ? initialVariations : [{ variationValues: [] }],
  )

  // Update form value when variations change
  useEffect(() => {
    form.setValue("productVariations", variations)
  }, [variations, form])

  // Add a new variation
  const addVariation = () => {
    setVariations([...variations, { variationValues: [] }])
  }

  // Remove a variation
  const removeVariation = (index: number) => {
    if (variations.length <= 1) return // Keep at least one variation
    const newVariations = [...variations]
    newVariations.splice(index, 1)
    setVariations(newVariations)
  }

  // Update variation values
  const updateVariationValues = (index: number, typeId: number, selectedValues: VariationValue[]) => {
    const newVariations = [...variations]
    newVariations[index] = {
      ...newVariations[index],
      variationValues: selectedValues,
    }
    setVariations(newVariations)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-base font-medium">{t("productVariations")}</h3>
        <Button type="button" size="sm" variant="outline" onClick={addVariation}>
          <Plus className="w-4 h-4 mr-2" />
          {t("addVariation")}
        </Button>
      </div>

      {variations.map((variation, index) => (
        <VariationSelector
          key={index}
          index={index}
          variation={variation}
          onRemove={() => removeVariation(index)}
          onValuesChange={(typeId, values) => updateVariationValues(index, typeId, values)}
          variationTypes={variationTypesData?.items || []}
          showRemoveButton={variations.length > 1}
        />
      ))}

      {/* Hidden field to store variations in form */}
      <input type="hidden" {...form.register("productVariations")} value={JSON.stringify(variations)} />
    </div>
  )
}

interface VariationSelectorProps {
  index: number
  variation: ProductVariation
  onRemove: () => void
  onValuesChange: (typeId: number, values: VariationValue[]) => void
  variationTypes: VariationType[]
  showRemoveButton: boolean
}

function VariationSelector({
  index,
  variation,
  onRemove,
  onValuesChange,
  variationTypes,
  showRemoveButton,
}: VariationSelectorProps) {
  const t = useTranslations("Products.Form")
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(
    variation.variationValues[0]?.variationTypeId || null,
  )

  // Fetch variation values when a type is selected
  const { data: variationValuesData } = useSWR<ApiResponse<VariationValue>>(
    selectedTypeId ? `/variations/variationValues?page=1&limit=35&variationTypeId=${selectedTypeId}` : null,
    api,
  )

  // Convert API data to options for MultipleSelector
  const valueOptions: Option[] =
    variationValuesData?.items.map((item) => ({
      label: item.value,
      value: item.id.toString(),
      color: item.colorHex,
      data: item, // Store the full item data
    })) || []

  // Get the selected values
  const selectedValues = variation.variationValues.map((value) => ({
    label: value.value,
    value: value.id.toString(),
    color: value.colorHex,
    data: value,
  }))

  // Handle type selection change
  const handleTypeChange = (typeId: string) => {
    const id = Number.parseInt(typeId)
    setSelectedTypeId(id)
    onValuesChange(id, []) // Reset values when type changes
  }

  // Handle value selection changes
  const handleValueChange = (options: Option[]) => {
    if (!selectedTypeId) return

    // Convert selected options back to VariationValue objects
    const values = options.map((option) => option.data as VariationValue)
    onValuesChange(selectedTypeId, values)
  }

  return (
    <div className="p-4 border rounded-md bg-blue-50/30">
      <div className="flex justify-between items-center mb-3">
        <div className="font-medium">
          {t("variation")} #{index + 1}
        </div>
        {showRemoveButton && (
          <Button type="button" size="icon" variant="ghost" onClick={onRemove}>
            <Trash className="w-4 h-4 text-red-500" />
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <FormItem>
          <Label>{t("variationType")}</Label>
          <Select value={selectedTypeId?.toString() || ""} onValueChange={handleTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("selectVariationType")} />
            </SelectTrigger>
            <SelectContent>
              {variationTypes.length === 0 ? (
                <div className="p-2 text-center text-muted-foreground">{t("noVariationTypesAvailable")}</div>
              ) : (
                variationTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id.toString()}>
                    {type.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </FormItem>

        {selectedTypeId && (
          <FormItem>
            <Label>{t("variationValues")}</Label>
            <MultipleSelector
              value={selectedValues}
              onChange={handleValueChange}
              defaultOptions={valueOptions}
              placeholder={t("selectVariationValues")}
              emptyIndicator={<p className="text-center text-gray-600 dark:text-gray-400">{t("noValuesFound")}</p>}
            />
            {selectedValues.length === 0 && (
              <p className="text-xs text-red-500 mt-1">{t("pleaseSelectAtLeastOneValue")}</p>
            )}
          </FormItem>
        )}
      </div>
    </div>
  )
}

