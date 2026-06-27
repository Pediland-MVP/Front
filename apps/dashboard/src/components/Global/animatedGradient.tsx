'use client';

import type React from 'react';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface AnimatedGradientProps {
  colors: string[];
  className?: string;
  children?: React.ReactNode;
  animationDuration?: string;
}

export function AnimatedGradient({
  colors,
  className = '',
  children,
  animationDuration = '4s',
}: AnimatedGradientProps) {
  // Create gradient stops from the color array
  const gradientColors = colors.join(', ');

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(-45deg, ${gradientColors})`,
        backgroundSize: '400% 400%',
        animation: `gradientShift ${animationDuration} ease infinite`,
      }}
    >
      <style jsx>{`
        @keyframes gradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
      {children}
    </div>
  );
}

export default function Component() {
  const [selectedColors, setSelectedColors] = useState([
    '#ff6b6b',
    '#4ecdc4',
    '#45b7d1',
    '#96ceb4',
  ]);

  const colorPresets = [
    {
      name: 'Sunset',
      colors: ['#ff6b6b', '#ffa726', '#ffcc02', '#ff8a65'],
    },
    {
      name: 'Ocean',
      colors: ['#667eea', '#764ba2', '#6dd5ed', '#2193b0'],
    },
    {
      name: 'Forest',
      colors: ['#56ab2f', '#a8edea', '#fed6e3', '#d299c2'],
    },
    {
      name: 'Purple Dream',
      colors: ['#a8edea', '#fed6e3', '#d299c2', '#ffecd2'],
    },
    {
      name: 'Fire',
      colors: ['#ff9a9e', '#fecfef', '#fecfef', '#ffecd2'],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="mb-4 text-3xl font-bold text-gray-800">Animated Gradient Component</h1>
          <p className="text-gray-600">
            A customizable animated gradient div that accepts any color array
          </p>
        </div>

        {/* Main animated gradient showcase */}
        <AnimatedGradient
          colors={selectedColors}
          className="flex h-64 w-full items-center justify-center rounded-xl"
          animationDuration="3s"
        >
          <div className="text-center text-white">
            <h2 className="mb-2 text-4xl font-bold">Animated Gradient</h2>
            <p className="text-xl opacity-90">Colors flow and shift continuously</p>
          </div>
        </AnimatedGradient>

        {/* Color preset buttons */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">Try Different Color Presets:</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {colorPresets.map((preset) => (
              <Button
                key={preset.name}
                onClick={() => setSelectedColors(preset.colors)}
                variant="outline"
                className="flex h-auto flex-col items-center space-y-2 p-4"
              >
                <AnimatedGradient
                  colors={preset.colors}
                  className="h-12 w-full rounded-md"
                  animationDuration="2s"
                />
                <span className="text-sm font-medium">{preset.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Different sizes and speeds */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">Different Sizes & Speeds:</h3>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <AnimatedGradient
              colors={['#ff6b6b', '#4ecdc4', '#45b7d1']}
              className="flex h-32 items-center justify-center rounded-lg"
              animationDuration="1s"
            >
              <span className="font-semibold text-white">Fast (1s)</span>
            </AnimatedGradient>

            <AnimatedGradient
              colors={['#a8edea', '#fed6e3', '#d299c2']}
              className="flex h-32 items-center justify-center rounded-lg"
              animationDuration="5s"
            >
              <span className="font-semibold text-white">Medium (5s)</span>
            </AnimatedGradient>

            <AnimatedGradient
              colors={['#667eea', '#764ba2', '#f093fb']}
              className="flex h-32 items-center justify-center rounded-lg"
              animationDuration="8s"
            >
              <span className="font-semibold text-white">Slow (8s)</span>
            </AnimatedGradient>
          </div>
        </div>

        {/* Usage example */}
        <div className="rounded-lg border bg-white p-6">
          <h3 className="mb-4 text-lg font-semibold">Usage Example:</h3>
          <pre className="overflow-x-auto rounded bg-gray-100 p-4 text-sm">
            {`<AnimatedGradient 
  colors={["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"]}
  className="w-full h-64 rounded-xl"
  animationDuration="3s"
>
  <div className="flex items-center justify-center h-full">
    <h2 className="text-white text-2xl">Your Content Here</h2>
  </div>
</AnimatedGradient>`}
          </pre>
        </div>
      </div>
    </div>
  );
}
