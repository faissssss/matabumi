import { Satellite, Brain, Globe, Shield, TrendingUp, Users } from 'lucide-react';
import { Language } from '../types';

interface AboutPageProps {
  language: Language;
}

const content = {
  en: {
    title: 'About MataBumi',
    subtitle: 'Monitoring Indonesia\'s Forests with Advanced Technology',
    mission: {
      title: 'Our Mission',
      text: 'MataBumi is dedicated to providing transparent, accessible, and actionable data on deforestation across Indonesia. We empower conservation efforts, inform policy-making, and raise environmental awareness through cutting-edge technology and real-time monitoring.',
    },
    features: [
      {
        icon: Satellite,
        title: 'Satellite Monitoring',
        description: 'We integrate data from Landsat, Sentinel-2, and MODIS satellites to detect deforestation events in near real-time across all Indonesian provinces.',
      },
      {
        icon: Brain,
        title: 'AI-Powered Analysis',
        description: 'Advanced machine learning algorithms analyze multi-spectral imagery to classify events by severity and identify probable causes with high accuracy.',
      },
      {
        icon: Globe,
        title: 'Comprehensive Coverage',
        description: 'Monitor deforestation across all 38 provinces of Indonesia with detailed provincial and national-level statistics and trends.',
      },
      {
        icon: Shield,
        title: 'Protected Zone Alerts',
        description: 'Special tracking for deforestation events in protected areas, national parks, and conservation zones to support enforcement efforts.',
      },
      {
        icon: TrendingUp,
        title: 'Trend Analysis',
        description: 'Historical data and trend analysis help identify patterns, predict future risks, and measure the effectiveness of conservation initiatives.',
      },
      {
        icon: Users,
        title: 'Open Access',
        description: 'Free access to data and insights for researchers, policymakers, NGOs, and concerned citizens working to protect Indonesia\'s forests.',
      },
    ],
    methodology: {
      title: 'Our Methodology',
      steps: [
        {
          title: 'Data Collection',
          text: 'Continuous monitoring using multiple satellite sources with 10-30 meter resolution imagery updated every 5-16 days.',
        },
        {
          title: 'Change Detection',
          text: 'Computer vision algorithms detect changes in forest cover by analyzing NDVI (Normalized Difference Vegetation Index) and other spectral indices.',
        },
        {
          title: 'Classification',
          text: 'Machine learning models classify events by severity (Critical, High, Moderate, Low) and identify probable causes (Logging, Plantation, Mining, Fire).',
        },
        {
          title: 'Validation',
          text: 'Automated validation against historical data and ground truth information to ensure accuracy and reduce false positives.',
        },
      ],
    },
    impact: {
      title: 'Our Impact',
      stats: [
        { value: '110,000+', label: 'Hectares Monitored' },
        { value: '38', label: 'Provinces Covered' },
        { value: '24/7', label: 'Real-time Monitoring' },
        { value: '95%+', label: 'Detection Accuracy' },
      ],
    },
    technology: {
      title: 'Technology Stack',
      text: 'Built with modern web technologies including React, TypeScript, and Leaflet for interactive mapping. Our backend processes terabytes of satellite data using Python, TensorFlow, and cloud computing infrastructure to deliver insights at scale.',
    },
    contact: {
      title: 'Get Involved',
      text: 'Whether you\'re a researcher, policymaker, conservationist, or concerned citizen, we welcome collaboration. Together, we can protect Indonesia\'s precious forests for future generations.',
      email: 'info@matabumi.org',
      cta: 'Contact Us',
    },
  },
  id: {
    title: 'Tentang MataBumi',
    subtitle: 'Memantau Hutan Indonesia dengan Teknologi Canggih',
    mission: {
      title: 'Misi Kami',
      text: 'MataBumi berdedikasi untuk menyediakan data deforestasi yang transparan, mudah diakses, dan dapat ditindaklanjuti di seluruh Indonesia. Kami memberdayakan upaya konservasi, menginformasikan pembuatan kebijakan, dan meningkatkan kesadaran lingkungan melalui teknologi mutakhir dan pemantauan real-time.',
    },
    features: [
      {
        icon: Satellite,
        title: 'Pemantauan Satelit',
        description: 'Kami mengintegrasikan data dari satelit Landsat, Sentinel-2, dan MODIS untuk mendeteksi peristiwa deforestasi secara real-time di seluruh provinsi Indonesia.',
      },
      {
        icon: Brain,
        title: 'Analisis Berbasis AI',
        description: 'Algoritma pembelajaran mesin canggih menganalisis citra multi-spektral untuk mengklasifikasikan peristiwa berdasarkan tingkat keparahan dan mengidentifikasi penyebab dengan akurasi tinggi.',
      },
      {
        icon: Globe,
        title: 'Cakupan Menyeluruh',
        description: 'Pantau deforestasi di 38 provinsi Indonesia dengan statistik dan tren tingkat provinsi dan nasional yang terperinci.',
      },
      {
        icon: Shield,
        title: 'Peringatan Zona Lindung',
        description: 'Pelacakan khusus untuk peristiwa deforestasi di kawasan lindung, taman nasional, dan zona konservasi untuk mendukung upaya penegakan hukum.',
      },
      {
        icon: TrendingUp,
        title: 'Analisis Tren',
        description: 'Data historis dan analisis tren membantu mengidentifikasi pola, memprediksi risiko masa depan, dan mengukur efektivitas inisiatif konservasi.',
      },
      {
        icon: Users,
        title: 'Akses Terbuka',
        description: 'Akses gratis ke data dan wawasan untuk peneliti, pembuat kebijakan, LSM, dan warga yang peduli untuk melindungi hutan Indonesia.',
      },
    ],
    methodology: {
      title: 'Metodologi Kami',
      steps: [
        {
          title: 'Pengumpulan Data',
          text: 'Pemantauan berkelanjutan menggunakan berbagai sumber satelit dengan citra resolusi 10-30 meter yang diperbarui setiap 5-16 hari.',
        },
        {
          title: 'Deteksi Perubahan',
          text: 'Algoritma visi komputer mendeteksi perubahan tutupan hutan dengan menganalisis NDVI (Normalized Difference Vegetation Index) dan indeks spektral lainnya.',
        },
        {
          title: 'Klasifikasi',
          text: 'Model pembelajaran mesin mengklasifikasikan peristiwa berdasarkan tingkat keparahan (Kritis, Tinggi, Sedang, Rendah) dan mengidentifikasi penyebab (Penebangan, Perkebunan, Pertambangan, Kebakaran).',
        },
        {
          title: 'Validasi',
          text: 'Validasi otomatis terhadap data historis dan informasi lapangan untuk memastikan akurasi dan mengurangi positif palsu.',
        },
      ],
    },
    impact: {
      title: 'Dampak Kami',
      stats: [
        { value: '110.000+', label: 'Hektar Dipantau' },
        { value: '38', label: 'Provinsi Tercakup' },
        { value: '24/7', label: 'Pemantauan Real-time' },
        { value: '95%+', label: 'Akurasi Deteksi' },
      ],
    },
    technology: {
      title: 'Teknologi',
      text: 'Dibangun dengan teknologi web modern termasuk React, TypeScript, dan Leaflet untuk pemetaan interaktif. Backend kami memproses terabyte data satelit menggunakan Python, TensorFlow, dan infrastruktur cloud computing untuk memberikan wawasan dalam skala besar.',
    },
    contact: {
      title: 'Mari Bergabung',
      text: 'Baik Anda peneliti, pembuat kebijakan, konservasionis, atau warga yang peduli, kami menyambut kolaborasi. Bersama-sama, kita dapat melindungi hutan Indonesia yang berharga untuk generasi mendatang.',
      email: 'info@matabumi.org',
      cta: 'Hubungi Kami',
    },
  },
};

export default function AboutPage({ language }: AboutPageProps) {
  const t = content[language];

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <h1 className="text-4xl font-bold text-foreground md:text-5xl lg:text-6xl">
            {t.title}
          </h1>
          <p className="mt-6 text-xl text-muted-foreground md:text-2xl">
            {t.subtitle}
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="mb-6 text-center text-3xl font-bold text-foreground">
            {t.mission.title}
          </h2>
          <p className="text-center text-lg leading-relaxed text-muted-foreground">
            {t.mission.text}
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {t.features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="rounded-xl border border-border bg-card p-6 transition-all hover:shadow-lg"
                >
                  <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                    <Icon className="text-primary" size={24} />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            {t.methodology.title}
          </h2>
          <div className="space-y-8">
            {t.methodology.steps.map((step, index) => (
              <div key={index} className="flex gap-6">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="border-b border-border bg-primary/5">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mb-12 text-center text-3xl font-bold text-foreground">
            {t.impact.title}
          </h2>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {t.impact.stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mb-2 text-4xl font-bold text-primary md:text-5xl">
                  {stat.value}
                </div>
                <div className="text-sm font-medium text-muted-foreground md:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <h2 className="mb-6 text-center text-3xl font-bold text-foreground">
            {t.technology.title}
          </h2>
          <p className="text-center text-lg leading-relaxed text-muted-foreground">
            {t.technology.text}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} MataBumi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
