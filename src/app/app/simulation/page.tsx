import { FlaskConical, Play, Database, Activity } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SimulationPage() {
  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
          Simulation & Demo
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Tools for running synthetic scenarios and testing the State Machine.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seed Data Card */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="w-10 h-10 rounded-md bg-purple-50 flex items-center justify-center mb-4">
            <Database className="w-5 h-5 text-purple-600" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900">Seed Synthetic Data</h3>
          <p className="text-sm text-neutral-500 mt-2 mb-6">
            Generates 200 synthetic invoices and debtors, mapping to the 8 core edge-case scenarios required for evaluation.
          </p>
          <button className="w-full py-2 px-4 rounded-md bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors disabled:opacity-50">
            Run Seed Script
          </button>
          <p className="text-xs text-neutral-400 mt-3 text-center">
            Note: Must be run via CLI `npm run generate-synthetic-data` for now.
          </p>
        </div>

        {/* Advance Clock Card */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="w-10 h-10 rounded-md bg-blue-50 flex items-center justify-center mb-4">
            <Play className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-base font-semibold text-neutral-900">Advance Time (Cron)</h3>
          <p className="text-sm text-neutral-500 mt-2 mb-6">
            Simulates the passage of time to trigger daily crons (Ghosting timeouts, Promise breakage, Reminders).
          </p>
          <button className="w-full py-2 px-4 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
            Trigger Daily Cron
          </button>
          <p className="text-xs text-neutral-400 mt-3 text-center">
            Currently disabled in UI. Use CLI or hit API directly.
          </p>
        </div>
      </div>
    </div>
  );
}
