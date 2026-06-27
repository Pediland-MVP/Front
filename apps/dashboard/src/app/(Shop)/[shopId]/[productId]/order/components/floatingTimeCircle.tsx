'use client';

import { useState, useEffect } from 'react';
import { FloatingTimeCircleSkeleton } from './floatingTimeCircle.skeleton';
// UI
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { mutate } from 'swr';
import { useCheckout } from '../useCheckout';
import { MAX_PAYMENT_LIFE_TIME_IN_SEC } from '@/config/configs';

interface FloatingTimeCircleProps {
  startDateString: string | undefined;
}

const FloatingTimeCircle: React.FC<FloatingTimeCircleProps> = ({ startDateString }) => {
  const { timeLeft, setTimeLeft } = useCheckout();
  // const [timeLeft, setTimeLeft] = useState(MAX_PAYMENT_LIFE_TIME_IN_SEC) // Initialize with 1 hour in seconds
  const totalTime = MAX_PAYMENT_LIFE_TIME_IN_SEC; // 1 hour in seconds
  const progress = ((totalTime - timeLeft!) / totalTime) * 100;

  useEffect(() => {
    if (!startDateString) return;
    const calculateTimeLeft = () => {
      const now = new Date();
      const endTime = new Date(
        new Date(startDateString).getTime() + MAX_PAYMENT_LIFE_TIME_IN_SEC * 1000,
      ); // 1 hour after start
      const difference = endTime.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft(Math.floor(difference / 1000));
      } else {
        setTimeLeft(0);
      }
    };

    calculateTimeLeft(); // Initial calculation
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [startDateString]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!startDateString) return <FloatingTimeCircleSkeleton />;

  return (
    <div className="flex items-center justify-center py-3 md:fixed md:right-4 md:bottom-4 md:z-50 md:h-32 md:w-32">
      <div className="relative flex h-full w-full items-center justify-center">
        <div className="hidden h-full w-full md:block">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle
              className="text-gray-200"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
              r="48"
              cx="50"
              cy="50"
            />
            <circle
              className="text-primary"
              strokeWidth="4"
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="48"
              cx="50"
              cy="50"
              style={{
                strokeDasharray: `${2 * Math.PI * 48}`,
                strokeDashoffset: `${2 * Math.PI * 48 * (progress / 100)}`,
                transition: 'stroke-dashoffset 1s linear',
              }}
            />
          </svg>
        </div>
        {/* Linear progress and time display for mobile */}
        <div className="flex w-full items-center justify-center gap-x-3 px-4 md:hidden">
          <span className="text-primary font-semibold">{formatTime(timeLeft!)}</span>
          <div className="flex flex-grow items-center justify-center">
            <Progress value={100 - progress} className="h-1" />
          </div>
        </div>
        {/* Time display for desktop */}
        <div className="absolute top-0 left-0 hidden h-full w-full items-center justify-center md:flex">
          <span className="text-primary text-2xl font-bold">{formatTime(timeLeft!)}</span>
        </div>
      </div>
    </div>
  );
};

export default FloatingTimeCircle;
