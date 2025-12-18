import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 btn-enhanced",
  {
    variants: {
      variant: {
        // Primary solid button - professional blue
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:shadow-md hover:-translate-y-px active:translate-y-0 active:shadow-sm border border-primary",
        // Destructive button - error state
        destructive:
          "bg-error text-error-foreground shadow-sm hover:bg-error/90 hover:shadow-md hover:-translate-y-px active:translate-y-0 active:shadow-sm border border-error",
        // Outline button - secondary alternative
        outline:
          "border border-border bg-background shadow-sm hover:bg-secondary hover:text-secondary-foreground hover:border-border-medium",
        // Secondary button - surface background
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:shadow-md hover:-translate-y-px active:translate-y-0 active:shadow-sm border border-border-light",
        // Ghost button - transparent background
        ghost: "hover:bg-secondary hover:text-secondary-foreground hover:-translate-y-px active:translate-y-0",
        // Link button - text only
        link: "text-primary underline-offset-4 hover:underline hover:bg-transparent hover:shadow-none hover:translate-y-0",
        // Surface button - subtle surface
        surface:
          "bg-surface-tertiary text-foreground hover:bg-surface-secondary border border-border-light hover:border-border-medium hover:-translate-y-px active:translate-y-0",
        // Success button
        success:
          "bg-success text-success-foreground shadow-sm hover:bg-success/90 hover:shadow-md hover:-translate-y-px active:translate-y-0 active:shadow-sm border border-success",
        // Warning button
        warning:
          "bg-warning text-warning-foreground shadow-sm hover:bg-warning/90 hover:shadow-md hover:-translate-y-px active:translate-y-0 active:shadow-sm border border-warning",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }