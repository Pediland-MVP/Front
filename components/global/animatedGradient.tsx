"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface AnimatedGradientProps {
  colors: string[]
  className?: string
  children?: React.ReactNode
  animationDuration?: string
}

export function AnimatedGradient({ colors, className = "", children, animationDuration = "4s" }: AnimatedGradientProps) {
  // Create gradient stops from the color array
  const gradientColors = colors.join(", ")

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(-45deg, ${gradientColors})`,
        backgroundSize: "400% 400%",
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
  )
}

export default function Component() {
  const [selectedColors, setSelectedColors] = useState(["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4"])

  const colorPresets = [
    {
      name: "Sunset",
      colors: ["#ff6b6b", "#ffa726", "#ffcc02", "#ff8a65"],
    },
    {
      name: "Ocean",
      colors: ["#667eea", "#764ba2", "#6dd5ed", "#2193b0"],
    },
    {
      name: "Forest",
      colors: ["#56ab2f", "#a8edea", "#fed6e3", "#d299c2"],
    },
    {
      name: "Purple Dream",
      colors: ["#a8edea", "#fed6e3", "#d299c2", "#ffecd2"],
    },
    {
      name: "Fire",
      colors: ["#ff9a9e", "#fecfef", "#fecfef", "#ffecd2"],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Animated Gradient Component</h1>
          <p className="text-gray-600">A customizable animated gradient div that accepts any color array</p>
        </div>

        {/* Main animated gradient showcase */}
        <AnimatedGradient
          colors={selectedColors}
          className="w-full h-64 rounded-xl flex items-center justify-center"
          animationDuration="3s"
        >
          <div className="text-white text-center">
            <h2 className="text-4xl font-bold mb-2">Animated Gradient</h2>
            <p className="text-xl opacity-90">Colors flow and shift continuously</p>
          </div>
        </AnimatedGradient>

        {/* Color preset buttons */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">Try Different Color Presets:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {colorPresets.map((preset) => (
              <Button
                key={preset.name}
                onClick={() => setSelectedColors(preset.colors)}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
              >
                <AnimatedGradient colors={preset.colors} className="w-full h-12 rounded-md" animationDuration="2s" />
                <span className="text-sm font-medium">{preset.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Different sizes and speeds */}
        <div className="space-y-4">
          <h3 className="text-xl font-semibold text-gray-800">Different Sizes & Speeds:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedGradient
              colors={["#ff6b6b", "#4ecdc4", "#45b7d1"]}
              className="h-32 rounded-lg flex items-center justify-center"
              animationDuration="1s"
            >
              <span className="text-white font-semibold">Fast (1s)</span>
            </AnimatedGradient>

            <AnimatedGradient
              colors={["#a8edea", "#fed6e3", "#d299c2"]}
              className="h-32 rounded-lg flex items-center justify-center"
              animationDuration="5s"
            >
              <span className="text-white font-semibold">Medium (5s)</span>
            </AnimatedGradient>

            <AnimatedGradient
              colors={["#667eea", "#764ba2", "#f093fb"]}
              className="h-32 rounded-lg flex items-center justify-center"
              animationDuration="8s"
            >
              <span className="text-white font-semibold">Slow (8s)</span>
            </AnimatedGradient>
          </div>
        </div>

        {/* Usage example */}
        <div className="bg-white rounded-lg p-6 border">
          <h3 className="text-lg font-semibold mb-4">Usage Example:</h3>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
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
  )
}
