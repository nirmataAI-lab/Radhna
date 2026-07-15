import { useCallback, useEffect, useState } from 'react';
import { Loader2, ScrollText, Download, RefreshCcw } from 'lucide-react';
import { fetchAuditLog } from '../api';
import type { AuditEntry } from '../api';
import { exportRowsAsCSV } from '../lib/csv';
import { Card, Button, Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Badge } from 'ui-components';

export function AuditPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async (p = page) => {
    setLoading(true);
    try {
      const res = await fetchAuditLog(p, 50);
      setEntries(res.data);
      setTotalPages(res.meta.totalPages);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(page); }, [page, load]);

  return (
    <div className="animate-in fade-in duration-300">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Audit Log</h2>
          <p className="text-[var(--color-muted-foreground)] text-sm mt-1">Admin actions & sensitive changes</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportRowsAsCSV(`audit-log-${new Date().toISOString().slice(0,10)}`, entries, [
              { key: 'timestamp', label: 'When', format: (v) => new Date(v).toISOString() },
              { key: 'admin', label: 'Admin', format: (_v, r) => r.admin?.name || r.admin?.email || '' },
              { key: 'action', label: 'Action' },
              { key: 'entity', label: 'Entity' },
              { key: 'entityId', label: 'Entity ID' },
              { key: 'reason', label: 'Reason' },
            ])}
            disabled={entries.length === 0}
          >
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button variant="outline" size="icon" onClick={() => load(page)}>
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </header>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-16 text-center"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--color-muted-foreground)]" /></div>
        ) : entries.length === 0 ? (
          <div className="p-16 text-center text-[var(--color-muted-foreground)]">
            <ScrollText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No audit entries</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(e => (
                <TableRow key={e.id}>
                  <TableCell className="text-[var(--color-muted-foreground)] text-xs whitespace-nowrap">{new Date(e.timestamp).toLocaleString()}</TableCell>
                  <TableCell className="font-medium">{e.admin?.name || <span className="text-[var(--color-muted-foreground)]">—</span>}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-[10px] font-bold tracking-wider">{e.action}</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{e.entity} <span className="text-[var(--color-muted-foreground)]">{e.entityId.slice(0, 8)}…</span></TableCell>
                  <TableCell className="text-[var(--color-muted-foreground)] text-sm">{e.reason || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
          <span className="text-sm font-medium text-[var(--color-muted-foreground)]">Page {page} of {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
