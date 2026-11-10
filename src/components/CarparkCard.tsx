import React from 'react';
import { Carpark, VehicleLotType } from '../types/carpark';
import { 
  Car, 
  Bike, 
  Truck, 
  Bookmark, 
  Navigation, 
  MapPin, 
  Calculator, 
  BatteryCharging, 
  Clock, 
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Info
} from 'lucide-react';

interface CarparkCardProps {
  carpark: Carpark;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: (carpark: Carpark) => void;
  onToggleFavorite: (id: string) => void;
  onOpenEstimator: (carpark: Carpark) => void;
  onOpenDetails: (carpark: Carpark) => void;
  selectedVehicleType: 'all' | VehicleLotType;
}

export const CarparkCard: React.FC<CarparkCardProps> = ({
  carpark,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
  onOpenEstimator,
  onOpenDetails,
  selectedVehicleType,
}) => {
  // Determine displayed lots based on selected vehicle type
  let displayedAvailable = carpark.availableLotsCombined;
  let displayedTotal = carpark.totalLotsCombined;

  if (selectedVehicleType === 'C' && carpark.lots.C) {
    displayedAvailable = carpark.lots.C.lots_available;
    displayedTotal = carpark.lots.C.total_lots;
  } else if (selectedVehicleType === 'Y' && carpark.lots.Y) {
    displayedAvailable = carpark.lots.Y.lots_available;
    displayedTotal = carpark.lots.Y.total_lots;
  } else if (selectedVehicleType === 'H' && carpark.lots.H) {
    displayedAvailable = carpark.lots.H.lots_available;
    displayedTotal = carpark.lots.H.total_lots;
  }

  const occupancy = displayedTotal > 0
    ? Math.min(100, Math.round(((displayedTotal - displayedAvailable) / displayedTotal) * 100))
    : carpark.occupancyPercent;

  // Status visual cues
  const getStatusConfig = () => {
    switch (carpark.status) {
      case 'available':
        return {
          label: 'Plenty of Lots',
          badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          lotColor: 'text-emerald-400',
          progressClass: 'bg-emerald-500',
        };
      case 'filling_fast':
        return {
          label: 'Filling Fast',
          badgeClass: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          lotColor: 'text-amber-400',
          progressClass: 'bg-amber-500',
        };
      case 'almost_full':
        return {
          label: 'Almost Full (<15)',
          badgeClass: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
          lotColor: 'text-rose-400',
          progressClass: 'bg-rose-500',
        };
      case 'full':
        return {
          label: 'Carpark Full',
          badgeClass: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
          lotColor: 'text-slate-400',
          progressClass: 'bg-slate-600',
        };
    }
  };

  const statusConfig = getStatusConfig();

  const getAgencyColor = (agency: string) => {
    switch (agency) {
      case 'HDB':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'URA':
        return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
      case 'LTA':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
    }
  };

  return (
    <div
      onClick={() => onSelect(carpark)}
      className={`group relative rounded-2xl transition-all duration-200 border cursor-pointer p-4 bg-slate-900/90 hover:bg-slate-850 hover:shadow-xl hover:shadow-black/40 ${
        isSelected
          ? 'border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-500/10'
          : 'border-slate-800/90 hover:border-slate-700'
      }`}
    >
      {/* Header: ID, Agency, Status, Bookmark */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200">
            {carpark.id}
          </span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${getAgencyColor(carpark.agency)}`}>
            {carpark.agency}
          </span>
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md border ${statusConfig.badgeClass}`}>
            {statusConfig.label}
          </span>
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(carpark.id);
          }}
          className={`p-1.5 rounded-lg border transition ${
            isFavorite
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
              : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700'
          }`}
          title={isFavorite ? 'Remove from saved' : 'Save carpark'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isFavorite ? 'fill-amber-400' : ''}`} />
        </button>
      </div>

      {/* Name and Address */}
      <div className="mb-3">
        <h3 className="font-semibold text-slate-100 text-base leading-snug group-hover:text-emerald-400 transition-colors line-clamp-1">
          {carpark.name}
        </h3>
        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1 line-clamp-1">
          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
          <span>{carpark.address}</span>
        </p>
      </div>

      {/* Real-time Big Lot Count & Delta pulse */}
      <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/90 mb-3.5">
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className={`font-mono font-black text-2xl sm:text-3xl ${statusConfig.lotColor}`}>
              {displayedAvailable.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              / {displayedTotal.toLocaleString()} available
            </span>
          </div>

          {/* Real-time Delta badge */}
          {carpark.lotDelta !== undefined && carpark.lotDelta !== 0 && (
            <span
              className={`flex items-center gap-0.5 text-xs font-mono font-bold px-1.5 py-0.5 rounded-md animate-pulse ${
                carpark.lotDelta > 0
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              {carpark.lotDelta > 0 ? (
                <>
                  <TrendingUp className="w-3 h-3" />
                  +{carpark.lotDelta}
                </>
              ) : (
                <>
                  <TrendingDown className="w-3 h-3" />
                  {carpark.lotDelta}
                </>
              )}
            </span>
          )}
        </div>

        {/* Occupancy bar */}
        <div className="mt-2.5">
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Occupancy</span>
            <span className="font-mono font-semibold text-slate-300">{occupancy}%</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${statusConfig.progressClass}`}
              style={{ width: `${occupancy}%` }}
            />
          </div>
        </div>

        {/* Breakdown by vehicle class */}
        <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] font-mono">
          <div className="flex items-center gap-1 text-slate-300">
            <Car className="w-3 h-3 text-emerald-400" />
            <span>{carpark.lots.C?.lots_available ?? 0}</span>
            <span className="text-slate-500 text-[10px]">cars</span>
          </div>
          <div className="flex items-center gap-1 text-slate-300">
            <Bike className="w-3 h-3 text-cyan-400" />
            <span>{carpark.lots.Y?.lots_available ?? 0}</span>
            <span className="text-slate-500 text-[10px]">bikes</span>
          </div>
          <div className="flex items-center gap-1 text-slate-300">
            <Truck className="w-3 h-3 text-amber-400" />
            <span>{carpark.lots.H?.lots_available ?? 0}</span>
            <span className="text-slate-500 text-[10px]">heavy</span>
          </div>
        </div>
      </div>

      {/* Feature Badges: EV, Clearance, Distance, Rates */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px]">
        {carpark.distanceKm !== undefined && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
            <Navigation className="w-3 h-3" />
            {carpark.distanceKm} km away
          </span>
        )}

        {carpark.has_ev_charging && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-400 border border-teal-500/20 font-medium">
            <BatteryCharging className="w-3 h-3" />
            {carpark.ev_charging_count ? `${carpark.ev_charging_count} EV Ports` : 'EV Ready'}
          </span>
        )}

        {carpark.free_parking && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
            <Clock className="w-3 h-3" />
            Free Sun/PH
          </span>
        )}

        {carpark.gantry_height_m && (
          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-mono text-[10px]">
            ↕ {carpark.gantry_height_m}m clearance
          </span>
        )}
      </div>

      {/* Rates preview & Action buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
        <div className="text-slate-400 truncate max-w-[170px] sm:max-w-[200px]" title={carpark.rates.weekday_day}>
          <span className="text-slate-300 font-medium font-mono">{carpark.rates.weekday_day.split('(')[0]}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Rate Calculator Button */}
          <button
            onClick={() => onOpenEstimator(carpark)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Calculate Parking Fee"
          >
            <Calculator className="w-3.5 h-3.5" />
          </button>

          {/* Details Button */}
          <button
            onClick={() => onOpenDetails(carpark)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition"
            title="Carpark Details & Trends"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          {/* External Directions link */}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-medium text-xs transition"
            title="Open in Google Maps"
          >
            <span>Nav</span>
            <ArrowUpRight className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
};
