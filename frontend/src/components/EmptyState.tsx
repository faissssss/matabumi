import { AlertTriangle, Database, Wifi, WifiOff } from 'lucide-react';
import type { Language } from '../types';
import { translations } from '../i18n';

interface EmptyStateProps {
  language: Language;
  type?: 'no-data' | 'no-backend' | 'error';
  message?: string;
}

export default function EmptyState({ language, type = 'no-data', message }: EmptyStateProps) {
  const t = translations[language];

  const getIcon = () => {
    switch (type) {
      case 'no-backend':
        return <WifiOff className="mb-4 text-muted-foreground/30" size={64} />;
      case 'error':
        return <AlertTriangle className="mb-4 text-destructive/50" size={64} />;
      default:
        return <Database className="mb-4 text-muted-foreground/30" size={64} />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'no-backend':
        return language === 'id' ? 'Mode Demo' : 'Demo Mode';
      case 'error':
        return language === 'id' ? 'Terjadi Kesalahan' : 'Error Occurred';
      default:
        return language === 'id' ? 'Tidak Ada Data' : 'No Data Available';
    }
  };

  const getMessage = () => {
    if (message) return message;
    
    switch (type) {
      case 'no-backend':
        return language === 'id'
          ? 'Backend API tidak tersedia. Aplikasi berjalan dalam mode demo tanpa data real-time.'
          : 'Backend API is not available. The application is running in demo mode without real-time data.';
      case 'error':
        return language === 'id'
          ? 'Gagal memuat data. Silakan coba lagi nanti.'
          : 'Failed to load data. Please try again later.';
      default:
        return language === 'id'
          ? 'Tidak ada data yang tersedia untuk filter yang dipilih.'
          : 'No data available for the selected filters.';
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      {getIcon()}
      <h3 className="mb-2 text-lg font-semibold text-foreground">
        {getTitle()}
      </h3>
      <p className="max-w-md text-sm text-muted-foreground">
        {getMessage()}
      </p>
      {type === 'no-backend' && (
        <div className="mt-6 rounded-lg border border-primary/20 bg-primary/5 p-4 text-left">
          <p className="text-xs text-muted-foreground">
            <strong className="text-primary">
              {language === 'id' ? 'Catatan:' : 'Note:'}
            </strong>{' '}
            {language === 'id'
              ? 'Untuk menggunakan data real-time, deploy backend API atau hubungkan ke server yang sudah ada.'
              : 'To use real-time data, deploy the backend API or connect to an existing server.'}
          </p>
        </div>
      )}
    </div>
  );
}
