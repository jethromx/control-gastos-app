'use client';
import { useRef, useState } from 'react';
import { Upload, CheckCircle, AlertCircle, X, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { getInvestmentUseCases } from '../../lib/di';
import { formatCurrency, formatDate } from '../../lib/utils';

// ── Column mapping ────────────────────────────────────────────────────────────
// CSV header (normalized) → field key
const HEADER_MAP: Record<string, string> = {
  'proyecto briq':              'name',
  'nombre':                     'name',
  'proyecto':                   'name',
  'estado':                     'status',
  'monto':                      'amount',
  'monto invertido':            'amount',
  'fecha inversión':            'date',
  'fecha inversion':            'date',
  'fecha':                      'date',
  '% interés':                  'rate',
  '% interes':                  'rate',
  'tasa':                       'rate',
  'interés anual':              'rate',
  'año':                        'termYears',
  'plazo (años)':               'termYears',
  'plazo':                      'termYears',
};

// ── Parsers ───────────────────────────────────────────────────────────────────
function parseMoney(raw: string): number {
  const clean = raw.replace(/[$MXN,\s]/g, '').trim();
  return parseFloat(clean) || 0;
}

function parseRate(raw: string): number {
  return parseFloat(raw.replace('%', '').trim()) || 0;
}

// Accepts dd/mm/yyyy, mm/dd/yyyy, yyyy-mm-dd, d/m/yyyy
function parseDate(raw: string): Date {
  const s = raw.trim();
  // ISO
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return new Date(s);
  // dd/mm/yyyy or d/m/yyyy
  const parts = s.split(/[/\-.]/).map(Number);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    if (c > 1000) return new Date(c, b - 1, a);   // dd/mm/yyyy
    if (a > 1000) return new Date(a, b - 1, c);   // yyyy/mm/dd
  }
  return new Date(s);
}

function parseStatus(raw: string): 'active' | 'completed' {
  const s = raw.toLowerCase().trim();
  if (s.includes('complet') || s.includes('finaliz') || s.includes('vencid')) return 'completed';
  return 'active';
}

function parseTermMonths(raw: string): number | undefined {
  const s = raw.trim();
  if (!s) return undefined;
  const val = parseFloat(s);
  if (isNaN(val) || val <= 0) return undefined;
  if (val > 100) return undefined; // calendar year (e.g. 2024) — not a term
  return val <= 10 ? Math.round(val * 12) : Math.round(val);
}

// ── CSV parser ────────────────────────────────────────────────────────────────
function parseCSV(text: string): string[][] {
  // Strip BOM
  const clean = text.replace(/^﻿/, '');
  return clean.split('\n').filter(Boolean).map((line) => {
    const cells: string[] = [];
    let cur = '';
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === ',' && !inQ) { cells.push(cur.trim()); cur = ''; continue; }
      cur += ch;
    }
    cells.push(cur.trim());
    return cells;
  });
}

// ── Row type ──────────────────────────────────────────────────────────────────
interface ParsedRow {
  name: string;
  status: 'active' | 'completed';
  amount: number;
  date: Date;
  rate: number;
  termMonths?: number;
  valid: boolean;
  errors: string[];
}

function buildRows(rows: string[][], headers: string[]): ParsedRow[] {
  const fieldIndex: Record<string, number> = {};
  headers.forEach((h, i) => {
    const norm = h.toLowerCase().trim();
    const key = HEADER_MAP[norm];
    if (key) fieldIndex[key] = i;
  });

  return rows.map((cells) => {
    const get = (key: string) => cells[fieldIndex[key] ?? -1] ?? '';
    const errors: string[] = [];

    const name = get('name').trim();
    if (!name) errors.push('Nombre vacío');

    const amount = parseMoney(get('amount'));
    if (amount <= 0) errors.push('Monto inválido');

    const date = parseDate(get('date'));
    if (isNaN(date.getTime())) errors.push('Fecha inválida');

    const rate = parseRate(get('rate'));
    if (rate <= 0) errors.push('Tasa inválida');

    return {
      name,
      status: parseStatus(get('status')),
      amount,
      date,
      rate,
      termMonths: parseTermMonths(get('termYears')),
      valid: errors.length === 0,
      errors,
    };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props {
  userId: string;
  onImported: () => void;
}

export function BriqImportButton({ userId, onImported }: Props) {
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
      const all = parseCSV(text);
      if (all.length < 2) return;
      const [headerRow, ...dataRows] = all;
      const parsed = buildRows(dataRows.filter((r) => r.some((c) => c)), headerRow);
      setRows(parsed);
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
        await uc.createBriqInvestment(
          { userId, name: row.name, type: 'briq', status: row.status, description: '' },
          { annualInterestRate: row.rate, investedAmount: row.amount, investmentDate: row.date, termMonths: row.termMonths }
        );
        ok++;
      } catch { skip++; }
    }
    setImporting(false);
    setDone({ ok, skip });
    onImported();
  }

  function handleClose() {
    setOpen(false);
    setRows([]);
    setDone(null);
  }

  const validCount = rows.filter((r) => r.valid).length;

  return (
    <>
      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
        <Upload className="h-4 w-4 mr-2" />Importar CSV
      </Button>

      <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              Vista previa — importar inversiones Briq
            </DialogTitle>
          </DialogHeader>

          {done ? (
            <div className="flex flex-col items-center gap-4 py-10">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-900">{done.ok} inversión{done.ok !== 1 ? 'es' : ''} importada{done.ok !== 1 ? 's' : ''}</p>
                {done.skip > 0 && <p className="text-sm text-slate-500 mt-1">{done.skip} fila{done.skip !== 1 ? 's' : ''} omitida{done.skip !== 1 ? 's' : ''} por errores</p>}
              </div>
              <Button onClick={handleClose}>Cerrar</Button>
            </div>
          ) : (
            <>
              {/* Summary bar */}
              <div className="flex items-center gap-3 px-1">
                <Badge variant="default">{rows.length} filas detectadas</Badge>
                <Badge variant="success">{validCount} listas para importar</Badge>
                {rows.length - validCount > 0 && <Badge variant="destructive">{rows.length - validCount} con errores</Badge>}
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto rounded-xl border border-slate-100">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 z-10">
                    <tr className="border-b border-slate-100">
                      <th className="px-3 py-2.5 text-left font-semibold text-slate-500 w-6">#</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Proyecto</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Monto</th>
                      <th className="px-3 py-2.5 text-right font-semibold text-slate-500">Tasa</th>
                      <th className="px-3 py-2.5 text-left font-semibold text-slate-500">Fecha</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-slate-500">Plazo</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-slate-500">Estado</th>
                      <th className="px-3 py-2.5 text-center font-semibold text-slate-500 w-6" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map((row, i) => (
                      <tr key={i} className={row.valid ? 'bg-white hover:bg-slate-50' : 'bg-rose-50/60'}>
                        <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2 font-medium text-slate-900 max-w-[200px] truncate">{row.name || '—'}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{row.amount > 0 ? formatCurrency(row.amount) : <span className="text-rose-500">—</span>}</td>
                        <td className="px-3 py-2 text-right tabular-nums text-emerald-600">{row.rate > 0 ? `${row.rate}%` : <span className="text-rose-500">—</span>}</td>
                        <td className="px-3 py-2 text-slate-600">{!isNaN(row.date.getTime()) ? formatDate(row.date) : <span className="text-rose-500">Inválida</span>}</td>
                        <td className="px-3 py-2 text-center text-slate-500">{row.termMonths ? `${row.termMonths} m` : '—'}</td>
                        <td className="px-3 py-2 text-center">
                          <Badge variant={row.status === 'active' ? 'success' : 'secondary'}>
                            {row.status === 'active' ? 'Activa' : 'Completada'}
                          </Badge>
                        </td>
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

              {/* Footer */}
              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-slate-400">
                  {rows.length - validCount > 0 && 'Las filas con errores serán omitidas. Pasa el cursor sobre ⚠ para ver el detalle.'}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose} disabled={importing}>Cancelar</Button>
                  <Button onClick={handleImport} disabled={importing || validCount === 0}>
                    {importing
                      ? <span className="flex items-center gap-2"><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />Importando...</span>
                      : `Importar ${validCount} inversión${validCount !== 1 ? 'es' : ''}`}
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
