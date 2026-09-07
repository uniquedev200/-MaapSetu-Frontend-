import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { LANGUAGES, DEFAULT_LANG, STORAGE_KEY, isLangCode, type LangCode } from './languages';
import { strings } from './strings';

interface LanguageContextType {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function langFromUrl(): LangCode | null {
  try {
    const param = new URLSearchParams(window.location.search).get('lang');
    if (param && isLangCode(param)) return param;
  } catch { /* ignore */ }
  return null;
}

function detectLang(): LangCode {
  const fromUrl = langFromUrl();
  if (fromUrl) return fromUrl;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLangCode(stored)) return stored;
  } catch { /* storage unavailable */ }
  const nav = (navigator.language || (navigator as any).languages?.[0] || 'en').toLowerCase();
  for (const l of LANGUAGES) {
    if (nav === l.code || nav.startsWith(l.code + '-')) return l.code;
  }
  return DEFAULT_LANG;
}

function syncUrlLang(lang: LangCode) {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('lang', lang);
    window.history.replaceState(window.history.state, '', url.toString().replace(window.location.origin, ''));
  } catch { /* ignore */ }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => detectLang());

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const onPopState = () => {
      const next = langFromUrl();
      if (next) setLangState(next);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const setLang = useCallback((next: LangCode) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch { /* storage unavailable */ }
    syncUrlLang(next);
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let out = strings[key]?.[lang] ?? strings[key]?.[DEFAULT_LANG] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          out = out.split(`{${k}}`).join(String(v));
        }
      }
      return out;
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used within a LanguageProvider');
  return ctx;
};