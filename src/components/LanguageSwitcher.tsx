import { useEffect, useRef, useState } from 'react';
import { LANGUAGES } from '../i18n/languages';
import { useLang } from '../i18n/LanguageContext';

interface Props {
  variant?: 'dropdown' | 'inline';
}

export default function LanguageSwitcher({ variant = 'dropdown' }: Props) {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const current = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center flex-wrap gap-1.5">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            onClick={() => setLang(l.code)}
            className={`px-2.5 py-1.5 rounded-full font-label-sm text-label-sm transition-all active:scale-95 ${
              l.code === lang
                ? 'bg-primary/10 text-primary font-bold'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            {l.name}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 neu-btn px-3 py-1.5 rounded-full text-on-surface-variant font-label-sm border-none cursor-pointer"
        title={t('lang.label')}
      >
        <span className="material-symbols-outlined text-[18px]">language</span>
        <span>{current.name}</span>
        <span className="material-symbols-outlined text-[16px]">{open ? 'expand_less' : 'expand_more'}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 neu-flat rounded-xl py-2 w-44">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className="w-full flex items-center justify-between gap-2 px-4 py-2 font-body-md text-body-md text-left transition-all hover:bg-surface-container-low cursor-pointer"
            >
              <span className={l.code === lang ? 'text-primary font-bold' : 'text-on-surface'}>{l.name}</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant">{l.en}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}