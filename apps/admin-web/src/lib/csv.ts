// CSV export helper — no dependencies, RFC 4180 quoting.

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const s = typeof value === 'string' ? value : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCSV<T>(
  rows: T[],
  columns: { key: keyof T; label: string; format?: (v: any, row: T) => unknown }[],
): string {
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((c) => escapeCell(c.format ? c.format((row as any)[c.key], row) : (row as any)[c.key]))
        .join(','),
    )
    .join('\n');
  return `${header}\n${body}`;
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportRowsAsCSV<T>(
  filename: string,
  rows: T[],
  columns: { key: keyof T; label: string; format?: (v: any, row: T) => unknown }[],
) {
  downloadCSV(filename, toCSV(rows, columns));
}
