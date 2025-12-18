import * as React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "surface-01" | "surface-02" | "surface-03" | "surface-04" | "interactive" | "subtle" | "primary" | "error"
  blur?: "sm" | "md" | "lg" | "xl"
  border?: boolean
  glow?: boolean
  depth?: "flat" | "raised" | "floating"
  animated?: boolean
  hover?: boolean
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({
    className,
    variant = "surface-02",
    blur = "md",
    border = true,
    glow = false,
    depth = "flat",
    animated = false,
    hover = true,
    ...props
  }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false)
    const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 })

    const handleMouseMove = React.useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (!hover) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 20
      setMousePosition({ x, y })
    }, [hover])

    const variantStyles = {
      "surface-01": "glass-depth-1",
      "surface-02": "glass-depth-2",
      "surface-03": "glass-depth-3",
      "surface-04": "glass-depth-3",
      "interactive": "glass-depth-2 cursor-pointer group",
      "subtle": "glass-depth-1 border-white/5 dark:border-white/10",
      "primary": "bg-blue-500/20 dark:bg-blue-500/10 border-blue-500/30 dark:border-blue-500/20",
      "error": "bg-red-500/20 dark:bg-red-500/10 border-red-500/30 dark:border-red-500/20"
    }

    const blurStyles = {
      sm: "backdrop-blur-sm",
      md: "backdrop-blur-md",
      lg: "backdrop-blur-lg",
      xl: "backdrop-blur-xl"
    }

    const blurValues = {
      sm: "blur(8px)",
      md: "blur(12px)",
      lg: "blur(20px)",
      xl: "blur(30px)"
    }

    const depthStyles = {
      flat: "",
      raised: hover ? "hover:-translate-y-1" : "",
      floating: hover ? "hover:-translate-y-2" : ""
    }

    const glowEffect = glow ? "shadow-[0_0_40px_rgba(0,102,255,0.2)] dark:shadow-[0_0_60px_rgba(0,102,255,0.3)]" : ""

    const animationClass = animated ? "animate-glass-entrance" : ""

    return (
      <div
        ref={ref}
        className={cn(
          // Base glass effect
          "relative rounded-2xl overflow-hidden gpu-accelerated",
          // Enhanced glass depth
          variantStyles[variant],
          // Backdrop blur
          blurStyles[blur],
          // Border styling
          border && "border border-white/10 dark:border-white/10 shadow-glass",
          // Glow effect
          glowEffect,
          // Depth and hover effects
          depthStyles[depth as keyof typeof depthStyles],
          hover && "transition-all duration-300 ease-out",
          // Animation on mount
          animationClass,
          className
        )}
        style={{
          backdropFilter: `${blurValues[blur as keyof typeof blurValues]} saturate(1.1)`,
          WebkitBackdropFilter: `${blurValues[blur as keyof typeof blurValues]} saturate(1.1)`,
          transform: hover && isHovered
            ? `perspective(1000px) rotateY(${mousePosition.x}deg) rotateX(${-mousePosition.y}deg) translateZ(10px)`
            : "perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)",
          transformStyle: "preserve-3d"
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => hover && setIsHovered(true)}
        onMouseLeave={() => {
          if (hover) {
            setIsHovered(false)
            setMousePosition({ x: 0, y: 0 })
          }
        }}
        {...props}
      >
        {/* Enhanced shimmer effect */}
        {hover && (
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
            style={{
              background: `radial-gradient(circle at ${50 + mousePosition.x * 2}% ${50 + mousePosition.y * 2}%, rgba(255, 255, 255, 0.1) 0%, transparent 50%)`
            }}
          />
        )}

        {/* Animated shimmer overlay */}
        <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"
            style={{
              width: "200%",
              height: "100%",
              animation: "shimmer-slow 2.5s infinite"
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {props.children}
        </div>
      </div>
    )
  }
)
GlassCard.displayName = "GlassCard"

const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6 border-b border-white/10",
      className
    )}
    {...props}
  />
))
GlassCardHeader.displayName = "GlassCardHeader"

const GlassCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "font-semibold leading-none tracking-tight text-white",
      className
    )}
    {...props}
  />
))
GlassCardTitle.displayName = "GlassCardTitle"

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-gray-300",
      className
    )}
    {...props}
  />
))
GlassCardDescription.displayName = "GlassCardDescription"

const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
GlassCardContent.displayName = "GlassCardContent"

const GlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0 border-t border-white/10",
      className
    )}
    {...props}
  />
))
GlassCardFooter.displayName = "GlassCardFooter"

export {
  GlassCard,
  GlassCardHeader,
  GlassCardFooter,
  GlassCardTitle,
  GlassCardDescription,
  GlassCardContent
}