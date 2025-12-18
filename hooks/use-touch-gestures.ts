import { useState, useEffect, useRef, useCallback } from 'react';

interface TouchGestureOptions {
  threshold?: number;
  preventDefault?: boolean;
  capture?: boolean;
}

interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface LongPressCallbacks {
  onLongPress?: () => void;
  onLongPressEnd?: () => void;
  threshold?: number;
}

interface PullToRefreshCallbacks {
  onRefresh?: () => Promise<void>;
  threshold?: number;
  maxDistance?: number;
}

// Swipe gesture hook
export const useSwipeGesture = (
  elementRef: React.RefObject<HTMLElement>,
  callbacks: SwipeCallbacks,
  options: TouchGestureOptions = {}
) => {
  const { threshold = 50, preventDefault = false } = options;
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventDefault) e.preventDefault();
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  }, [preventDefault]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefault) e.preventDefault();
  }, [preventDefault]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!startX.current || !startY.current) return;

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - startX.current;
    const deltaY = endY - startY.current;

    // Only trigger if it's a horizontal swipe (more horizontal than vertical movement)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
      if (deltaX > 0) {
        callbacks.onSwipeRight?.();
      } else {
        callbacks.onSwipeLeft?.();
      }
    }
    // Vertical swipe
    else if (Math.abs(deltaY) > threshold) {
      if (deltaY > 0) {
        callbacks.onSwipeDown?.();
      } else {
        callbacks.onSwipeUp?.();
      }
    }

    startX.current = null;
    startY.current = null;
  }, [callbacks, threshold]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault]);
};

// Long press hook
export const useLongPress = (
  callbacks: LongPressCallbacks,
  options: TouchGestureOptions = {}
) => {
  const { threshold = 500 } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressing = useState(false);

  const start = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      isLongPressing[1](true);
      callbacks.onLongPress?.();
    }, threshold);
  }, [callbacks, threshold, isLongPressing]);

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (isLongPressing[0]) {
      isLongPressing[1](false);
      callbacks.onLongPressEnd?.();
    }
  }, [callbacks, isLongPressing]);

  const mouseEvents = {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear
  };

  const touchEvents = {
    onTouchStart: start,
    onTouchEnd: clear
  };

  return {
    isLongPressing: isLongPressing[0],
    mouseEvents,
    touchEvents
  };
};

// Pull to refresh hook
export const usePullToRefresh = (
  containerRef: React.RefObject<HTMLElement>,
  callbacks: PullToRefreshCallbacks,
  options: TouchGestureOptions = {}
) => {
  const { threshold = 80, maxDistance = 150 } = options;
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const startY = useRef<number | null>(null);
  const containerScrollTop = useRef(0);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Only enable pull-to-refresh when at the top of the container
    const container = containerRef.current;
    if (!container) return;

    containerScrollTop.current = container.scrollTop;

    // Only start if we're at the top and can scroll
    if (container.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [containerRef]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startY.current === null || !isPulling) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startY.current;

    // Only allow pulling down, not up
    if (deltaY > 0 && containerScrollTop.current <= 0) {
      const distance = Math.min(deltaY * 0.5, maxDistance); // Reduce sensitivity
      setPullDistance(distance);

      // Add resistance when approaching max distance
      if (distance > threshold) {
        e.preventDefault();
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
      startY.current = null;
    }
  }, [isPulling, maxDistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(0);
      setIsPulling(false);
      startY.current = null;

      try {
        await callbacks.onRefresh?.();
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
      startY.current = null;
    }
  }, [pullDistance, threshold, isRefreshing, callbacks]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [containerRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    pullDistance,
    isPulling,
    isRefreshing,
    canRefresh: pullDistance >= threshold
  };
};

// Touch feedback hook
export const useTouchFeedback = () => {
  const [ripplePositions, setRipplePositions] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const nextId = useRef(0);

  const createRipple = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    let x: number, y: number;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    const id = nextId.current++;
    const newRipple = { x, y, id };

    setRipplePositions(prev => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipplePositions(prev => prev.filter(r => r.id !== id));
    }, 600);
  }, []);

  return {
    ripplePositions,
    createRipple
  };
};

// Touch-friendly click hook (prevents accidental clicks on scroll)
export const useTouchClick = (
  onClick: () => void,
  options: { threshold?: number; delay?: number } = {}
) => {
  const { threshold = 10, delay = 50 } = options;
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) {
      startPos.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    } else {
      startPos.current = {
        x: e.clientX,
        y: e.clientY
      };
    }
  }, []);

  const handleEnd = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!startPos.current) return;

    let endX: number, endY: number;
    if ('changedTouches' in e) {
      endX = e.changedTouches[0].clientX;
      endY = e.changedTouches[0].clientY;
    } else {
      endX = e.clientX;
      endY = e.clientY;
    }

    const distance = Math.sqrt(
      Math.pow(endX - startPos.current.x, 2) +
      Math.pow(endY - startPos.current.y, 2)
    );

    // Only trigger click if movement is below threshold
    if (distance < threshold) {
      if (delay > 0) {
        timeoutRef.current = setTimeout(onClick, delay);
      } else {
        onClick();
      }
    }

    startPos.current = null;
  }, [onClick, threshold, delay]);

  const handleCancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    startPos.current = null;
  }, []);

  const mouseEvents = {
    onMouseDown: handleStart,
    onMouseUp: handleEnd,
    onMouseLeave: handleCancel
  };

  const touchEvents = {
    onTouchStart: handleStart,
    onTouchEnd: handleEnd,
    onTouchCancel: handleCancel
  };

  return {
    mouseEvents,
    touchEvents
  };
};

// Mobile keyboard detection
export const useMobileKeyboard = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const initialViewportHeight = window.visualViewport?.height || window.innerHeight;

    const handleViewportChange = () => {
      if (window.visualViewport) {
        const height = window.visualViewport.height;
        const keyboardHeight = initialViewportHeight - height;

        setIsKeyboardVisible(keyboardHeight > 150); // Threshold for keyboard detection
        setKeyboardHeight(keyboardHeight);
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        // Small delay to allow keyboard to appear
        setTimeout(handleViewportChange, 100);
      }
    };

    const handleFocusOut = () => {
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      }
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return {
    isKeyboardVisible,
    keyboardHeight,
    // Style to apply to content when keyboard is visible
    keyboardStyle: {
      marginBottom: isKeyboardVisible ? `${keyboardHeight}px` : 0,
      transition: 'margin-bottom 0.3s ease'
    }
  };
};

// Touch-optimized scrolling hook
export const useTouchScroll = (options: { momentum?: boolean; bounce?: boolean } = {}) => {
  const { momentum = true, bounce = true } = options;
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Enable smooth scrolling with momentum on iOS
    if (momentum) {
      element.style.webkitOverflowScrolling = 'touch';
    }

    // Prevent overscroll bounce if disabled
    if (!bounce) {
      const handleTouchMove = (e: TouchEvent) => {
        const { scrollTop, scrollHeight, clientHeight } = element;

        // At top and trying to scroll up
        if (scrollTop === 0 && e.touches[0].clientY < e.touches[0].clientY) {
          e.preventDefault();
        }

        // At bottom and trying to scroll down
        if (scrollTop + clientHeight >= scrollHeight && e.touches[0].clientY > e.touches[0].clientY) {
          e.preventDefault();
        }
      };

      element.addEventListener('touchmove', handleTouchMove, { passive: false });

      return () => {
        element.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [momentum, bounce]);

  return elementRef;
};

// Touch device detection
export const useTouchDevice = () => {
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [hasTouch, setHasTouch] = useState(false);

  useEffect(() => {
    const checkTouch = () => {
      const hasTouchSupport = 'ontouchstart' in window ||
                             navigator.maxTouchPoints > 0 ||
                             (navigator as any).msMaxTouchPoints > 0;

      setHasTouch(hasTouchSupport);
      setIsTouchSupportTouchSupport && window.innerWidth < 1024);
    };

    checkTouch();
    window.addEventListener('resize', checkTouch);

    return () => window.removeEventListener('resize', checkTouch);
  }, []);

  return {
    isTouchDevice,
    hasTouch,
    // Touch-friendly classes
    touchClass: isTouchDevice ? 'touch-device' : 'no-touch',
    // Pointer type for CSS
    pointerType: isTouchDevice ? 'coarse' : 'fine'
  };
};