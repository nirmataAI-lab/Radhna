import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'
import { SUPPORTED_LANGS } from '../lib/i18n'

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const current = i18n.language?.split('-')[0] ?? 'en'

  return (
    <label className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2.5 text-xs text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)]">
      <Languages className="h-4 w-4" />
      <select
        aria-label={t('common.language')}
        value={SUPPORTED_LANGS.find((l) => l.code === current)?.code ?? 'en'}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="bg-transparent pr-1 text-xs font-medium focus:outline-none"
      >
        {SUPPORTED_LANGS.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </label>
  )
}
