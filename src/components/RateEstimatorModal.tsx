import React, { useState } from 'react';
import { Carpark } from '../types/carpark';
import { X, Calculator, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

interface RateEstimatorModalProps {
  carpark: Carpark | null;
  onClose: () => void;
}

export const RateEstimatorModal: React.FC<RateEstimatorModalProps> = ({ carpark, onClose }) => {
  if (!carpark) return null;

  const [durationMins, setDurationMins] = useState<number>(90); // default 1.5 hours
  const [dayType, setDayType] = useState<'weekday' | 'saturday' | 'sunday'>('weekday');
  const [startHour, setStartHour] = useState<number>(14); // 2pm

  const graceMins = carpark.rates.grace_period_mins || 10;
  const isWithinGrace = durationMins <= graceMins;

  // Calculate estimated fee
  const calculateFee = () => {
    if (isWithinGrace) {
      return { fee: 0, reason: `Free exit within ${graceMins}-minute grace period` };
    }

    // Free parking check for Sunday
    if (dayType === 'sunday' && carpark.free_parking && startHour >= 7 && startHour < 22) {
      return { fee: 0, reason: 'Free parking scheme active (Sundays 7am - 10:30pm)' };
    }

    const halfHours = Math.ceil(durationMins / 30);
    const perHalfHour = carpark.rates.per_half_hour_cents || 60;
    let totalCents = halfHours * perHalfHour;

    // Check if flat night rate applies (after 5pm/6pm)
    if (startHour >= 18 && carpark.agency === 'COMMERCIAL') {
      // commercial flat entry
      return {
        fee: 3.5,
        reason: 'Evening per-entry flat rate applied',
      };
    }

    if (startHour >= 22 && carpark.agency === 'HDB') {
      // HDB night parking capped at $5.00
      const nightFee = Math.min(5.0, (totalCents / 100));
      return {
        fee: nightFee,
        reason: 'HDB Night cap ($5.00 max) applied',
      };
    }

    return {
      fee: Math.round(totalCents) / 100,
      reason: `Calculated at approx. $${(perHalfHour / 100).toFixed(2)} / 30 mins`,
    };
  };

  const result = calculateFee();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Calculator className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Parking Fee Estimator</h3>
              <p className="text-xs text-slate-400 truncate max-w-[240px]">{carpark.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {/* Day Type Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">Day of Week</label>
            <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setDayType('weekday')}
                className={`py-1.5 text-xs font-medium rounded-lg transition ${
                  dayType === 'weekday'
                    ? 'bg-slate-800 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Weekday
              </button>
              <button
                type="button"
                onClick={() => setDayType('saturday')}
                className={`py-1.5 text-xs font-medium rounded-lg transition ${
                  dayType === 'saturday'
                    ? 'bg-slate-800 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Saturday
              </button>
              <button
                type="button"
                onClick={() => setDayType('sunday')}
                className={`py-1.5 text-xs font-medium rounded-lg transition ${
                  dayType === 'sunday'
                    ? 'bg-slate-800 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sunday / PH
              </button>
            </div>
          </div>

          {/* Start Time Hour */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1.5">
              <span>Arrival Time</span>
              <span className="font-mono text-emerald-400">
                {startHour.toString().padStart(2, '0')}:00 {startHour >= 12 ? 'PM' : 'AM'}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="23"
              step="1"
              value={startHour}
              onChange={(e) => setStartHour(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Duration in Minutes */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1.5">
              <span>Parking Duration</span>
              <span className="font-mono text-emerald-400 font-bold">
                {Math.floor(durationMins / 60)}h {durationMins % 60}m ({durationMins} mins)
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="480"
              step="15"
              value={durationMins}
              onChange={(e) => setDurationMins(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            {/* Quick duration presets */}
            <div className="flex items-center gap-1.5 mt-2">
              {[15, 30, 60, 90, 120, 240].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setDurationMins(mins)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono border transition ${
                    durationMins === mins
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-600'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                </button>
              ))}
            </div>
          </div>

          {/* Estimated Fee Display Card */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 mt-2">
            <div className="text-xs text-slate-400 mb-1">Estimated Parking Cost</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-mono font-black text-emerald-400">
                ${result.fee.toFixed(2)}
              </span>
              <span className="text-xs text-slate-500 font-mono">SGD</span>
            </div>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{result.reason}</span>
            </p>
            {isWithinGrace && (
              <div className="mt-2 text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg">
                ⚠️ Grace period: Drive out before {graceMins} minutes to avoid any charge.
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
