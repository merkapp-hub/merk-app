import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import es from './locales/es.json';

const LANGUAGES = {
  en,
  es,
};

const LANG_CODES = Object.keys(LANGUAGES);

const LANGUAGE_DETECTOR = {
  type: 'languageDetector',
  async: true,
  detect: callback => {
    AsyncStorage.getItem('@app_language', (err, language) => {
      // if error fetching stored data or no language was stored
      // display errors when in DEV mode as console statements
      if (err || !language) {
        if (err) {
          console.log('Error fetching Languages from asyncstorage ', err);
        } else {
          console.log('No language is set, choosing English as fallback');
        }

        const findBestAvailableLanguage =
          RNLocalize.findBestAvailableLanguage(LANG_CODES);

        callback(findBestAvailableLanguage.languageTag || 'en');
        return;
      }
      callback(language);
    });
  },
  init: () => {},
  cacheUserLanguage: language => {
    AsyncStorage.setItem('@app_language', language);
  },
};

i18n
  .use(LANGUAGE_DETECTOR)
  .use(initReactI18next)
  .init({
    resources: LANGUAGES,
    react: {
      useSuspense: false,
    },
    interpolation: {
      escapeValue: false,
    },
    defaultNS: 'common',
    fallbackLng: 'en',
  });

export default i18n;
