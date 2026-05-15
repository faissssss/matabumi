import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Download } from 'lucide-react';
import { Alert, Language, NationalStats, TrendPoint } from '../types';
import { translations } from '../i18n';
import TrendChart from './TrendChart';

interface AnalyticsDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  trends: TrendPoint[];
  stats: NationalStats | null;
  alerts: Alert[];
  language: Language;
}

export default function AnalyticsDrawer({
  isOpen,
  onToggle,
  trends,
  stats,
  alerts,
  language,
}: AnalyticsDrawerProps) {
  const t = translations[language];

  return (
    <motion.div
      initial={{ y: 'calc(100% - 48px)' }}
      animate={{ y: isOpen ? 0 : 'calc(100% - 48px)' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute bottom-0 left-0 right-0 z-30"
    >
      {/* Handle */}
      <button
        onClick={onToggle}
        className="mx-auto flex w-full items-center justify-center gap-2 rounded-t-xl bg-glass-surface px-4 py-3 text-sm font-medium text-mist-white backdrop-blur-xl transition-colors hover:bg-glass-surface/80"
      >
        {isOpen ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        {isOpen ? 'Hide Analytics' : 'Show Analytics'}
      </button>

      {/* Content */}
      <div className="h-[400px] overflow-y-auto bg-glass-surface p-6 backdrop-blur-xl">
        <div className="mx-auto max-w-[1400px]">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-mist-white">
              Analytics & Trends
            </h3>
            <button
              className="flex items-center gap-2 rounded-lg bg-canopy-green px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-canopy-green/90"
            >
              <Download size={16} />
              Export Data
            </button>
          </div>

          <TrendChart
            trends={trends}
            stats={stats}
            alerts={alerts}
            language={language}
          />
        </div>
      </div>
    </motion.div>
  );
}
