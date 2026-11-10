import React from 'react';
import { Carpark } from '../types/carpark';
import { 
  Car, 
  Sparkles, 
  BatteryCharging, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  TrendingUp,
  MapPin
} from 'lucide-react';

interface StatsBannerProps {
  carparks: Carpark[];
  onSelectQuickFilter: (filterType: string) => void;
  activeQuickFilter: string;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({
  carparks,
  onSelectQuickFilter,
  activeQuickFilter,
}) => {
  const totalMonitoredLots = carparks.reduce((acc, c) => acc + c.totalLotsCombined, 0);
  const totalAvailableLots = carparks.reduce((acc, c) => acc + c.availableLotsCombined, 0);
  const availableCarparksCount = carparks.filter((c) => c.status === 'available').length;
  const criticalCarparksCount = carparks.filter((c) => c.status === 'almost_full' || c.status === 'full').length;
  const evCarparksCount = carparks.filter((c) => c.has_ev_charging).length;
  const freeParkingCount = carparks.filter((c) => c.free_parking).length;

  const islandWideOccupancy =
    totalMonitoredLots > 0
      ? Math.round(((totalMonitoredLots - totalAvailableLots) / totalMonitoredLots) * 100)
      : 0;

  return (
    <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto">
        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          
          {/* Card 1: Available Lots */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Available Lots</span>
              <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                <Car className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400 tracking-tight">
                {totalAvailableLots.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                / {totalMonitoredLots.toLocaleString()}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.max(5, 100 - islandWideOccupancy)}%` }} 
              />
            </div>
          </div>

          {/* Card 2: Island Occupancy */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>SG Occupancy</span>
              <span className="p-1 rounded-md bg-cyan-500/10 text-cyan-400">
                <TrendingUp className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                {islandWideOccupancy}%
              </span>
              <span className="text-xs text-slate-400">avg</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              {islandWideOccupancy > 80 ? 'Heavy Island Traffic' : 'Moderate Flow'}
            </p>
          </div>

          {/* Card 3: Free Parking Available */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Free Parking (Sun/PH)</span>
              <span className="p-1 rounded-md bg-amber-500/10 text-amber-400">
                <Clock className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-400 tracking-tight">
                {freeParkingCount}
              </span>
              <span className="text-xs text-slate-500">sites</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              HDB & URA free schemes
            </p>
          </div>

          {/* Card 4: EV Charging Stations */}
          <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>EV Ready Sites</span>
              <span className="p-1 rounded-md bg-teal-500/10 text-teal-400">
                <BatteryCharging className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-teal-400 tracking-tight">
                {evCarparksCount}
              </span>
              <span className="text-xs text-slate-500">locations</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 truncate">
              Fast & AC charging
            </p>
          </div>

          {/* Card 5: Critical/Full Carparks */}
          <div className="hidden lg:block bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 hover:border-slate-700 transition">
            <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
              <span>Full / High Demand</span>
              <span className="p-1 rounded-md bg-rose-500/10 text-rose-400">
                <AlertTriangle className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-rose-400 tracking-tight">
                {criticalCarparksCount}
              </span>
              <span className="text-xs text-slate-500">sites &lt;15 lots</span>
            </div>
            <p className="text-[11px] text-rose-400/80 mt-1 truncate">
              Avoid or queue expected
            </p>
          </div>

        </div>

        {/* Quick Filter Bar */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-slate-400 whitespace-nowrap text-[11px] font-medium mr-1">Quick Filters:</span>
          
          <button
            onClick={() => onSelectQuickFilter('all')}
            className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap border ${
              activeQuickFilter === 'all'
                ? 'bg-slate-800 text-white border-slate-600 font-medium'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            All Carparks ({carparks.length})
          </button>

          <button
            onClick={() => onSelectQuickFilter('available_only')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition whitespace-nowrap border ${
              activeQuickFilter === 'available_only'
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600 font-medium'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-emerald-300 hover:border-emerald-800/50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>High Availability (&gt;40 lots)</span>
          </button>

          <button
            onClick={() => onSelectQuickFilter('ev_only')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition whitespace-nowrap border ${
              activeQuickFilter === 'ev_only'
                ? 'bg-teal-950/80 text-teal-300 border-teal-600 font-medium'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-teal-300 hover:border-teal-800/50'
            }`}
          >
            <BatteryCharging className="w-3.5 h-3.5 text-teal-400" />
            <span>EV Charging Ready</span>
          </button>

          <button
            onClick={() => onSelectQuickFilter('free_parking')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition whitespace-nowrap border ${
              activeQuickFilter === 'free_parking'
                ? 'bg-amber-950/80 text-amber-300 border-amber-600 font-medium'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-amber-300 hover:border-amber-800/50'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Free Parking Schemes</span>
          </button>

          <button
            onClick={() => onSelectQuickFilter('hdb_only')}
            className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap border ${
              activeQuickFilter === 'hdb_only'
                ? 'bg-blue-950/80 text-blue-300 border-blue-600 font-medium'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-blue-300 hover:border-blue-800/50'
            }`}
          >
            HDB Housing Estates
          </button>

          <button
            onClick={() => onSelectQuickFilter('commercial_only')}
            className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap border ${
              activeQuickFilter === 'commercial_only'
                ? 'bg-purple-950/80 text-purple-300 border-purple-600 font-medium'
                : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-purple-300 hover:border-purple-800/50'
            }`}
          >
            Shopping Malls & Commercial
          </button>
        </div>

      </div>
    </div>
  );
};
