/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Carpark, 
  FilterState, 
  BackendConfig, 
  VehicleLotType 
} from './types/carpark';
import { INITIAL_SINGAPORE_CARPARKS } from './data/singaporeCarparks';
import { 
  fetchCarparks, 
  DEFAULT_BACKEND_CONFIG, 
  calculateDistanceKm 
} from './services/carparkApi';

import { Header } from './components/Header';
import { StatsBanner } from './components/StatsBanner';
import { FilterBar } from './components/FilterBar';
import { CarparkCard } from './components/CarparkCard';
import { CarparkMap } from './components/CarparkMap';
import { CarparkDetailModal } from './components/CarparkDetailModal';
import { RateEstimatorModal } from './components/RateEstimatorModal';
import { BackendIntegrationModal } from './components/BackendIntegrationModal';
import { Car, MapPin, X, AlertCircle, RefreshCw } from 'lucide-react';

const STORAGE_FAVORITES_KEY = 'sg_carpark_favorites';
const STORAGE_CONFIG_KEY = 'sg_carpark_backend_config';

export default function App() {
  // Carparks State
  const [carparks, setCarparks] = useState<Carpark[]>(INITIAL_SINGAPORE_CARPARKS);
  const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  const [activeSourceLabel, setActiveSourceLabel] = useState<string>('Simulated Stream (Live)');

  // View Mode: 'split' | 'map' | 'list'
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');

  // Backend Config State
  const [backendConfig, setBackendConfig] = useState<BackendConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CONFIG_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_BACKEND_CONFIG;
    } catch {
      return DEFAULT_BACKEND_CONFIG;
    }
  });

  // Countdown timer for next sync
  const [countdown, setCountdown] = useState<number>(backendConfig.pollIntervalSecs);

  // Favorites
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FAVORITES_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set(['ACB', 'ION01', 'MBS01']);
    } catch {
      return new Set(['ACB', 'ION01', 'MBS01']);
    }
  });

  // User GPS Geolocation State
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Modals
  const [isBackendModalOpen, setIsBackendModalOpen] = useState<boolean>(false);
  const [detailModalCarpark, setDetailModalCarpark] = useState<Carpark | null>(null);
  const [estimatorModalCarpark, setEstimatorModalCarpark] = useState<Carpark | null>(null);

  // Quick Filter State
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('all');

  // Comprehensive Filters
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    vehicleType: 'all',
    agency: 'all',
    status: 'all',
    zone: 'All Zones',
    hasEvCharging: false,
    freeParkingOnly: false,
    highClearanceOnly: false,
    sortBy: 'availability_desc',
    onlyFavorites: false,
  });

  // Save favorites to localStorage
  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      try {
        localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(Array.from(next)));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Save backend config
  const handleUpdateBackendConfig = (newConfig: BackendConfig) => {
    setBackendConfig(newConfig);
    setCountdown(newConfig.pollIntervalSecs);
    try {
      localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(newConfig));
    } catch (e) {
      console.error(e);
    }
    // Trigger immediate refresh with new config
    doRefresh(newConfig);
  };

  // Perform Fetch / Sync
  const doRefresh = useCallback(async (cfgToUse = backendConfig) => {
    setIsRefreshing(true);
    try {
      const result = await fetchCarparks(cfgToUse, carparks);
      
      // Update with distances if user GPS is available
      const updated = result.carparks.map((cp) => {
        if (userLocation) {
          const dist = calculateDistanceKm(
            userLocation.lat,
            userLocation.lng,
            cp.coordinates.lat,
            cp.coordinates.lng
          );
          return { ...cp, distanceKm: dist };
        }
        return cp;
      });

      setCarparks(updated);
      setActiveSourceLabel(result.sourceUsed);
      setLastUpdated(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
      setCountdown(cfgToUse.pollIntervalSecs);
    }
  }, [backendConfig, carparks, userLocation]);

  // Periodic Polling Timer
  useEffect(() => {
    if (!backendConfig.autoRefresh) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          doRefresh();
          return backendConfig.pollIntervalSecs;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [backendConfig.autoRefresh, backendConfig.pollIntervalSecs, doRefresh]);

  // Request HTML5 Geolocation in Singapore
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        // Verify if within Singapore rough bounds (Lat 1.15 to 1.5, Lng 103.5 to 104.1)
        const isWithinSingapore =
          coords.lat >= 1.15 && coords.lat <= 1.5 && coords.lng >= 103.5 && coords.lng <= 104.1;

        const effectiveCoords = isWithinSingapore
          ? coords
          : { lat: 1.2838, lng: 103.8589 }; // Fallback to Marina Bay Sands if tested from outside SG

        setUserLocation(effectiveCoords);
        setIsLocating(false);

        // Update carparks with distance
        setCarparks((prev) =>
          prev.map((cp) => ({
            ...cp,
            distanceKm: calculateDistanceKm(
              effectiveCoords.lat,
              effectiveCoords.lng,
              cp.coordinates.lat,
              cp.coordinates.lng
            ),
          }))
        );
      },
      (err) => {
        console.warn('Geolocation failed, falling back to Singapore Downtown:', err);
        // Fallback to Singapore CBD / Downtown
        const downtownCoords = { lat: 1.2935, lng: 103.8572 };
        setUserLocation(downtownCoords);
        setIsLocating(false);
        setCarparks((prev) =>
          prev.map((cp) => ({
            ...cp,
            distanceKm: calculateDistanceKm(
              downtownCoords.lat,
              downtownCoords.lng,
              cp.coordinates.lat,
              cp.coordinates.lng
            ),
          }))
        );
      },
      { timeout: 8000 }
    );
  };

  // Quick Filter Handler
  const handleSelectQuickFilter = (type: string) => {
    setActiveQuickFilter(type);
    switch (type) {
      case 'available_only':
        setFilters((f) => ({ ...f, status: 'available', agency: 'all', hasEvCharging: false, freeParkingOnly: false }));
        break;
      case 'ev_only':
        setFilters((f) => ({ ...f, hasEvCharging: true, status: 'all', agency: 'all', freeParkingOnly: false }));
        break;
      case 'free_parking':
        setFilters((f) => ({ ...f, freeParkingOnly: true, status: 'all', agency: 'all', hasEvCharging: false }));
        break;
      case 'hdb_only':
        setFilters((f) => ({ ...f, agency: 'HDB', status: 'all', hasEvCharging: false, freeParkingOnly: false }));
        break;
      case 'commercial_only':
        setFilters((f) => ({ ...f, agency: 'COMMERCIAL', status: 'all', hasEvCharging: false, freeParkingOnly: false }));
        break;
      default:
        setFilters((f) => ({
          ...f,
          status: 'all',
          agency: 'all',
          hasEvCharging: false,
          freeParkingOnly: false,
        }));
    }
  };

  const handleResetFilters = () => {
    setActiveQuickFilter('all');
    setFilters({
      searchQuery: '',
      vehicleType: 'all',
      agency: 'all',
      status: 'all',
      zone: 'All Zones',
      hasEvCharging: false,
      freeParkingOnly: false,
      highClearanceOnly: false,
      sortBy: 'availability_desc',
      onlyFavorites: false,
    });
  };

  // Filtered & Sorted Carparks
  const filteredCarparks = useMemo(() => {
    return carparks
      .filter((cp) => {
        // Search query
        if (filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase().trim();
          const matchName = cp.name.toLowerCase().includes(q);
          const matchId = cp.id.toLowerCase().includes(q);
          const matchAddress = cp.address.toLowerCase().includes(q);
          const matchZone = cp.zone.toLowerCase().includes(q);
          if (!matchName && !matchId && !matchAddress && !matchZone) return false;
        }

        // Zone filter
        if (filters.zone !== 'All Zones' && cp.zone !== filters.zone) {
          return false;
        }

        // Vehicle Type Filter
        if (filters.vehicleType !== 'all') {
          const lot = cp.lots[filters.vehicleType];
          if (!lot || lot.lots_available <= 0) return false;
        }

        // Agency Filter
        if (filters.agency !== 'all' && cp.agency !== filters.agency) {
          return false;
        }

        // Status Filter
        if (filters.status !== 'all' && cp.status !== filters.status) {
          return false;
        }

        // EV Charging
        if (filters.hasEvCharging && !cp.has_ev_charging) {
          return false;
        }

        // Free Parking
        if (filters.freeParkingOnly && !cp.free_parking) {
          return false;
        }

        // High Clearance
        if (filters.highClearanceOnly && (!cp.gantry_height_m || cp.gantry_height_m < 2.1)) {
          return false;
        }

        // Favorites only
        if (filters.onlyFavorites && !favorites.has(cp.id)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'availability_desc') {
          return b.availableLotsCombined - a.availableLotsCombined;
        }
        if (filters.sortBy === 'availability_asc') {
          return a.availableLotsCombined - b.availableLotsCombined;
        }
        if (filters.sortBy === 'distance_asc') {
          return (a.distanceKm ?? 999) - (b.distanceKm ?? 999);
        }
        if (filters.sortBy === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [carparks, filters, favorites]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      
      {/* 1. Top Navbar */}
      <Header
        backendConfig={backendConfig}
        onOpenBackendModal={() => setIsBackendModalOpen(true)}
        onRefreshNow={() => doRefresh()}
        isRefreshing={isRefreshing}
        secondsUntilNextSync={countdown}
        lastUpdatedTime={lastUpdated}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        totalCarparksCount={carparks.length}
        activeSourceLabel={activeSourceLabel}
      />

      {/* 2. Island-wide Stats Banner */}
      <StatsBanner
        carparks={carparks}
        onSelectQuickFilter={handleSelectQuickFilter}
        activeQuickFilter={activeQuickFilter}
      />

      {/* 3. Filter & Search Controls */}
      <FilterBar
        filters={filters}
        onFilterChange={setFilters}
        onResetFilters={handleResetFilters}
        userLocation={userLocation}
        onLocateUser={handleLocateUser}
        isLocating={isLocating}
        favoritesCount={favorites.size}
      />

      {/* 4. Main Body: Split View / Map / List */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Results Counter & Active Summary */}
        <div className="flex items-center justify-between text-xs text-slate-400 mb-4 font-mono">
          <div>
            Showing <strong className="text-white">{filteredCarparks.length}</strong> of{' '}
            {carparks.length} carparks
            {filters.zone !== 'All Zones' && ` in ${filters.zone}`}
          </div>
          <div className="hidden sm:block">
            Auto-refreshing in <span className="text-emerald-400 font-bold">{countdown}s</span>
          </div>
        </div>

        {/* View Mode 1: Split Mode (Map + List side-by-side on desktop) */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Sticky Interactive Map Column */}
            <div className="lg:col-span-6 xl:col-span-5 h-[380px] lg:h-[calc(100vh-270px)] lg:sticky lg:top-[120px] rounded-2xl overflow-hidden shadow-2xl">
              <CarparkMap
                carparks={filteredCarparks}
                selectedCarpark={selectedCarpark}
                onSelectCarpark={(cp) => {
                  setSelectedCarpark(cp);
                  setDetailModalCarpark(cp);
                }}
                userLocation={userLocation}
                onLocateUser={handleLocateUser}
                selectedVehicleType={filters.vehicleType}
              />
            </div>

            {/* Scrollable Carpark Cards Column */}
            <div className="lg:col-span-6 xl:col-span-7 space-y-3.5">
              {filteredCarparks.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Car className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">No carparks found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                    No carparks matching your active filter criteria. Try clearing search or choosing another zone.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                filteredCarparks.map((cp) => (
                  <CarparkCard
                    key={cp.id}
                    carpark={cp}
                    isSelected={selectedCarpark?.id === cp.id}
                    isFavorite={favorites.has(cp.id)}
                    onSelect={(c) => setSelectedCarpark(c)}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenEstimator={(c) => setEstimatorModalCarpark(c)}
                    onOpenDetails={(c) => setDetailModalCarpark(c)}
                    selectedVehicleType={filters.vehicleType}
                  />
                ))
              )}
            </div>

          </div>
        )}

        {/* View Mode 2: Map Focus Mode */}
        {viewMode === 'map' && (
          <div className="relative h-[calc(100vh-240px)] min-h-[500px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
            <CarparkMap
              carparks={filteredCarparks}
              selectedCarpark={selectedCarpark}
              onSelectCarpark={(cp) => setSelectedCarpark(cp)}
              userLocation={userLocation}
              onLocateUser={handleLocateUser}
              selectedVehicleType={filters.vehicleType}
            />

            {/* Selected Carpark Floating Card Bottom Drawer */}
            {selectedCarpark && (
              <div className="absolute bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-96 z-30">
                <CarparkCard
                  carpark={selectedCarpark}
                  isSelected={true}
                  isFavorite={favorites.has(selectedCarpark.id)}
                  onSelect={(c) => setSelectedCarpark(c)}
                  onToggleFavorite={handleToggleFavorite}
                  onOpenEstimator={(c) => setEstimatorModalCarpark(c)}
                  onOpenDetails={(c) => setDetailModalCarpark(c)}
                  selectedVehicleType={filters.vehicleType}
                />
              </div>
            )}
          </div>
        )}

        {/* View Mode 3: Cards Grid Mode */}
        {viewMode === 'list' && (
          <div>
            {filteredCarparks.length === 0 ? (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
                  <Car className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">No carparks found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
                  No carparks matching your active filter criteria. Try clearing search or choosing another zone.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCarparks.map((cp) => (
                  <CarparkCard
                    key={cp.id}
                    carpark={cp}
                    isSelected={selectedCarpark?.id === cp.id}
                    isFavorite={favorites.has(cp.id)}
                    onSelect={(c) => {
                      setSelectedCarpark(c);
                      setDetailModalCarpark(c);
                    }}
                    onToggleFavorite={handleToggleFavorite}
                    onOpenEstimator={(c) => setEstimatorModalCarpark(c)}
                    onOpenDetails={(c) => setDetailModalCarpark(c)}
                    selectedVehicleType={filters.vehicleType}
                  />
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/90 py-5 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">SG CarPark Real-Time Tracker</span>
            <span>•</span>
            <span>Data format compatible with LTA DataMall &amp; data.gov.sg</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsBackendModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 font-mono text-[11px] underline"
            >
              Configure Custom Backend API
            </button>
            <span>•</span>
            <span>SGT (UTC+8)</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {/* 1. Detail Modal */}
      <CarparkDetailModal
        carpark={detailModalCarpark}
        onClose={() => setDetailModalCarpark(null)}
        isFavorite={detailModalCarpark ? favorites.has(detailModalCarpark.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onOpenEstimator={(c) => {
          setDetailModalCarpark(null);
          setEstimatorModalCarpark(c);
        }}
      />

      {/* 2. Rate Estimator Modal */}
      <RateEstimatorModal
        carpark={estimatorModalCarpark}
        onClose={() => setEstimatorModalCarpark(null)}
      />

      {/* 3. Backend Integration Hub Modal */}
      {isBackendModalOpen && (
        <BackendIntegrationModal
          config={backendConfig}
          onUpdateConfig={handleUpdateBackendConfig}
          onClose={() => setIsBackendModalOpen(false)}
        />
      )}

    </div>
  );
}
