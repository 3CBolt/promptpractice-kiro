'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './GlobalNav.module.css';

interface NavItem {
  label: string;
  href: string;
  icon: string;
  description: string;
}

interface GlobalNavProps {
  className?: string;
}

const navItems: NavItem[] = [
  {
    label: 'Learn',
    href: '/guides/fundamentals',
    icon: '📚',
    description: 'Educational guides and concepts'
  },
  {
    label: 'Practice',
    href: '/labs/practice-basics',
    icon: '🧪',
    description: 'Interactive labs and exercises'
  },
  {
    label: 'Progress',
    href: '/progress',
    icon: '📊',
    description: 'Track your learning journey'
  },
  {
    label: 'About',
    href: '/about',
    icon: 'ℹ️',
    description: 'About this platform'
  }
];

export default function GlobalNav({ className = '' }: GlobalNavProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileMenuOpen]);

  const isActiveRoute = (href: string): boolean => {
    if (!mounted) return false;
    
    // Handle root path
    if (href === '/' && pathname === '/') return true;
    
    // Handle nested paths
    if (href !== '/' && pathname.startsWith(href)) return true;
    
    // Special handling for guides and labs
    if (href.includes('/guides/') && pathname.startsWith('/guides/')) return true;
    if (href.includes('/labs/') && pathname.startsWith('/labs/')) return true;
    
    return false;
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav 
      className={`${styles.globalNav} ${className}`}
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Skip link - positioned absolutely to appear on focus */}
      <a 
        href="#main-content" 
        className="skip-link"
        style={{
          position: 'absolute',
          left: '-9999px',
          zIndex: 1070,
          padding: '0.5rem 1rem',
          backgroundColor: '#2563eb',
          color: '#ffffff',
          textDecoration: 'none',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          fontWeight: 500,
          transition: 'all 150ms cubic-bezier(0, 0, 0.2, 1)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.left = '1rem';
          e.currentTarget.style.top = '1rem';
        }}
        onBlur={(e) => {
          e.currentTarget.style.left = '-9999px';
          e.currentTarget.style.top = 'auto';
        }}
      >
        Skip to main content
      </a>

      <div className={styles.navContainer}>
        {/* Logo/Brand */}
        <div className={styles.navBrand}>
          <Link 
            href="/"
            className={styles.brandLink}
            aria-label="Prompt Practice App - Home"
          >
            <span className={styles.brandIcon} aria-hidden="true">🎯</span>
            <span className={styles.brandText}>Prompt Practice</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className={styles.navLinksDesktop} role="menubar">
          {navItems.map((item) => {
            const isActive = isActiveRoute(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                role="menuitem"
                aria-current={isActive ? 'page' : undefined}
                title={item.description}
              >
                <span className={styles.navIcon} aria-hidden="true">{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Mobile Menu Button */}
        <button
          className={styles.mobileMenuButton}
          onClick={toggleMobileMenu}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <span className="hamburger-icon" aria-hidden="true">
            {isMobileMenuOpen ? '✕' : '☰'}
          </span>
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMobileMenuOpen && (
        <div 
          id="mobile-menu"
          className={styles.mobileMenu}
          role="menu"
          aria-label="Mobile navigation menu"
        >
          <div className={styles.mobileMenuContent}>
            {navItems.map((item) => {
              const isActive = isActiveRoute(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.mobileNavLink} ${isActive ? styles.mobileNavLinkActive : ''}`}
                  role="menuitem"
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <span className={styles.mobileNavIcon} aria-hidden="true">{item.icon}</span>
                  <div className={styles.mobileNavContent}>
                    <span className={styles.mobileNavLabel}>{item.label}</span>
                    <span className={styles.mobileNavDescription}>{item.description}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}