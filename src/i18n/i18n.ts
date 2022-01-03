/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { i18n_en } from './en';
import { i18n_zh_cn } from './zh_cn';
import { i18n_zh_tw } from './zh_tw';
import { i18n_es } from './es';
import { i18n_tr } from './tr';

i18n
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    debug: true,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
    },
    resources: {
      en: i18n_en,
      zh_cn: i18n_zh_cn,
      zh_tw: i18n_zh_tw,
      es: i18n_es,
      tr: i18n_tr,
    },
  });

export default i18n;
