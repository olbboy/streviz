import React from 'react';

// Technical Metric Component - For streaming statistics and performance data
interface TechnicalMetricProps {
  value: string | number;
  label: string;
  unit?: string;
  variant?: 'default' | 'compact' | 'large';
  status?: 'default' | 'good' | 'warning' | 'critical';
}

export const TechnicalMetric: React.FC<TechnicalMetricProps> = ({
  value,
  label,
  unit,
  variant = 'default'
  // status = 'default' - currently unused
}) => {
  const baseClasses = 'technical-metric';
  // Remove unused valueClasses

  const sizeClasses = {
    compact: {
      value: 'text-sm',
      label: 'text-micro'
    },
    default: {
      value: 'text-base',
      label: 'text-xs'
    },
    large: {
      value: 'text-lg',
      label: 'text-sm'
    }
  };

  return (
    <div className={baseClasses}>
      <div className={`technical-metric-value ${sizeClasses[variant].value}`}>
        {value}
        {unit && <span className="technical-metric-unit">{unit}</span>}
      </div>
      <div className={`technical-metric-label ${sizeClasses[variant].label}`}>
        {label}
      </div>
    </div>
  );
};

// Stream URL Component - For displaying RTSP/SRT/RTMP URLs
interface StreamUrlProps {
  url: string;
  protocol: 'rtsp' | 'srt' | 'rtmp';
  showProtocol?: boolean;
  copyable?: boolean;
  truncated?: boolean;
}

export const StreamUrl: React.FC<StreamUrlProps> = ({
  url,
  protocol,
  showProtocol = true,
  copyable = false,
  truncated = true
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const displayUrl = truncated && url.length > 60
    ? url.substring(0, 30) + '...' + url.substring(url.length - 25)
    : url;

  return (
    <div className="flex items-center gap-2 group">
      <code className={`stream-url protocol-${protocol} ${truncated ? 'max-w-md' : ''}`}>
        {showProtocol && <span className="font-semibold">{protocol.toUpperCase()}://</span>}
        {truncated ? (
          <span title={url}>{displayUrl}</span>
        ) : (
          <span>{url}</span>
        )}
      </code>
      {copyable && (
        <button
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy URL"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Code Display Component - For technical commands and code snippets
interface CodeDisplayProps {
  code: string;
  language?: string;
  inline?: boolean;
  copyable?: boolean;
  maxLines?: number;
}

export const CodeDisplay: React.FC<CodeDisplayProps> = ({
  code,
  language = 'bash',
  inline = false,
  copyable = true,
  maxLines
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  if (inline) {
    return <code className="code-display-inline">{code}</code>;
  }

  const lines = code.split('\n');
  const displayLines = maxLines ? lines.slice(0, maxLines) : lines;
  const hasMore = maxLines && lines.length > maxLines;

  return (
    <div className="relative group">
      <pre className="code-display">
        <code className={`language-${language}`}>
          {displayLines.join('\n')}
          {hasMore && '\n...'}
        </code>
      </pre>
      {copyable && (
        <button
          onClick={handleCopy}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
          title="Copy code"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Status Text Component - For status indicators with text
interface StatusTextProps {
  status: 'online' | 'offline' | 'warning' | 'error' | 'starting';
  children: React.ReactNode;
}

export const StatusText: React.FC<StatusTextProps> = ({
  status,
  children
}) => {
  return (
    <span className={`status-text ${status}`}>
      {children}
    </span>
  );
};

// File Path Display Component - For showing file paths with proper formatting
interface FilePathProps {
  path: string;
  showFilename?: boolean;
  maxSegments?: number;
}

export const FilePath: React.FC<FilePathProps> = ({
  path,
  showFilename = true,
  maxSegments = 3
}) => {
  const segments = path.split(/[/\\]/);
  const filename = segments[segments.length - 1];
  const dirSegments = segments.slice(0, -1);

  const displaySegments = maxSegments > 0
    ? dirSegments.slice(-maxSegments)
    : dirSegments;

  return (
    <div className="file-path">
      {displaySegments.length > 0 && (
        <>
          {displaySegments.map((segment, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="file-path-separator">/</span>}
              <span className="file-path-segment">{segment}</span>
            </React.Fragment>
          ))}
          <span className="file-path-separator">/</span>
        </>
      )}
      {showFilename && (
        <span className="file-path-filename">{filename}</span>
      )}
    </div>
  );
};

// Codec Label Component - For displaying video codec information
interface CodecLabelProps {
  codec: 'h264' | 'h265' | 'av1' | 'vp9' | 'unsupported';
  profile?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const CodecLabel: React.FC<CodecLabelProps> = ({
  codec,
  profile,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'text-micro px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-2.5 py-1.5'
  };

  return (
    <span className={`codec-label ${codec} ${sizeClasses[size]}`}>
      {codec.toUpperCase()}
      {profile && <span className="opacity-75 ml-1">{profile}</span>}
    </span>
  );
};

// Enhanced Heading Components - For consistent heading hierarchy
interface HeadingProps {
  level: 1 | 2 | 3 | 4 | 5 | 6 | 'display';
  children: React.ReactNode;
  className?: string;
}

export const Heading: React.FC<HeadingProps> = ({
  level,
  children,
  className = ''
}) => {
  const Tag = level === 'display' ? 'h1' : `h${level}` as keyof JSX.IntrinsicElements;
  const headingClass = level === 'display' ? 'heading-display' : `heading-${level}`;

  return (
    <Tag className={`${headingClass} ${className}`}>
      {children}
    </Tag>
  );
};

// Performance Indicator Component - For performance metrics
interface PerformanceIndicatorProps {
  value: number;
  thresholds?: {
    good?: number;
    warning?: number;
  };
  unit?: string;
  showStatus?: boolean;
}

export const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = ({
  value,
  thresholds = { good: 50, warning: 80 },
  unit,
  showStatus = true
}) => {
  const getStatus = () => {
    if (thresholds.good && value <= thresholds.good) return 'good';
    if (thresholds.warning && value <= thresholds.warning) return 'warning';
    return 'critical';
  };

  const status = getStatus();

  return (
    <div className={`performance-indicator ${status}`}>
      <span className="font-mono-display">{value}{unit}</span>
      {showStatus && (
        <span className="text-xs opacity-75 capitalize">{status}</span>
      )}
    </div>
  );
};

// Typography Helper Component - For applying consistent text styling
interface TextProps {
  variant: 'display' | 'heading' | 'subheading' | 'body' | 'caption';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export const Text: React.FC<TextProps> = ({
  variant,
  size,
  weight,
  children,
  className = '',
  as: Component = 'p'
}) => {
  const variantClasses = {
    display: 'font-display',
    heading: 'font-heading',
    subheading: 'font-subheading',
    body: 'font-body',
    caption: 'font-caption'
  };

  const weightClasses = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  const sizeClass = size ? `text-${size}` : '';
  const variantClass = variantClasses[variant];
  const weightClass = weight ? weightClasses[weight] : '';

  return (
    <Component className={`${variantClass} ${sizeClass} ${weightClass} ${className}`}>
      {children}
    </Component>
  );
};

// Export all components as a unified typography system
export const Typography = {
  TechnicalMetric,
  StreamUrl,
  CodeDisplay,
  StatusText,
  FilePath,
  CodecLabel,
  Heading,
  PerformanceIndicator,
  Text
};

export default Typography;