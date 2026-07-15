import { useCallback, useEffect, useState } from 'react';
import {
  Users, Plus, Edit3, Trash2, RefreshCcw, Loader2, ShieldCheck, ChefHat, X,
} from 'lucide-react';
import {
  fetchStaff, createStaff, updateStaff, deleteStaff,
  type StaffMember, type StaffRole,
} from './api';
import { useAuthStore } from './authStore';

const ROLE_STYLES: Record<StaffRole, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-200',
  CHIEF: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-200',
};

export function StaffTab() {
  const currentUser = useAuthStore((s) => s.user);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<StaffMember | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try { setStaff(await fetchStaff()); }
    catch (e: any) { setErr(e?.message || 'Failed to load staff'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const remove = async (m: StaffMember) => {
    if (!confirm(`Delete staff member "${m.name}"? This cannot be undone.`)) return;
    try { await deleteStaff(m.id); await load(); }
    catch (e: any) { alert(e?.message || 'Failed to delete'); }
  };

  const toggleStatus = async (m: StaffMember) => {
    try {
      await updateStaff(m.id, { status: m.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' });
      await load();
    } catch (e: any) { alert(e?.message || 'Failed to update status'); }
  };

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-7 h-7 text-[var(--color-primary)]" /> Staff
          </h2>
          <p className="text-[var(--color-muted-foreground)] text-sm mt-1">
            Manage admins and kitchen chefs
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 text-sm border border-[var(--color-border)] px-3 py-2 rounded-lg hover:bg-[var(--color-muted)] transition-colors">
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => { setEditTarget(null); setShowForm(true); }}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </header>

      {err && (
        <div className="premium-card mb-4 p-3 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-200 border-red-300">
          {err}
        </div>
      )}

      <div className="premium-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex items-center justify-center text-[var(--color-muted-foreground)]">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : staff.length === 0 ? (
          <div className="p-12 text-center text-[var(--color-muted-foreground)]">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No staff yet. Add your first team member.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-muted)]">
                  <th className="text-left p-3 font-semibold">Name</th>
                  <th className="text-left p-3 font-semibold">Email</th>
                  <th className="text-left p-3 font-semibold">Phone</th>
                  <th className="text-left p-3 font-semibold">Role</th>
                  <th className="text-left p-3 font-semibold">Status</th>
                  <th className="text-left p-3 font-semibold">Joined</th>
                  <th className="text-left p-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staff.map((m) => {
                  const isSelf = currentUser?.id === m.id;
                  return (
                    <tr key={m.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-muted)] transition-colors">
                      <td className="p-3 font-medium">
                        {m.name}
                        {isSelf && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)]">YOU</span>}
                      </td>
                      <td className="p-3 text-[var(--color-muted-foreground)]">{m.email || '—'}</td>
                      <td className="p-3 text-[var(--color-muted-foreground)]">{m.phone || '—'}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${ROLE_STYLES[m.role]}`}>
                          {m.role === 'SUPER_ADMIN' ? <ShieldCheck className="w-3 h-3" /> : <ChefHat className="w-3 h-3" />}
                          {m.role === 'SUPER_ADMIN' ? 'Admin' : 'Chief'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          disabled={isSelf}
                          onClick={() => toggleStatus(m)}
                          className={`text-xs font-bold px-2 py-1 rounded-full transition-colors ${
                            m.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          } disabled:cursor-not-allowed disabled:opacity-60`}
                          title={isSelf ? 'You cannot change your own status' : 'Toggle status'}
                        >
                          {m.status}
                        </button>
                      </td>
                      <td className="p-3 text-[var(--color-muted-foreground)]">
                        {new Date(m.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditTarget(m); setShowForm(true); }}
                            className="p-1.5 rounded bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors" title="Edit">
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => remove(m)} disabled={isSelf}
                            className="p-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title={isSelf ? 'You cannot delete yourself' : 'Delete'}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && (
        <StaffFormModal
          initial={editTarget}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={async () => { setShowForm(false); setEditTarget(null); await load(); }}
        />
      )}
    </div>
  );
}

function StaffFormModal({ initial, onClose, onSaved }: {
  initial: StaffMember | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<StaffRole>(initial?.role || 'CHIEF');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setSaving(true);
    try {
      if (isEdit && initial) {
        const patch: any = { name, phone: phone || undefined, role };
        if (password) patch.password = password;
        await updateStaff(initial.id, patch);
      } else {
        if (!email || !password) throw new Error('Email and password are required');
        await createStaff({ name, email, phone: phone || undefined, password, role });
      }
      onSaved();
    } catch (e: any) {
      setErr(e?.message || 'Failed to save');
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="premium-card w-full max-w-md p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 p-1 rounded hover:bg-[var(--color-muted)]">
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-xl font-bold mb-1">{isEdit ? 'Edit Staff' : 'Add Staff'}</h3>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-5">
          {isEdit ? 'Update the details below.' : 'Create a new admin or chef account.'}
        </p>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">Full name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full text-sm px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">Email {isEdit && <span className="opacity-60">(read-only)</span>}</label>
            <input type="email" required={!isEdit} disabled={isEdit} value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full text-sm px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] disabled:opacity-60" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">Phone (optional)</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full text-sm px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">
              {isEdit ? 'New password (leave blank to keep current)' : 'Password'}
            </label>
            <input type="password" required={!isEdit} minLength={6} value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full text-sm px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]" />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--color-muted-foreground)]">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)}
              className="mt-1 w-full text-sm px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]">
              <option value="CHIEF">Chief (Kitchen)</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
          </div>

          {err && <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded px-3 py-2">{err}</div>}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 text-sm px-4 py-2 rounded-lg border border-[var(--color-border)] hover:bg-[var(--color-muted)]">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 text-sm font-semibold px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Save changes' : 'Create staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
