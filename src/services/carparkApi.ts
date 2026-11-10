import { Carpark, BackendConfig, AvailabilityStatus, LotDetail } from '../types/carpark';
import { INITIAL_SINGAPORE_CARPARKS } from '../data/singaporeCarparks';

const GOV_API_URL = 'https://api.data.gov.sg/v1/transport/carpark-availability';

export const DEFAULT_BACKEND_CONFIG: BackendConfig = {
  source: 'simulated',
  customEndpointUrl: 'http://localhost:8080/api/carparks',
  pollIntervalSecs: 30,
  autoRefresh: true,
};

export interface DataGovCarparkItem {
  carpark_number: string;
  update_datetime: string;
  carpark_info: Array<{
    total_lots: string;
    lot_type: 'C' | 'Y' | 'H';
    lots_available: string;
  }>;
}

export function calculateStatus(available: number, total: number): AvailabilityStatus {
  if (available <= 0) return 'full';
  const ratio = available / Math.max(total, 1);
  if (available < 15 || ratio < 0.1) return 'almost_full';
  if (ratio < 0.25 || available < 40) return 'filling_fast';
  return 'available';
}

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Map Data.gov.sg carpark response to our UI Carpark model
export function mergeWithGovData(
  currentCarparks: Carpark[],
  govDataList: DataGovCarparkItem[]
): Carpark[] {
  const govMap = new Map<string, DataGovCarparkItem>();
  govDataList.forEach((item) => govMap.set(item.carpark_number, item));

  return currentCarparks.map((cp) => {
    const govItem = govMap.get(cp.id);
    if (!govItem || !govItem.carpark_info || govItem.carpark_info.length === 0) {
      return cp;
    }

    const newLots: Record<string, LotDetail> = { ...cp.lots };
    let combinedTotal = 0;
    let combinedAvailable = 0;

    govItem.carpark_info.forEach((info) => {
      const tot = parseInt(info.total_lots, 10) || 0;
      const avail = parseInt(info.lots_available, 10) || 0;
      newLots[info.lot_type] = {
        total_lots: tot,
        lot_type: info.lot_type,
        lots_available: avail,
      };
      combinedTotal += tot;
      combinedAvailable += avail;
    });

    const previousAvailable = cp.availableLotsCombined;
    const lotDelta = combinedAvailable - previousAvailable;
    const occupancy =
      combinedTotal > 0
        ? Math.min(100, Math.round(((combinedTotal - combinedAvailable) / combinedTotal) * 100))
        : cp.occupancyPercent;

    return {
      ...cp,
      lots: newLots,
      totalLotsCombined: combinedTotal > 0 ? combinedTotal : cp.totalLotsCombined,
      availableLotsCombined: combinedAvailable,
      occupancyPercent: occupancy,
      status: calculateStatus(combinedAvailable, combinedTotal || cp.totalLotsCombined),
      update_datetime: govItem.update_datetime || new Date().toISOString(),
      lotDelta: lotDelta !== 0 ? lotDelta : undefined,
    };
  });
}

// Simulate real-time lot fluctuations for front-end demonstration
export function simulateLotTicks(carparks: Carpark[]): Carpark[] {
  return carparks.map((cp) => {
    // Random 40% chance of a change on each tick
    if (Math.random() > 0.45) return { ...cp, lotDelta: undefined };

    // Fluctuate car lots by -3 to +3
    const delta = Math.floor(Math.random() * 7) - 3;
    if (delta === 0) return { ...cp, lotDelta: undefined };

    const currentCarLots = cp.lots.C?.lots_available ?? 20;
    const totalCarLots = cp.lots.C?.total_lots ?? 100;
    const newCarAvailable = Math.max(0, Math.min(totalCarLots, currentCarLots + delta));

    const actualDelta = newCarAvailable - currentCarLots;
    if (actualDelta === 0) return cp;

    const updatedLots: Record<string, LotDetail> = {
      ...cp.lots,
      C: cp.lots.C
        ? { ...cp.lots.C, lots_available: newCarAvailable }
        : { total_lots: 100, lot_type: 'C', lots_available: newCarAvailable },
    };

    let totalAvail = 0;
    let totalLots = 0;
    Object.values(updatedLots).forEach((lot) => {
      totalAvail += lot.lots_available;
      totalLots += lot.total_lots;
    });

    const occupancy = Math.min(100, Math.round(((totalLots - totalAvail) / Math.max(1, totalLots)) * 100));

    return {
      ...cp,
      lots: updatedLots,
      availableLotsCombined: totalAvail,
      occupancyPercent: occupancy,
      status: calculateStatus(totalAvail, totalLots),
      update_datetime: new Date().toISOString(),
      lotDelta: actualDelta,
    };
  });
}

// Fetch carparks from chosen data source
export async function fetchCarparks(
  config: BackendConfig,
  currentCarparks: Carpark[]
): Promise<{ carparks: Carpark[]; sourceUsed: string; error?: string }> {
  if (config.source === 'simulated') {
    return {
      carparks: simulateLotTicks(currentCarparks.length ? currentCarparks : INITIAL_SINGAPORE_CARPARKS),
      sourceUsed: 'Simulated Real-Time Stream (Demo)',
    };
  }

  if (config.source === 'direct_gov') {
    try {
      const res = await fetch(GOV_API_URL, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        throw new Error(`data.gov.sg returned status ${res.status}`);
      }
      const data = await res.json();
      const items: DataGovCarparkItem[] = data?.items?.[0]?.carpark_data || [];
      if (!items.length) {
        throw new Error('No carpark items in data.gov.sg payload');
      }
      const merged = mergeWithGovData(
        currentCarparks.length ? currentCarparks : INITIAL_SINGAPORE_CARPARKS,
        items
      );
      return {
        carparks: merged,
        sourceUsed: 'data.gov.sg (Live Official SGT)',
      };
    } catch (err: any) {
      console.warn('Failed to fetch from data.gov.sg:', err);
      // Fallback with simulation
      return {
        carparks: simulateLotTicks(currentCarparks.length ? currentCarparks : INITIAL_SINGAPORE_CARPARKS),
        sourceUsed: 'Simulated Stream (Gov API fallback: ' + (err?.message || 'CORS/Network error') + ')',
        error: err?.message,
      };
    }
  }

  if (config.source === 'custom_backend') {
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }
      const res = await fetch(config.customEndpointUrl, {
        method: 'GET',
        headers,
      });
      if (!res.ok) {
        throw new Error(`Custom backend responded with HTTP ${res.status}`);
      }
      const data = await res.json();
      // Handle array directly or { data: [...] } or { carparks: [...] }
      const list = Array.isArray(data) ? data : data.carparks || data.data || [];
      if (!Array.isArray(list) || list.length === 0) {
        throw new Error('Custom backend returned empty or non-array payload');
      }
      return {
        carparks: list,
        sourceUsed: `Custom Backend: ${config.customEndpointUrl}`,
      };
    } catch (err: any) {
      console.error('Custom backend request failed:', err);
      return {
        carparks: simulateLotTicks(currentCarparks.length ? currentCarparks : INITIAL_SINGAPORE_CARPARKS),
        sourceUsed: 'Simulated (Custom Backend unreachable)',
        error: err?.message || 'Connection failed',
      };
    }
  }

  return {
    carparks: INITIAL_SINGAPORE_CARPARKS,
    sourceUsed: 'Default Mock',
  };
}

// Test custom backend connectivity
export async function testBackendConnection(
  url: string,
  apiKey?: string
): Promise<{ success: boolean; latencyMs: number; message: string; sampleData?: any }> {
  const start = performance.now();
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    const res = await fetch(url, { method: 'GET', headers });
    const end = performance.now();
    const latency = Math.round(end - start);

    if (!res.ok) {
      return {
        success: false,
        latencyMs: latency,
        message: `HTTP error ${res.status}: ${res.statusText}`,
      };
    }

    const json = await res.json();
    return {
      success: true,
      latencyMs: latency,
      message: `Connected successfully (${latency}ms). Payload received.`,
      sampleData: json,
    };
  } catch (err: any) {
    const end = performance.now();
    return {
      success: false,
      latencyMs: Math.round(end - start),
      message: err?.message || 'Could not connect. Ensure CORS is enabled on the server.',
    };
  }
}
