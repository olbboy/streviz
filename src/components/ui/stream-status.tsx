import * as React from "react"
import { cn } from "@/lib/utils"

interface StreamStatusProps {
  status: "live" | "offline" | "starting" | "error" | "warning"
  size?: "sm" | "md" | "lg"
  showText?: boolean
  text?: string
  className?: string
}

const statusConfig = {
  live: {
    bgColor: "bg-emerald-500/20 dark:bg-emerald-400/20",
    borderColor: "border-emerald-500/50 dark:border-emerald-400/50",
    dotColor: "bg-emerald-500 dark:bg-emerald-400",
    glowColor: "shadow-emerald-500/25 dark:shadow-emerald-400/25",
    textColor: "text-emerald-700 dark:text-emerald-300"
  },
  offline: {
    bgColor: "bg-slate-500/20 dark:bg-slate-400/20",
    borderColor: "border-slate-500/50 dark:border-slate-400/50",
    dotColor: "bg-slate-500 dark:bg-slate-400",
    glowColor: "shadow-slate-500/25 dark:shadow-slate-400/25",
    textColor: "text-slate-700 dark:text-slate-300"
  },
  starting: {
    bgColor: "bg-amber-500/20 dark:bg-amber-400/20",
    borderColor: "border-amber-500/50 dark:border-amber-400/50",
    dotColor: "bg-amber-500 dark:bg-amber-400",
    glowColor: "shadow-amber-500/25 dark:shadow-amber-400/25",
    textColor: "text-amber-700 dark:text-amber-300"
  },
  error: {
    bgColor: "bg-red-500/20 dark:bg-red-400/20",
    borderColor: "border-red-500/50 dark:border-red-400/50",
    dotColor: "bg-red-500 dark:bg-red-400",
    glowColor: "shadow-red-500/25 dark:shadow-red-400/25",
    textColor: "text-red-700 dark:text-red-300"
  },
  warning: {
    bgColor: "bg-orange-500/20 dark:bg-orange-400/20",
    borderColor: "border-orange-500/50 dark:border-orange-400/50",
    dotColor: "bg-orange-500 dark:bg-orange-400",
    glowColor: "shadow-orange-500/25 dark:shadow-orange-400/25",
    textColor: "text-orange-700 dark:text-orange-300"
  }
}

const sizeConfig = {
  sm: {
    container: "px-2.5 py-1.5",
    dot: "w-1.5 h-1.5",
    text: "text-xs font-medium"
  },
  md: {
    container: "px-3 py-2",
    dot: "w-2 h-2",
    text: "text-sm font-medium"
  },
  lg: {
    container: "px-4 py-2.5",
    dot: "w-2.5 h-2.5",
    text: "text-base font-medium"
  }
}

export const StreamStatus = React.forwardRef<HTMLDivElement, StreamStatusProps>(
  ({ status, size = "md", showText = true, text, className, ...props }, ref) => {
    const [prevStatus, setPrevStatus] = React.useState(status)
    const [isTransitioning, setIsTransitioning] = React.useState(false)

    const config = statusConfig[status]
    const sizeStyles = sizeConfig[size]
    const statusText = text || status.charAt(0).toUpperCase() + status.slice(1)

    React.useEffect(() => {
      if (prevStatus !== status) {
        setIsTransitioning(true)
        const timer = setTimeout(() => {
          setPrevStatus(status)
          setIsTransitioning(false)
        }, 150)
        return () => clearTimeout(timer)
      }
    }, [status, prevStatus])

    const getStatusAnimation = (statusType: string) => {
      switch (statusType) {
        case "live":
          return "animate-pulse-subtle"
        case "starting":
          return "animate-pulse"
        case "error":
          return "animate-pulse"
        default:
          return ""
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          // Enhanced glass effect base
          "relative inline-flex items-center gap-2 rounded-full backdrop-blur-md gpu-accelerated",
          // Status-specific colors
          config.bgColor,
          config.borderColor,
          // Border
          "border",
          // Size
          sizeStyles.container,
          // Enhanced transitions
          "transition-all duration-300 ease-out hover:scale-[1.02] hover:shadow-lg",
          config.glowColor,
          isTransitioning && "animate-fade-in",
          className
        )}
        style={{
          backdropFilter: "blur(12px) saturate(1.1)",
          WebkitBackdropFilter: "blur(12px) saturate(1.1)",
          boxShadow: `0 4px 20px ${status === "live" ? "rgba(16, 185, 129, 0.2)" : "rgba(0, 0, 0, 0.1)"}`
        }}
        {...props}
      >
        {/* Enhanced animated status dot with multiple layers */}
        <div className="relative flex items-center justify-center">
          {/* Outer glow ring for live status */}
          {status === "live" && (
            <>
              <div
                className={cn(
                  "absolute rounded-full animate-ping opacity-20",
                  `w-[${parseInt(sizeStyles.dot) * 2}px] h-[${parseInt(sizeStyles.dot) * 2}px]`,
                  config.dotColor
                )}
                style={{
                  width: `${parseInt(sizeStyles.dot) * 2}px`,
                  height: `${parseInt(sizeStyles.dot) * 2}px`
                }}
              />
              <div
                className={cn(
                  "absolute rounded-full animate-pulse opacity-40",
                  `w-[${parseInt(sizeStyles.dot) * 1.5}px] h-[${parseInt(sizeStyles.dot) * 1.5}px]`,
                  config.dotColor,
                  getStatusAnimation(status)
                )}
                style={{
                  width: `${parseInt(sizeStyles.dot) * 1.5}px`,
                  height: `${parseInt(sizeStyles.dot) * 1.5}px`,
                  animationDelay: "0.5s"
                }}
              />
            </>
          )}

          {/* Inner status dot */}
          <div
            className={cn(
              "rounded-full relative z-20 transition-all duration-300",
              sizeStyles.dot,
              config.dotColor,
              getStatusAnimation(status)
            )}
            style={{
              boxShadow: status === "live"
                ? `0 0 10px currentColor`
                : status === "error"
                ? `0 0 8px rgba(239, 68, 68, 0.5)`
                : "none"
            }}
          >
            {/* Inner shine effect */}
            <div
              className="absolute inset-0 rounded-full opacity-60"
              style={{
                background: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 50%)`
              }}
            />
          </div>

          {/* Transition effect overlay */}
          {isTransitioning && (
            <div
              className={cn(
                "absolute inset-0 rounded-full z-30",
                statusConfig[prevStatus].dotColor,
                "opacity-0 animate-scale-in"
              )}
            />
          )}
        </div>

        {/* Status text with enhanced animations */}
        {showText && (
          <span
            className={cn(
              "truncate transition-all duration-300 font-medium",
              sizeStyles.text,
              config.textColor,
              isTransitioning && "animate-slide-up"
            )}
          >
            {statusText}
          </span>
        )}

        {/* Enhanced multi-layer shimmer effects */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          {/* Primary shimmer */}
          <div
            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-400"
            style={{
              background: `linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)`,
              animation: "shimmer-slow 3s infinite"
            }}
          />

          {/* Secondary shimmer on hover */}
          <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300">
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform skew-x-12"
              style={{
                width: "200%",
                height: "100%",
                animation: "shimmer 2s infinite",
                animationDelay: "0.5s"
              }}
            />
          </div>
        </div>

        {/* Subtle pulsing border for live status */}
        {status === "live" && (
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              border: "1px solid",
              borderColor: "currentColor",
              opacity: 0.3,
              animation: "pulse-subtle 2s infinite"
            }}
          />
        )}
      </div>
    )
  }
)
StreamStatus.displayName = "StreamStatus"

// Compact version for tight spaces
export const StreamStatusCompact = React.forwardRef<HTMLDivElement, Omit<StreamStatusProps, "size" | "showText">>(
  ({ status, className, ...props }, ref) => {
    const config = statusConfig[status]

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center w-8 h-8 rounded-full backdrop-blur-md border",
          config.bgColor,
          config.borderColor,
          "transition-all duration-200",
          "hover:scale-110 hover:shadow-lg",
          config.glowColor,
          className
        )}
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)"
        }}
        {...props}
      >
        <div className="relative">
          <div
            className={cn(
              "w-3 h-3 rounded-full",
              config.dotColor,
              status === "live" && "animate-pulse"
            )}
          />
          {status === "live" && (
            <div
              className={cn(
                "absolute inset-0 w-3 h-3 rounded-full animate-ping",
                config.dotColor
              )}
            />
          )}
        </div>
      </div>
    )
  }
)
StreamStatusCompact.displayName = "StreamStatusCompact"

// Large display version for dashboards
export const StreamStatusLarge = React.forwardRef<HTMLDivElement, Omit<StreamStatusProps, "size">>(
  ({ status, showText = true, text, className, ...props }, ref) => {
    const config = statusConfig[status]
    const statusText = text || status.charAt(0).toUpperCase() + status.slice(1)

    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center gap-3 p-6 rounded-2xl backdrop-blur-lg border",
          config.bgColor,
          config.borderColor,
          "transition-all duration-300",
          "hover:scale-[1.02] hover:shadow-2xl",
          config.glowColor,
          className
        )}
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)"
        }}
        {...props}
      >
        <div className="relative">
          <div
            className={cn(
              "w-6 h-6 rounded-full",
              config.dotColor,
              status === "live" && "animate-pulse"
            )}
          />
          {status === "live" && (
            <div
              className={cn(
                "absolute inset-0 w-6 h-6 rounded-full animate-ping",
                config.dotColor
              )}
            />
          )}
        </div>

        {showText && (
          <span className={cn("text-lg font-bold", config.textColor)}>
            {statusText}
          </span>
        )}

        {/* Decorative background pattern */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
      </div>
    )
  }
)
StreamStatusLarge.displayName = "StreamStatusLarge"