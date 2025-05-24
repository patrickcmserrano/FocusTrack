// Internationalization (i18n) system
import { addMessages, init, locale, _ } from 'svelte-i18n';
import { writable } from 'svelte/store';
import en from './locales/en';
import pt from './locales/pt';
import es from './locales/es';

// Language definitions
export const SUPPORTED_LANGUAGES = ['en', 'pt', 'es'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

// Create a custom store to hold the active language
export const currentLanguage = writable<SupportedLanguage>('pt');

// Initialize i18n
export const i18n = {
  initialize: () => {
    // Add language dictionaries
    addMessages('en', en);
    addMessages('pt', pt);
    addMessages('es', es);

    // Initialize with default values
    init({
      fallbackLocale: 'pt',
      initialLocale: getStoredLocale() || 'pt',
    });

    // Sync our custom store with the svelte-i18n locale
    locale.subscribe(value => {
      if (value && SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)) {
        currentLanguage.set(value as SupportedLanguage);
      }
    });
  },

  // Change the current language
  setLanguage: (lang: SupportedLanguage) => {
    locale.set(lang);
  },

  // Get current language
  getLanguage: (): SupportedLanguage => {
    let current: SupportedLanguage = 'pt';
    currentLanguage.subscribe(value => {
      current = value;
    })();
    return current;
  }
};

// Obter idioma armazenado localmente
function getStoredLocale() {
  try {
    if (typeof localStorage !== 'undefined') {
      const storedLocale = localStorage.getItem('preferredLanguage');
      if (storedLocale && SUPPORTED_LANGUAGES.includes(storedLocale as SupportedLanguage)) {
        return storedLocale;
      }
    }
  } catch (e) {
    console.error('Erro ao acessar localStorage:', e);
  }
  return null;
}

// Re-export what we need from svelte-i18n
export { _, locale };