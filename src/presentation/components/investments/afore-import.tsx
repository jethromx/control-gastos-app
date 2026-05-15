'use client';
import { useRef, useState } from 'react';
import { Upload, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { getInvestmentUseCases } from '../../lib/di';
import { formatCurrency, formatDate } from '../../lib/utils';

// Header mapping (normalized → field key)
const HEADER_MAP: Record<string, string> = {
  'fecha':                    'date',
  'date':                     'date',
  'retiro':                   'retiro',
  'rcv':                      'retiro',
  'saldo retiro':             'retiro',
  'saldo para mi retiro':     'retiro',
  'retiro cesantia':          'retiro',
  'retiro cesantía':          'retiro',
  'vivienda':                 'vivienda',
  'infonavit':                'vivienda',
  'saldo vivienda':           'vivienda',
  'mi vivienda':              'vivienda',
  'total':                    'total',
  'saldo total':              'total',
  'saldo actual':             'total',
  'notas':                    'notes',
  'notes':                    'notes',
  'descripcion':              'notes',
  'descripción':              'notes',
};

// Detect delimiter: tab wins if first line has more tabs than commas
function detectDelimiter(firstLine: string): string {
  const tabs = (firstLine.match(/\t/g) ?? []).length;
  const commas = (firstLine.match(/,/g) ?? []).length;
  return tabs >= commas ? '\t' : ',';
}

function parseDelimited(text: string): string[][] {
  // Strip BOM (both literal ﻿ and the mojibake version), normalize line endings
  const clean = text.replace(/^﻿/, '').replace(/﻿/g, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = clean.split('\n').filter((l) => l.trim());
  if (lines.length === 0) return [];
  const delimiter = detectDelimiter(lines[0]);

  return lines.map((line) => {
    if (delimiter === '\t') return line.split('\t').map((c) => c.trim());
    const cells: string[] = [];
    let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  });
}

function parseMoney(raw: string): number {
  return parseFloat(raw.replace(/[$MXN,\s]/g, '').trim()) || 0;
}

function parseDate(raw: string): Date {
  const s = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s);
  const parts = s.split(/[/\-.]/).map(Number);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    if (c > 1000) return new Date(c, b - 1, a);
    if (a > 1000) return new Date(a, b - 1, c);
  }
  return new Date(s);
}

interface ParsedRow {
  date: Date;
  retiro: number;
  vivienda: number;
  total: number;
  notes: string;
  valid: boolean;
  errors: string[];
}

function buildRows(rows: string[][], headers: string[]): ParsedRow[] {
  const idx: Record<string, number> = {};
  headers.forEach((h, i) => {
    // strip BOM and other invisible Unicode chars before matching
    const norm = h.replace(/﻿/g, '').toLowerCase().trim();
    const key = HEADER_MAP[norm];
    if (key) idx[key] = i;
  });

  return rows.map((cells) => {
    const get = (k: string) => cells[idx[k] ?? -1] ?? '';
    const errors: string[] = [];

    const date = parseDate(get('date'));
    if (isNaN(date.getTime())) errors.push('Fecha inválida');

    const retiro = parseMoney(get('retiro'));
    const vivienda = parseMoney(get('vivienda'));
    const computedTotal = retiro + vivienda;
    const csvTotal = get('total') ? parseMoney(get('total')) : computedTotal;

    if (retiro <= 0 && vivienda <= 0) errors.push('Sin saldo');

    return {
      date, retiro, vivienda,
      total: csvTotal || computedTotal,
      notes: get('notes'),
      valid: errors.length === 0,
      errors,
    };
  });
}

interface Props {
  aforeId: string;
  onImported: () => void;
}

export function AforeImportButton({ aforeId, onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [done, setDone] = useState<{ ok: number; skip: number } | null>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const all = parseDelimited(text);
      if (all.length < 2) return;
      const [headerRow, ...dataRows] = all;
      setRows(buildRows(dataRows.filter((r) => r.some((c) => c)), headerRow));
      setDone(null);
      setOpen(true);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  }

  async function handleImport() {
    setImporting(true);
    const uc = getInvestmentUseCases();
    let ok = 0, skip = 0;
    for (const row of rows) {
      if (!row.valid) { skip++; continue; }
      try {
        await uc.upsertAforeSnapshot(aforeId, {
          snapshotDate: row.date,
          balanceRetiro: row.retiro,
          balanceVivienda: row.vivienda,
          notes: row.notes || undefined,
        });
        ok++;
      } catch { skip++; }
    }
    setImporting(false);
    setDone({ ok, skip });
    onImported();
  }

  function handleClose() { setOpen(false); setRows([]); setDone(null); }

  const validCount = rows.filter((r) => r.valid).length;

  return (
    <>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
        <Upload className="h-4 w-4 mr-2" />Importar CSV
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              Vista previa — importar saldos AFORE
            </DialogTitle>
          </DialogHeader>

          {done ? (
            <div className="flex flex-col items-center gap-4 py-10">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">{done.ok} registro{done.ok !== 1 ? 's' : ''} importado{done.ok !== 1 ? 's' : ''}</p>
                {done.skip > 0 && <p className="text-sm text-slate-500 mt-1">{done.skip} fila{done.skip !== 1 ? 's' : ''} omitida{done.skip !== 1 ? 's' : ''}</p>}
              </div>
              <Button onClick={handleClose}>Cerrar</Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-1">
                <Badge variant="default">{rows.length} filas</Badge>
                <Badge variant="success">{validCount} válidas</Badge>
                {rows.length - validCount > 0 && <Badge variant="destructive">{rows.length - validCount} con errores</Badge>}
              </div>

              <div className="flex-1 overflow-auto rounded-xl border border-slate-100">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50">
                    <tr className="border-b border-slate-100">
                      <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-6">#</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Fecha</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Retiro (RCV)</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Vivienda</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Total</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-slate-500 w-6" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((row, i) => (
                      <tr key={i} className={row.valid ? 'bg-white hover:bg-slate-50' : 'bg-rose-50/60'}>
                        <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2 text-slate-600">{!isNaN(row.date.getTime()) ? formatDate(row.date) : <span className="text-rose-500">Inválida</span>}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-indigo-600">{row.retiro > 0 ? formatCurrency(row.retiro) : '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-amber-600">{row.vivienda > 0 ? formatCurrency(row.vivienda) : '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-semibold text-emerald-600">{formatCurrency(row.total)}</td>
                        <td className="px-3 py-2 text-center">
                          {row.valid
                            ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 inline" />
                            : <span title={row.errors.join(', ')}><AlertCircle className="h-3.5 w-3.5 text-rose-500 inline cursor-help" /></span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-slate-400">
                  Columnas: <code className="bg-slate-100 rounded px-1">Fecha · Saldo para mi retiro · Mi vivienda · Saldo actual</code>
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose} disabled={importing}>Cancelar</Button>
                  <Button onClick={handleImport} disabled={importing || validCount === 0}>
                    {importing
                      ? <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Importando...</span>
                      : `Importar ${validCount} registro${validCount !== 1 ? 's' : ''}`}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
