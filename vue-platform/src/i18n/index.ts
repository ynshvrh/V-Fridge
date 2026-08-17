import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import ukMessages from './messages/uk.json';
import enMessages from './messages/en.json';

export type Locale = 'uk' | 'en';

const dictionaries: Record<Locale, Record<string, string>> = {
  uk: ukMessages as Record<string, string>,
  en: enMessages as Record<string, string>
};

export const useI18nStore = defineStore('i18n', () => {
  const getInitialLocale = (): Locale => {
    const saved = localStorage.getItem('vf_locale') as Locale | null;
    if (saved === 'uk' || saved === 'en') return saved;
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('uk')) return 'uk';
    return 'uk'; // default to Ukrainian
  };

  const locale = ref<Locale>(getInitialLocale());

  const setLocale = (newLocale: Locale) => {
    if (newLocale === 'uk' || newLocale === 'en') {
      locale.value = newLocale;
      localStorage.setItem('vf_locale', newLocale);
      document.documentElement.lang = newLocale;
    }
  };

  const t = (key: string, params?: Record<string, string | number | undefined | null>): string => {
    const dict = dictionaries[locale.value] || dictionaries.uk;
    let template = dict[key] || (dictionaries.en && dictionaries.en[key]) || key;

    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        const val = paramVal !== undefined && paramVal !== null ? String(paramVal) : '';
        template = template.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), val);
      });
    }

    return template;
  };

  return {
    locale,
    setLocale,
    t
  };
});

export function useI18n() {
  const store = useI18nStore();
  return {
    locale: computed(() => store.locale),
    setLocale: store.setLocale,
    t: store.t
  };
}
