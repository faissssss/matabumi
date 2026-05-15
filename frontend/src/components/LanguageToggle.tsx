import type { Language } from '../types';

interface Props {
  language: Language;
  onChange: (language: Language) => void;
}

export default function LanguageToggle({ language, onChange }: Props) {
  return (
    <div className="inline-flex border border-border bg-card rounded-lg overflow-hidden" aria-label="Language">
      {(['id', 'en'] as Language[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`h-9 px-3 text-xs font-semibold uppercase transition ${
            language === option ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
