import * as React from "react"
import { cn } from "@/lib/utils"
import { GlassButton } from "./glass-button"
import { GlassIconButton } from "./glass-button"

interface GlassNavigationProps extends React.HTMLAttributes<HTMLElement> {
  variant?: "navbar" | "sidebar" | "bottom-nav" | "breadcrumbs"
  position?: "fixed" | "sticky" | "relative"
  align?: "start" | "center" | "end" | "between"
  glass?: "light" | "medium" | "heavy"
}

interface NavItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  icon?: React.ReactNode
  active?: boolean
  disabled?: boolean
  badge?: string | number
  onClick?: () => void
}

export const GlassNavigation = React.forwardRef<HTMLElement, GlassNavigationProps>(
  ({ className, variant = "navbar", position = "relative", align = "start", glass = "medium", children, ...props }, ref) => {
    const variantStyles = {
      navbar: "h-16 px-6 border-b border-white/10",
      sidebar: "w-64 h-full p-4 border-r border-white/10",
      "bottom-nav": "h-20 px-6 border-t border-white/10",
      breadcrumbs: "h-12 px-6 border-b border-white/10"
    }

    const positionStyles = {
      fixed: "fixed z-50",
      sticky: "sticky top-0 z-40",
      relative: "relative"
    }

    const alignStyles = {
      start: "justify-start",
      center: "justify-center",
      end: "justify-end",
      between: "justify-between"
    }

    const glassStyles = {
      light: "bg-white/20 dark:bg-black/10",
      medium: "bg-white/10 dark:bg-black/20",
      heavy: "bg-white/5 dark:bg-black/30"
    }

    const containerStyles = {
      navbar: "flex items-center gap-4",
      sidebar: "flex flex-col gap-2",
      "bottom-nav": "flex items-center gap-4",
      breadcrumbs: "flex items-center gap-2"
    }

    return (
      <nav
        ref={ref}
        className={cn(
          // Base
          "backdrop-blur-md border",
          // Variant specific
          variantStyles[variant],
          // Position
          positionStyles[position],
          // Alignment
          alignStyles[align],
          // Glass effect
          glassStyles[glass],
          // Transitions
          "transition-all duration-300 ease-out",
          className
        )}
        style={{
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)"
        }}
        {...props}
      >
        <div className={cn("w-full", containerStyles[variant])}>
          {children}
        </div>
      </nav>
    )
  }
)
GlassNavigation.displayName = "GlassNavigation"

// Navigation item component
export const GlassNavItem = React.forwardRef<HTMLButtonElement, NavItemProps & {
  variant?: "default" | "icon-only" | "compact"
}>(({ label, icon, active, disabled, badge, onClick, variant = "default", className, ...props }, ref) => {
  const isActive = active || false
  const isDisabled = disabled || false

  const baseClasses = "relative group transition-all duration-200"

  if (variant === "icon-only") {
    return (
      <GlassIconButton
        ref={ref}
        icon={icon}
        tooltip={label}
        variant={isActive ? "primary" : "surface"}
        className={cn(
          "h-12 w-12",
          isActive && "ring-2 ring-broadcast-blue/50",
          className
        )}
        onClick={onClick}
        disabled={isDisabled}
        {...props}
      />
    )
  }

  if (variant === "compact") {
    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          "px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2",
          "bg-white/5 border border-white/10 hover:bg-white/10",
          isActive && "bg-broadcast-blue/20 border-broadcast-blue/30 text-broadcast-blue",
          isDisabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={onClick}
        disabled={isDisabled}
        {...props}
      >
        {icon}
        <span>{label}</span>
        {badge && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center">
            {badge}
          </span>
        )}
      </button>
    )
  }

  return (
    <GlassButton
      ref={ref}
      variant={isActive ? "primary" : "ghost"}
      size="md"
      className={cn(
        "justify-start h-12 px-4 rounded-xl",
        isActive && "shadow-lg shadow-broadcast-blue/25",
        className
      )}
      onClick={onClick}
      disabled={isDisabled}
      {...props}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn(
            "flex items-center justify-center",
            isActive && "text-broadcast-blue-light"
          )}>
            {icon}
          </div>
        )}
        <span>{label}</span>
        {badge && (
          <div className="ml-auto h-5 px-2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-center justify-center border border-emerald-500/30">
            {badge}
          </div>
        )}
      </div>

      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-broadcast-blue rounded-r-full" />
      )}
    </GlassButton>
  )
})
GlassNavItem.displayName = "GlassNavItem"

// Breadcrumb navigation
export const GlassBreadcrumb = React.forwardRef<HTMLDivElement, {
  items: Array<{ label: string; href?: string; icon?: React.ReactNode; active?: boolean }>
  separator?: React.ReactNode
} & React.HTMLAttributes<HTMLDivElement>>(({ items, separator, className, ...props }, ref) => {
  const defaultSeparator = (
    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )

  return (
    <div
      ref={ref}
      className={cn("flex items-center gap-2", className)}
      {...props}
    >
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <button
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200",
              item.active
                ? "bg-broadcast-blue/20 text-broadcast-blue border border-broadcast-blue/30"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/5"
            )}
            onClick={() => {
              // Handle navigation
            }}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
          {index < items.length - 1 && (
            <div className="text-slate-400">
              {separator || defaultSeparator}
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
})
GlassBreadcrumb.displayName = "GlassBreadcrumb"

// Tab navigation
export const GlassTabs = React.forwardRef<HTMLDivElement, {
  tabs: Array<{ id: string; label: string; icon?: React.ReactNode; badge?: string | number }>
  activeTab: string
  onTabChange: (tabId: string) => void
  variant?: "default" | "pills" | "underline"
} & React.HTMLAttributes<HTMLDivElement>>(({ tabs, activeTab, onTabChange, variant = "default", className, ...props }, ref) => {
  const variantStyles = {
    default: "flex gap-1 p-1 bg-white/5 rounded-xl",
    pills: "flex gap-2",
    underline: "flex gap-6 border-b border-white/10"
  }

  const tabStyles = {
    default: (isActive: boolean) => cn(
      "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
      isActive
        ? "bg-broadcast-blue/20 text-broadcast-blue shadow-sm"
        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/5"
    ),
    pills: (isActive: boolean) => cn(
      "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
      isActive
        ? "bg-broadcast-blue/20 text-broadcast-blue border border-broadcast-blue/30"
        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/5"
    ),
    underline: (isActive: boolean) => cn(
      "flex items-center gap-2 pb-3 text-sm font-medium transition-all duration-200 border-b-2",
      isActive
        ? "text-broadcast-blue border-broadcast-blue"
        : "text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-100"
    )
  }

  return (
    <div
      ref={ref}
      className={cn("backdrop-blur-md", variantStyles[variant], className)}
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)"
      }}
      {...props}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            className={tabStyles[variant](isActive)}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <span className={cn(
                "h-5 px-2 rounded-full text-xs font-medium flex items-center justify-center",
                isActive
                  ? "bg-broadcast-blue/30 text-broadcast-blue-light"
                  : "bg-slate-500/20 text-slate-600 dark:text-slate-400"
              )}>
                {tab.badge}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
})
GlassTabs.displayName = "GlassTabs"