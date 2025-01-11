"use client";

import * as React from "react";
import { createContext, useContext, useMemo } from "react";
import { cn } from "@/lib/utils";

// Types
interface FormStepperContextValue {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  steps: FormStepProps[];
  registerStep: (step: FormStepProps) => void;
  disableNavigation?: boolean;
}

interface FormStepperProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  currentStep?: number;
  onStepChange?: (step: number) => void;
  disableNavigation?: boolean;
}

interface FormStepProps  {
  icon: React.ReactNode;
  title: string;
  step: number;
  children: React.ReactNode;
  className?: string;
  disableTitle?: boolean;
}

// Context
const FormStepperContext = createContext<FormStepperContextValue | undefined>(
  undefined
);

// Custom Hook
export function useFormStepper() {
  const context = useContext(FormStepperContext);
  if (!context) {
    throw new Error("useFormStepper must be used within FormStepperProvider");
  }
  return context;
}

// Provider Component
export function FormStepperProvider({
  children,
  currentStep = 1,
  onStepChange,
  disableNavigation = false,
  className,
  ...props
}: FormStepperProviderProps) {
  const [activeStep, setActiveStep] = React.useState(currentStep);
  const [steps, setSteps] = React.useState<FormStepProps[]>([]);

  const registerStep = React.useCallback((step: FormStepProps) => {
    setSteps((prev) => {
      const existing = prev.find((s) => s.step === step.step);
      if (existing) return prev;
      return [...prev, step].sort((a, b) => a.step - b.step);
    });
  }, []);

  const setCurrentStep = React.useCallback(
    (step: number) => {
      setActiveStep(step);
      onStepChange?.(step);
    },
    [onStepChange]
  );

  const value = useMemo(
    () => ({
      currentStep: activeStep,
      setCurrentStep,
      steps,
      registerStep,
      disableNavigation,
    }),
    [activeStep, setCurrentStep, steps, registerStep, disableNavigation]
  );

  return (
    <FormStepperContext.Provider value={value}>
      <div className={cn("w-full", className)}>
        <div className="mb-8 flex items-center justify-center">
          {steps.map((step, index) => {
            const isActive = step.step === activeStep;
            const isCompleted = step.step < activeStep;
            const isLast = index === steps.length - 1;

            return (
              <React.Fragment key={step.step}>
                <div className="flex items-center">
                  <button
                    onClick={() =>
                      !disableNavigation && setCurrentStep(step.step)
                    }
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                      isCompleted && "bg-primary text-primary-foreground",
                      isActive && "bg-primary text-primary-foreground",
                      !isActive &&
                        !isCompleted &&
                        "bg-muted text-muted-foreground",
                      disableNavigation && "cursor-default",
                      !disableNavigation && "hover:opacity-90"
                    )}
                    disabled={disableNavigation}
                  >
                    {step.icon || step.step}
                  </button>
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "h-[5px] w-[10%] mx-2 rounded-full transition-colors duration-300",
                      isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </FormStepperContext.Provider>
  );
}

// Step Component
export function FormStep({
  icon,
  title,
  step,
  children,
  className,
  disableTitle = false,
}: FormStepProps) {
  const context = useContext(FormStepperContext);

  if (!context) {
    throw new Error("FormStep must be used within FormStepperProvider");
  }

  const { currentStep, registerStep } = context;

  React.useEffect(() => {
    registerStep({ icon, title, step, children });
  }, [registerStep, icon, title, step, children]);

  if (currentStep !== step) {
    return null;
  }

  return (
    <div
      className={cn(
        "animate-in fade-in-50 duration-500 ease-in-out",
        className
      )}
    >
      {!disableTitle && (
        <div className="mb-6 text-center">
          <h2 className="text-lg font-semibold capitalize">{title}</h2>
        </div>
      )}
      {children}
    </div>
  );
}
