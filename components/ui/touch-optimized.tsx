import React, { useRef, forwardRef } from 'react';
import { useTouchClick, useTouchFeedback, useLongPress } from '../../hooks/use-touch-gestures';
import { cn } from '@/lib/utils';

// Touch-optimized button with ripple effect
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  ripple?: boolean;
  longPressAction?: () => void;
  children: React.ReactNode;
}

export const TouchButton = forwardRef<HTMLButtonElement, TouchButtonProps>(
  ({ className, variant = 'primary', size = 'md', ripple = true, longPressAction, onClick, children, ...props }, ref) => {
    const { mouseEvents, touchEvents } = useTouchClick(onClick || (() => {}));
    const { ripplePositions, createRipple } = useTouchFeedback();
    const { isLongPressing, mouseEvents: longPressMouse, touchEvents: longPressTouch } = useLongPress({
      onLongPress: longPressAction,
      threshold: 500
    });

    const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
      if (ripple) {
        createRipple(e);
      }
      mouseEvents.onMouseDown?.(e as React.MouseEvent);
      touchEvents.onTouchStart?.(e as React.TouchEvent);
    };

    const baseClasses = 'relative overflow-hidden touch-target transition-all duration-200 font-medium';
    const sizeClasses = {
      sm: 'min-h-[44px] px-3 py-2 text-sm',
      md: 'min-h-[44px] px-4 py-3 text-base',
      lg: 'min-h-[52px] px-6 py-4 text-lg'
    };
    const variantClasses = {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95',
      ghost: 'bg-transparent hover:bg-surface-02 active:bg-surface-03',
      danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95'
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          sizeClasses[size],
          variantClasses[variant],
          isLongPressing && 'opacity-70',
          className
        )}
        onClick={handleClick}
        onMouseDown={longPressAction ? longPressMouse.onMouseDown : mouseEvents.onMouseDown}
        onMouseUp={longPressAction ? longPressMouse.onMouseUp : mouseEvents.onMouseUp}
        onTouchStart={longPressAction ? longPressTouch.onTouchStart : touchEvents.onTouchStart}
        onTouchEnd={longPressAction ? longPressTouch.onTouchEnd : touchEvents.onTouchEnd}
        {...props}
      >
        {children}
        {ripple && ripplePositions.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute bg-white/30 rounded-full animate-ripple"
            style={{
              left: ripple.x - 20,
              top: ripple.y - 20,
              width: 40,
              height: 40,
            }}
          />
        ))}
      </button>
    );
  }
);

TouchButton.displayName = 'TouchButton';

// Touch-optimized input with better mobile UX
interface TouchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const TouchInput = forwardRef<HTMLInputElement, TouchInputProps>(
  ({ className, label, error, helper, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full min-h-[44px] px-4 py-3 bg-background border border-input rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-destructive focus:ring-destructive',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-destructive">{error}</p>
        )}
        {helper && !error && (
          <p className="mt-1 text-sm text-muted-foreground">{helper}</p>
        )}
      </div>
    );
  }
);

TouchInput.displayName = 'TouchInput';

// Touch-optimized card with swipe actions
interface TouchCardProps {
  children: React.ReactNode;
  leftAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
    onPress: () => void;
  };
  rightAction?: {
    icon: React.ReactNode;
    label: string;
    color: string;
    onPress: () => void;
  };
  onLongPress?: () => void;
  className?: string;
}

export const TouchCard: React.FC<TouchCardProps> = ({
  children,
  leftAction,
  rightAction,
  onLongPress,
  className
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const { mouseEvents, touchEvents } = useLongPress({
    onLongPress,
    threshold: 500
  });

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsSwiping(true);
    touchEvents.onTouchStart?.(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping || !cardRef.current) return;

    const touch = e.touches[0];
    const rect = cardRef.current.getBoundingClientRect();
    const startX = rect.left;
    const currentX = touch.clientX;
    const deltaX = currentX - startX;

    // Limit swipe distance
    const maxSwipe = 100;
    const limitedDeltaX = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
    setTranslateX(limitedDeltaX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!cardRef.current) return;

    setIsSwiping(false);

    // Check if we should trigger an action
    if (Math.abs(translateX) > 50) {
      if (translateX > 0 && leftAction) {
        leftAction.onPress();
      } else if (translateX < 0 && rightAction) {
        rightAction.onPress();
      }
    }

    // Reset position
    setTranslateX(0);
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Left action background */}
      {leftAction && (
        <div
          className={cn(
            'absolute inset-y-0 left-0 w-20 flex items-center justify-center z-0',
            leftAction.color
          )}
        >
          <div className="text-white text-center">
            <div className="mb-1">{leftAction.icon}</div>
            <div className="text-xs">{leftAction.label}</div>
          </div>
        </div>
      )}

      {/* Right action background */}
      {rightAction && (
        <div
          className={cn(
            'absolute inset-y-0 right-0 w-20 flex items-center justify-center z-0',
            rightAction.color
          )}
        >
          <div className="text-white text-center">
            <div className="mb-1">{rightAction.icon}</div>
            <div className="text-xs">{rightAction.label}</div>
          </div>
        </div>
      )}

      {/* Card content */}
      <div
        ref={cardRef}
        className="relative z-10 bg-background border border-border rounded-lg transition-transform duration-200"
        style={{
          transform: `translateX(${translateX}px)`
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...mouseEvents}
      >
        {children}
      </div>
    </div>
  );
};

// Pull-to-refresh indicator
interface PullToRefreshProps {
  isPulling: boolean;
  pullDistance: number;
  canRefresh: boolean;
  isRefreshing: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  isPulling,
  pullDistance,
  canRefresh,
  isRefreshing
}) => {
  const opacity = Math.min(pullDistance / 80, 1);
  const scale = 0.5 + (opacity * 0.5);

  return (
    <div
      className="flex justify-center items-center py-4 pointer-events-none"
      style={{
        height: `${pullDistance}px`,
        opacity
      }}
    >
      {isRefreshing ? (
        <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full" />
      ) : canRefresh ? (
        <div className="flex items-center gap-2 text-primary">
          <div className="w-6 h-6" style={{ transform: `scale(${scale})` }}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </div>
          <span className="text-sm font-medium">Release to refresh</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-6 h-6" style={{ transform: `scale(${scale})` }}>
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
            </svg>
          </div>
          <span className="text-sm">Pull down to refresh</span>
        </div>
      )}
    </div>
  );
};

// Touch-optimized modal
interface TouchModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'full' | 'sheet' | 'centered';
}

export const TouchModal: React.FC<TouchModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'full'
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    full: 'fixed inset-0 rounded-none max-w-none',
    sheet: 'fixed bottom-0 left-0 right-0 rounded-t-2xl max-h-[80vh]',
    centered: 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-2xl max-w-lg w-full mx-4'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={cn(
          'glass-surface animate-slide-up',
          sizeClasses[size]
        )}
      >
        {/* Drag indicator for sheet modals */}
        {size === 'sheet' && (
          <div className="flex justify-center py-3">
            <div className="w-12 h-1 bg-muted-foreground/30 rounded-full" />
          </div>
        )}

        {title && (
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
        )}

        <div className="max-h-[70vh] overflow-y-auto -webkit-overflow-scrolling: touch">
          {children}
        </div>
      </div>
    </div>
  );
};

// Touch-optimized switch/toggle
interface TouchSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const TouchSwitch: React.FC<TouchSwitchProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md'
}) => {
  const { mouseEvents, touchEvents } = useTouchClick(() => onChange(!checked));

  const sizeClasses = {
    sm: 'w-11 h-6',
    md: 'w-14 h-7',
    lg: 'w-16 h-8'
  };

  const thumbSizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7'
  };

  return (
    <button
      type="button"
      className={cn(
        'relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
        checked ? 'bg-primary' : 'bg-muted',
        disabled && 'opacity-50 cursor-not-allowed',
        sizeClasses[size]
      )}
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      {...mouseEvents}
      {...touchEvents}
    >
      <span className="sr-only">{label || 'Toggle switch'}</span>
      <span
        className={cn(
          'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition-transform duration-200',
          thumbSizeClasses[size],
          checked ? 'translate-x-0' : 'translate-x-0'
        )}
        style={{
          transform: checked
            ? size === 'sm' ? 'translateX(20px)'
              : size === 'md' ? 'translateX(28px)'
              : 'translateX(32px)'
            : 'translateX(0)'
        }}
      />
    </button>
  );
};

// Touch-optimized slider
interface TouchSliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  label?: string;
  disabled?: boolean;
}

export const TouchSlider: React.FC<TouchSliderProps> = ({
  value,
  onChange,
  min,
  max,
  step = 1,
  label,
  disabled = false
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const updateValue = (clientX: number) => {
    if (!sliderRef.current || disabled) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newValue = min + (max - min) * percent;
    const steppedValue = Math.round(newValue / step) * step;
    onChange(Math.max(min, Math.min(max, steppedValue)));
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    updateValue(clientX);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    updateValue(clientX);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      const handleGlobalMove = (e: MouseEvent | TouchEvent) => {
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
        updateValue(clientX);
      };

      const handleGlobalEnd = () => {
        setIsDragging(false);
      };

      document.addEventListener('mousemove', handleGlobalMove);
      document.addEventListener('mouseup', handleGlobalEnd);
      document.addEventListener('touchmove', handleGlobalMove);
      document.addEventListener('touchend', handleGlobalEnd);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMove);
        document.removeEventListener('mouseup', handleGlobalEnd);
        document.removeEventListener('touchmove', handleGlobalMove);
        document.removeEventListener('touchend', handleGlobalEnd);
      };
    }
  }, [isDragging]);

  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
        </label>
      )}
      <div
        ref={sliderRef}
        className={cn(
          'relative h-12 w-full touch-none select-none',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        {/* Track */}
        <div className="absolute top-1/2 transform -translate-y-1/2 w-full h-2 bg-muted rounded-full">
          {/* Active track */}
          <div
            className="absolute top-0 left-0 h-full bg-primary rounded-full"
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Thumb */}
        <div
          className={cn(
            'absolute top-1/2 transform -translate-y-1/2 w-6 h-6 bg-white border-2 border-primary rounded-full shadow-lg transition-transform',
            isDragging && 'scale-125'
          )}
          style={{ left: `calc(${percent}% - 12px)` }}
        />
      </div>

      {/* Value display */}
      <div className="mt-2 text-center">
        <span className="text-sm font-mono">{value}</span>
      </div>
    </div>
  );
};