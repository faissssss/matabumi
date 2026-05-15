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
      value: stats?.total_alerts?.toLocaleString() || '0',
      unit: t.alerts,
      icon: AlertTriangle,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
    },
    {
      label: t.criticalAlerts,
      value: stats?.critical_alerts?.toLocaleString() || '0',
      unit: t.critical,
      icon: AlertTriangle,
      color: 'text-alert-orange',
      bgColor: 'bg-alert-orange/10',
    },
    {
      label: t.protectedZones,
      value: stats?.protected_zones?.toLocaleString() || '0',
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
        type: 'spring',
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <motion.div
      className="absolute left-1/2 top-20 z-40 flex -translate-x-1/2 gap-4"
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
            whileHover={{ scale: 1.05, y: -5 }}
            className="group min-w-[180px] rounded-xl bg-glass-surface p-4 backdrop-blur-xl transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-mist-white/60">
                  {card.label}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${card.color}`}>
                    {card.value}
                  </span>
                  <span className="text-sm text-mist-white/40">{card.unit}</span>
                </div>
              </div>
              <div className={`rounded-lg ${card.bgColor} p-2`}>
                <Icon className={card.color} size={20} />
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
