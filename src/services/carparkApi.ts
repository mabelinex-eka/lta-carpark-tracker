import { Carpark, BackendConfig, AvailabilityStatus, LotDetail } from '../types/carpark';
import { INITIAL_SINGAPORE_CARPARKS } from '../data/singaporeCarparks';

const GOV_API_URL = 'https://api.data.gov.sg/v1/transport/carpark-availability';
const LOCAL_LTA_ENDPOINT = '/api/carparkavailability';

export const DEFAULT_BACKEND_CONFIG: BackendConfig = {
  source: 'lta_serverless',
  customEndpointUrl: '/api/carparkavailability',
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

export interface LtaDataMallRawItem {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // "latitude longitude" e.g. "1.29375 103.85718"
  AvailableLots: number;
  LotType: 'C' | 'Y' | 'H';
  Agency: 'HDB' | 'LTA' | 'URA';
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

// Map LTA DataMall items to our UI Carpark model
export function mergeWithLtaData(
  currentCarparks: Carpark[],
  ltaItems: LtaDataMallRawItem[]
): Carpark[] {
  // Group LTA items by CarParkID
  const ltaMap = new Map<string, LtaDataMallRawItem[]>();
  ltaItems.forEach((item) => {
    const list = ltaMap.get(item.CarParkID) || [];
    list.push(item);
    ltaMap.set(item.CarParkID, list);
  });

  return currentCarparks.map((cp) => {
    const items = ltaMap.get(cp.id);
    if (!items || items.length === 0) return cp;

    const newLots: Record<string, LotDetail> = { ...cp.lots };
    let combinedAvailable = 0;

    items.forEach((item) => {
      const avail = item.AvailableLots || 0;
      const existingTotal = cp.lots[item.LotType]?.total_lots || Math.max(avail, 100);
      newLots[item.LotType] = {
        total_lots: existingTotal,
        lot_type: item.LotType,
        lots_available: avail,
      };
      combinedAvailable += avail;
    });

    const previousAvailable = cp.availableLotsCombined;
    const lotDelta = combinedAvailable - previousAvailable;
    const totalLots = cp.totalLotsCombined;
    const occupancy =
      totalLots > 0
        ? Math.min(100, Math.round(((totalLots - combinedAvailable) / totalLots) * 100))
        : cp.occupancyPercent;

    return {
      ...cp,
      lots: newLots,
      availableLotsCombined: combinedAvailable,
      occupancyPercent: occupancy,
      status: calculateStatus(combinedAvailable, totalLots),
      update_datetime: new Date().toISOString(),
      lotDelta: lotDelta !== 0 ? lotDelta : undefined,
    };
  });
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
    if (Math.random() > 0.45) return { ...cp, lotDelta: undefined };

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
  // Option 1: Local LTA Serverless proxy (/api/carparkavailability)
  if (config.source === 'lta_serverless') {
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (config.apiKey) {
        headers['AccountKey'] = config.apiKey;
      }
      const res = await fetch(LOCAL_LTA_ENDPOINT, { headers });
      if (!res.ok) {
        throw new Error(`Serverless /api/carparkavailability returned ${res.status}`);
      }
      const json = await res.json();

      // Check if LTA DataMall returned value array
      const items: LtaDataMallRawItem[] = Array.isArray(json.value)
        ? json.value
        : Array.isArray(json)
        ? json
        : [];

      if (items.length > 0) {
        const merged = mergeWithLtaData(
          currentCarparks.length ? currentCarparks : INITIAL_SINGAPORE_CARPARKS,
          items
        );
        const hasKey = json.hasAccountKey !== false;
        return {
          carparks: merged,
          sourceUsed: hasKey
            ? 'LTA DataMall Serverless (/api/carparkavailability)'
            : 'LTA DataMall Serverless (Fallback Demo - Add AccountKey)',
        };
      }

      // If pending configuration notice
      return {
        carparks: simulateLotTicks(currentCarparks.length ? currentCarparks : INITIAL_SINGAPORE_CARPARKS),
        sourceUsed: 'LTA DataMall (/api/carparkavailability - Waiting for AccountKey)',
      };
    } catch (err: any) {
      console.warn('LTA serverless fetch failed, falling back:', err);
      return {
        carparks: simulateLotTicks(currentCarparks.length ? currentCarparks : INITIAL_SINGAPORE_CARPARKS),
        sourceUsed: 'Simulated Stream (LTA Serverless fallback: ' + (err?.message || 'Error') + ')',
        error: err?.message,
      };
    }
  }

  // Option 2: Direct data.gov.sg
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
      return {
        carparks: simulateLotTicks(currentCarparks.length ? currentCarparks : INITIAL_SINGAPORE_CARPARKS),
        sourceUsed: 'Simulated Stream (Gov API fallback: ' + (err?.message || 'CORS/Network error') + ')',
        error: err?.message,
      };
    }
  }

  // Option 3: Custom Backend
  if (config.source === 'custom_backend') {
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        headers['AccountKey'] = config.apiKey;
      }
      const res = await fetch(config.customEndpointUrl, {
        method: 'GET',
        headers,
      });
      if (!res.ok) {
        throw new Error(`Custom backend responded with HTTP ${res.status}`);
      }
      const data = await res.json();

      // Check if it's LTA DataMall shape
      if (Array.isArray(data.value)) {
        const merged = mergeWithLtaData(
          currentCarparks.length ? currentCarparks : INITIAL_SINGAPORE_CARPARKS,
          data.value
        );
        return {
          carparks: merged,
          sourceUsed: `Custom Backend (LTA DataMall): ${config.customEndpointUrl}`,
        };
      }

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

  // Option 4: Simulated Stream
  return {
    carparks: simulateLotTicks(currentCarparks.length ? currentCarparks : INITIAL_SINGAPORE_CARPARKS),
    sourceUsed: 'Simulated Real-Time Stream (Demo)',
  };
}

// Test backend or serverless connectivity
export async function testBackendConnection(
  url: string,
  apiKey?: string
): Promise<{ success: boolean; latencyMs: number; message: string; sampleData?: any }> {
  const start = performance.now();
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (apiKey) {
      headers['AccountKey'] = apiKey;
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
      message: err?.message || 'Could not connect. Ensure server is running and CORS is enabled.',
    };
  }
}
