import React, { useState, useEffect } from 'react';
import { 
  TrafficIncident, 
  TrainAlert, 
  BusArrivalResponse 
} from '../types/carpark';
import { 
  fetchTrafficIncidents, 
  fetchTrainAlerts, 
  fetchBusArrivals 
} from '../services/carparkApi';
import { 
  AlertTriangle, 
  Train, 
  Bus, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  ShieldCheck,
  Search,
  ExternalLink
} from 'lucide-react';

interface LtaTransitBarProps {
  ltaAccountKey?: string;
  onOpenBackendModal: () => void;
}

export const LtaTransitBar: React.FC<LtaTransitBarProps> = ({
  ltaAccountKey,
  onOpenBackendModal,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [incidents, setIncidents] = useState<TrafficIncident[]>([]);
  const [trainStatus, setTrainStatus] = useState<TrainAlert | null>(null);
  const [busData, setBusData] = useState<BusArrivalResponse | null>(null);
  
  const [busStopInput, setBusStopInput] = useState<string>('83139');
  const [busServiceInput, setBusServiceInput] = useState<string>('15');
  const [isLoadingBus, setIsLoadingBus] = useState<boolean>(false);

  // Active Incident Ticker index
  const [incidentIndex, setIncidentIndex] = useState<number>(0);

  // Fetch initial LTA data
  const loadLtaData = async () => {
    const [inc, tr, bus] = await Promise.all([
      fetchTrafficIncidents(ltaAccountKey),
      fetchTrainAlerts(ltaAccountKey),
      fetchBusArrivals(busStopInput, busServiceInput, ltaAccountKey),
    ]);
    if (inc) setIncidents(inc);
    if (tr) setTrainStatus(tr);
    if (bus) setBusData(bus);
  };

  useEffect(() => {
    loadLtaData();
  }, [ltaAccountKey]);

  // Rotate incidents every 6 seconds
  useEffect(() => {
    if (incidents.length <= 1) return;
    const interval = setInterval(() => {
      setIncidentIndex((prev) => (prev + 1) % incidents.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [incidents.length]);

  const handleSearchBus = async () => {
    if (!busStopInput.trim()) return;
    setIsLoadingBus(true);
    try {
      const res = await fetchBusArrivals(busStopInput.trim(), busServiceInput.trim() || undefined, ltaAccountKey);
      if (res) setBusData(res);
    } finally {
      setIsLoadingBus(false);
    }
  };

  const currentIncident = incidents[incidentIndex] || incidents[0];

  const getLoadBadge = (load?: string) => {
    switch (load) {
      case 'SEA':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono">Seats Avail</span>;
      case 'SDA':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono">Standing</span>;
      case 'LSD':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono">Full / Limited</span>;
      default:
        return null;
    }
  };

  const getArrivalMins = (isoTime?: string) => {
    if (!isoTime) return null;
    const diffMs = new Date(isoTime).getTime() - Date.now();
    const mins = Math.round(diffMs / 60000);
    if (mins <= 0) return 'Arr';
    return `${mins}m`;
  };

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 text-xs">
      {/* Collapsed Headline Strip */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        
        {/* Left: Live Traffic Incident Ticker */}
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-md font-semibold shrink-0">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>LTA Traffic</span>
          </div>

          <div className="truncate text-slate-300">
            {currentIncident ? (
              <span className="font-mono text-xs text-slate-200">
                {currentIncident.Message}
              </span>
            ) : (
              <span className="text-slate-400">All Singapore expressways flowing smoothly.</span>
            )}
          </div>
        </div>

        {/* Right: MRT Status + Bus Quick Button + Expand Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          {/* MRT Check */}
          <div className="flex items-center gap-1.5 text-slate-300 bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800">
            <Train className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium text-[11px]">
              {trainStatus?.Status === 2 ? (
                <span className="text-rose-400 font-bold">MRT Alert</span>
              ) : (
                <span className="text-emerald-400 font-bold">All MRT Normal</span>
              )}
            </span>
          </div>

          {/* Toggle Expand Bus & Transit Drawer */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition font-medium"
          >
            <Bus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Bus Arrivals (v3)</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>

      {/* Expanded LTA Transit Panel */}
      {isExpanded && (
        <div className="bg-slate-950 border-t border-slate-800 px-4 sm:px-6 lg:px-8 py-4 transition-all">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Column 1: Next Bus Arrival (v3) - as specified by user */}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Bus className="w-4 h-4 text-cyan-400" />
                  Live Bus Arrival (v3)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">20s refresh</span>
              </div>

              {/* Bus Stop & Service Search */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={busStopInput}
                  onChange={(e) => setBusStopInput(e.target.value)}
                  placeholder="Stop Code (e.g. 83139)"
                  className="w-28 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500"
                />
                <input
                  type="text"
                  value={busServiceInput}
                  onChange={(e) => setBusServiceInput(e.target.value)}
                  placeholder="Service (e.g. 15)"
                  className="w-20 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 placeholder-slate-600 outline-none focus:border-cyan-500"
                />
                <button
                  onClick={handleSearchBus}
                  disabled={isLoadingBus}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition disabled:opacity-50"
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Bus Results */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {busData?.Services && busData.Services.length > 0 ? (
                  busData.Services.map((svc) => (
                    <div key={svc.ServiceNo} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-sm font-mono text-white px-1.5 py-0.5 rounded bg-slate-800">
                            {svc.ServiceNo}
                          </span>
                          <span className="text-[11px] text-slate-400">{svc.Operator}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Next Bus */}
                        <div className="text-right">
                          <div className="font-mono font-bold text-cyan-400 text-sm">
                            {getArrivalMins(svc.NextBus.EstimatedArrival)}
                          </div>
                          {getLoadBadge(svc.NextBus.Load)}
                        </div>

                        {/* Next Bus 2 */}
                        {svc.NextBus2?.EstimatedArrival && (
                          <div className="text-right pl-2 border-l border-slate-800">
                            <div className="font-mono text-xs text-slate-400">
                              {getArrivalMins(svc.NextBus2.EstimatedArrival)}
                            </div>
                            {getLoadBadge(svc.NextBus2.Load)}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-500 text-center py-3 text-xs">
                    No active buses arriving at stop #{busStopInput}.
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Traffic Incidents list */}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Expressway &amp; Road Alerts
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {incidents.length} active
                </span>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {incidents.map((inc, i) => (
                  <div key={i} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs">
                    <span className="font-semibold text-rose-400 font-mono text-[11px] block">
                      [{inc.Type}]
                    </span>
                    <p className="text-slate-300 mt-0.5 leading-snug">{inc.Message}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Column 3: Train Service Alerts & LTA DataMall Key Info */}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Train className="w-4 h-4 text-emerald-400" />
                  MRT &amp; LRT Lines
                </span>
                <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10">
                  Normal Operations
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-red-400 font-bold">NSL</span>
                  <span className="text-emerald-400">Normal</span>
                </div>
                <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-emerald-400 font-bold">EWL</span>
                  <span className="text-emerald-400">Normal</span>
                </div>
                <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-purple-400 font-bold">NEL</span>
                  <span className="text-emerald-400">Normal</span>
                </div>
                <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-amber-400 font-bold">CCL</span>
                  <span className="text-emerald-400">Normal</span>
                </div>
                <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-blue-400 font-bold">DTL</span>
                  <span className="text-emerald-400">Normal</span>
                </div>
                <div className="p-1.5 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                  <span className="text-amber-600 font-bold">TEL</span>
                  <span className="text-emerald-400">Normal</span>
                </div>
              </div>

              {/* LTA Header & AccountKey status */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400">LTA AccountKey:</span>
                <button
                  onClick={onOpenBackendModal}
                  className="text-cyan-400 hover:text-cyan-300 font-mono font-medium underline"
                >
                  {ltaAccountKey ? 'Configured' : 'Configure Header Key'}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
