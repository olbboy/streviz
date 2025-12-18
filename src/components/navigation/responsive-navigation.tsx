import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  VideoCameraIcon,
  FolderIcon,
  Cog6ToothIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

const navigationItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <HomeIcon className="w-5 h-5" />,
    path: '/'
  },
  {
    id: 'streams',
    label: 'Streams',
    icon: <VideoCameraIcon className="w-5 h-5" />,
    path: '/control-center',
    badge: 0 // Will be updated with active stream count
  },
  {
    id: 'library',
    label: 'Library',
    icon: <FolderIcon className="w-5 h-5" />,
    path: '/library'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Cog6ToothIcon className="w-5 h-5" />,
    path: '/settings'
  }
];

interface ResponsiveNavigationProps {
  activeStreamCount?: number;
  onMobileMenuToggle?: (isOpen: boolean) => void;
}

export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  activeStreamCount = 0,
  onMobileMenuToggle
}) => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Update navigation items with active stream count
  const updatedNavItems = navigationItems.map(item =>
    item.id === 'streams'
      ? { ...item, badge: activeStreamCount }
      : item
  );

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    onMobileMenuToggle?.(false);
  }, [location.pathname, onMobileMenuToggle]);

  // Handle mobile menu toggle
  const handleMobileMenuToggle = (isOpen: boolean) => {
    setMobileMenuOpen(isOpen);
    onMobileMenuToggle?.(isOpen);
  };

  // Mobile Bottom Navigation
  const MobileNav = () => (
    <nav className="mobile-nav mobile-only">
      <div className="mobile-nav-items">
        {updatedNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`mobile-nav-item ${isActive ? 'active' : ''}`}
              aria-label={item.label}
            >
              <div className="mobile-nav-icon relative">
                {item.icon}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="mobile-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  // Tablet Sidebar Navigation
  const TabletSidebar = () => (
    <aside className={`tablet-sidebar tablet-up ${sidebarCollapsed ? 'collapsed' : ''}`}>
      <div className="tablet-sidebar-content">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold font-display text-foreground">Streviz</h2>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-glass-surface-02 transition-colors touch-target"
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <nav className="space-y-1">
          {updatedNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="sidebar-nav-icon">
                  {item.icon}
                </div>
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );

  // Desktop Top Navigation
  const DesktopNavbar = () => (
    <header className="desktop-navbar desktop-up">
      <div className="desktop-navbar-content responsive-container">
        <Link to="/" className="desktop-nav-brand">
          <VideoCameraIcon className="w-8 h-8 mr-3 text-primary" />
          Streviz
        </Link>

        <nav className="desktop-nav-center">
          {updatedNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`desktop-nav-item ${isActive ? 'active' : ''}`}
              >
                {item.icon}
                <span className="ml-2">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-2 bg-primary text-primary-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-4">
          <button className="p-2 rounded-lg hover:bg-surface-02 transition-colors touch-target" aria-label="Settings">
            <Cog6ToothIcon className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </header>
  );

  // Mobile Menu Overlay
  const MobileMenuOverlay = () => (
    <div
      className={`fixed inset-0 z-50 bg-black/50 backdrop-blur-sm mobile-only transition-opacity duration-300 ${
        mobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      onClick={() => handleMobileMenuToggle(false)}
    >
      <div
        className={`absolute left-0 top-0 bottom-0 w-72 bg-glass-surface-03 border-r border-white/10 dark:border-white/10 transform transition-transform duration-300 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pt-safe-top">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold font-display text-foreground">Menu</h2>
            <button
              onClick={() => handleMobileMenuToggle(false)}
              className="p-2 rounded-lg hover:bg-glass-surface-02 transition-colors touch-target"
              aria-label="Close menu"
            >
              <XMarkIcon className="w-5 h-5 text-foreground" />
            </button>
          </div>

          <nav className="space-y-2">
            {updatedNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                    isActive
                      ? 'bg-primary/10 text-primary border-l-4 border-primary'
                      : 'hover:bg-surface-02 text-foreground'
                  }`}
                  onClick={() => handleMobileMenuToggle(false)}
                >
                  <div className="flex items-center">
                    <div className="mr-4">{item.icon}</div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded-full">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                  <ChevronRightIcon className="w-4 h-4 ml-2 text-muted-foreground" />
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );

  // Mobile Hamburger Menu
  const MobileHamburger = () => (
    <button
      onClick={() => handleMobileMenuToggle(true)}
      className="mobile-only fixed top-4 left-4 z-40 p-3 glass-surface rounded-xl touch-target"
      aria-label="Open menu"
    >
      <Bars3Icon className="w-6 h-6 text-foreground" />
    </button>
  );

  return (
    <>
      {/* Mobile Navigation */}
      <MobileNav />
      <MobileMenuOverlay />
      <MobileHamburger />

      {/* Tablet Sidebar */}
      <TabletSidebar />

      {/* Desktop Navbar */}
      <DesktopNavbar />
    </>
  );
};

// Hook for responsive content padding
export const useResponsivePadding = () => {
  const [paddingTop, setPaddingTop] = useState(0);
  const [paddingLeft, setPaddingLeft] = useState(0);
  const [paddingBottom, setPaddingBottom] = useState(0);

  useEffect(() => {
    const updatePaddings = () => {
      // Mobile bottom nav height
      const mobileNavHeight = window.innerWidth < 768 ? 60 : 0;

      // Tablet sidebar width
      const tabletSidebarWidth = window.innerWidth >= 768 && window.innerWidth < 1024 ? 256 : 0;

      // Desktop navbar height
      const desktopNavHeight = window.innerWidth >= 1024 ? 64 : 0;

      setPaddingBottom(mobileNavHeight);
      setPaddingLeft(tabletSidebarWidth);
      setPaddingTop(desktopNavHeight);
    };

    updatePaddings();
    window.addEventListener('resize', updatePaddings);
    return () => window.removeEventListener('resize', updatePaddings);
  }, []);

  return {
    paddingTop: `${paddingTop}px`,
    paddingLeft: `${paddingLeft}px`,
    paddingBottom: `${paddingBottom}px`,
    style: {
      paddingTop: `${paddingTop}px`,
      paddingLeft: `${paddingLeft}px`,
      paddingBottom: `${paddingBottom}px`,
      transition: 'all 0.3s ease'
    }
  };
};

// Responsive Layout Wrapper
export const ResponsiveLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { style } = useResponsivePadding();

  return (
    <div className="responsive-app-layout">
      <ResponsiveNavigation />
      <main
        className="responsive-content"
        style={style}
      >
        <div className="responsive-container">
          {children}
        </div>
      </main>
    </div>
  );
};