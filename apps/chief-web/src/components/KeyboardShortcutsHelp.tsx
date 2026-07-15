import { X } from 'lucide-react';

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ['?'], label: 'Show / hide this help' },
  { keys: ['F'], label: 'Toggle full-screen mode' },
  { keys: ['S'], label: 'Toggle notification sound' },
  { keys: ['A'], label: 'Toggle auto-refresh' },
  { keys: ['R'], label: 'Refresh orders now' },
  { keys: ['T'], label: 'Switch Active / Completed tab' },
  { keys: ['1', '…', '9'], label: 'Focus order card by position' },
  { keys: ['↵', 'Space'], label: 'Advance status of focused order' },
  { keys: ['⌫'], label: 'Cancel focused order' },
  { keys: ['Esc'], label: 'Clear focus / close overlay' },
];

export function KeyboardShortcutsHelp({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="premium-card w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold">Keyboard shortcuts</h3>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-muted-foreground)] transition hover:bg-[var(--color-muted)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <ul className="space-y-2.5">
          {SHORTCUTS.map((s) => (
            <li key={s.label} className="flex items-center justify-between gap-4">
              <span className="text-sm text-[var(--color-foreground)]">{s.label}</span>
              <span className="flex items-center gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded-md border border-[var(--color-border)] bg-[var(--color-muted)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--color-foreground)] shadow-sm"
                  >
                    {k}
                  </kbd>
                ))}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-xs text-[var(--color-muted-foreground)]">
          Shortcuts are disabled while typing in an input.
        </p>
      </div>
    </div>
  );
}
