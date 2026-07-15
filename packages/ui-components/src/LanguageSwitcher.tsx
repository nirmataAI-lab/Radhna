import { useTranslation } from 'react-i18next'
import { Languages } from 'lucide-react'

export interface Language {
  code: string;
  label: string;
}

export interface LanguageSwitcherProps {
  supportedLangs: readonly Language[];
}

export function LanguageSwitcher({ supportedLangs }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation()
  const current = i18n.language?.split('-')[0] ?? 'en'

  return (
    <label className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-2.5 text-xs text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)]">
      <Languages className="h-4 w-4" />
      <select
        aria-label={t('common.language') as string}
        value={supportedLangs.find((l) => l.code === current)?.code ?? 'en'}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="bg-transparent pr-1 text-xs font-medium focus:outline-none"
      >
        {supportedLangs.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </label>
  )
}
