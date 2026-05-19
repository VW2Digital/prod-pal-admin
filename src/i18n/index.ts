import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import pt from './locales/pt.json';
import es from './locales/es.json';
import en from './locales/en.json';

export const SUPPORTED_LANGUAGES = ['pt', 'es', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * i18next: motor de tradução de toda a aplicação.
 *
 * - Padrão e fallback: PT (Português de Portugal). Forçado por requisito.
 * - Deteção: ?lang= na URL → localStorage → cookie. NÃO usa o idioma do browser,
 *   para garantir que PT-PT é sempre o ponto de partida.
 * - Persistência: cookie + localStorage, chave `language`.
 */
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      pt: { translation: pt },
      es: { translation: es },
      en: { translation: en },
    },
    fallbackLng: 'pt',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    nonExplicitSupportedLngs: true, // 'pt-PT' → 'pt'
    load: 'languageOnly',
    interpolation: { escapeValue: false },
    detection: {
      // Não inclui 'navigator' — PT é forçado se nada estiver guardado.
      order: ['querystring', 'localStorage', 'cookie'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'language',
      lookupCookie: 'language',
      caches: ['localStorage', 'cookie'],
      cookieMinutes: 60 * 24 * 365, // 1 ano
      cookieOptions: { path: '/', sameSite: 'lax' },
    },
    returnNull: false,
  });

export default i18n;
