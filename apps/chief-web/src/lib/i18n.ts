import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

export const SUPPORTED_LANGS = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'hi', label: 'हिन्दी', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
] as const

export type LangCode = (typeof SUPPORTED_LANGS)[number]['code']

const resources = {
  en: {
    translation: {
      app: { title: 'Chief KDS', subtitle: 'Kitchen Display' },
      status: {
        live: 'Live · connected',
        offline: 'Offline · reconnecting',
      },
      nav: {
        active: 'Active Orders',
        recall: 'Recall Lane',
        completed: 'Completed',
        stock: 'Prep Stock',
      },
      sidebar: {
        soundOn: 'Sound On',
        soundOff: 'Sound Off',
        logout: 'Logout',
      },
      common: { language: 'Language' },
    },
  },
  hi: {
    translation: {
      app: { title: 'शेफ KDS', subtitle: 'रसोई डिस्प्ले' },
      status: {
        live: 'लाइव · जुड़ा हुआ',
        offline: 'ऑफ़लाइन · दोबारा जोड़ रहे हैं',
      },
      nav: {
        active: 'सक्रिय ऑर्डर',
        recall: 'रीकॉल लेन',
        completed: 'पूर्ण',
        stock: 'तैयारी स्टॉक',
      },
      sidebar: {
        soundOn: 'आवाज़ चालू',
        soundOff: 'आवाज़ बंद',
        logout: 'लॉगआउट',
      },
      common: { language: 'भाषा' },
    },
  },
  ar: {
    translation: {
      app: { title: 'شاشة الشيف', subtitle: 'شاشة المطبخ' },
      status: {
        live: 'مباشر · متصل',
        offline: 'غير متصل · إعادة الاتصال',
      },
      nav: {
        active: 'الطلبات النشطة',
        recall: 'مسار الاستدعاء',
        completed: 'مكتملة',
        stock: 'مخزون التحضير',
      },
      sidebar: {
        soundOn: 'الصوت مفعّل',
        soundOff: 'الصوت مغلق',
        logout: 'تسجيل الخروج',
      },
      common: { language: 'اللغة' },
    },
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGS.map((l) => l.code),
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'], lookupLocalStorage: 'chief-lang' },
  })

function applyDir(lng: string) {
  const meta = SUPPORTED_LANGS.find((l) => l.code === lng)
  const dir = meta?.dir ?? 'ltr'
  if (typeof document !== 'undefined') {
    document.documentElement.dir = dir
    document.documentElement.lang = lng
  }
}

applyDir(i18n.language)
i18n.on('languageChanged', applyDir)

export default i18n
