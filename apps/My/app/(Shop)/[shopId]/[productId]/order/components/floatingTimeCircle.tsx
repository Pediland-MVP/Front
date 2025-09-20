'use client'

import { useState, useEffect } from 'react'
import { FloatingTimeCircleSkeleton } from './floatingTimeCircle.skeleton'
// UI
import { Card } from "@befroosh/ui"
import { Progress } from "@befroosh/ui"
import { mutate } from 'swr'
import { useCheckout } from '../useCheckout'
import { MAX_PAYMENT_LIFE_TIME_IN_SEC } from '@/config/configs'

interface FloatingTimeCircleProps {
  startDateString: string | undefined
}


const FloatingTimeCircle: React.FC<FloatingTimeCircleProps> = ({ startDateString }) => {
  const { timeLeft, setTimeLeft } = useCheckout()
  // const [timeLeft, setTimeLeft] = useState(MAX_PAYMENT_LIFE_TIME_IN_SEC) // Initialize with 1 hour in seconds
  const totalTime = MAX_PAYMENT_LIFE_TIME_IN_SEC // 1 hour in seconds
  const progress = ((totalTime - timeLeft!) / totalTime) * 100

  useEffect(() => {
    if (!startDateString) return;
    const calculateTimeLeft = () => {
      const now = new Date()
      const endTime = new Date(new Date(startDateString).getTime() + MAX_PAYMENT_LIFE_TIME_IN_SEC * 1000) // 1 hour after start
      const difference = endTime.getTime() - now.getTime()

      if (difference > 0) {
        setTimeLeft(Math.floor(difference / 1000))
      } else {
        setTimeLeft(0)
      }
    }

    calculateTimeLeft() // Initial calculation
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [startDateString])

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = time % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  if (!startDateString) return <FloatingTimeCircleSkeleton />

  return (
    <Card className="rounded-full border flex items-center justify-center mb-2 py-1.5 px-0 md:fixed md:z-50 md:bottom-4 md:right-4 md:w-32 md:h-32">
      <div className="relative w-full h-full flex items-center justify-center">
        <div className="hidden md:block w-full h-full">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
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
        <div className="md:hidden w-full px-4 flex gap-x-3 items-center justify-center">
          <span className="font-semibold text-primary">
            {formatTime(timeLeft!)}
          </span>
          <div className="flex-grow flex justify-center items-center">
            <Progress value={100 - progress} className="h-1" />
          </div>
        </div>
        {/* Time display for desktop */}
        <div className="absolute top-0 left-0 w-full h-full md:flex hidden items-center justify-center">
          <span className="text-2xl font-bold text-primary">
            {formatTime(timeLeft!)}
          </span>
        </div>
      </div>
    </Card>
  )
}

export default FloatingTimeCircle
