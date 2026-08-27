'use client';

import { useState } from 'react';
import { Play, Database, FastForward, CheckCircle2, Clock, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { formatSimulatedTime } from '@/lib/simulated-time';

interface SimulationClientProps {
  initialSimulatedTime: string;
  totalCases: number;
  totalInvoices: number;
}

export function SimulationClient({
  initialSimulatedTime,
  totalCases,
  totalInvoices,
}: SimulationClientProps) {
  const [simulatedTime, setSimulatedTime] = useState(initialSimulatedTime);
  const [loading, setLoading] = useState(false);
  const [activeDays, setActiveDays] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [advanceLogs, setAdvanceLogs] = useState<string[]>([]);

  async function handleAdvance(days: number) {
    setLoading(true);
    setActiveDays(days);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/simulation/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days }),
      });
      const data = await res.json();
      if (data.success) {
        setSimulatedTime(data.currentDate);
        setStatusMessage(`Successfully advanced simulated clock by ${days} day(s).`);
        if (data.logs) {
          setAdvanceLogs((prev) => [...data.logs, ...prev].slice(0, 30));
        }
      } else {
        setStatusMessage(`Advance notice: ${data.message || data.error || 'Check server'}`);
      }
    } catch (e: any) {
      setStatusMessage(`Advanced clock simulation: ${e.message}`);
    } finally {
      setLoading(false);
      setActiveDays(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Current Simulated Clock Banner */}
      <div className="bg-white rounded-lg border border-neutral-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
              Authoritative Simulated Clock
            </p>
            <p className="text-lg font-bold text-neutral-900 font-mono mt-0.5">
              {formatSimulatedTime(simulatedTime)}
            </p>
            <p className="text-xs text-neutral-400 font-mono">{simulatedTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono bg-neutral-50 px-3.5 py-2 rounded-md border border-neutral-200">
          <div>
            <span className="text-neutral-400">Invoices: </span>
            <span className="font-semibold text-neutral-900">{totalInvoices}</span>
          </div>
          <div className="h-3 w-px bg-neutral-300" />
          <div>
            <span className="text-neutral-400">Total Cases: </span>
            <span className="font-semibold text-neutral-900">{totalCases}</span>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div className="p-3 rounded-md bg-blue-50 border border-blue-200 text-xs text-blue-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Control Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Advance Clock */}
        <div className="bg-white rounded-lg border border-neutral-200 p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center">
              <FastForward className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Advance Simulated Time</h2>
              <p className="text-xs text-neutral-500">Triggers cron evaluations, promise due dates, and escalation checks.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-2">
            <button
              onClick={() => handleAdvance(1)}
              disabled={loading}
              className="py-2 px-3 rounded-md bg-neutral-900 hover:bg-black text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {activeDays === 1 ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3" />
              )}
              {activeDays === 1 ? 'Running...' : '+1 Day'}
            </button>
            <button
              onClick={() => handleAdvance(3)}
              disabled={loading}
              className="py-2 px-3 rounded-md bg-neutral-900 hover:bg-black text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {activeDays === 3 ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <FastForward className="w-3 h-3" />
              )}
              {activeDays === 3 ? 'Running...' : '+3 Days'}
            </button>
            <button
              onClick={() => handleAdvance(7)}
              disabled={loading}
              className="py-2 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {activeDays === 7 ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <FastForward className="w-3 h-3" />
              )}
              {activeDays === 7 ? 'Running...' : '+7 Days'}
            </button>
          </div>

          <p className="text-[11px] text-neutral-400">
            Advances the authoritative clock and processes all intermediate state machine checks.
          </p>
        </div>

        {/* Synthetic Data Info */}
        <div className="bg-white rounded-lg border border-neutral-200 p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-purple-50 flex items-center justify-center">
              <Database className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Synthetic Benchmark Dataset</h2>
              <p className="text-xs text-neutral-500">200 realistic invoices across 8 evaluation scenarios.</p>
            </div>
          </div>

          <div className="p-3 bg-neutral-50 rounded-md border border-neutral-200 text-xs text-neutral-600 space-y-1">
            <p><strong>Clean separation:</strong> Scenario labels are strictly internal metadata.</p>
            <p><strong>Deterministic seed:</strong> Run <code className="bg-white px-1 py-0.5 rounded border border-neutral-200 font-mono text-[11px]">npm run generate-synthetic-data</code> to reseed.</p>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-neutral-400 font-mono">
              CLI / Webhook ready
            </span>
          </div>
        </div>
      </div>

      {/* Advance Activity Log */}
      {advanceLogs.length > 0 && (
        <div className="bg-white rounded-lg border border-neutral-200 p-4 space-y-2">
          <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">
            Cron Transition Activity
          </h3>
          <div className="p-3 rounded bg-neutral-900 text-neutral-100 font-mono text-xs max-h-48 overflow-y-auto space-y-1">
            {advanceLogs.map((log, idx) => (
              <div key={idx} className="text-[11px] leading-relaxed">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
