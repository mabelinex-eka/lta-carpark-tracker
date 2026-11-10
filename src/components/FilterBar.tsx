import React from 'react';
import { 
  Search, 
  MapPin, 
  X, 
  Car, 
  Bike, 
  Truck, 
  Sparkles, 
  Bookmark, 
  ArrowUpDown,
  Navigation,
  SlidersHorizontal
} from 'lucide-react';
import { FilterState, VehicleLotType, AgencyType } from '../types/carpark';
import { SINGAPORE_ZONES } from '../data/singaporeCarparks';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
  userLocation: { lat: number; lng: number } | null;
  onLocateUser: () => void;
  isLocating: boolean;
  favoritesCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  userLocation,
  onLocateUser,
  isLocating,
  favoritesCount,
}) => {
  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.vehicleType !== 'all' ||
    filters.agency !== 'all' ||
    filters.status !== 'all' ||
    filters.zone !== 'All Zones' ||
    filters.hasEvCharging ||
    filters.freeParkingOnly ||
    filters.highClearanceOnly ||
    filters.onlyFavorites;

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto space-y-3">
        
        {/* Top Row: Search & GPS Location & Favorites */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              placeholder="Search by Carpark Code (e.g. ACB), Mall Name, Road, or Estate..."
              className="w-full pl-10 pr-9 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-slate-100 placeholder-slate-500 outline-none transition"
            />
            {filters.searchQuery && (
              <button
                onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* GPS Locate Me Button */}
          <button
            onClick={onLocateUser}
            disabled={isLocating}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition shrink-0 ${
              userLocation
                ? 'bg-blue-950/80 text-blue-300 border-blue-700/60'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
            title="Use current Singapore GPS to calculate distance to carparks"
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-blue-400' : userLocation ? 'text-blue-400' : 'text-slate-400'}`} />
            <span>{userLocation ? 'GPS Active (SG)' : 'Locate Me'}</span>
          </button>

          {/* Favorites Filter */}
          <button
            onClick={() => onFilterChange({ ...filters, onlyFavorites: !filters.onlyFavorites })}
            className={`flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition shrink-0 ${
              filters.onlyFavorites
                ? 'bg-amber-950 text-amber-300 border-amber-600'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${filters.onlyFavorites ? 'fill-amber-400 text-amber-400' : 'text-slate-400'}`} />
            <span>Saved ({favoritesCount})</span>
          </button>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 bg-rose-950/40 border border-rose-900/50 hover:bg-rose-900/60 transition shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}

        </div>

        {/* Bottom Row: Granular Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          
          {/* Zone Selector */}
          <div className="relative">
            <select
              value={filters.zone}
              onChange={(e) => onFilterChange({ ...filters, zone: e.target.value })}
              className="appearance-none bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium focus:border-emerald-500 outline-none cursor-pointer"
            >
              {SINGAPORE_ZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone === 'All Zones' ? '📍 All SG Zones' : `📍 ${zone}`}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
              ▼
            </div>
          </div>

          {/* Vehicle Type Tabs */}
          <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
            <button
              onClick={() => onFilterChange({ ...filters, vehicleType: 'all' })}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                filters.vehicleType === 'all'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Lots
            </button>
            <button
              onClick={() => onFilterChange({ ...filters, vehicleType: 'C' })}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                filters.vehicleType === 'C'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Filter by Car lots (Class C)"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Cars</span>
            </button>
            <button
              onClick={() => onFilterChange({ ...filters, vehicleType: 'Y' })}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                filters.vehicleType === 'Y'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Filter by Motorcycle lots (Class Y)"
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Bikes</span>
            </button>
            <button
              onClick={() => onFilterChange({ ...filters, vehicleType: 'H' })}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition ${
                filters.vehicleType === 'H'
                  ? 'bg-slate-800 text-emerald-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Filter by Heavy Vehicle lots (Class H)"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Heavy</span>
            </button>
          </div>

          {/* Agency Dropdown */}
          <div className="relative">
            <select
              value={filters.agency}
              onChange={(e) => onFilterChange({ ...filters, agency: e.target.value as any })}
              className="appearance-none bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium focus:border-emerald-500 outline-none cursor-pointer"
            >
              <option value="all">🏢 All Operators</option>
              <option value="HDB">HDB (Public Housing)</option>
              <option value="URA">URA (City Area)</option>
              <option value="COMMERCIAL">Commercial / Malls</option>
              <option value="LTA">LTA / Transport Hubs</option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
              ▼
            </div>
          </div>

          {/* Sort By Dropdown */}
          <div className="relative ml-auto">
            <select
              value={filters.sortBy}
              onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value as any })}
              className="appearance-none bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-3 py-1.5 pr-8 text-xs font-medium focus:border-emerald-500 outline-none cursor-pointer"
            >
              <option value="availability_desc">⚡ Most Lots Available</option>
              <option value="availability_asc">⚠️ Least Lots Available</option>
              <option value="distance_asc">📍 Nearest Distance</option>
              <option value="name_asc">🔤 Name (A - Z)</option>
            </select>
            <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
              ▼
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
