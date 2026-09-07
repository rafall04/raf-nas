import { useEffect, useState, type ReactNode } from 'react';
import { downloadNodeUrl, searchApi, type SearchResponse } from '../lib/api';
import { formatBytes, formatDate } from '../data/types';
import { Badge, Button, EmptyState, FileTypeChip } from '../ui/primitives';
import { Icon } from '../ui/icons';
import './pages.css';

function highlight(text: string, q: string): ReactNode {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <mark className="hl">{text.slice(i, i + q.length)}</mark>
      {text.slice(i + q.length)}
    </>
  );
}

function download(id: string): void {
  const a = document.createElement('a');
  a.href = downloadNodeUrl(id);
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function SearchPage(): JSX.Element {
  const [q, setQ] = useState('laporan');
  const [data, setData] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [spaceFilter, setSpaceFilter] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const t = setTimeout(() => {
      searchApi(q)
        .then((d) => alive && (setData(d), setLoading(false)))
        .catch(() => alive && setLoading(false));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q]);

  const spaces = data?.spaces ?? [];
  const allResults = data?.results ?? [];
  const results = allResults.filter((r) => spaceFilter.size === 0 || spaceFilter.has(r.spaceId));
  const countPerSpace = (id: string): number => allResults.filter((r) => r.spaceId === id).length;

  function toggleSpace(id: string): void {
    setSpaceFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Pencarian</h1>
          <p>Cari file di semua ruang yang boleh Anda akses. Hasil difilter izin di server.</p>
        </div>
      </div>

      <div className="search-layout">
        <aside className="search-filters">
          <div className="filter-group">
            <div className="filter-title">Ruang</div>
            {spaces.map((s) => (
              <label className="filter-check" key={s.id}>
                <input type="checkbox" checked={spaceFilter.has(s.id)} onChange={() => toggleSpace(s.id)} />
                {s.name}
                <span className="cnt">{countPerSpace(s.id)}</span>
              </label>
            ))}
            {spaces.length === 0 && <div style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)' }}>—</div>}
          </div>
        </aside>

        <div className="search-results">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 12 }}>
            <div className="search" style={{ maxWidth: 360, flex: 1 }}>
              <Icon name="search" size={16} />
              <input placeholder="Kata kunci…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <div className="chips-row">
            {q && <span className="chip-filter">nama: {q}</span>}
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--ink-tertiary)' }}>
              {loading ? 'mencari…' : `${results.length} hasil`}
            </span>
          </div>

          {!loading && results.length === 0 ? (
            <EmptyState title={q ? `Tidak ada file bernama “${q}”.` : 'Ketik kata kunci untuk mencari.'} description="Coba kata kunci lain, kurangi filter, atau periksa ruang lain." />
          ) : (
            results.map((r) => (
              <div className="result" key={r.id}>
                <FileTypeChip ext={r.ext ?? undefined} />
                <div className="result-body">
                  <div className="result-name">{highlight(r.name, q)}</div>
                  <div className="result-path">{r.path}</div>
                  <div className="result-meta">
                    <span className="mono">{formatBytes(r.sizeBytes)}</span>
                    <span className="mono">{formatDate(r.updatedAt)}</span>
                    <Badge tone="info">{r.spaceName}</Badge>
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => download(r.id)}><Icon name="download" size={16} /></Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
