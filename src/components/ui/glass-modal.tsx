// Glass modal component with glassmorphism effect

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface GlassModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  size?: "sm" | "md" | "lg" | "xl" | "full"
  className?: string
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
}

const GlassModal = React.forwardRef<HTMLDivElement, GlassModalProps>(
  ({
    isOpen,
    onClose,
    children,
    size = "md",
    className = "",
    showCloseButton = true,
    closeOnOverlayClick = true,
    ...props
  }, ref) => {
    const modalRef = React.useRef<HTMLDivElement>(null)

    // Handle escape key
    React.useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onClose()
        }
      }

      if (isOpen) {
        document.addEventListener("keydown", handleEscape)
        // Prevent body scroll
        document.body.style.overflow = "hidden"
      }

      return () => {
        document.removeEventListener("keydown", handleEscape)
        document.body.style.overflow = "unset"
      }
    }, [isOpen, onClose])

    // Handle click outside
    const handleOverlayClick = (event: React.MouseEvent) => {
      if (closeOnOverlayClick && event.target === event.currentTarget) {
        onClose()
      }
    }

    if (!isOpen) return null

    const sizeStyles = {
      sm: "max-w-md",
      md: "max-w-lg",
      lg: "max-w-2xl",
      xl: "max-w-4xl",
      full: "max-w-7xl w-full mx-4"
    }

    return (
      <div
        ref={ref}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={handleOverlayClick}
      >
        {/* Backdrop with glassmorphism effect */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Modal */}
        <div
          ref={modalRef}
          className={cn(
            // Base styles
            "relative w-full rounded-2xl shadow-2xl",
            // Glassmorphism effect
            "bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10",
            // Size
            sizeStyles[size],
            // Animations
            "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-200",
            // Custom styles
            className
          )}
          style={{
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)"
          }}
          {...props}
        >
          {/* Close button */}
          {showCloseButton && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg glass-button surface hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-200"
            >
              <X size={18} className="text-slate-600 dark:text-slate-300" />
            </button>
          )}

          {/* Modal content */}
          <div className="relative z-0">
            {children}
          </div>
        </div>
      </div>
    )
  }
)
GlassModal.displayName = "GlassModal"

// Modal header component
const GlassModalHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-between p-6 pb-4 border-b border-white/10 dark:border-white/5",
      className
    )}
    {...props}
  />
))
GlassModalHeader.displayName = "GlassModalHeader"

// Modal title component
const GlassModalTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn(
      "text-xl font-semibold text-slate-900 dark:text-slate-100",
      className
    )}
    {...props}
  />
))
GlassModalTitle.displayName = "GlassModalTitle"

// Modal description component
const GlassModalDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm text-slate-600 dark:text-slate-400 mt-1",
      className
    )}
    {...props}
  />
))
GlassModalDescription.displayName = "GlassModalDescription"

// Modal body component
const GlassModalBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "p-6 pt-4",
      className
    )}
    {...props}
  />
))
GlassModalBody.displayName = "GlassModalBody"

// Modal footer component
const GlassModalFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center justify-end gap-3 p-6 pt-4 border-t border-white/10 dark:border-white/5",
      className
    )}
    {...props}
  />
))
GlassModalFooter.displayName = "GlassModalFooter"

export {
  GlassModal,
  GlassModalHeader,
  GlassModalTitle,
  GlassModalDescription,
  GlassModalBody,
  GlassModalFooter
}