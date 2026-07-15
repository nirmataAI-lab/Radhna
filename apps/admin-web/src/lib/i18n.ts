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
      app: { title: 'Admin Panel' },
      nav: {
        dashboard: 'Dashboard',
        analytics: 'Analytics',
        orders: 'Orders',
        menu: 'Menu',
        inventory: 'Inventory',
        coupons: 'Coupons',
        reviews: 'Reviews',
        audit: 'Audit Log',
        staff: 'Staff',
      },
      sidebar: {
        newOrders: 'New Orders',
        noNewOrders: 'No new orders',
        light: 'Light',
        dark: 'Dark',
        logout: 'Logout',
      },
      common: { language: 'Language' },
    },
  },
  hi: {
    translation: {
      app: { title: 'एडमिन पैनल' },
      nav: {
        dashboard: 'डैशबोर्ड',
        analytics: 'एनालिटिक्स',
        orders: 'ऑर्डर',
        menu: 'मेन्यू',
        inventory: 'इन्वेंटरी',
        coupons: 'कूपन',
        reviews: 'समीक्षाएँ',
        audit: 'ऑडिट लॉग',
        staff: 'स्टाफ़',
      },
      sidebar: {
        newOrders: 'नए ऑर्डर',
        noNewOrders: 'कोई नया ऑर्डर नहीं',
        light: 'लाइट',
        dark: 'डार्क',
        logout: 'लॉगआउट',
      },
      common: { language: 'भाषा' },
    },
  },
  ar: {
    translation: {
      app: { title: 'لوحة الإدارة' },
      nav: {
        dashboard: 'لوحة التحكم',
        analytics: 'التحليلات',
        orders: 'الطلبات',
        menu: 'القائمة',
        inventory: 'المخزون',
        coupons: 'الكوبونات',
        reviews: 'المراجعات',
        audit: 'سجل التدقيق',
        staff: 'الموظفون',
      },
      sidebar: {
        newOrders: 'طلبات جديدة',
        noNewOrders: 'لا توجد طلبات جديدة',
        light: 'فاتح',
        dark: 'داكن',
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
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'], lookupLocalStorage: 'admin-lang' },
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
