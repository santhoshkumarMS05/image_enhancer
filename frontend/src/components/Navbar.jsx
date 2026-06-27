import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from './ThemeContext';
import { Sun, Moon, Monitor, UploadCloud, User, LogOut, FileImage, Sparkles } from 'lucide-react';
import logo1 from '../assets/logo2.png';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Navbar({ 
  username, 
  onLogout, 
  onLoginClick,
  activeTab,
  setActiveTab
}) {
  const { theme, setTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fix 8: Close profile dropdown on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && profileOpen) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [profileOpen]);

  // Fix 9: Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileOpen]);

  const toggleTheme = () => {
    if (theme === 'dark') setTheme('light');
    else if (theme === 'light') setTheme('system');
    else setTheme('dark');
  };

  const getThemeIcon = () => {
    if (theme === 'dark') return <Moon className="w-4 h-4" />;
    if (theme === 'light') return <Sun className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  // Fix 2: Dynamic aria-label for theme toggle
  const getThemeAriaLabel = () => {
    if (theme === 'dark') return 'Switch to light mode';
    if (theme === 'light') return 'Switch to system mode';
    return 'Switch to dark mode';
  };

  const tabs = [
    { id: 'upload', label: 'Dashboard', icon: <UploadCloud className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <FileImage className="w-4 h-4" /> },
  ];

  return (
    <motion.header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-200",
        isScrolled ? "pt-4 px-4" : "pt-6 px-6"
      )}
    >
      <div className={cn(
        "max-w-7xl mx-auto px-6 h-16 flex items-center justify-between transition-all duration-200",
        isScrolled 
          ? "bg-background/70 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-2xl" 
          : "bg-transparent border-transparent"
      )}>
        
        {/* Fix 1: Logo changed from div to button with aria-label */}
        <button
          className="flex items-center gap-3 cursor-pointer group bg-transparent border-none p-0"
          onClick={() => setActiveTab('upload')}
          aria-label="Go to Dashboard"
        >
          <div className="h-10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
            <img src={logo1} alt="Visionexa AI Logo" className="h-full w-auto object-contain drop-shadow-md" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-black tracking-tight text-foreground">
              Visionexa <span className="text-accent drop-shadow-[0_0_8px_rgba(236,72,153,0.5)]">AI</span>
            </h1>
          </div>
        </button>

        {/* Fix 6: nav gets aria-label="Main navigation" */}
        <nav
          aria-label="Main navigation"
          className="hidden md:flex items-center bg-muted/30 backdrop-blur-md rounded-full border border-card-border p-1 relative shadow-inner"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                // Fix 7: aria-current for active tab
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  "relative flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors z-10",
                  isActive
                    ? "text-white"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="navbar-active-tab"
                    className="absolute inset-0 bg-accent rounded-full -z-10 shadow-[0_0_15px_rgba(236,72,153,0.5)]"
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Fix 2: Dynamic aria-label on theme toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
            aria-label={getThemeAriaLabel()}
            title={`Current theme: ${theme}`}
          >
            {getThemeIcon()}
          </button>

          {username ? (
            /* Fix 9: attach ref for click-outside detection */
            <div className="relative" ref={profileRef}>
              {/* Fix 3: aria-label, aria-expanded, aria-haspopup on profile button */}
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-9 h-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent hover:bg-accent/20 transition-colors"
                aria-label="Open profile menu"
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                <User className="w-5 h-5" />
              </button>
              
              {profileOpen && (
                /* Fix 4: role="menu" on the dropdown */
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-48 glass rounded-xl shadow-xl overflow-hidden py-2 animate-slide-up"
                >
                  <div className="px-4 py-2 border-b border-card-border mb-1">
                    <p className="text-sm font-bold text-foreground truncate">{username}</p>
                    <p className="text-xs text-muted-foreground">Pro User</p>
                  </div>
                  {/* Fix 5: role="menuitem" on each dropdown button */}
                  <button 
                    role="menuitem"
                    onClick={() => { setProfileOpen(false); setActiveTab('history'); }}
                    className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                  >
                    <FileImage className="w-4 h-4" /> My Images
                  </button>
                  <button 
                    role="menuitem"
                    onClick={() => { setProfileOpen(false); onLogout(); }}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={onLoginClick}
              className="px-5 py-2 rounded-full bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </motion.header>
  );
}
