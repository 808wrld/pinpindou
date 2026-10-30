import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import zh from '@/i18n/zh-CN.json'
import en from '@/i18n/en.json'

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { 'zh-CN': { translation: zh }, en: { translation: en } },
    fallbackLng: 'zh-CN',
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  })

// Keep <html lang> in sync so screen readers, hyphenation and :lang() CSS
// (used to relax letter-spacing for Chinese) follow the UI language.
function syncDocumentLang(lng: string | undefined) {
  if (typeof document !== 'undefined' && lng) document.documentElement.lang = lng
}
syncDocumentLang(i18n.resolvedLanguage ?? i18n.language)
i18n.on('languageChanged', syncDocumentLang)

export default i18n
