import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  Copy,
  Database,
  Download,
  ExternalLink,
  FileText,
  Globe2,
  HelpCircle,
  ImageOff,
  Layers3,
  Menu,
  Microscope,
  Satellite,
  Sprout,
  X,
} from 'lucide-react';
import type { Language } from '../../types';
import { getHeroImageUrl, getLocalHeroImageUrl } from '../../utils/supabaseStorage';

type Theme = 'dark' | 'light';

interface DocumentationPageProps {
  language: Language;
  theme: Theme;
  onBackToDashboard: () => void;
}

interface LocalizedText {
  en: string;
  id: string;
}

interface HeroImage {
  filename: string;
  province: string;
  detectionDate: string;
  caption: LocalizedText;
  description: LocalizedText;
  patternNote: LocalizedText;
}

interface APIEndpoint {
  method: 'GET';
  path: string;
  description: LocalizedText;
  parameters: Array<{ name: string; type: string; required: boolean; description: LocalizedText }>;
  response: string;
  example: string;
}

const sections = [
  { id: 'about', icon: Sprout },
  { id: 'how-it-works', icon: Layers3 },
  { id: 'visual-examples', icon: Satellite },
  { id: 'technical-details', icon: Code2 },
  { id: 'data-sources', icon: Database },
  { id: 'technology-stack', icon: Globe2 },
  { id: 'api-documentation', icon: FileText },
  { id: 'methodology', icon: Microscope },
  { id: 'limitations', icon: AlertTriangle },
  { id: 'faq', icon: HelpCircle },
  { id: 'contact', icon: BookOpen },
] as const;

const copy = {
  en: {
    nav: {
      about: 'About',
      'how-it-works': 'How It Works',
      'visual-examples': 'Visual Examples',
      'technical-details': 'Technical Details',
      'data-sources': 'Data Sources',
      'technology-stack': 'Technology Stack',
      'api-documentation': 'API Documentation',
      methodology: 'Methodology',
      limitations: 'Limitations',
      faq: 'FAQ',
      contact: 'Contact',
    },
    pageTitle: 'MataBumi Documentation',
    subtitle:
      'A practical guide to the forest transparency platform, satellite methodology, public API, and interpretation limits.',
    back: 'Back to Dashboard',
    menu: 'Sections',
    download: 'Download',
    open: 'Open full image',
    close: 'Close',
    copy: 'Copy',
    copied: 'Copied',
    unavailable: 'Image unavailable',
    version: 'Version 2.0',
    updated: 'Last updated: May 27, 2026',
  },
  id: {
    nav: {
      about: 'Tentang',
      'how-it-works': 'Cara Kerja',
      'visual-examples': 'Contoh Visual',
      'technical-details': 'Detail Teknis',
      'data-sources': 'Sumber Data',
      'technology-stack': 'Teknologi',
      'api-documentation': 'Dokumentasi API',
      methodology: 'Metodologi',
      limitations: 'Batasan',
      faq: 'FAQ',
      contact: 'Kontak',
    },
    pageTitle: 'Dokumentasi MataBumi',
    subtitle:
      'Panduan praktis untuk platform transparansi hutan, metodologi satelit, API publik, dan batas interpretasi.',
    back: 'Kembali ke Dashboard',
    menu: 'Bagian',
    download: 'Unduh',
    open: 'Buka gambar penuh',
    close: 'Tutup',
    copy: 'Salin',
    copied: 'Disalin',
    unavailable: 'Gambar tidak tersedia',
    version: 'Versi 2.0',
    updated: 'Terakhir diperbarui: 27 Mei 2026',
  },
} as const;

const heroImages: HeroImage[] = [
  ['matabumi_aceh.png', 'Aceh', '2026'],
  ['matabumi_bali.png', 'Bali', '2026'],
  ['matabumi_bali_2026.png', 'Bali', '2026'],
  ['matabumi_bengkulu.png', 'Bengkulu', '2026'],
  ['matabumi_dki_jakarta.png', 'DKI Jakarta', '2026'],
  ['matabumi_jawa_timur_2026.png', 'Jawa Timur', '2026'],
  ['matabumi_kalimantan_barat.png', 'Kalimantan Barat', '2026'],
  ['matabumi_nusa_tenggara_barat_2026.png', 'Nusa Tenggara Barat', '2026'],
  ['matabumi_papua_pegunungan.png', 'Papua Pegunungan', '2026'],
  ['matabumi_papua_pegunungan_2025.png', 'Papua Pegunungan', '2025'],
  ['matabumi_papua_tengah_2025.png', 'Papua Tengah', '2025'],
  ['matabumi_riau_2026.png', 'Riau', '2026'],
  ['matabumi_sulawesi_barat_2025.png', 'Sulawesi Barat', '2025'],
  ['matabumi_sumatera_selatan_2025.png', 'Sumatera Selatan', '2025'],
  ['matabumi_sumatera_selatan_2026.png', 'Sumatera Selatan', '2026'],
].map(([filename, province, detectionDate]) => ({
  filename,
  province,
  detectionDate,
  caption: {
    en: `${province} NDVI change detection (${detectionDate})`,
    id: `Deteksi perubahan NDVI ${province} (${detectionDate})`,
  },
  description: {
    en: 'Three-panel output comparing NDVI before, NDVI after, and vegetation-loss change intensity.',
    id: 'Output tiga panel yang membandingkan NDVI sebelum, NDVI sesudah, dan intensitas perubahan kehilangan vegetasi.',
  },
  patternNote: {
    en: 'Use the red change panel to compare compact, fragmented, and contiguous vegetation-loss patterns.',
    id: 'Gunakan panel perubahan merah untuk membandingkan pola kehilangan vegetasi yang kompak, terfragmentasi, dan menyambung.',
  },
}));

const pipeline = {
  en: [
    ['Satellite imagery', 'Fetch Sentinel-2 before and after windows from Microsoft Planetary Computer.'],
    ['NDVI calculation', 'Convert NIR and Red bands into a vegetation health index.'],
    ['Change detection', 'Subtract after NDVI from before NDVI to find vegetation decrease.'],
    ['Cause classification', 'Score shape, intensity, patches, and regional heuristics.'],
    ['Severity scoring', 'Combine area impact, cause risk, and protected-zone context.'],
    ['Web visualization', 'Store alerts and expose them through the dashboard and API.'],
  ],
  id: [
    ['Citra satelit', 'Mengambil jendela sebelum dan sesudah dari Sentinel-2 melalui Microsoft Planetary Computer.'],
    ['Perhitungan NDVI', 'Mengubah band NIR dan Red menjadi indeks kesehatan vegetasi.'],
    ['Deteksi perubahan', 'Mengurangkan NDVI sesudah dari NDVI sebelum untuk menemukan penurunan vegetasi.'],
    ['Klasifikasi penyebab', 'Menilai bentuk, intensitas, patch, dan heuristik wilayah.'],
    ['Skor tingkat', 'Menggabungkan dampak area, risiko penyebab, dan konteks zona lindung.'],
    ['Visualisasi web', 'Menyimpan peringatan dan menampilkannya lewat dashboard serta API.'],
  ],
};

const apiEndpoints: APIEndpoint[] = [
  {
    method: 'GET',
    path: '/api/alerts',
    description: {
      en: 'Retrieve deforestation alerts with optional filters.',
      id: 'Mengambil peringatan deforestasi dengan filter opsional.',
    },
    parameters: [
      { name: 'province', type: 'string', required: false, description: { en: 'Filter by province.', id: 'Filter berdasarkan provinsi.' } },
      { name: 'severity', type: 'string', required: false, description: { en: 'Filter by low, moderate, high, or critical.', id: 'Filter rendah, sedang, tinggi, atau kritis.' } },
      { name: 'cause', type: 'string', required: false, description: { en: 'Filter by logging, plantation, mining, fire, or unknown.', id: 'Filter penebangan, perkebunan, pertambangan, kebakaran, atau tidak diketahui.' } },
      { name: 'limit', type: 'number', required: false, description: { en: 'Limit returned rows.', id: 'Membatasi jumlah baris.' } },
    ],
    response: 'AlertResponse[]',
    example: 'GET /api/alerts?province=Riau&severity=high',
  },
  {
    method: 'GET',
    path: '/api/provinces',
    description: { en: 'Return province-level totals and latest detections.', id: 'Mengembalikan total tingkat provinsi dan deteksi terbaru.' },
    parameters: [],
    response: 'ProvinceStats[]',
    example: 'GET /api/provinces',
  },
  {
    method: 'GET',
    path: '/api/stats',
    description: { en: 'Return national KPI totals.', id: 'Mengembalikan total KPI nasional.' },
    parameters: [],
    response: 'NationalStats',
    example: 'GET /api/stats',
  },
  {
    method: 'GET',
    path: '/api/trends',
    description: { en: 'Return monthly trend points, optionally by province.', id: 'Mengembalikan titik tren bulanan, opsional berdasarkan provinsi.' },
    parameters: [{ name: 'province', type: 'string', required: false, description: { en: 'Optional province filter.', id: 'Filter provinsi opsional.' } }],
    response: 'TrendPoint[]',
    example: 'GET /api/trends?province=Aceh',
  },
  {
    method: 'GET',
    path: '/api/forecast',
    description: { en: 'Return projected risk values when forecast data is available.', id: 'Mengembalikan proyeksi risiko saat data forecast tersedia.' },
    parameters: [],
    response: 'ForecastPoint[]',
    example: 'GET /api/forecast',
  },
  {
    method: 'GET',
    path: '/api/thumbnails/{filename}',
    description: { en: 'Serve generated alert thumbnails.', id: 'Menyajikan thumbnail peringatan yang dihasilkan.' },
    parameters: [{ name: 'filename', type: 'string', required: true, description: { en: 'Thumbnail filename.', id: 'Nama file thumbnail.' } }],
    response: 'image/jpeg',
    example: 'GET /api/thumbnails/Riau_2026-03-15_0.jpg',
  },
];

const faq = {
  en: [
    ['How often is the data updated?', 'The pipeline is designed around recurring Sentinel-2 availability; imagery revisits are about every 5 days, while alert windows compare recent and previous 30-day periods.'],
    ['What is NDVI?', 'NDVI is a vegetation index that compares near-infrared and red reflectance to estimate plant health.'],
    ['How accurate is cause classification?', 'Cause labels are rule-based confidence estimates, bounded between 60% and 85%, not legal proof.'],
    ['Can I download the data?', 'Yes. Developers can use the API endpoints, and visual examples include download links.'],
    ['What does critical severity mean?', 'Critical indicates very high computed severity or any alert inside the configured protected provinces.'],
    ['Why are some provinces missing data?', 'Cloud cover, imagery availability, and filtering can prevent usable observations in a period.'],
    ['Is this real time?', 'No. It is near-periodic monitoring based on available satellite scenes and comparison windows.'],
    ['Can I use this for research?', 'Yes, with proper attribution to MataBumi, Sentinel-2, ESA, and Microsoft Planetary Computer.'],
    ['Does it prove illegal activity?', 'No. MataBumi detects vegetation loss patterns; legal interpretation requires field and policy context.'],
    ['How can I contribute?', 'Improve code, documentation, translations, issue reports, or validation workflows through the project repository.'],
  ],
  id: [
    ['Seberapa sering data diperbarui?', 'Pipeline dirancang mengikuti ketersediaan Sentinel-2; revisit citra sekitar 5 hari, sementara peringatan membandingkan periode 30 hari terbaru dan sebelumnya.'],
    ['Apa itu NDVI?', 'NDVI adalah indeks vegetasi yang membandingkan pantulan near-infrared dan red untuk memperkirakan kesehatan tanaman.'],
    ['Seberapa akurat klasifikasi penyebab?', 'Label penyebab adalah estimasi berbasis aturan dengan keyakinan 60% sampai 85%, bukan bukti hukum.'],
    ['Bisakah saya mengunduh data?', 'Ya. Developer dapat menggunakan endpoint API, dan contoh visual memiliki tautan unduh.'],
    ['Apa arti tingkat kritis?', 'Kritis berarti skor sangat tinggi atau peringatan berada di provinsi zona lindung yang dikonfigurasi.'],
    ['Mengapa beberapa provinsi tidak punya data?', 'Tutupan awan, ketersediaan citra, dan filter dapat membuat observasi tidak layak pada periode tertentu.'],
    ['Apakah ini real-time?', 'Tidak. Ini pemantauan periodik dekat-waktu berdasarkan scene satelit dan jendela perbandingan.'],
    ['Bisakah dipakai untuk riset?', 'Ya, dengan atribusi kepada MataBumi, Sentinel-2, ESA, dan Microsoft Planetary Computer.'],
    ['Apakah ini membuktikan aktivitas ilegal?', 'Tidak. MataBumi mendeteksi pola kehilangan vegetasi; interpretasi hukum membutuhkan konteks lapangan dan kebijakan.'],
    ['Bagaimana cara berkontribusi?', 'Bantu kode, dokumentasi, terjemahan, laporan isu, atau workflow validasi melalui repositori proyek.'],
  ],
};

function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState(ids[0]);

  useEffect(() => {
    const observers = ids
      .map((id) => {
        const element = document.getElementById(id);
        if (!element) return null;
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) setActive(id);
          },
          { rootMargin: '-20% 0px -65% 0px', threshold: 0.01 },
        );
        observer.observe(element);
        return observer;
      })
      .filter(Boolean);
    return () => observers.forEach((observer) => observer?.disconnect());
  }, [ids]);

  return active;
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-b border-border px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full">
        <h2 className="mb-6 text-2xl font-bold text-foreground md:text-3xl">{title}</h2>
        {children}
      </div>
    </section>
  );
}

function Formula({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-border bg-muted p-4 font-mono text-sm text-foreground">
      {children}
    </div>
  );
}

function InfoTable({ rows }: { rows: Array<[string, string, string]> }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[640px] text-left text-sm">
        <tbody>
          {rows.map(([a, b, c]) => (
            <tr key={a} className="border-b border-border last:border-0">
              <th className="w-48 bg-muted/50 px-4 py-3 font-semibold text-foreground">{a}</th>
              <td className="px-4 py-3 text-muted-foreground">{b}</td>
              <td className="px-4 py-3 text-muted-foreground">{c}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function HeroImageWithFallback({ image, language, onOpen }: { image: HeroImage; language: Language; onOpen: () => void }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const sources = [getLocalHeroImageUrl(image.filename), getHeroImageUrl(image.filename)];
  const url = sources[sourceIndex];
  const labels = copy[language];

  if (sourceIndex >= sources.length) {
    return (
      <div className="flex aspect-[3/1] min-h-52 items-center justify-center rounded-lg border border-border bg-muted">
        <div className="text-center text-muted-foreground">
          <ImageOff className="mx-auto mb-2" size={32} />
          <p className="text-sm">{labels.unavailable}</p>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative block w-full overflow-hidden rounded-lg border border-border bg-muted text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`${labels.open}: ${image.caption[language]}`}
    >
      {!loaded && <div className="absolute inset-0 animate-pulse bg-muted" />}
      <img
        src={url}
        alt={image.caption[language]}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(false);
          setSourceIndex((current) => current + 1);
        }}
        className="w-full object-contain transition-transform duration-300 group-hover:scale-[1.01]"
      />
    </button>
  );
}

function HeroImageGallery({ language }: { language: Language }) {
  const [index, setIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const image = heroImages[index];
  const labels = copy[language];
  const url = getLocalHeroImageUrl(image.filename);
  const next = () => setIndex((current) => (current + 1) % heroImages.length);
  const prev = () => setIndex((current) => (current - 1 + heroImages.length) % heroImages.length);

  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModalOpen(false);
      if (event.key === 'ArrowRight') next();
      if (event.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modalOpen]);

  return (
    <div className="space-y-4">
      <HeroImageWithFallback image={image} language={language} onOpen={() => setModalOpen(true)} />
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{image.caption[language]}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{image.description[language]}</p>
          <p className="mt-2 text-sm text-primary">{image.patternNote[language]}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={prev} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted" aria-label="Previous image">
            <ChevronLeft size={18} />
          </button>
          <button onClick={next} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted" aria-label="Next image">
            <ChevronRight size={18} />
          </button>
          <a href={url} download className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted">
            <Download size={16} />
            {labels.download}
          </a>
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2 md:grid-cols-10 lg:grid-cols-[repeat(15,minmax(0,1fr))]">
        {heroImages.map((item, itemIndex) => (
          <button
            key={item.filename}
            onClick={() => setIndex(itemIndex)}
            className={`h-2 rounded-full transition-colors ${itemIndex === index ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground/30'}`}
            aria-label={item.caption[language]}
          />
        ))}
      </div>
      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 p-4 backdrop-blur-xl" role="dialog" aria-modal="true">
          <div className="max-h-full w-full max-w-6xl">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-semibold text-foreground">{image.caption[language]}</p>
              <button onClick={() => setModalOpen(false)} className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-muted" aria-label={labels.close}>
                <X size={18} />
              </button>
            </div>
            <img src={url} alt={image.caption[language]} className="max-h-[78vh] w-full rounded-lg border border-border object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}

function CodeExample({ title, code, language }: { title: string; code: string; language: Language }) {
  const [copied, setCopied] = useState(false);
  const labels = copy[language];
  const onCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-sm font-semibold text-foreground">{title}</span>
        <button onClick={onCopy} className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
          {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
          {copied ? labels.copied : labels.copy}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm text-muted-foreground"><code>{code}</code></pre>
    </div>
  );
}

function APIEndpointCard({ endpoint, language }: { endpoint: APIEndpoint; language: Language }) {
  return (
    <article className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-primary px-2 py-1 font-mono text-xs font-bold text-primary-foreground">{endpoint.method}</span>
        <code className="rounded-md bg-muted px-2 py-1 text-sm text-foreground">{endpoint.path}</code>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{endpoint.description[language]}</p>
      {endpoint.parameters.length > 0 && (
        <div className="mb-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Type</th>
                <th className="py-2">Required</th>
                <th className="py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {endpoint.parameters.map((param) => (
                <tr key={param.name} className="border-t border-border">
                  <td className="py-2 font-mono text-foreground">{param.name}</td>
                  <td className="py-2 text-muted-foreground">{param.type}</td>
                  <td className="py-2 text-muted-foreground">{param.required ? 'yes' : 'no'}</td>
                  <td className="py-2 text-muted-foreground">{param.description[language]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-md bg-muted p-3">
          <div className="mb-1 text-xs font-semibold text-muted-foreground">Response</div>
          <code className="text-sm text-foreground">{endpoint.response}</code>
        </div>
        <div className="rounded-md bg-muted p-3">
          <div className="mb-1 text-xs font-semibold text-muted-foreground">Example</div>
          <code className="text-sm text-foreground">{endpoint.example}</code>
        </div>
      </div>
    </article>
  );
}

function FAQSection({ language }: { language: Language }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-3">
      {faq[language].map(([question, answer], index) => (
        <div key={question} className="rounded-lg border border-border bg-card">
          <button
            onClick={() => setOpen(open === index ? -1 : index)}
            className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left font-medium text-foreground"
          >
            {question}
            <ChevronDown className={`shrink-0 transition-transform ${open === index ? 'rotate-180' : ''}`} size={18} />
          </button>
          {open === index && <p className="border-t border-border px-4 py-3 text-sm leading-relaxed text-muted-foreground">{answer}</p>}
        </div>
      ))}
    </div>
  );
}

export default function DocumentationPage({ language, onBackToDashboard }: DocumentationPageProps) {
  const labels = copy[language];
  const sectionIds = useMemo(() => sections.map((section) => section.id), []);
  const active = useScrollSpy(sectionIds);
  const [mobileOpen, setMobileOpen] = useState(false);

  const goToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileOpen(false);
  };

  const sidebar = (
    <nav className="space-y-1 p-3" aria-label={labels.menu}>
      {sections.map(({ id, icon: Icon }) => (
        <button
          key={id}
          onClick={() => goToSection(id)}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
            active === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          }`}
        >
          <Icon size={16} />
          {labels.nav[id]}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-background text-foreground">
      <a href="#main-docs" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-20 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        Skip to content
      </a>
      <div className="flex w-full gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-6 overflow-hidden rounded-xl border border-border bg-card shadow-2xl backdrop-blur-xl">
            {sidebar}
          </div>
        </aside>

        <main id="main-docs" className="min-w-0 flex-1 overflow-hidden rounded-xl border border-border bg-card/40 shadow-2xl">
          <section className="border-b border-border bg-gradient-to-br from-primary/10 via-background to-background px-4 py-10 sm:px-6 lg:px-8">
            <div className="w-full">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <button onClick={onBackToDashboard} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted">
                  <ChevronLeft size={16} />
                  {labels.back}
                </button>
                <button onClick={() => setMobileOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground hover:bg-muted lg:hidden">
                  <Menu size={16} />
                  {labels.menu}
                </button>
              </div>
              <h1 className="max-w-3xl text-4xl font-bold text-foreground md:text-5xl">{labels.pageTitle}</h1>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted-foreground">{labels.subtitle}</p>
            </div>
          </section>

          <Section id="about" title={labels.nav.about}>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                ['38', language === 'en' ? 'Indonesian provinces covered' : 'Provinsi Indonesia tercakup'],
                ['AI Talent 2026', language === 'en' ? 'Social impact competition context' : 'Konteks kompetisi dampak sosial'],
                ['Open API', language === 'en' ? 'Data access for researchers and builders' : 'Akses data untuk peneliti dan developer'],
              ].map(([value, label]) => (
                <div key={value} className="rounded-lg border border-border bg-card p-5">
                  <div className="text-2xl font-bold text-primary">{value}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{label}</div>
                </div>
              ))}
            </div>
            <p className="mt-6 leading-relaxed text-muted-foreground">
              {language === 'en'
                ? 'MataBumi is a national forest transparency application for Indonesia. It helps environmental organizations, agencies, researchers, journalists, and citizens see where significant vegetation loss is likely occurring.'
                : 'MataBumi adalah aplikasi transparansi hutan nasional untuk Indonesia. Platform ini membantu organisasi lingkungan, lembaga pemerintah, peneliti, jurnalis, dan warga melihat lokasi potensi kehilangan vegetasi signifikan.'}
            </p>
          </Section>

          <Section id="how-it-works" title={labels.nav['how-it-works']}>
            <div className="grid gap-3 md:grid-cols-2">
              {pipeline[language].map(([title, text], index) => (
                <div key={title} className="flex gap-4 rounded-lg border border-border bg-card p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{index + 1}</div>
                  <div>
                    <h3 className="font-semibold text-foreground">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{text}</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section id="visual-examples" title={labels.nav['visual-examples']}>
            <p className="mb-5 leading-relaxed text-muted-foreground">
              {language === 'en'
                ? 'Each generated image shows NDVI before, NDVI after, and the change map. The RdYlGn panels show vegetation health from low to high; the red panel highlights vegetation loss.'
                : 'Setiap gambar menampilkan NDVI sebelum, NDVI sesudah, dan peta perubahan. Panel RdYlGn menunjukkan kesehatan vegetasi dari rendah ke tinggi; panel merah menyorot kehilangan vegetasi.'}
            </p>
            <HeroImageGallery language={language} />
          </Section>

          <Section id="technical-details" title={labels.nav['technical-details']}>
            {language === 'en' ? (
              <>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  NDVI (Normalized Difference Vegetation Index) is a numerical index that measures vegetation health of an area from satellite data, with output ranging from -1 to +1 — the higher the value, the denser and healthier the vegetation.
                </p>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  This index was first introduced in 1973 by John Rouse and his team at the Remote Sensing Center, Texas A&M University, then popularized for global vegetation monitoring by Compton Tucker from NASA in 1979.
                </p>
                <h3 className="mb-3 mt-6 text-xl font-semibold text-foreground">Physical Basis</h3>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  NDVI leverages the unique properties of chlorophyll in plants. Healthy vegetation behaves very differently to these two light bands:
                </p>
                <InfoTable
                  rows={[
                    ['NIR — Sentinel-2 Band 8', language === 'en' ? 'Strongly reflected by leaf cell structure' : 'Dipantulkan sangat kuat oleh struktur sel daun', ''],
                    ['Red — Sentinel-2 Band 4', language === 'en' ? 'Absorbed by chlorophyll for photosynthesis' : 'Diserap klorofil untuk proses fotosintesis', ''],
                  ]}
                />
                <p className="mb-4 mt-4 leading-relaxed text-muted-foreground">
                  The formula calculates the contrast ratio between them so results can be compared across different scenes and atmospheric conditions:
                </p>
                <Formula>NDVI = (NIR - Red) / (NIR + Red + 1e-10)</Formula>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  Healthy vegetation → high NIR, low Red → NDVI approaches +1. Water or buildings → both low or reversed → NDVI approaches 0 or negative.
                </p>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  <strong>Why + 1e-10?</strong> This small epsilon is added to the denominator to prevent ZeroDivisionError on pixels with zero total reflectance — for example, deep shadows or water bodies that absorb all light. The value 0.0000000001 is too small to affect accuracy, but ensures the program doesn't crash. This is standard practice in Python, Google Earth Engine, and ArcGIS.
                </p>
                <h3 className="mb-3 mt-6 text-xl font-semibold text-foreground">NDVI Value Interpretation</h3>
                <InfoTable
                  rows={[
                    ['0.6 – 0.9', 'Dense forest / very healthy vegetation', ''],
                    ['0.2 – 0.5', 'Moderate vegetation / grassland', ''],
                    ['0.0 – 0.2', 'Bare soil / open land', ''],
                    ['< 0', 'Water, snow, or hard surfaces', ''],
                  ]}
                />
                <h3 className="mb-3 mt-6 text-xl font-semibold text-foreground">Vegetation Change Detection</h3>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  The system compares NDVI from two different time points on the same area:
                </p>
                <Formula>Change = NDVI_before - NDVI_after{'\n'}deforestation_mask = Change &gt; 0.2</Formula>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  An NDVI decrease greater than 0.2 between two periods is considered significant vegetation loss. This threshold is chosen to be sensitive enough to detect real land clearing, yet tolerant of normal seasonal fluctuations.
                </p>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  Calculating detected area:
                </p>
                <Formula>area_ha = pixel_count × (resolution_m²) / 10000</Formula>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  Area is calculated from the number of detected pixels multiplied by the sensor's spatial resolution, then converted to hectares. Detections below 50 ha are filtered to reduce noise and false positives from small-scale changes.
                </p>
                <h3 className="mb-3 mt-6 text-xl font-semibold text-foreground">System Parameters</h3>
                <InfoTable
                  rows={[
                    ['NIR', 'Near-infrared reflectance — Sentinel-2 Band 8', 'High in healthy vegetation'],
                    ['Red', 'Red reflectance — Sentinel-2 Band 4', 'Absorbed by chlorophyll during photosynthesis'],
                    ['Epsilon', 'Division stabilization constant', '1e-10'],
                    ['Threshold', 'NDVI decrease threshold for vegetation loss detection', 'Change > 0.2'],
                    ['Minimum area', 'Minimum area for detection to be considered valid', '50 ha'],
                  ]}
                />
                <h3 className="mb-3 mt-6 text-xl font-semibold text-foreground">Cause Classification</h3>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  Each detected area is analyzed morphologically to identify the likely cause of deforestation.
                </p>
                <InfoTable
                  rows={[
                    ['Plantation', 'Compactness < 1.5, low fragmentation, high elongation', 'Regular pattern typical of plantation land clearing'],
                    ['Mining', 'High intensity, compactness < 2.0, high convexity', 'Rough and compact shape typical of open-pit mining'],
                    ['Logging', 'Fragmentation > 0.15, compactness > 2.5, many small patches', 'Scattered loss following logging paths'],
                    ['Fire', 'Large area, few patches, high intensity', 'Homogeneous and massive pattern typical of forest fires'],
                  ]}
                />
                <h3 className="mb-3 mt-6 text-xl font-semibold text-foreground">Risk Scoring System</h3>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  Risk score is calculated from a combination of area size, cause type, and geographic location.
                </p>
                <InfoTable
                  rows={[
                    ['Area score', '< 100 ha → 20 · < 500 ha → 40 · < 2,000 ha → 70 · ≥ 2,000 ha → 90', 'Larger area = higher base score'],
                    ['Cause weight', 'Logging 1.0 · Mining 0.9 · Plantation 0.7 · Fire 0.5', 'Ecological risk weight per cause type'],
                    ['Protected bonus', '+20', 'Added if area is in protected zone'],
                    ['Final label', 'Critical ≥ 80 · High 60–79 · Moderate 35–59 · Low < 35', 'Response priority rating'],
                  ]}
                />
                <div className="mt-6">
                  <CodeExample
                    language={language}
                    title="Python NDVI calculation"
                    code={`ndvi = (nir - red) / (nir + red + 1e-10)\nchange = ndvi_before - ndvi_after\ndeforestation_mask = change > 0.2`}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  NDVI (Normalized Difference Vegetation Index) adalah indeks numerik yang mengukur kesehatan vegetasi suatu area dari data satelit, dengan output berupa angka antara -1 hingga +1 — semakin tinggi nilainya, semakin lebat dan sehat vegetasinya.
                </p>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  Indeks ini pertama kali dicetuskan pada 1973 oleh John Rouse dan timnya di Remote Sensing Center, Texas A&M University, kemudian dipopulerkan untuk pemantauan vegetasi global oleh Compton Tucker dari NASA pada 1979.
                </p>
                <h3 className="mb-3 mt-6 text-xl font-semibold text-foreground">Dasar Fisika</h3>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  NDVI memanfaatkan sifat unik klorofil pada tanaman. Vegetasi sehat berperilaku sangat berbeda terhadap dua band cahaya ini:
                </p>
                <InfoTable
                  rows={[
                    ['NIR — Sentinel-2 Band 8', 'Dipantulkan sangat kuat oleh struktur sel daun', ''],
                    ['Red — Sentinel-2 Band 4', 'Diserap klorofil untuk proses fotosintesis', ''],
                  ]}
                />
                <p className="mb-4 mt-4 leading-relaxed text-muted-foreground">
                  Rumus menghitung rasio kontras antara keduanya sehingga hasilnya dapat dibandingkan lintas scene dan kondisi atmosfer yang berbeda:
                </p>
                <Formula>NDVI = (NIR - Red) / (NIR + Red + 1e-10)</Formula>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  Vegetasi sehat → NIR tinggi, Red rendah → NDVI mendekati +1. Air atau bangunan → keduanya rendah atau terbalik → NDVI mendekati 0 atau negatif.
                </p>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  <strong>Mengapa + 1e-10?</strong> Epsilon kecil ini ditambahkan ke penyebut untuk mencegah ZeroDivisionError pada piksel dengan total reflektansi nol — misalnya bayangan pekat atau badan air yang menyerap semua cahaya. Nilai 0.0000000001 ini terlalu kecil untuk mempengaruhi akurasi hasil, tapi menjamin program tidak crash. Ini praktik standar di Python, Google Earth Engine, maupun ArcGIS.
                </p>
                <h3 className="mb-3 mt-6 text-xl font-semibold text-foreground">Makna Nilai NDVI</h3>
                <InfoTable
                  rows={[
                    ['0.6 – 0.9', 'Hutan lebat / vegetasi sangat sehat', ''],
                    ['0.2 – 0.5', 'Vegetasi sedang / padang rumput', ''],
                    ['0.0 – 0.2', 'Tanah kosong / lahan terbuka', ''],
                    ['< 0', 'Air, salju, atau permukaan keras', ''],
                  ]}
                />
                <h3 className="mb-3 mt-6 text-xl font-semibold text-foreground">Deteksi Perubahan Vegetasi</h3>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  Sistem membandingkan NDVI dari dua titik waktu berbeda pada area yang sama:
                </p>
                <Formula>Change = NDVI_before - NDVI_after{'\n'}deforestation_mask = Change &gt; 0.2</Formula>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  Penurunan NDVI lebih dari 0.2 antara dua periode dianggap sebagai kehilangan vegetasi signifikan. Threshold ini dipilih agar cukup sensitif mendeteksi pembukaan lahan nyata, namun toleran terhadap fluktuasi musiman normal.
                </p>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  Menghitung luas area terdeteksi:
                </p>
                <Formula>area_ha = pixel_count × (resolution_m²) / 10000</Formula>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  Luas dihitung dari jumlah piksel terdeteksi dikalikan resolusi spasial sensor, lalu dikonversi ke hektar. Deteksi di bawah 50 ha disaring untuk mengurangi noise dan false positive dari perubahan skala kecil.
                </p>
                <h3 className="mb-3 mt-6 text-xl font-semibold text-foreground">Parameter Sistem</h3>
                <InfoTable
                  rows={[
                    ['NIR', 'Reflektansi near-infrared — Sentinel-2 Band 8', 'Tinggi pada vegetasi sehat'],
                    ['Red', 'Reflektansi merah — Sentinel-2 Band 4', 'Diserap klorofil saat fotosintesis'],
                    ['Epsilon', 'Konstanta stabilisasi pembagian', '1e-10'],
                    ['Threshold', 'Ambang batas penurunan NDVI untuk deteksi kehilangan vegetasi', 'Change > 0.2'],
                    ['Minimum area', 'Luas minimum agar deteksi dianggap valid', '50 ha'],
                  ]}
                />
                <h3 className="mb-3 mt-6 text-xl font-semibold text-foreground">Klasifikasi Penyebab</h3>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  Setiap area terdeteksi dianalisis morfologinya untuk mengidentifikasi kemungkinan penyebab deforestasi.
                </p>
                <InfoTable
                  rows={[
                    ['Plantation', 'Compactness < 1.5, fragmentasi rendah, elongasi tinggi', 'Pola teratur khas pembukaan lahan perkebunan'],
                    ['Mining', 'Intensitas tinggi, compactness < 2.0, convexity tinggi', 'Bentuk kasar dan padat khas area tambang terbuka'],
                    ['Logging', 'Fragmentation > 0.15, compactness > 2.5, banyak patch kecil', 'Kehilangan tersebar mengikuti jalur penebangan'],
                    ['Fire', 'Area luas, patch sedikit, intensitas tinggi', 'Pola homogen dan masif khas kebakaran hutan'],
                  ]}
                />
                <h3 className="mb-3 mt-6 text-xl font-semibold text-foreground">Sistem Skoring Risiko</h3>
                <p className="mb-4 leading-relaxed text-muted-foreground">
                  Skor risiko dihitung dari kombinasi luas area, jenis penyebab, dan lokasi geografis.
                </p>
                <InfoTable
                  rows={[
                    ['Area score', '< 100 ha → 20 · < 500 ha → 40 · < 2.000 ha → 70 · ≥ 2.000 ha → 90', 'Semakin luas, semakin tinggi skor dasar'],
                    ['Cause weight', 'Logging 1.0 · Mining 0.9 · Plantation 0.7 · Fire 0.5', 'Bobot risiko ekologis per jenis penyebab'],
                    ['Protected bonus', '+20', 'Ditambahkan jika area berada di kawasan lindung'],
                    ['Label akhir', 'Critical ≥ 80 · High 60–79 · Moderate 35–59 · Low < 35', 'Peringkat prioritas respon'],
                  ]}
                />
                <div className="mt-6">
                  <CodeExample
                    language={language}
                    title="Perhitungan NDVI Python"
                    code={`ndvi = (nir - red) / (nir + red + 1e-10)\nchange = ndvi_before - ndvi_after\ndeforestation_mask = change > 0.2`}
                  />
                </div>
              </>
            )}
          </Section>

          <Section id="data-sources" title={labels.nav['data-sources']}>
            <div className="space-y-4 text-muted-foreground">
              <p>{language === 'en' ? 'MataBumi uses Sentinel-2 imagery accessed through Microsoft Planetary Computer. Sentinel-2 is operated by the European Space Agency and offers frequent multispectral observations.' : 'MataBumi menggunakan citra Sentinel-2 melalui Microsoft Planetary Computer. Sentinel-2 dioperasikan oleh European Space Agency dan menyediakan observasi multispektral berkala.'}</p>
              <p>{language === 'en' ? 'The current MVP works with 60m processing resolution while using Red and NIR spectral bands. Cloud cover filtering prefers scenes below 15%, with a 25% fallback.' : 'MVP saat ini menggunakan resolusi pemrosesan 60m dengan band Red dan NIR. Filter tutupan awan memprioritaskan scene di bawah 15%, dengan fallback 25%.'}</p>
              <a className="inline-flex items-center gap-2 text-primary hover:underline" href="https://planetarycomputer.microsoft.com/" target="_blank" rel="noopener noreferrer">
                Microsoft Planetary Computer <ExternalLink size={16} />
              </a>
            </div>
          </Section>

          <Section id="technology-stack" title={labels.nav['technology-stack']}>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                ['Data acquisition', 'planetary-computer, pystac-client, stackstac'],
                ['Detection pipeline', 'Python, NumPy, SciPy, matplotlib'],
                ['Backend API', 'FastAPI, SQLite, Pydantic'],
                ['Frontend dashboard', 'React, Vite, TypeScript, Tailwind CSS, Leaflet, Recharts'],
              ].map(([title, body]) => (
                <div key={title} className="rounded-lg border border-border bg-card p-4">
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="api-documentation" title={labels.nav['api-documentation']}>
            <div className="mb-5 rounded-lg border border-border bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                {language === 'en' ? 'Base URL: use the deployed backend origin or local development server.' : 'Base URL: gunakan origin backend produksi atau server lokal pengembangan.'}
              </p>
            </div>
            <div className="space-y-4">
              {apiEndpoints.map((endpoint) => <APIEndpointCard key={endpoint.path} endpoint={endpoint} language={language} />)}
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <CodeExample language={language} title="TypeScript" code={`const response = await fetch('/api/alerts?province=Aceh');\nconst alerts = await response.json();`} />
              <CodeExample language={language} title="Python" code={`import requests\nalerts = requests.get('/api/alerts', params={'province': 'Aceh'}).json()`} />
            </div>
          </Section>

          <Section id="methodology" title={labels.nav.methodology}>
            <p className="mb-5 leading-relaxed text-muted-foreground">
              {language === 'en'
                ? 'The classifier is intentionally rule-based: it does not need training labels, and every result can be explained through shape, intensity, patch, and geographic signals.'
                : 'Classifier sengaja berbasis aturan: tidak membutuhkan label pelatihan, dan setiap hasil dapat dijelaskan lewat sinyal bentuk, intensitas, patch, serta wilayah.'}
            </p>
            <InfoTable rows={[
              ['Fragmentation', 'number_of_patches / total_area', language === 'en' ? 'Higher means more scattered loss.' : 'Lebih tinggi berarti kehilangan lebih tersebar.'],
              ['Compactness', 'perimeter^2 / (4*pi*area)', language === 'en' ? 'Near 1 is compact; high is irregular.' : 'Mendekati 1 kompak; tinggi lebih tidak teratur.'],
              ['Mean intensity', 'average NDVI change', language === 'en' ? 'Strength of vegetation loss.' : 'Kekuatan kehilangan vegetasi.'],
              ['Elongation', 'major_axis / minor_axis', language === 'en' ? 'Captures row-like shapes.' : 'Menangkap bentuk memanjang.'],
              ['Convexity', 'area / convex_hull_area', language === 'en' ? 'Captures regularity.' : 'Menangkap keteraturan.'],
              ['Edge density', 'perimeter / area', language === 'en' ? 'Captures boundary complexity.' : 'Menangkap kompleksitas batas.'],
            ]} />
            <p className="mt-5 text-muted-foreground">
              {language === 'en'
                ? 'Confidence starts from score strength, increases when one cause clearly wins, receives a geographic boost when appropriate, and is bounded from 0.60 to 0.85.'
                : 'Keyakinan dimulai dari kekuatan skor, meningkat saat satu penyebab menang jelas, mendapat boost geografis bila sesuai, dan dibatasi dari 0,60 hingga 0,85.'}
            </p>
          </Section>

          <Section id="limitations" title={labels.nav.limitations}>
            <div className="grid gap-3 md:grid-cols-2">
              {(language === 'en'
                ? ['Cloud cover can hide usable imagery.', '60m processing can miss small events.', 'Cause classification is a conservative estimate.', 'A 50 ha threshold filters smaller changes.', 'The system is not real-time.', 'Vegetation loss does not prove illegality.']
                : ['Tutupan awan dapat menutup citra layak.', 'Pemrosesan 60m dapat melewatkan kejadian kecil.', 'Klasifikasi penyebab adalah estimasi konservatif.', 'Ambang 50 ha menyaring perubahan kecil.', 'Sistem ini bukan real-time.', 'Kehilangan vegetasi tidak membuktikan aktivitas ilegal.']
              ).map((item) => (
                <div key={item} className="flex gap-3 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                  <AlertTriangle className="shrink-0 text-primary" size={18} />
                  {item}
                </div>
              ))}
            </div>
          </Section>

          <Section id="faq" title={labels.nav.faq}>
            <FAQSection language={language} />
          </Section>

          <Section id="contact" title={labels.nav.contact}>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="text-xl font-semibold text-foreground">
                {language === 'en' ? 'Contribute to MataBumi' : 'Berkontribusi ke MataBumi'}
              </h3>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                {language === 'en'
                  ? 'Contributions can include code, documentation, translations, validation notes, bug reports, and feature suggestions for the AI Talent Challenge 2026 project.'
                  : 'Kontribusi dapat berupa kode, dokumentasi, terjemahan, catatan validasi, laporan bug, dan saran fitur untuk proyek AI Talent Challenge 2026.'}
              </p>
            </div>
            <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>{labels.version}</span>
              <span>{labels.updated}</span>
            </footer>
          </Section>
        </main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[90] bg-background/80 backdrop-blur-sm lg:hidden">
          <div className="h-full w-80 max-w-[85vw] border-r border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <span className="font-semibold text-foreground">{labels.menu}</span>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted" aria-label={labels.close}>
                <X size={18} />
              </button>
            </div>
            {sidebar}
          </div>
        </div>
      )}
    </div>
  );
}
