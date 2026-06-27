'use client';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';

const WordsList = [
  'بـاعـشـق',
  'راحـت',
  'تـو سـفـر',
  'تـو خـواب',
  'اتـومـات',
  'سـریـع',
  'هـوشـمنـد',
  'زیاد',
  'تـو خـونـه',
  'آنـلایـن',
  'بـیـشـتـر',
];

interface LogoSloganProps {
  variant?: 'default' | 'white';
}

export const LogoSlogan = ({ variant = 'default' }: LogoSloganProps) => {
  const [word, setWord] = useState<string | null>(null);

  useEffect(() => {
    setWord(WordsList[Math.floor(Math.random() * WordsList.length)]);
  }, []);

  if (!word) {
    return null;
  }

  return (
    <h2
      className={cn(
        'text-sm',
        variant === 'white'
          ? 'text-white'
          : 'text-primary flex h-6.5 items-center rounded-full border border-violet-200/90 bg-violet-100 px-2 font-medium duration-300',
      )}
    >
      {word}
    </h2>
  );
};
