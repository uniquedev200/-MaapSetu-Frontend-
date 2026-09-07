export type LangCode = 'en' | 'hi' | 'mr' | 'ta' | 'te' | 'bn' | 'gu';

export interface LanguageMeta {
  code: LangCode;
  name: string;
  en: string;
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', en: 'English' },
  { code: 'hi', name: 'हिन्दी', en: 'Hindi' },
  { code: 'mr', name: 'मराठी', en: 'Marathi' },
  { code: 'ta', name: 'தமிழ்', en: 'Tamil' },
  { code: 'te', name: 'తెలుగు', en: 'Telugu' },
  { code: 'bn', name: 'বাংলা', en: 'Bengali' },
  { code: 'gu', name: 'ગુજરાતી', en: 'Gujarati' },
];

export const DEFAULT_LANG: LangCode = 'en';
export const STORAGE_KEY = 'lm_lang';

export function isLangCode(value: string | null): value is LangCode {
  return !!value && LANGUAGES.some((l) => l.code === value);
}