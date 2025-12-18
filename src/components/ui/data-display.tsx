import * as React from "react"
import { cn } from "@/lib/utils"
import { GlassCard } from "./glass-card"

// Metric card for displaying key performance indicators
export interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  change?: {
    value: number
    type: "increase" | "decrease" | "neutral"
    period?: string
  }
  icon?: React.ReactNode
  trend?: "up" | "down" | "stable"
  size?: "sm" | "md" | "lg"
  color?: "blue" | "emerald" | "amber" | "red" | "purple" | "slate"
  loading?: boolean
  className?: string
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({
    title,
    value,
    unit,
    change,
    icon,
    trend,
    size = "md",
    color = "blue",
    loading = false,
    className,
    ...props
  }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(value)
    const [prevValue, setPrevValue] = React.useState(value)
    const [isValueChanging, setIsValueChanging] = React.useState(false)
    const [isHovered, setIsHovered] = React.useState(false)

    const colorConfig = {
      blue: {
        bg: "bg-broadcast-blue/10",
        text: "text-broadcast-blue",
        border: "border-broadcast-blue/20",
        glow: "shadow-blue"
      },
      emerald: {
        bg: "bg-emerald-500/10",
        text: "text-emerald-500",
        border: "border-emerald-500/20",
        glow: "shadow-emerald"
      },
      amber: {
        bg: "bg-amber-500/10",
        text: "text-amber-500",
        border: "border-amber-500/20",
        glow: "shadow-amber"
      },
      red: {
        bg: "bg-red-500/10",
        text: "text-red-500",
        border: "border-red-500/20",
        glow: "shadow-red"
      },
      purple: {
        bg: "bg-purple-500/10",
        text: "text-purple-500",
        border: "border-purple-500/20",
        glow: "shadow-purple"
      },
      slate: {
        bg: "bg-slate-500/10",
        text: "text-slate-500",
        border: "border-slate-500/20",
        glow: "shadow-slate"
      }
    }

    const sizeConfig = {
      sm: {
        container: "p-4",
        valueSize: "text-2xl font-bold",
        titleSize: "text-sm font-medium",
        iconSize: "w-8 h-8"
      },
      md: {
        container: "p-6",
        valueSize: "text-3xl font-bold",
        titleSize: "text-sm font-medium",
        iconSize: "w-10 h-10"
      },
      lg: {
        container: "p-8",
        valueSize: "text-4xl font-bold",
        titleSize: "text-base font-medium",
        iconSize: "w-12 h-12"
      }
    }

    const config = colorConfig[color]
    const sizeStyles = sizeConfig[size]

    const changeColor = change?.type === "increase" ? "text-emerald-600 dark:text-emerald-400"
                      : change?.type === "decrease" ? "text-red-600 dark:text-red-400"
                      : "text-slate-600 dark:text-slate-400"

    // Animate value changes
    React.useEffect(() => {
      if (value !== prevValue && !loading) {
        setIsValueChanging(true)
        const timer = setTimeout(() => {
          setDisplayValue(value)
          setPrevValue(value)
          setIsValueChanging(false)
        }, 150)
        return () => clearTimeout(timer)
      }
    }, [value, prevValue, loading])

    return (
      <GlassCard
        ref={ref}
        variant="surface-02"
        blur="lg"
        depth="raised"
        animated={true}
        className={cn(
          "group cursor-pointer transition-all duration-300 hover:scale-[1.02]",
          sizeStyles.container,
          isHovered && config.glow,
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className={cn(
              "text-slate-600 dark:text-slate-400 mb-1 transition-all duration-200",
              sizeStyles.titleSize,
              isHovered && "text-slate-700 dark:text-slate-300"
            )}>
              {title}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className={cn(
                "text-slate-900 dark:text-slate-100 transition-all duration-300",
                sizeStyles.valueSize,
                isValueChanging && "animate-pulse",
                change?.type === "increase" && "text-emerald-600 dark:text-emerald-400",
                change?.type === "decrease" && "text-red-600 dark:text-red-400"
              )}>
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse glass-loading" />
                    <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  </div>
                ) : (
                  <span className={cn(
                    "inline-block",
                    isValueChanging && "animate-slide-up"
                  )}>
                    {displayValue}
                  </span>
                )}
              </span>
              {unit && (
                <span className="text-sm text-slate-500 dark:text-slate-400 transition-opacity duration-200">
                  {unit}
                </span>
              )}
            </div>

            {change && (
              <div className={cn(
                "flex items-center gap-1 mt-2 transition-all duration-300",
                change.type === "increase" && "animate-slide-up",
                change.type === "decrease" && "animate-fade-in"
              )}>
                <svg
                  className={cn(
                    "w-4 h-4 transition-all duration-300",
                    change.type === "increase" ? "rotate-0 text-emerald-500" :
                    change.type === "decrease" ? "rotate-180 text-red-500" : "hidden",
                    change.type && "animate-bounce"
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  style={{
                    animationDelay: "0.2s",
                    animationDuration: "0.5s"
                  }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
                <span className={cn("text-sm font-medium transition-all duration-200", changeColor)}>
                  {Math.abs(change.value)}%
                  {change.period && <span className="text-xs opacity-70 ml-1">{change.period}</span>}
                </span>
              </div>
            )}
          </div>

          {icon && (
            <div className={cn(
              "flex items-center justify-center rounded-xl border relative overflow-hidden",
              config.bg,
              config.border,
              sizeStyles.iconSize,
              "transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
            )}>
              <div className={cn(
                "transition-all duration-300",
                config.text,
                isHovered && "scale-110"
              )}>
                {icon}
              </div>
              {/* Animated background for icon */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent animate-shimmer-slow" />
              </div>
            </div>
          )}
        </div>

        {/* Enhanced animated overlays */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          {/* Primary gradient overlay */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent transition-opacity duration-300",
            isHovered ? "opacity-100" : "opacity-0"
          )} />

          {/* Animated shimmer on hover */}
          <div className={cn(
            "absolute inset-0 opacity-0 transition-opacity duration-500",
            isHovered && "opacity-100"
          )}>
            <div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"
              style={{
                width: "200%",
                height: "100%",
                animation: isHovered ? "shimmer-slow 2.5s infinite" : "none"
              }}
            />
          </div>

          {/* Value change pulse effect */}
          {isValueChanging && (
            <div
              className="absolute inset-0 rounded-2xl animate-pulse"
              style={{
                background: change?.type === "increase"
                  ? "radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 70%)"
                  : change?.type === "decrease"
                  ? "radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.1) 0%, transparent 70%)"
                  : "radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.1) 0%, transparent 70%)"
              }}
            />
          )}
        </div>
      </GlassCard>
    )
  }
)
MetricCard.displayName = "MetricCard"

// Table component with glassmorphism styling
interface GlassTableProps extends React.HTMLAttributes<HTMLTableElement> {
  columns: Array<{
    key: string
    label: string
    align?: "left" | "center" | "right"
    sortable?: boolean
    onSort?: () => void
  }>
  data: Record<string, any>[]
  size?: "sm" | "md" | "lg"
  striped?: boolean
  hover?: boolean
  loading?: boolean
}

export const GlassTable = React.forwardRef<HTMLTableElement, GlassTableProps>(
  ({
    columns,
    data,
    size = "md",
    striped = true,
    hover = true,
    loading = false,
    className,
    ...props
  }, ref) => {
    const sizeConfig = {
      sm: "text-xs",
      md: "text-sm",
      lg: "text-base"
    }

    const paddingConfig = {
      sm: "px-3 py-2",
      md: "px-4 py-3",
      lg: "px-6 py-4"
    }

    return (
      <GlassCard variant="surface-02" blur="md" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table
            ref={ref}
            className={cn(
              "w-full",
              sizeConfig[size],
              className
            )}
            {...props}
          >
            <thead className="border-b border-white/10">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      paddingConfig[size],
                      "font-medium text-left text-slate-700 dark:text-slate-300",
                      column.align === "center" && "text-center",
                      column.align === "right" && "text-right",
                      column.sortable && "cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
                    )}
                    onClick={column.sortable ? column.onSort : undefined}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && (
                        <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        </svg>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className={cn(
                    striped && index % 2 === 1 && "bg-white/5 dark:bg-black/20",
                    hover && "hover:bg-white/10 dark:hover:bg-black/30"
                  )}>
                    {columns.map((column) => (
                      <td key={column.key} className={cn(paddingConfig[size])}>
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                data.map((row, index) => (
                  <tr
                    key={index}
                    className={cn(
                      "border-b border-white/5 transition-colors duration-200",
                      striped && index % 2 === 1 && "bg-white/5 dark:bg-black/20",
                      hover && "hover:bg-white/10 dark:hover:bg-black/30"
                    )}
                  >
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={cn(
                          paddingConfig[size],
                          "text-slate-700 dark:text-slate-300",
                          column.align === "center" && "text-center",
                          column.align === "right" && "text-right"
                        )}
                      >
                        {row[column.key]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    )
  }
)
GlassTable.displayName = "GlassTable"

// Status indicator component
export interface StatusIndicatorProps {
  status: "online" | "offline" | "warning" | "error" | "loading"
  label?: string
  size?: "sm" | "md" | "lg"
  showDot?: boolean
  className?: string
}

export const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ status, label, size = "md", showDot = true, className, ...props }, ref) => {
    const [prevStatus, setPrevStatus] = React.useState(status)
    const [isTransitioning, setIsTransitioning] = React.useState(false)

    const statusConfig = {
      online: {
        dot: "bg-emerald-500",
        text: "text-emerald-700 dark:text-emerald-300",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        glow: "shadow-emerald"
      },
      offline: {
        dot: "bg-slate-500",
        text: "text-slate-700 dark:text-slate-300",
        bg: "bg-slate-500/10",
        border: "border-slate-500/20",
        glow: "shadow-slate"
      },
      warning: {
        dot: "bg-amber-500",
        text: "text-amber-700 dark:text-amber-300",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        glow: "shadow-amber"
      },
      error: {
        dot: "bg-red-500",
        text: "text-red-700 dark:text-red-300",
        bg: "bg-red-500/10",
        border: "border-red-500/20",
        glow: "shadow-red"
      },
      loading: {
        dot: "bg-broadcast-blue",
        text: "text-broadcast-blue",
        bg: "bg-broadcast-blue/10",
        border: "border-broadcast-blue/20",
        glow: "shadow-blue"
      }
    }

    const sizeConfig = {
      sm: {
        dot: "w-1.5 h-1.5",
        text: "text-xs",
        container: "px-2 py-1 gap-1.5"
      },
      md: {
        dot: "w-2 h-2",
        text: "text-sm",
        container: "px-3 py-1.5 gap-2"
      },
      lg: {
        dot: "w-2.5 h-2.5",
        text: "text-base",
        container: "px-4 py-2 gap-2.5"
      }
    }

    React.useEffect(() => {
      if (prevStatus !== status) {
        setIsTransitioning(true)
        const timer = setTimeout(() => {
          setPrevStatus(status)
          setIsTransitioning(false)
        }, 200)
        return () => clearTimeout(timer)
      }
    }, [status, prevStatus])

    const config = statusConfig[status]
    const prevConfig = statusConfig[prevStatus]
    const sizeStyles = sizeConfig[size]

    const getStatusAnimation = (statusType: string) => {
      switch (statusType) {
        case "online":
          return "animate-pulse-subtle"
        case "loading":
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
          "relative inline-flex items-center rounded-full border backdrop-blur-md overflow-hidden gpu-accelerated",
          config.bg,
          config.border,
          sizeStyles.container,
          "transition-all duration-300 ease-out hover:scale-105",
          status === "online" && config.glow,
          isTransitioning && "animate-fade-in",
          className
        )}
        style={{
          backdropFilter: "blur(8px) saturate(1.1)",
          WebkitBackdropFilter: "blur(8px) saturate(1.1)"
        }}
        {...props}
      >
        {/* Enhanced status dot with multiple layers */}
        {showDot && (
          <div className="relative flex items-center justify-center">
            {/* Outer glow ring for online status */}
            {status === "online" && (
              <>
                <div
                  className={cn(
                    "absolute rounded-full animate-ping opacity-20",
                    `w-[${parseInt(sizeStyles.dot) * 2}px] h-[${parseInt(sizeStyles.dot) * 2}px]`,
                    config.dot
                  )}
                  style={{
                    width: `${parseInt(sizeStyles.dot) * 1.5}px`,
                    height: `${parseInt(sizeStyles.dot) * 1.5}px`
                  }}
                />
                <div
                  className={cn(
                    "absolute rounded-full animate-pulse opacity-40",
                    `w-[${parseInt(sizeStyles.dot) * 1.5}px] h-[${parseInt(sizeStyles.dot) * 1.5}px]`,
                    config.dot
                  )}
                  style={{
                    width: `${parseInt(sizeStyles.dot) * 1.2}px`,
                    height: `${parseInt(sizeStyles.dot) * 1.2}px`,
                    animationDelay: "0.3s"
                  }}
                />
              </>
            )}

            {/* Main status dot */}
            <div
              className={cn(
                "rounded-full relative z-10 transition-all duration-300",
                sizeStyles.dot,
                config.dot,
                getStatusAnimation(status)
              )}
              style={{
                boxShadow: status === "online"
                  ? "0 0 8px currentColor"
                  : status === "error"
                  ? "0 0 6px rgba(239, 68, 68, 0.5)"
                  : status === "loading"
                  ? "0 0 6px rgba(37, 99, 235, 0.5)"
                  : "none"
              }}
            >
              {/* Inner shine effect */}
              <div
                className="absolute inset-0 rounded-full opacity-60"
                style={{
                  background: "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 50%)"
                }}
              />
            </div>

            {/* Transition overlay */}
            {isTransitioning && (
              <div
                className={cn(
                  "absolute inset-0 rounded-full z-20 opacity-0 animate-scale-in",
                  prevConfig.dot
                )}
              />
            )}
          </div>
        )}

        {/* Status label with animation */}
        {label && (
          <span className={cn(
            "font-medium relative z-10 transition-all duration-300",
            sizeStyles.text,
            config.text,
            isTransitioning && "animate-slide-up"
          )}>
            {label}
          </span>
        )}

        {/* Enhanced shimmer effects */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
          {/* Primary shimmer */}
          <div
            className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
            style={{
              background: "linear-gradient(135deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)"
            }}
          />

          {/* Rotating shimmer for loading status */}
          {status === "loading" && (
            <div
              className="absolute inset-0"
              style={{
                background: "conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255, 255, 255, 0.1) 60deg, transparent 120deg)",
                animation: "shimmer-slow 2s linear infinite"
              }}
            />
          )}

          {/* Status-specific pulse effect */}
          {(status === "error" || status === "warning") && (
            <div
              className="absolute inset-0 rounded-full animate-pulse"
              style={{
                background: status === "error"
                  ? "radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.1) 0%, transparent 70%)"
                  : "radial-gradient(circle at 50% 50%, rgba(245, 158, 11, 0.1) 0%, transparent 70%)",
                animationDuration: "2s"
              }}
            />
          )}
        </div>
      </div>
    )
  }
)
StatusIndicator.displayName = "StatusIndicator"

// Badge component for labels and tags
export interface GlassBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "info"
  size?: "sm" | "md" | "lg"
  shape?: "rounded" | "pill" | "square"
  icon?: React.ReactNode
  count?: number
}

export const GlassBadge = React.forwardRef<HTMLDivElement, GlassBadgeProps>(
  ({
    variant = "default",
    size = "md",
    shape = "rounded",
    icon,
    count,
    children,
    className,
    ...props
  }, ref) => {
    const variantConfig = {
      default: {
        bg: "bg-white/10 dark:bg-black/20",
        text: "text-slate-700 dark:text-slate-300",
        border: "border-white/20"
      },
      success: {
        bg: "bg-emerald-500/20",
        text: "text-emerald-700 dark:text-emerald-300",
        border: "border-emerald-500/30"
      },
      warning: {
        bg: "bg-amber-500/20",
        text: "text-amber-700 dark:text-amber-300",
        border: "border-amber-500/30"
      },
      error: {
        bg: "bg-red-500/20",
        text: "text-red-700 dark:text-red-300",
        border: "border-red-500/30"
      },
      info: {
        bg: "bg-broadcast-blue/20",
        text: "text-broadcast-blue",
        border: "border-broadcast-blue/30"
      }
    }

    const sizeConfig = {
      sm: {
        container: "px-2 py-1 text-xs",
        icon: "w-3 h-3"
      },
      md: {
        container: "px-3 py-1.5 text-sm",
        icon: "w-4 h-4"
      },
      lg: {
        container: "px-4 py-2 text-base",
        icon: "w-5 h-5"
      }
    }

    const shapeConfig = {
      rounded: "rounded-lg",
      pill: "rounded-full",
      square: "rounded-none"
    }

    const config = variantConfig[variant]
    const sizeStyles = sizeConfig[size]
    const shapeStyles = shapeConfig[shape]

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 border backdrop-blur-sm font-medium",
          config.bg,
          config.text,
          config.border,
          sizeStyles.container,
          shapeStyles,
          "transition-all duration-200 hover:scale-105",
          className
        )}
        {...props}
      >
        {icon && <div className={sizeStyles.icon}>{icon}</div>}
        {children}
        {typeof count === "number" && (
          <span className="ml-1 px-1.5 py-0.5 bg-black/10 rounded text-xs">
            {count}
          </span>
        )}
      </div>
    )
  }
)
GlassBadge.displayName = "GlassBadge"