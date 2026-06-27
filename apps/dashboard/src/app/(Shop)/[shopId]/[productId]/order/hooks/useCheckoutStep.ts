import { useState, useMemo } from 'react';
import { useCheckout } from '../useCheckout';

/**
 * Custom hook to manage step navigation based on product properties.
 *
 * @param {Object} product - The product object.
 * @param {number} product.price - The price of the product.
 * @param {boolean} product.isDigital - Whether the product is digital.
 * @returns {Object} - An object containing:
 *   - currentStep: The current step number.
 *   - nextStep: Function to get the next step number.
 *   - prevStep: Function to get the previous step number.
 *   - setCurrentStep: Function to manually set the current step.
 *   - isValidStep: Function to check if a step is valid for the product.
 */
const useCheckoutStep = () => {
  const { pendingOrder, product, step } = useCheckout();

  /**
   * Determines the valid steps based on the product's properties.
   *
   * @returns {number[]} - An array of valid step numbers.
   */
  const validSteps = useMemo(() => {
    const steps = [1]; // Step 1 is always included
    if (!product) return steps;

    // The price to be used for step validation
    // It is either the pending order's price or the product's price
    const price = pendingOrder
      ? typeof pendingOrder.orderProducts[0]?.discountPrice === 'number'
        ? pendingOrder.orderProducts[0]?.discountPrice
        : pendingOrder.orderProducts[0].price
      : typeof product.discountPrice === 'number'
        ? product.discountPrice
        : product.price;

    // Add Step 2 if the product is not digital and has a price > 0
    if (!product.isDigital) {
      steps.push(2);
    }

    // Add Step 3 if the product has a price > 0
    if (price > 0) {
      steps.push(3);
    }

    // Add Step 4 if the product is digital and has a price > 0
    if (price > 0 && product.isDigital) {
      steps.push(4);
    }

    return steps;
  }, [product]);

  /**
   * Checks if a given step number is valid for the product.
   *
   * @param {number} step - The step number to check.
   * @returns {boolean} - True if the step is valid, false otherwise.
   */
  const isValidStep = (step: number) => {
    return validSteps.includes(step);
  };

  /**
   * Gets the next step number.
   *
   * @returns {number|null} - The next step number, or null if there is no next step.
   */
  const nextStep = () => {
    const currentIndex = validSteps.indexOf(step);
    return validSteps[currentIndex + 1];
  };

  /**
   * Gets the previous step number.
   *
   * @returns {number|null} - The previous step number, or null if there is no previous step.
   */
  const prevStep = () => {
    const currentIndex = validSteps.indexOf(step);

    return validSteps[currentIndex - 1];
  };

  return {
    nextStep,
    prevStep,
    isValidStep,
  };
};

export default useCheckoutStep;
