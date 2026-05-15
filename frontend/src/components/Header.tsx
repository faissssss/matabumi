import { RefreshCw, Sun, Moon } from 'lucide-react';
import { Language } from '../types';
import LanguageToggle from './LanguageToggle';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  loading: boolean;
  currentView: 'dashboard' | 'about';
  onViewChange: (view: 'dashboard' | 'about') => void;
}

export default function Header({
  language,
  onLanguageChange,
  theme,
  onThemeToggle,
  loading,
  currentView,
  onViewChange,
}: HeaderProps) {
  return (
    <header className="relative z-50 border-b border-border bg-card/95 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1920px] items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img
            src="/assets/matabumi-logo.png"
            alt="MataBumi"
            className="h-8 w-8"
          />
          <h1 className="text-lg font-semibold text-foreground">MataBumi</h1>
        </div>

        {/* Navigation - Center */}
        <nav className="flex items-center gap-6">
          <button
            onClick={() => onViewChange('about')}
            className={`text-sm font-medium transition-colors ${
              currentView === 'about'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            About
          </button>
          <button
            onClick={() => onViewChange('dashboard')}
            className={`text-sm font-medium transition-colors ${
              currentView === 'dashboard'
                ? 'text-primary'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            Dashboard
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Loading Indicator */}
          {loading && (
            <RefreshCw className="animate-spin text-primary" size={18} />
          )}

          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Language Toggle */}
          <LanguageToggle language={language} onChange={onLanguageChange} />
        </div>
      </div>
    </header>
  );
}
