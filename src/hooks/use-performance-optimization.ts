import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Detect device capabilities
interface DeviceCapabilities {
  isLowEnd: boolean;
  isHighEnd: boolean;
  cores: number;
  memory: number;
  gpuTier: 'low' | 'medium' | 'high';
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | 'wifi' | 'unknown';
  saveData: boolean;
}

export const useDeviceCapabilities = (): DeviceCapabilities => {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>({
    isLowEnd: false,
    isHighEnd: true,
    cores: 4,
    memory: 8,
    gpuTier: 'high',
    connectionType: 'unknown',
    saveData: false
  });

  useEffect(() => {
    // Detect CPU cores
    const cores = navigator.hardwareConcurrency || 4;

    // Estimate memory (not directly available in most browsers)
    const estimateMemory = () => {
      const deviceMemory = (navigator as any).deviceMemory;
      if (deviceMemory) return deviceMemory;

      // Estimate based on cores and user agent
      if (cores <= 2) return 2;
      if (cores <= 4) return 4;
      if (cores <= 8) return 8;
      return 16;
    };

    // Detect GPU tier (simplified)
    const detectGPUTier = (): 'low' | 'medium' | 'high' => {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (!gl) return 'low';

      const webglGL = gl as WebGLRenderingContext;
      const renderer = webglGL.getParameter(webglGL.RENDERER);
      const vendor = webglGL.getParameter(webglGL.VENDOR);

      // Check for known low-end GPUs
      const lowEndGPUs = [
        'mali-400', 'adreno 305', 'adreno 306', 'adreno 320',
        'powervr sgx', 'tegra 3', 'tegra 4'
      ];

      const lowGPURenderer = lowEndGPUs.some(gpu =>
        renderer.toLowerCase().includes(gpu)
      );

      if (lowGPURenderer) return 'low';

      // Check for known high-end GPUs
      const highEndGPUs = [
        'nvidia', 'radeon', 'adreno 6', 'mali-g', 'apple a'
      ];

      const highGPURenderer = highEndGPUs.some(gpu =>
        renderer.toLowerCase().includes(gpu) || vendor.toLowerCase().includes(gpu)
      );

      return highGPURenderer ? 'high' : 'medium';
    };

    // Detect connection type
    const detectConnection = (): DeviceCapabilities['connectionType'] => {
      const connection = (navigator as any).connection ||
                        (navigator as any).mozConnection ||
                        (navigator as any).webkitConnection;

      if (!connection) return 'unknown';

      if (connection.saveData) return 'slow-2g';

      switch (connection.effectiveType) {
        case 'slow-2g': return 'slow-2g';
        case '2g': return '2g';
        case '3g': return '3g';
        case '4g': return '4g';
        default: return 'unknown';
      }
    };

    const memory = estimateMemory();
    const isLowEnd = cores <= 2 || memory <= 2;
    const isHighEnd = cores >= 6 && memory >= 8;

    setCapabilities({
      isLowEnd,
      isHighEnd,
      cores,
      memory,
      gpuTier: detectGPUTier(),
      connectionType: detectConnection(),
      saveData: (navigator as any).connection?.saveData || false
    });
  }, []);

  return capabilities;
};

// Lazy loading hook with intersection observer
export const useLazyLoad = (threshold = 0.1, rootMargin = '50px') => {
  const elementRef = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasLoaded) {
          setIsIntersecting(true);
          setHasLoaded(true);
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, hasLoaded]);

  return { elementRef, isIntersecting, hasLoaded };
};

// Virtual scrolling hook for large lists
export const useVirtualScroll = <T>(
  items: T[],
  itemHeight: number,
  containerHeight: number,
  overscan = 5
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  );

  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(items.length - 1, visibleEnd + overscan);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index
    }));
  }, [items, startIndex, endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
    scrollElementRef,
    startIndex,
    endIndex
  };
};

// Debounce hook for performance optimization
export const useDebounce = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Throttle hook for performance optimization
export const useThrottle = <T extends (...args: any[]) => void>(
  callback: T,
  delay: number
): T => {
  const lastRunRef = useRef(Date.now());

  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      if (Date.now() - lastRunRef.current >= delay) {
        callback(...args);
        lastRunRef.current = Date.now();
      }
    },
    [callback, delay]
  ) as T;

  return throttledCallback;
};

// Image loading optimization
export const useOptimizedImage = (src: string, options?: {
  lazy?: boolean;
  lowQuality?: boolean;
  format?: 'webp' | 'avif' | 'auto';
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const { elementRef, isIntersecting } = useLazyLoad();

  useEffect(() => {
    if (!src) return;

    const img = new Image();

    img.onload = () => {
      setLoaded(true);
      setError(false);
    };

    img.onerror = () => {
      setError(true);
      setLoaded(false);
    };

    // Determine if we should use a low-quality placeholder
    if (options?.lowQuality && !isIntersecting) {
      // Create a low-quality placeholder
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 32;
        canvas.height = 32;
        ctx.fillStyle = '#e5e7eb';
        ctx.fillRect(0, 0, 32, 32);
        setCurrentSrc(canvas.toDataURL());
      }
    } else if (options?.lazy && !isIntersecting) {
      // Don't load image until it's in viewport
      return;
    } else {
      // Load the actual image
      const optimizedSrc = optimizeImageSrc(src, options?.format);
      img.src = optimizedSrc;
      setCurrentSrc(optimizedSrc);
    }
  }, [src, options, isIntersecting]);

  return {
    elementRef,
    src: currentSrc,
    loaded,
    error,
    isIntersecting
  };
};

// Optimize image URL based on browser support and options
const optimizeImageSrc = (src: string, format?: 'webp' | 'avif' | 'auto'): string => {
  if (!format || format === 'auto') {
    // Check browser support for modern formats
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Simple check for WebP support
    if (ctx) {
      canvas.width = 1;
      canvas.height = 1;
      const webpSupported = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
      if (webpSupported && src.match(/\.(jpg|jpeg|png)$/i)) {
        return src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      }
    }
  } else if (format && src.match(/\.(jpg|jpeg|png)$/i)) {
    return src.replace(/\.(jpg|jpeg|png)$/i, `.${format}`);
  }

  return src;
};

// Animation performance hook
export const useAnimationPerformance = () => {
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const rafId = useRef<number>();

  useEffect(() => {
    const measureFPS = () => {
      frameCount.current++;
      const currentTime = performance.now();

      if (currentTime >= lastTime.current + 1000) {
        setFps(Math.round((frameCount.current * 1000) / (currentTime - lastTime.current)));
        frameCount.current = 0;
        lastTime.current = currentTime;
      }

      rafId.current = requestAnimationFrame(measureFPS);
    };

    rafId.current = requestAnimationFrame(measureFPS);

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  const shouldUseReducedMotion = useMemo(() => {
    // Check user preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Check device performance
    const isLowPerformance = fps < 30;

    return prefersReduced || isLowPerformance;
  }, [fps]);

  const animationDuration = useMemo(() => {
    if (shouldUseReducedMotion) return 0;
    if (fps < 45) return 300; // Slower animations on lower FPS
    return 200; // Default duration
  }, [fps, shouldUseReducedMotion]);

  return {
    fps,
    shouldUseReducedMotion,
    animationDuration
  };
};

// Memory usage monitoring
export const useMemoryMonitoring = () => {
  const [memoryInfo, setMemoryInfo] = useState<{
    used: number;
    total: number;
    limit: number;
  } | null>(null);

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMemoryInfo({
          used: Math.round(memory.usedJSHeapSize / 1048576), // MB
          total: Math.round(memory.totalJSHeapSize / 1048576), // MB
          limit: Math.round(memory.jsHeapSizeLimit / 1048576) // MB
        });
      }
    };

    updateMemoryInfo();
    const interval = setInterval(updateMemoryInfo, 5000);

    return () => clearInterval(interval);
  }, []);

  const memoryUsagePercent = useMemo(() => {
    if (!memoryInfo) return 0;
    return Math.round((memoryInfo.used / memoryInfo.limit) * 100);
  }, [memoryInfo]);

  const isHighMemoryUsage = useMemo(() => {
    return memoryUsagePercent > 80;
  }, [memoryUsagePercent]);

  return {
    memoryInfo,
    memoryUsagePercent,
    isHighMemoryUsage
  };
};

// Network status monitoring
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [effectiveType, setEffectiveType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor connection if available
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    if (connection) {
      const updateConnectionInfo = () => {
        setConnectionType(connection.type || 'unknown');
        setEffectiveType(connection.effectiveType || 'unknown');
      };

      updateConnectionInfo();
      connection.addEventListener('change', updateConnectionInfo);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', updateConnectionInfo);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isSlowConnection = useMemo(() => {
    return effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveType === '3g';
  }, [effectiveType]);

  return {
    isOnline,
    connectionType,
    effectiveType,
    isSlowConnection
  };
};

// Bundle size optimization
export const useCodeSplitting = () => {
  const [loadedModules, setLoadedModules] = useState<Set<string>>(new Set());

  const loadModule = useCallback(async (moduleName: string, importFn: () => Promise<any>) => {
    if (loadedModules.has(moduleName)) {
      return;
    }

    try {
      await importFn();
      setLoadedModules(prev => new Set(prev).add(moduleName));
    } catch (error) {
      console.error(`Failed to load module ${moduleName}:`, error);
    }
  }, [loadedModules]);

  return {
    loadModule,
    isModuleLoaded: (moduleName: string) => loadedModules.has(moduleName),
    loadedModules
  };
};

// Performance metrics collector
export const usePerformanceMetrics = () => {
  const metricsRef = useRef<Map<string, number[]>>(new Map());

  const measure = useCallback((name: string, fn: () => void | Promise<void>) => {
    const start = performance.now();

    const end = fn instanceof Promise
      ? fn.then(() => performance.now())
      : new Promise(resolve => {
          fn();
          resolve(performance.now());
        });

    return end.then((endTime: unknown) => {
      const duration = (endTime as number) - start;
      const metrics = metricsRef.current.get(name) || [];
      metrics.push(duration);

      // Keep only last 10 measurements
      if (metrics.length > 10) {
        metrics.shift();
      }

      metricsRef.current.set(name, metrics);
      return duration;
    });
  }, []);

  const getMetrics = useCallback((name: string) => {
    const metrics = metricsRef.current.get(name) || [];
    if (metrics.length === 0) return null;

    const sorted = [...metrics].sort((a, b) => a - b);
    return {
      count: metrics.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      average: metrics.reduce((sum, val) => sum + val, 0) / metrics.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)]
    };
  }, []);

  return {
    measure,
    getMetrics
  };
};