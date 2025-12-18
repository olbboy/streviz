# Streviz Design Guidelines

## Overview

This document outlines the comprehensive design system for Streviz - a professional broadcast streaming application built with glassmorphism aesthetics. The design system emphasizes clarity, professionalism, and performance while maintaining a modern, sophisticated appearance.

## Design Philosophy

### Core Principles

1. **Professional Broadcast Aesthetic**: Clean, technical interface suitable for live streaming environments
2. **Glassmorphism Foundation**: Frosted glass effects with backdrop blur and transparency layers
3. **Status-Driven Visuals**: Clear color coding for different stream states and system conditions
4. **Performance First**: Optimized components that maintain smooth 60fps interactions
5. **Accessibility First**: WCAG 2.1 AA compliant with proper contrast ratios

### Visual Language

- **Backdrop Blur**: 12px standard for frosted glass effects
- **Transparency Levels**: 5%, 8%, 12%, 16% for visual hierarchy
- **Border Opacity**: 10% for subtle separation
- **Professional Blue**: #0066FF as primary brand color
- **Status Colors**: Green (success), Amber (warning), Red (error), Slate (neutral)

## Enhanced Color System

### Modern Blue Gradient System

| Color | Hex | Usage | WCAG Rating |
|-------|-----|-------|-------------|
| Primary Blue | #2563EB | Primary actions, brand identity | AAA |
| Blue Light | #60A5FA | Hover states, interactive elements | AAA |
| Blue Dark | #1D4ED8 | Pressed states, deep accents | AAA |
| Blue Gradient | Linear | CTA buttons, special elements | AAA |

### Enhanced Status Colors

| Status | Hex | Usage | Contrast | WCAG Rating |
|--------|-----|-------|----------|-------------|
| Success | #059669 | Online status, completed operations | 7.2:1 | AAA |
| Warning | #D97706 | Starting streams, cautions | 6.8:1 | AA |
| Error | #DC2626 | Offline status, error states | 7.5:1 | AAA |
| Neutral | #64748B | Inactive, disabled states | 4.8:1 | AA |

### Professional Neutral Palette (Slate System)

| Color | Hex | Usage | Light/Dark |
|-------|-----|-------|------------|
| White | #FFFFFF | Light mode backgrounds | Light |
| Slate-50 | #F8FAFC | Subtle surfaces | Light |
| Slate-100 | #F1F5F9 | Cards, panels | Light |
| Slate-200 | #E2E8F0 | Borders, dividers | Light |
| Slate-300 | #CBD5E1 | Secondary text | Light |
| Slate-400 | #94A3B8 | Muted text | Light |
| Slate-500 | #64748B | Tertiary text | Light |
| Slate-600 | #475569 | Secondary content | Light |
| Slate-700 | #334155 | Primary dark text | Light |
| Slate-800 | #1E293B | Dark mode surfaces | Dark |
| Slate-900 | #0F172A | Dark mode backgrounds | Dark |
| Slate-950 | #020617 | Deepest backgrounds | Dark |

### Glassmorphism Surface System

**Light Mode Glass Surfaces:**
| Surface | Opacity | Usage |
|---------|---------|-------|
| surface-01 | 3% | Very subtle overlays, minimal emphasis |
| surface-02 | 6% | Default cards, primary surfaces |
| surface-03 | 10% | Hover states, secondary emphasis |
| surface-04 | 15% | Active elements, strong emphasis |
| surface-05 | 20% | High emphasis, special elements |

**Dark Mode Glass Surfaces:**
| Surface | Opacity | Usage |
|---------|---------|-------|
| surface-dark-01 | 40% | Subtle overlays |
| surface-dark-02 | 60% | Default cards |
| surface-dark-03 | 80% | Hover states |
| surface-dark-04 | 90% | Active elements |
| surface-dark-05 | 95% | High emphasis |

### Professional Gradient System

| Gradient | Usage |
|----------|-------|
| Primary | Linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%) |
| Success | Linear-gradient(135deg, #10B981 0%, #059669 100%) |
| Warning | Linear-gradient(135deg, #F59E0B 0%, #D97706 100%) |
| Error | Linear-gradient(135deg, #EF4444 0%, #DC2626 100%) |
| Surface Light | Linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%) |
| Surface Dark | Linear-gradient(135deg, rgba(15,23,42,0.4) 0%, rgba(15,23,42,0.2) 100%) |

### Accessibility & Contrast Guidelines

- **WCAG 2.1 AAA**: Primary colors meet 7:1 contrast minimum
- **Text on Background**: Minimum 4.5:1 (AA), 7:1 (AAA)
- **Large Text**: Minimum 3:1 (AA), 4.5:1 (AAA)
- **Interactive Elements**: Enhanced contrast on focus/hover
- **Color Independence**: Status information not conveyed by color alone

### Glass Effect Best Practices

**Light Mode:**
- Use higher opacity (3-20%) for visibility
- Subtle borders: rgba(255,255,255,0.08)
- Soft shadows: rgba(0,0,0,0.05-0.15)

**Dark Mode:**
- Use slate-based backgrounds with opacity (40-95%)
- Minimal borders: rgba(255,255,255,0.06)
- Stronger shadows: rgba(0,0,0,0.15-0.30)

### Color Implementation

**CSS Custom Properties:**
```css
:root {
  --primary: 217 91% 60%;
  --success: 160 84% 39%;
  --warning: 35 91% 46%;
  --error: 0 84% 60%;
  --glass-surface-02: rgba(255, 255, 255, 0.06);
}
```

**Tailwind Classes:**
- Primary: `bg-broadcast-blue-600`
- Success: `bg-broadcast-success-600`
- Glass: `bg-broadcast-glass-surface-02`
- Gradient: `bg-broadcast-gradient-primary`

## Typography

### Refined Font System

Our enhanced typography system uses modern, professional fonts optimized for technical streaming applications:

#### Primary Font Families

- **Display**: Inter Display - For large headings and important UI elements
- **Heading**: Inter Display - For headings and subheadings
- **Body**: Inter - For body text and general UI content
- **Caption**: Inter - For small text and labels
- **Monospace**: JetBrains Mono - For technical data, URLs, and code

#### Font Loading Strategy

```css
/* Enhanced Font Imports */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Inter+Display:wght@300;400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700;800&display=swap');
```

### Enhanced Type Scale

Our refined type scale is designed for optimal readability across different screen sizes:

| Size | Usage | Line Height | Letter Spacing | Font Family |
|------|-------|-------------|----------------|-------------|
| 5xl (48px) | Display headings | 1.0 | -0.04em | Inter Display |
| 4xl (36px) | Large headings | 2.5rem | -0.03em | Inter Display |
| 3xl (30px) | Section headings | 2.25rem | -0.025em | Inter Display |
| 2xl (24px) | Component headers | 2rem | -0.02em | Inter Display |
| xl (20px) | Subheadings | 1.75rem | -0.015em | Inter Display |
| lg (18px) | Large body text | 1.75rem | -0.01em | Inter |
| base (16px) | Body text | 1.5rem | 0em | Inter |
| sm (15px) | Small body text | 1.25rem | 0.01em | Inter |
| xs (14px) | Caption text | 1.25rem | 0.025em | Inter |
| micro (12px) | Micro text | 1rem | 0.05em | Inter |

### Specialized Typography Components

#### TechnicalMetric
For displaying streaming statistics and performance data:
```tsx
<TechnicalMetric
  value={1280}
  label="Bitrate"
  unit="kbps"
  variant="default"
  status="good"
/>
```

#### StreamUrl
For displaying RTSP/SRT/RTMP URLs with protocol-specific styling:
```tsx
<StreamUrl
  url="rtsp://localhost:8554/stream-name"
  protocol="rtsp"
  copyable={true}
  truncated={true}
/>
```

#### CodeDisplay
For technical commands and code snippets:
```tsx
<CodeDisplay
  code="ffmpeg -i input.mp4 -c:v libx264 output.mp4"
  language="bash"
  copyable={true}
/>
```

#### StatusText
For status indicators with visual feedback:
```tsx
<StatusText status="online">
  Stream is active
</StatusText>
```

#### PerformanceIndicator
For performance metrics with status coloring:
```tsx
<PerformanceIndicator
  value={75}
  thresholds={{ good: 50, warning: 80 }}
  unit="%"
  showStatus
/>
```

### Typography Best Practices

1. **Use proper font families**:
   - Use `Inter Display` for headings and important UI elements
   - Use `Inter` for body text and general content
   - Use `JetBrains Mono` for technical data, URLs, and code

2. **Maintain readable line heights**:
   - Body text: 1.5-1.625 (optimal for reading)
   - Headings: 1.1-1.4 (tighter for better hierarchy)
   - Technical data: 1.25-1.5 (balanced for scannability)

3. **Use appropriate letter spacing**:
   - Display text: -0.04em to -0.02em (tighter for impact)
   - Body text: 0em to -0.01em (natural reading)
   - Small text: 0.01em to 0.05em (enhanced readability)

4. **Implement responsive typography**:
   - Reduce font sizes on mobile devices
   - Maintain readability across all screen sizes
   - Use relative units where possible

### Font Features

#### Inter Display & Inter
```css
font-feature-settings: "rlig" 1, "calt" 1, "ss01" 1, "ss02" 1;
font-variant-ligatures: common-ligatures;
font-optical-sizing: auto;
```

#### JetBrains Mono
```css
font-feature-settings: "tnum" 1, "zero" 1, "ss01" 1;
font-variant-numeric: tabular-nums;
```

### Accessibility Considerations

1. **Font sizes**: Minimum 16px for body text (WCAG AA)
2. **Contrast ratios**: Minimum 4.5:1 for normal text
3. **Responsive scaling**: Text remains readable at all breakpoints
4. **Font loading**: Uses `font-display: swap` to prevent invisible text

## Component Library

### Glassmorphism Components

#### 1. GlassCard
**Purpose**: Primary container for content and information

**Variants**:
- `surface-01` to `surface-04`: Transparency levels
- `blur`: sm (8px), md (12px), lg (20px)
- `border`: Show/hide glass border
- `glow`: Add shadow glow effect

**Usage**:
```tsx
<GlassCard variant="surface-02" blur="md" border glow>
  <GlassCardHeader>
    <GlassCardTitle>Stream Status</GlassCardTitle>
  </GlassCardHeader>
  <GlassCardContent>
    Content here
  </GlassCardContent>
</GlassCard>
```

#### 2. StreamStatus
**Purpose**: Display stream state with animations

**Status Types**:
- `live`: Active streaming with pulse animation
- `offline`: Inactive state
- `starting`: Preparing to stream
- `error`: Stream failure
- `warning`: Caution state

**Sizes**:
- `sm`: Compact (16px)
- `md`: Standard (24px)
- `lg`: Large display (32px)

**Variants**:
- `StreamStatus`: Full display with text
- `StreamStatusCompact`: Icon only (32px)
- `StreamStatusLarge`: Dashboard display

**Usage**:
```tsx
<StreamStatus status="live" size="md" showText />
<StreamStatusCompact status="live" />
<StreamStatusLarge status="live" text="LIVE" />
```

#### 3. ProgressGauge
**Purpose**: Display system metrics and progress

**Types**:
- `ProgressGauge`: Circular gauge with center content
- `ProgressGaugeCompact`: Small circular gauge
- `LinearProgressGauge`: Horizontal progress bar

**Properties**:
- Value/max for percentage calculation
- Size variations (sm, md, lg, xl)
- Color themes (blue, emerald, amber, red, purple, slate)
- Optional labels and units

**Usage**:
```tsx
<ProgressGauge value={75} max={100} size="lg" color="blue" showValue showLabel="CPU" />
<LinearProgressGauge value={60} label="Memory" unit="GB" color="emerald" />
```

#### 4. GlassButton
**Purpose**: Interactive actions with glass styling

**Variants**:
- `primary`: Blue accent glass
- `secondary`: Subtle white glass
- `surface`: Minimal glass
- `danger`, `success`, `warning`: Status-specific
- `ghost`: Transparent background

**Sizes**:
- `sm`: Small actions
- `md`: Standard buttons
- `lg`: Primary actions
- `xl`: Large CTAs
- `icon`: Square icon buttons

**Special Types**:
- `GlassIconButton`: Icon with tooltip
- `GlassFab`: Floating action button

**Usage**:
```tsx
<GlassButton variant="primary" size="md">Start Stream</GlassButton>
<GlassIconButton icon={<PlayIcon />} tooltip="Play" />
<GlassFab position="bottom-right"><PlusIcon /></GlassFab>
```

#### 5. GlassNavigation
**Purpose**: Navigation components with glass styling

**Types**:
- `navbar`: Top navigation bar
- `sidebar`: Side navigation panel
- `bottom-nav`: Mobile bottom navigation
- `breadcrumbs`: Trail navigation

**Components**:
- `GlassNavItem`: Navigation item with active states
- `GlassBreadcrumb`: Breadcrumb trail
- `GlassTabs`: Tab navigation (default, pills, underline)

**Usage**:
```tsx
<GlassNavigation variant="navbar" position="fixed" align="between">
  <GlassNavItem label="Dashboard" icon={<HomeIcon />} active />
  <GlassNavItem label="Streams" icon={<StreamIcon />} />
</GlassNavigation>
```

#### 6. Data Display
**Purpose**: Professional data visualization

**Components**:

**MetricCard**:
- KPI display with trend indicators
- Size variations (sm, md, lg)
- Color themes
- Change indicators
- Icon support

**GlassTable**:
- Glass-styled tables
- Sortable columns
- Size variations
- Hover states
- Striped rows

**StatusIndicator**:
- Compact status display
- 5 status types
- Size variations
- Optional text labels

**GlassBadge**:
- Labels and tags
- 5 variants (default, success, warning, error, info)
- Size variations
- Shape options (rounded, pill, square)
- Icon and count support

**Usage**:
```tsx
<MetricCard
  title="Active Streams"
  value={24}
  unit="streams"
  change={{ value: 12, type: "increase", period: "vs last hour" }}
  icon={<StreamIcon />}
  color="blue"
/>

<GlassTable
  columns={[
    { key: "name", label: "Stream Name", sortable: true },
    { key: "status", label: "Status" },
    { key: "viewers", label: "Viewers", align: "right" }
  ]}
  data={streamData}
/>

<StatusIndicator status="online" label="Connected" size="md" />
<GlassBadge variant="success" size="md">Active</GlassBadge>
```

## Layout System

### Container Structure
```tsx
<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
  {/* Fixed Navigation */}
  <GlassNavigation variant="navbar" position="fixed" />

  {/* Main Content */}
  <main className="pt-16">
    <div className="container mx-auto px-6 py-8">
      {/* Content Area */}
    </div>
  </main>
</div>
```

### Spacing Scale
- `xs`: 0.25rem (4px)
- `sm`: 0.5rem (8px)
- `md`: 1rem (16px)
- `lg`: 1.5rem (24px)
- `xl`: 2rem (32px)
- `2xl`: 3rem (48px)

### Grid System
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  {/* Responsive grid items */}
</div>
```

## Animation Guidelines

### Transition Properties
- **Duration**: 150ms (fast), 200ms (normal), 300ms (slow)
- **Easing**: `ease-out` for most interactions
- **Properties**: Transform, opacity, colors

### Animation Types

**Hover Effects**:
```tsx
className="hover:scale-105 hover:shadow-lg transition-all duration-200 ease-out"
```

**Loading States**:
```tsx
className="animate-pulse" // For placeholder content
className="animate-spin" // For loading spinners
```

**Status Animations**:
- Pulse for live status
- Gentle glow for active states
- Smooth transitions between states

### Performance Considerations
- Use `transform` and `opacity` for 60fps animations
- Avoid animating layout properties (width, height, margin)
- Use `will-change` sparingly for known animation elements
- Prefer CSS animations over JavaScript for simple effects

## Accessibility Guidelines

### Color Contrast
- **Normal text**: 4.5:1 minimum ratio
- **Large text**: 3:1 minimum ratio
- **Interactive elements**: Enhanced contrast on focus

### Interactive Elements
- Minimum 44x44px touch targets
- Clear focus states for keyboard navigation
- Descriptive labels for screen readers
- Semantic HTML structure

### Motion Preferences
```tsx
@media (prefers-reduced-motion: reduce) {
  /* Respect user motion preferences */
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Responsive Design

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Mobile Considerations
- Touch-friendly button sizes
- Simplified navigation for small screens
- Optimized spacing for thumb reach
- Horizontal scrolling prevention

### Desktop Optimizations
- Hover states for mouse interactions
- Keyboard shortcuts
- Larger click targets
- Enhanced tooltips

## Implementation Guidelines

### Component Structure
```tsx
// 1. Import from glassmorphism barrel
import { GlassCard, StreamStatus, ProgressGauge } from "@/components/ui/glassmorphism"

// 2. Use semantic props
<GlassCard variant="surface-02" blur="md">
  <GlassCardHeader>
    <GlassCardTitle>Component Title</GlassCardTitle>
  </GlassCardHeader>
  <GlassCardContent>
    {/* Content */}
  </GlassCardContent>
</GlassCard>

// 3. Follow naming conventions
// Props: camelCase
// Classes: kebab-case
// Files: PascalCase for components
```

### Performance Best Practices
- Lazy load heavy components
- Use React.memo for expensive renders
- Optimize re-renders with useMemo/useCallback
- Implement virtual scrolling for large lists

### Testing Considerations
- Test glass effects in both light and dark modes
- Verify animations at 60fps
- Test accessibility with screen readers
- Validate responsive behavior across breakpoints

## Dark Mode Support

All components support dark mode through CSS custom properties. The glassmorphism effects adapt automatically:

- **Light Mode**: White/transparent layers with subtle shadows
- **Dark Mode**: Black/transparent layers with enhanced glow effects

### Implementation
```tsx
// Automatic dark mode support via Tailwind classes
className="bg-white/10 dark:bg-black/20 border-white/20 dark:border-white/10"
```

## Future Considerations

### Extending the System
1. **New Components**: Follow established patterns
2. **Color Themes**: Maintain accessibility ratios
3. **Animation Standards**: Use consistent timing
4. **Component Variants**: Extend existing when possible

### Versioning
- Maintain backward compatibility for major releases
- Document breaking changes in release notes
- Provide migration guides for updates

## Troubleshooting

### Common Issues

**Glass effects not visible**:
- Check backdrop filter browser support
- Ensure proper contrast with background
- Verify z-index stacking context

**Performance issues**:
- Reduce number of backdrop-blur elements
- Use hardware acceleration where possible
- Optimize animation complexity

**Accessibility failures**:
- Verify color contrast ratios
- Ensure keyboard navigation works
- Test with screen readers

### Browser Support
- **Chrome/Edge**: Full support with backdrop-filter
- **Firefox**: Full support
- **Safari**: Good support, may need -webkit- prefix
- **Fallback**: Provide solid backgrounds for unsupported browsers