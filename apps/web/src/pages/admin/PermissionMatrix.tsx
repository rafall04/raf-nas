import React, { useEffect, useRef, useState } from 'react';
import { Role, ROLE_LABEL_ID } from '@rafnas/shared';
import { Button } from '../../ui/primitives';
import { Icon } from '../../ui/icons';
import { fetchMatrix, saveMatrix } from '../../lib/api';
import { useFetch } from '../../lib/useFetch';
import { AdminNotice } from './AdminPage';

const OPTIONS: Role[] = [Role.VIEWER, Role.CONTRIBUTOR, Role.EDITOR, Role.MANAGER, Role.NONE];

interface MenuState {
  groupId: string;
  spaceId: string;
  x: number;
  y: number;
}

export function PermissionMatrix(): JSX.Element {
  const state = useFetch(fetchMatrix);
  const [edits, setEdits] = useState<Record<string, Role>>({});
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [showExceptions, setShowExceptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (): void => setMenu(null);
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setMenu(null);
    };
    const onDown = (e: MouseEvent): void => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(null);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [menu]);

  const head = (
    <div className="adm-head">
      <div>
        <h1>Hak akses</h1>
        <p>Matriks Group × Ruang. Klik sel untuk mengubah peran. Perubahan tidak langsung tersimpan — tinjau dulu, lalu Simpan.</p>
      </div>
    </div>
  );

  if (state.loading) return <>{head}<AdminNotice>Memuat…</AdminNotice></>;
  if (state.forbidden) return <>{head}<AdminNotice>Hanya Admin IT yang bisa mengubah hak akses. Masuk sebagai <b>admin.it</b>.</AdminNotice></>;
  if (state.error || !state.data) return <>{head}<AdminNotice>Gagal memuat matriks.</AdminNotice></>;

  const { groups, spaces, grants: saved } = state.data;

  const roleOf = (key: string): Role => edits[key] ?? (saved[key] as Role | undefined) ?? Role.NONE;
  const isChanged = (key: string): boolean => key in edits && edits[key] !== ((saved[key] as Role | undefined) ?? Role.NONE);
  const changedKeys = Object.keys(edits).filter(isChanged);

  function openMenu(e: React.MouseEvent<HTMLButtonElement>, groupId: string, spaceId: string): void {
    const r = e.currentTarget.getBoundingClientRect();
    const menuW = 210;
    const menuH = 272;
    let x = r.left;
    let y = r.bottom + 4;
    if (x + menuW > window.innerWidth - 8) x = window.innerWidth - menuW - 8;
    if (y + menuH > window.innerHeight - 8) y = r.top - menuH - 4;
    setMenu({ groupId, spaceId, x, y });
  }
  function pick(role: Role): void {
    if (!menu) return;
    setEdits((prev) => ({ ...prev, [`${menu.groupId}|${menu.spaceId}`]: role }));
    setMenu(null);
  }
  async function save(): Promise<void> {
    const changes: Record<string, string> = {};
    for (const k of changedKeys) changes[k] = edits[k];
    setSaving(true);
    try {
      await saveMatrix(changes);
      setEdits({});
      state.reload();
    } finally {
      setSaving(false);
    }
  }

  const menuGroup = menu ? groups.find((g) => g.id === menu.groupId) : null;
  const menuSpace = menu ? spaces.find((s) => s.id === menu.spaceId) : null;
  const menuRole = menu ? roleOf(`${menu.groupId}|${menu.spaceId}`) : Role.NONE;

  return (
    <>
      {head}
      <div className="adm-content">
        <div className="matrix-wrap">
          <table className="matrix">
            <thead>
              <tr>
                <th className="corner">Group</th>
                {spaces.map((s) => <th key={s.id}>{s.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id}>
                  <th>
                    <div className="g-name">{g.name}</div>
                    <div className="g-members">{g.members} anggota</div>
                  </th>
                  {spaces.map((s) => {
                    const key = `${g.id}|${s.id}`;
                    const role = roleOf(key);
                    const changed = isChanged(key);
                    return (
                      <td className="cell" key={s.id}>
                        <button
                          className="cell-btn"
                          onClick={(e) => openMenu(e, g.id, s.id)}
                          style={role === Role.NONE ? { color: 'var(--ink-tertiary)', justifyContent: 'center' } : undefined}
                        >
                          {role === Role.NONE ? <span>—</span> : (<><span>{ROLE_LABEL_ID[role]}</span><Icon name="chevron-down" size={14} /></>)}
                          {changed && <span className="cell-dot" title="Belum disimpan" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="collapse">
          <button className="collapse-head" onClick={() => setShowExceptions((v) => !v)}>
            <Icon name={showExceptions ? 'chevron-down' : 'chevron-right'} size={16} />
            Pengecualian per-folder
          </button>
          {showExceptions && (
            <div className="collapse-body">
              Pengecualian menimpa grant ruang untuk folder tertentu (paling spesifik menang; "Tidak ada akses" selalu menang). Editor daftar pengecualian dibangun berikutnya.
            </div>
          )}
        </div>

        <div className="role-defs">
          <div className="role-def"><h4><span className="role-badge role-viewer">Pelihat</span></h4><p>Lihat dan unduh.</p></div>
          <div className="role-def"><h4><span className="role-badge role-contributor">Kontributor</span></h4><p>+ unggah (tak bisa hapus milik orang lain).</p></div>
          <div className="role-def"><h4><span className="role-badge role-editor">Editor</span></h4><p>+ ganti nama, pindah, hapus.</p></div>
          <div className="role-def"><h4><span className="role-badge role-manager">Pengelola</span></h4><p>+ atur akses di ruang itu.</p></div>
        </div>
      </div>

      {changedKeys.length > 0 && (
        <div className="unsaved">
          <span className="txt">{changedKeys.length} perubahan belum disimpan</span>
          <span className="sp" />
          <Button variant="ghost" size="sm" onClick={() => setEdits({})} disabled={saving}>Batalkan perubahan</Button>
          <Button variant="primary" size="sm" onClick={() => void save()} disabled={saving}>{saving ? 'Menyimpan…' : 'Simpan perubahan'}</Button>
        </div>
      )}

      {menu && menuGroup && menuSpace && (
        <div className="menu" ref={menuRef} style={{ left: menu.x, top: menu.y }}>
          <div className="menu-head"><span className="mono">{menuGroup.name}</span> di {menuSpace.name}</div>
          {OPTIONS.map((r) => (
            <button key={r} className="menu-item" onClick={() => pick(r)}>
              <span>{ROLE_LABEL_ID[r]}</span>
              {menuRole === r && <Icon name="check" size={16} className="chk" />}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
