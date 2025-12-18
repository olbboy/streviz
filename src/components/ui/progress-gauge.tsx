import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressGaugeProps {
  value: number
  max?: number
  size?: "sm" | "md" | "lg" | "xl"
  thickness?: number
  showValue?: boolean
  showLabel?: boolean
  label?: string
  unit?: string
  color?: "blue" | "emerald" | "amber" | "red" | "purple" | "slate"
  backgroundColor?: string
  className?: string
}

const colorConfig = {
  blue: {
    stroke: "stroke-broadcast-blue",
    text: "text-broadcast-blue dark:text-broadcast-blue-light",
    glow: "drop-shadow-[0_0_8px_rgba(0,102,255,0.4)]"
  },
  emerald: {
    stroke: "stroke-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    glow: "drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]"
  },
  amber: {
    stroke: "stroke-amber-500",
    text: "text-amber-600 dark:text-amber-400",
    glow: "drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]"
  },
  red: {
    stroke: "stroke-red-500",
    text: "text-red-600 dark:text-red-400",
    glow: "drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]"
  },
  purple: {
    stroke: "stroke-purple-500",
    text: "text-purple-600 dark:text-purple-400",
    glow: "drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]"
  },
  slate: {
    stroke: "stroke-slate-500",
    text: "text-slate-600 dark:text-slate-400",
    glow: "drop-shadow-[0_0_8px_rgba(100,116,139,0.4)]"
  }
}

const sizeConfig = {
  sm: {
    container: "w-16 h-16",
    textSize: "text-xs font-semibold",
    labelSize: "text-xs",
    strokeWidth: 3
  },
  md: {
    container: "w-24 h-24",
    textSize: "text-sm font-semibold",
    labelSize: "text-sm",
    strokeWidth: 4
  },
  lg: {
    container: "w-32 h-32",
    textSize: "text-base font-semibold",
    labelSize: "text-base",
    strokeWidth: 5
  },
  xl: {
    container: "w-40 h-40",
    textSize: "text-lg font-semibold",
    labelSize: "text-lg",
    strokeWidth: 6
  }
}

export const ProgressGauge = React.forwardRef<HTMLDivElement, ProgressGaugeProps>(
  ({
    value,
    max = 100,
    size = "md",
    thickness,
    showValue = true,
    showLabel = false,
    label,
    unit,
    color = "blue",
    backgroundColor = "rgba(255, 255, 255, 0.1)",
    className,
    ...props
  }, ref) => {
    const [animatedValue, setAnimatedValue] = React.useState(0)
    const [prevPercentage, setPrevPercentage] = React.useState(0)
    const config = colorConfig[color]
    const sizeStyles = sizeConfig[size]
    const strokeWidth = thickness || sizeStyles.strokeWidth
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    // Smooth animation for value changes
    React.useEffect(() => {
      const timer = setTimeout(() => {
        setAnimatedValue(percentage)
      }, 50)
      return () => clearTimeout(timer)
    }, [percentage])

    // Handle animation transitions
    React.useEffect(() => {
      if (Math.abs(percentage - prevPercentage) > 5) {
        setPrevPercentage(percentage)
      }
    }, [percentage, prevPercentage])

    // Calculate SVG circle properties
    const radius = (size === "sm" ? 28 : size === "md" ? 44 : size === "lg" ? 60 : 76)
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (animatedValue / 100) * circumference

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex flex-col items-center justify-center gpu-accelerated",
          sizeStyles.container,
          "animate-glass-entrance"
        )}
        {...props}
      >
        {/* Enhanced SVG Circle Progress with multiple layers */}
        <svg
          className={cn(
            "absolute inset-0 transform -rotate-90 transition-all duration-300 ease-out",
            percentage > 90 && "animate-pulse"
          )}
          viewBox="0 0 100 100"
          style={{ filter: config.glow }}
        >
          {/* Outer glow ring for high values */}
          {percentage > 80 && (
            <circle
              cx="50"
              cy="50"
              r={radius + 2}
              strokeWidth="1"
              fill="none"
              stroke="currentColor"
              className={config.stroke}
              opacity="0.3"
            />
          )}

          {/* Background circle with gradient */}
          <defs>
            <linearGradient id={`bg-gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={backgroundColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={backgroundColor} stopOpacity="0.1" />
            </linearGradient>

            <linearGradient id={`progress-gradient-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          <circle
            cx="50"
            cy="50"
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            stroke={`url(#bg-gradient-${color})`}
            className="opacity-20"
          />

          {/* Progress circle with enhanced animation */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            strokeWidth={strokeWidth}
            fill="none"
            className={cn(
              config.stroke,
              "transition-all duration-700 ease-out",
              percentage > 90 && "animate-pulse"
            )}
            stroke={`url(#progress-gradient-${color})`}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 ${Math.max(2, percentage / 20)}px currentColor)`
            }}
          />

          {/* Animated progress tip */}
          {percentage > 0 && percentage < 100 && (
            <circle
              cx="50"
              cy={50 - radius}
              r="3"
              fill="currentColor"
              className={config.stroke}
              style={{
                transformOrigin: "50px 50px",
                transform: `rotate(${(animatedValue / 100) * 360}deg)`,
                filter: "drop-shadow(0 0 4px currentColor)"
              }}
            />
          )}
        </svg>

        {/* Content in center with smooth animations */}
        <div className="relative z-10 flex flex-col items-center">
          {showValue && (
            <div className="flex items-baseline gap-1 transition-all duration-300">
              <span className={cn(
                sizeStyles.textSize,
                config.text,
                "font-bold",
                percentage > 80 && "animate-pulse"
              )}>
                {Math.round(animatedValue)}
              </span>
              {unit && (
                <span className={cn("text-xs opacity-70", config.text, "transition-opacity duration-300")}>
                  {unit}
                </span>
              )}
            </div>
          )}

          {showLabel && label && (
            <span className={cn(
              sizeStyles.labelSize,
              "text-slate-600 dark:text-slate-400 mt-1 transition-all duration-300",
              percentage > 80 && "text-current"
            )}>
              {label}
            </span>
          )}
        </div>

        {/* Enhanced glass effect overlays */}
        <div className="absolute inset-0 rounded-full pointer-events-none overflow-hidden">
          {/* Primary radial shine */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background: "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 50%)"
            }}
          />

          {/* Animated shimmer based on progress */}
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-500"
            style={{
              opacity: percentage > 0 ? 0.3 : 0,
              background: `conic-gradient(from ${animatedValue * 3.6}deg at 50% 50%, transparent 0deg, rgba(255, 255, 255, 0.1) 45deg, transparent 90deg)`,
              animation: percentage > 50 ? "shimmer-slow 2s infinite" : "none"
            }}
          />

          {/* Progress-based glow effect */}
          {percentage > 70 && (
            <div
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                background: `radial-gradient(circle at 50% 50%, ${color === 'blue' ? 'rgba(37, 99, 235, 0.1)' : color === 'emerald' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.05)'} 0%, transparent 70%)`,
                animationDuration: "3s"
              }}
            />
          )}
        </div>

        {/* Value change animation overlay */}
        {Math.abs(percentage - prevPercentage) > 5 && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${color === 'blue' ? 'rgba(37, 99, 235, 0.2)' : color === 'emerald' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 0, 0, 0.1)'} 0%, transparent 70%)`,
              animation: "scale-in 0.5s ease-out"
            }}
          />
        )}
      </div>
    )
  }
)
ProgressGauge.displayName = "ProgressGauge"

// Compact gauge for tight spaces
export const ProgressGaugeCompact = React.forwardRef<HTMLDivElement, Omit<ProgressGaugeProps, "size" | "showLabel">>(
  ({
    value,
    max = 100,
    thickness = 3,
    showValue = true,
    unit,
    color = "blue",
    backgroundColor = "rgba(255, 255, 255, 0.1)",
    className,
    ...props
  }, ref) => {
    const config = colorConfig[color]
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    const radius = 20
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (percentage / 100) * circumference

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center w-12 h-12",
          className
        )}
        {...props}
      >
        <svg
          className="absolute inset-0 transform -rotate-90"
          viewBox="0 0 50 50"
        >
          <circle
            cx="25"
            cy="25"
            r={radius}
            strokeWidth={thickness}
            fill="none"
            stroke={backgroundColor}
            className="opacity-20"
          />
          <circle
            cx="25"
            cy="25"
            r={radius}
            strokeWidth={thickness}
            fill="none"
            className={cn(config.stroke, "transition-all duration-500 ease-out")}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {showValue && (
          <div className={cn("text-xs font-semibold", config.text)}>
            {Math.round(percentage)}{unit && <span className="opacity-70 ml-0.5">{unit}</span>}
          </div>
        )}
      </div>
    )
  }
)
ProgressGaugeCompact.displayName = "ProgressGaugeCompact"

// Linear progress gauge variant
export const LinearProgressGauge = React.forwardRef<HTMLDivElement, Omit<ProgressGaugeProps, "size" | "thickness">>(
  ({
    value,
    max = 100,
    showValue = true,
    showLabel = false,
    label,
    unit,
    color = "blue",
    backgroundColor = "rgba(255, 255, 255, 0.1)",
    className,
    ...props
  }, ref) => {
    const config = colorConfig[color]
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div
        ref={ref}
        className={cn("w-full space-y-2", className)}
        {...props}
      >
        {(showLabel && label) && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
            {showValue && (
              <span className={cn("text-sm font-semibold", config.text)}>
                {Math.round(value)}{unit && <span className="ml-1">{unit}</span>}
              </span>
            )}
          </div>
        )}

        <div className="relative h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out",
              config.stroke,
              percentage > 90 && "animate-pulse"
            )}
            style={{
              width: `${percentage}%`,
              boxShadow: `0 0 10px currentColor`
            }}
          />
        </div>
      </div>
    )
  }
)
LinearProgressGauge.displayName = "LinearProgressGauge"