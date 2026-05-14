import type { Language } from '../types';

interface Props {
  language: Language;
  onChange: (language: Language) => void;
}

export default function LanguageToggle({ language, onChange }: Props) {
  return (
    <div className="inline-flex border border-stone-300 bg-white" aria-label="Language">
      {(['id', 'en'] as Language[]).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`h-9 px-3 text-xs font-semibold uppercase transition ${
            language === option ? 'bg-canopy text-white' : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
