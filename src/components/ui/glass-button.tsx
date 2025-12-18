import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const glassButtonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl backdrop-blur-md border transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-broadcast-blue focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none font-medium",
  {
    variants: {
      variant: {
        // Primary glass button - blue accent
        primary: [
          "bg-broadcast-blue/20 border-broadcast-blue/30 text-broadcast-blue dark:text-broadcast-blue-light",
          "hover:bg-broadcast-blue/30 hover:border-broadcast-blue/50 hover:scale-105 hover:shadow-lg hover:shadow-broadcast-blue/25",
          "active:scale-100"
        ],
        // Secondary glass button - subtle white
        secondary: [
          "bg-white/10 border-white/20 text-slate-700 dark:text-slate-300",
          "hover:bg-white/15 hover:border-white/30 hover:scale-105 hover:shadow-lg hover:shadow-white/10",
          "active:scale-100"
        ],
        // Surface glass button - even more subtle
        surface: [
          "bg-white/5 border-white/10 text-slate-600 dark:text-slate-400",
          "hover:bg-white/10 hover:border-white/20 hover:scale-105 hover:shadow-lg hover:shadow-white/5",
          "active:scale-100"
        ],
        // Danger glass button - red accent
        danger: [
          "bg-red-500/20 border-red-500/30 text-red-600 dark:text-red-400",
          "hover:bg-red-500/30 hover:border-red-500/50 hover:scale-105 hover:shadow-lg hover:shadow-red-500/25",
          "active:scale-100"
        ],
        // Success glass button - green accent
        success: [
          "bg-emerald-500/20 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
          "hover:bg-emerald-500/30 hover:border-emerald-500/50 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25",
          "active:scale-100"
        ],
        // Warning glass button - amber accent
        warning: [
          "bg-amber-500/20 border-amber-500/30 text-amber-600 dark:text-amber-400",
          "hover:bg-amber-500/30 hover:border-amber-500/50 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/25",
          "active:scale-100"
        ],
        // Ghost glass button - transparent
        ghost: [
          "bg-transparent border-transparent text-slate-700 dark:text-slate-300",
          "hover:bg-white/5 hover:border-white/10 hover:scale-105",
          "active:scale-100"
        ]
      },
      size: {
        sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
        md: "h-10 px-4 py-2 text-sm gap-2",
        lg: "h-12 px-6 py-3 text-base gap-2.5 rounded-xl",
        xl: "h-14 px-8 py-4 text-lg gap-3 rounded-xl",
        icon: "h-10 w-10 rounded-lg"
      },
      glass: {
        light: "bg-white/20 border-white/30 dark:bg-black/20 dark:border-white/10",
        medium: "bg-white/10 border-white/20 dark:bg-black/30 dark:border-white/5",
        heavy: "bg-white/5 border-white/10 dark:bg-black/40 dark:border-white/5"
      }
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
      glass: "medium"
    }
  }
)

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {
  asChild?: boolean
  loading?: boolean
}

const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, glass, asChild = false, loading, children, disabled, ...props }, ref) => {
    const [ripples, setRipples] = React.useState<Array<{ id: number, x: number, y: number, size: number }>>([])
    const [isPressed, setIsPressed] = React.useState(false)
    const buttonRef = React.useRef<HTMLButtonElement | null>(null)
    const rippleIdRef = React.useRef(0)

    const createRipple = React.useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || loading) return

      const button = buttonRef.current
      if (!button) return

      const rect = button.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const x = event.clientX - rect.left - size / 2
      const y = event.clientY - rect.top - size / 2

      const newRipple = {
        id: rippleIdRef.current++,
        x,
        y,
        size
      }

      setRipples(prev => [...prev, newRipple])

      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
      }, 600)
    }, [disabled, loading])

    const handleMouseDown = React.useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      setIsPressed(true)
      createRipple(e)
    }, [createRipple])

    const handleMouseUp = React.useCallback(() => {
      setIsPressed(false)
    }, [])

    const Comp = asChild ? Slot : "button"

    return (
      <Comp
        className={cn(
          glassButtonVariants({ variant, size, glass, className }),
          "relative overflow-hidden gpu-accelerated",
          loading && "glass-loading"
        )}
        ref={(node) => {
          buttonRef.current = node
          if (typeof ref === 'function') ref(node)
          else if (ref) ref.current = node
        }}
        disabled={disabled || loading}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        {...props}
        style={{
          backdropFilter: "blur(12px) saturate(1.1)",
          WebkitBackdropFilter: "blur(12px) saturate(1.1)",
          transform: isPressed ? "scale(0.95)" : "scale(1)",
          transition: "transform 0.1s cubic-bezier(0.4, 0, 0.2, 1)"
        }}
      >
        {/* Multiple shimmer layers for depth */}
        <div className="absolute inset-0 -top-full bg-gradient-to-b from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-all duration-500 hover:top-full" />

        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -skew-x-12"
            style={{
              width: "200%",
              height: "100%",
              animation: "shimmer-slow 3s infinite"
            }}
          />
        </div>

        {/* Ripple effects */}
        {ripples.map(ripple => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
              transform: 'translate(-50%, -50%)'
            }}
          />
        ))}

        {/* Enhanced loading spinner with glow */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              <svg
                className="animate-spin h-4 w-4 text-current"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                style={{
                  filter: 'drop-shadow(0 0 3px currentColor)'
                }}
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {/* Pulse ring for loading state */}
              <div
                className="absolute inset-0 rounded-full border-2 border-current opacity-30 animate-ping"
                style={{ width: '24px', height: '24px', top: '-4px', left: '-4px' }}
              />
            </div>
          </div>
        )}

        {/* Button content with smooth transition */}
        <span
          className={cn(
            "flex items-center gap-2 relative z-10 transition-all duration-200",
            loading && "opacity-0 scale-95"
          )}
        >
          {children}
        </span>

        {/* Success/State feedback overlay */}
        {!loading && !disabled && (
          <div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent" />
          </div>
        )}
      </Comp>
    )
  }
)
GlassButton.displayName = "GlassButton"

// Icon button variant
export const GlassIconButton = React.forwardRef<
  HTMLButtonElement,
  Omit<GlassButtonProps, "children"> & {
    icon: React.ReactNode
    tooltip?: string
  }
>(({ className, icon, tooltip, size, ...props }, ref) => {
  const { variant = "surface", glass = "medium" } = props

  return (
    <div className="relative group">
      <GlassButton
        ref={ref}
        size="icon"
        variant={variant}
        glass={glass}
        className={className}
        {...props}
      >
        {icon}
      </GlassButton>

      {/* Tooltip */}
      {tooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-slate-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-4 border-transparent border-t-slate-900" />
          </div>
        </div>
      )}
    </div>
  )
})
GlassIconButton.displayName = "GlassIconButton"

// Floating action button
export const GlassFab = React.forwardRef<
  HTMLButtonElement,
  Omit<GlassButtonProps, "size" | "variant"> & {
    position?: "bottom-right" | "bottom-left" | "top-right" | "top-left"
    fixed?: boolean
  }
>(({ className, position = "bottom-right", fixed = true, children, ...props }, ref) => {
  const positionClasses = {
    "bottom-right": "bottom-6 right-6",
    "bottom-left": "bottom-6 left-6",
    "top-right": "top-6 right-6",
    "top-left": "top-6 left-6"
  }

  return (
    <GlassButton
      ref={ref}
      className={cn(
        glassButtonVariants({
          variant: "primary",
          size: "lg",
          glass: "medium",
          className: cn(
            "rounded-full shadow-xl hover:shadow-2xl hover:scale-110",
            fixed && "fixed z-50",
            positionClasses[position],
            className
          )
        }),
        "h-14 w-14 p-0"
      )}
      {...props}
    >
      {children}
    </GlassButton>
  )
})
GlassFab.displayName = "GlassFab"

export { GlassButton, glassButtonVariants }