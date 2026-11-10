import React from 'react';
import { Carpark } from '../types/carpark';
import { 
  X, 
  MapPin, 
  Bookmark, 
  Car, 
  Bike, 
  Truck, 
  BatteryCharging, 
  Clock, 
  ShieldCheck, 
  ArrowUpRight, 
  TrendingUp, 
  Calculator,
  Compass,
  AlertCircle
} from 'lucide-react';

interface CarparkDetailModalProps {
  carpark: Carpark | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenEstimator: (carpark: Carpark) => void;
}

export const CarparkDetailModal: React.FC<CarparkDetailModalProps> = ({
  carpark,
  onClose,
  isFavorite,
  onToggleFavorite,
  onOpenEstimator,
}) => {
  if (!carpark) return null;

  const currentHour = new Date().getHours();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Modal Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-200">
              {carpark.id}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {carpark.agency}
            </span>
            <span className="text-xs font-mono text-slate-400">
              {carpark.structure}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(carpark.id)}
              className={`p-2 rounded-xl border transition ${
                isFavorite
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={isFavorite ? 'Remove bookmark' : 'Bookmark this carpark'}
            >
              <Bookmark className={`w-4 h-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Title & Address */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {carpark.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{carpark.address}</span>
            </p>
          </div>

          {/* Real-Time Lot Availability Dashboard */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Live Lot Availability
              </span>
              <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Updated {new Date(carpark.update_datetime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} SGT
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Car Lots */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-emerald-400" />
                    Cars (Class C)
                  </span>
                </div>
                <div className="text-2xl font-mono font-black text-emerald-400">
                  {carpark.lots.C?.lots_available ?? 0}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  out of {carpark.lots.C?.total_lots ?? 0} lots
                </div>
              </div>

              {/* Motorcycle Lots */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Bike className="w-3.5 h-3.5 text-cyan-400" />
                    Motorcycles (Class Y)
                  </span>
                </div>
                <div className="text-2xl font-mono font-black text-cyan-400">
                  {carpark.lots.Y?.lots_available ?? 0}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  out of {carpark.lots.Y?.total_lots ?? 0} lots
                </div>
              </div>

              {/* Heavy Vehicle Lots */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-amber-400" />
                    Heavy (Class H)
                  </span>
                </div>
                <div className="text-2xl font-mono font-black text-amber-400">
                  {carpark.lots.H?.lots_available ?? 0}
                </div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                  out of {carpark.lots.H?.total_lots ?? 0} lots
                </div>
              </div>
            </div>

            {/* Occupancy bar */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-mono">
                <span>Overall Occupancy: {carpark.occupancyPercent}%</span>
                <span>{carpark.availableLotsCombined} lots free</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${carpark.occupancyPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* 24-Hour Historical & Projected Occupancy Trend */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-300">
                  Daily Demand Pattern (24-Hour Occupancy Curve)
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Current: {currentHour}:00
              </span>
            </div>

            {/* Visual Bar Chart */}
            <div className="grid grid-cols-24 gap-0.5 h-20 items-end pt-2">
              {carpark.hourly_occupancy_trend.map((val, idx) => {
                const isCurrent = idx === currentHour;
                return (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group/bar relative">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none bg-slate-800 text-white text-[9px] font-mono px-1 py-0.5 rounded shadow z-20 whitespace-nowrap">
                      {idx}:00 - {val}%
                    </div>
                    <div
                      className={`w-full rounded-t-sm transition-all duration-300 ${
                        isCurrent
                          ? 'bg-emerald-400 ring-2 ring-emerald-400/50'
                          : val > 90
                          ? 'bg-rose-500/80 group-hover/bar:bg-rose-400'
                          : val > 75
                          ? 'bg-amber-500/80 group-hover/bar:bg-amber-400'
                          : 'bg-emerald-600/70 group-hover/bar:bg-emerald-400'
                      }`}
                      style={{ height: `${Math.max(10, val)}%` }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 pt-1 border-t border-slate-800/80">
              <span>12 AM</span>
              <span>6 AM</span>
              <span>12 PM (Lunch)</span>
              <span>6 PM (Peak)</span>
              <span>11 PM</span>
            </div>
          </div>

          {/* Rates & Charging Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Rates Table */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Official Parking Rates</span>
                <button
                  onClick={() => onOpenEstimator(carpark)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Fee Estimator</span>
                </button>
              </div>

              <div className="text-xs space-y-2 pt-1 font-mono">
                <div className="flex justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Weekday Day:</span>
                  <span className="text-slate-200 text-right">{carpark.rates.weekday_day}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Weekday Night:</span>
                  <span className="text-slate-200 text-right">{carpark.rates.weekday_night}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-800">
                  <span className="text-slate-400">Weekend &amp; PH:</span>
                  <span className="text-slate-200 text-right">{carpark.rates.weekend}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Grace Period:</span>
                  <span className="text-emerald-400 font-bold">{carpark.rates.grace_period_mins} mins (Free Exit)</span>
                </div>
              </div>
            </div>

            {/* Key Amenities */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
              <span className="text-xs font-semibold text-slate-300">Gantry &amp; Amenities</span>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                  <div>
                    <span className="font-medium">Free Parking Scheme:</span>{' '}
                    <span className="text-slate-400">
                      {carpark.free_parking ? carpark.free_parking_desc || 'Sundays & PH' : 'No Free Scheme'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-300">
                  <BatteryCharging className="w-4 h-4 text-teal-400 shrink-0" />
                  <div>
                    <span className="font-medium">EV Charging:</span>{' '}
                    <span className="text-slate-400">
                      {carpark.has_ev_charging
                        ? `${carpark.ev_charging_count || 4} Ports (SP Mobility / Shell Recharge)`
                        : 'None Available'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <div>
                    <span className="font-medium">Vehicle Clearance:</span>{' '}
                    <span className="text-slate-400 font-mono">
                      {carpark.gantry_height_m ? `${carpark.gantry_height_m} meters` : 'No Height Limit (Surface)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Navigation Action Links */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-xs text-slate-400 block mb-2 font-medium">Navigate with GPS:</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-xs border border-slate-700 transition"
              >
                <span>Google Maps</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              </a>

              <a
                href={`https://www.onemap.gov.sg/main/v2/?lat=${carpark.coordinates.lat}&lng=${carpark.coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-xs border border-slate-700 transition"
              >
                <span>OneMap SG</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-cyan-400" />
              </a>

              <a
                href={`https://waze.com/ul?ll=${carpark.coordinates.lat},${carpark.coordinates.lng}&navigate=yes`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-medium text-xs border border-slate-700 transition col-span-2 sm:col-span-1"
              >
                <span>Waze</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
              </a>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
