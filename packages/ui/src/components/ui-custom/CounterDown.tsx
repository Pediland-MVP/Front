'use client';

import { useEffect, useState } from 'react';

interface CounterDownProps {
  time?: number; // زمان اولیه به ثانیه
  onEnd?: () => void; // کال‌بک وقتی تایمر تموم شد
}

export const CounterDown = ({ time = 120, onEnd }: CounterDownProps) => {
  const [timeLeft, setTimeLeft] = useState(time);

  // وقتی prop time تغییر کنه (مثلاً بعد از resend)، تایمر ریست میشه
  useEffect(() => {
    setTimeLeft(time);
  }, [time]);

  // 🕒 main countdown logic
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]); // update every second

  useEffect(() => {
    if (timeLeft === 0) {
      onEnd?.();
    }
  }, [timeLeft, onEnd]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return <span>{formatTime(timeLeft)}</span>;
};
