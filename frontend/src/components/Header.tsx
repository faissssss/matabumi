import { RefreshCw, Sun, Moon, Search } from 'lucide-react';
import { Language } from '../types';
import LanguageToggle from './LanguageToggle';

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  loading: boolean;
}

export default function Header({
  language,
  onLanguageChange,
  theme,
  onThemeToggle,
  loading,
}: HeaderProps) {
  return (
    <header className="relative z-50 border-b border-white/10 bg-glass-surface backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1920px] items-center justify-between px-6">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <img
            src="/assets/matabumi-logo.png"
            alt="MataBumi"
            className="h-8 w-8"
          />
          <div>
            <h1 className="text-lg font-semibold text-mist-white">MataBumi</h1>
            <p className="text-xs text-mist-white/60">
              Indonesia Deforestation Monitoring
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <a
            href="#dashboard"
            className="text-sm font-medium text-mist-white transition-colors hover:text-canopy-green"
          >
            Dashboard
          </a>
          <a
            href="#data"
            className="text-sm font-medium text-mist-white/70 transition-colors hover:text-mist-white"
          >
            Data
          </a>
          <a
            href="#methodology"
            className="text-sm font-medium text-mist-white/70 transition-colors hover:text-mist-white"
          >
            Methodology
          </a>
          <a
            href="#about"
            className="text-sm font-medium text-mist-white/70 transition-colors hover:text-mist-white"
          >
            About
          </a>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <button
            className="rounded-lg p-2 text-mist-white/70 transition-colors hover:bg-white/5 hover:text-mist-white"
            aria-label="Search"
          >
            <Search size={18} />
          </button>

          {/* Loading Indicator */}
          {loading && (
            <RefreshCw className="animate-spin text-canopy-green" size={18} />
          )}

          {/* Theme Toggle */}
          <button
            onClick={onThemeToggle}
            className="rounded-lg p-2 text-mist-white/70 transition-colors hover:bg-white/5 hover:text-mist-white"
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
