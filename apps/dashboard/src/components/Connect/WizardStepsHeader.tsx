'use client';

import { cn } from '@/lib/utils';

interface WizardStepsHeaderProps {
  titles: [string, string, string];
  currentIndex: 0 | 1 | 2;
}

export function WizardStepsHeader({ titles, currentIndex }: WizardStepsHeaderProps) {
  return (
    <div className="mb-5 space-y-2">
      <div className="flex items-center gap-1.5">
        {titles.map((_, index) => (
          <div
            key={index}
            data-testid="wizard-step-bar"
            className={cn(
              'h-2 flex-1 rounded-md transition-colors duration-300',
              index <= currentIndex ? 'bg-violet-600' : 'bg-slate-200',
            )}
          />
        ))}
      </div>
      <p className="text-center text-xs font-semibold text-slate-500">{titles[currentIndex]}</p>
    </div>
  );
}
