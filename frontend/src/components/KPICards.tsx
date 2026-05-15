import { motion } from 'framer-motion';
import { AlertTriangle, TrendingUp, Shield, MapPin } from 'lucide-react';
import { Language, NationalStats } from '../types';
import { translations } from '../i18n';

interface KPICardsProps {
  stats: NationalStats | null;
  language: Language;
}

export default function KPICards({ stats, language }: KPICardsProps) {
  const t = translations[language];

  const cards = [
    {
      label: t.totalArea,
      value: stats?.total_area_ha?.toLocaleString() || '0',
      unit: 'ha',
      icon: TrendingUp,
      color: 'text-alert-orange',
      bgColor: 'bg-alert-orange/10',
    },
    {
      label: t.totalAlerts,
      value: stats?.total_events?.toLocaleString() || '0',
      unit: t.alerts,
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
    {
      label: t.criticalAlerts,
      value: stats?.by_severity?.critical?.toLocaleString() || '0',
      unit: t.critical,
      icon: AlertTriangle,
      color: 'text-alert-orange',
      bgColor: 'bg-alert-orange/10',
    },
    {
      label: t.protectedZones,
      value: stats?.protected_zone_breaches?.toLocaleString() || '0',
      unit: t.zones,
      icon: Shield,
      color: 'text-canopy-green',
      bgColor: 'bg-canopy-green/10',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <motion.div
      className="grid grid-cols-2 gap-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={index}
            variants={cardVariants}
            whileHover={{ scale: 1.02, y: -2 }}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-lg backdrop-blur-xl transition-all"
          >
            <div className={`rounded-lg ${card.bgColor} p-2`}>
              <Icon className={card.color} size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-muted-foreground truncate">
                {card.label}
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className={`text-xl font-bold ${card.color} truncate`}>
                  {card.value}
                </span>
                <span className="text-xs text-muted-foreground truncate">{card.unit}</span>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
