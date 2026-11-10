import React from 'react';
import { 
  Car, 
  RefreshCw, 
  Server, 
  MapPin, 
  SlidersHorizontal, 
  Map, 
  List, 
  Split, 
  Radio, 
  ShieldCheck,
  Zap
} from 'lucide-react';
import { BackendConfig } from '../types/carpark';

interface HeaderProps {
  backendConfig: BackendConfig;
  onOpenBackendModal: () => void;
  onRefreshNow: () => void;
  isRefreshing: boolean;
  secondsUntilNextSync: number;
  lastUpdatedTime: string;
  viewMode: 'split' | 'map' | 'list';
  onViewModeChange: (mode: 'split' | 'map' | 'list') => void;
  totalCarparksCount: number;
  activeSourceLabel: string;
}

export const Header: React.FC<HeaderProps> = ({
  backendConfig,
  onOpenBackendModal,
  onRefreshNow,
  isRefreshing,
  secondsUntilNextSync,
  lastUpdatedTime,
  viewMode,
  onViewModeChange,
  totalCarparksCount,
  activeSourceLabel,
}) => {
  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Brand */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-500/20 text-white font-black text-lg">
                <Car className="w-5 h-5 text-white" />
                <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-900"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                    SG CarPark <span className="text-emerald-400">Live</span>
                  </h1>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Singapore
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Real-time lot availability across HDB, URA & Commercial carparks
                </p>
              </div>
            </div>

            {/* Mobile Refresh Button */}
            <div className="flex items-center gap-1.5 md:hidden">
              <button
                onClick={onRefreshNow}
                disabled={isRefreshing}
                className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
                title="Refresh Availability"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              </button>
              <button
                onClick={onOpenBackendModal}
                className="p-2 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800/40 hover:bg-emerald-900/60 transition"
                title="Backend API Settings"
              >
                <Server className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center: Live Sync ticker */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-950/60 px-3.5 py-1.5 rounded-lg border border-slate-800/80 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span className="font-mono text-slate-200">{activeSourceLabel}</span>
            </div>

            <div className="h-3 w-px bg-slate-800" />

            <div className="flex items-center gap-1.5 text-slate-400">
              <span>Next sync:</span>
              <span className="font-mono font-medium text-emerald-400 min-w-[20px] text-right">
                {secondsUntilNextSync}s
              </span>
            </div>

            <div className="h-3 w-px bg-slate-800" />

            <div className="text-slate-400">
              Updated: <span className="font-mono text-slate-300">{lastUpdatedTime}</span>
            </div>
          </div>

          {/* Right Controls: View Switcher & Backend Modal Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5">
            {/* View Mode Buttons */}
            <div className="flex items-center p-0.5 bg-slate-950 rounded-lg border border-slate-800">
              <button
                onClick={() => onViewModeChange('split')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                  viewMode === 'split'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Split Map & List View"
              >
                <Split className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Split</span>
              </button>
              <button
                onClick={() => onViewModeChange('map')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                  viewMode === 'map'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Map Only View"
              >
                <Map className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Map</span>
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                  viewMode === 'list'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Cards Only View"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>

            {/* Desktop Refresh Button */}
            <button
              onClick={onRefreshNow}
              disabled={isRefreshing}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-medium transition active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Sync</span>
            </button>

            {/* Backend Integration Hub Button */}
            <button
              onClick={onOpenBackendModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition active:scale-95"
            >
              <Server className="w-3.5 h-3.5 text-emerald-400" />
              <span>Backend API</span>
              <span className="hidden xl:inline-block text-[10px] bg-emerald-500/20 px-1 py-0.2 rounded font-mono">
                {backendConfig.source === 'custom_backend' ? 'Custom' : 'Ready'}
              </span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
