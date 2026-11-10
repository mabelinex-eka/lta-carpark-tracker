import { 
  Carpark, 
  BackendConfig, 
  AvailabilityStatus, 
  LotDetail,
  TrafficIncident,
  TrainAlert,
  BusArrivalResponse
} from '../types/carpark';
import { INITIAL_SINGAPORE_CARPARKS } from '../data/singaporeCarparks';

const GOV_API_URL = 'https://api.data.gov.sg/v1/transport/carpark-availability';

export const DEFAULT_BACKEND_CONFIG: BackendConfig = {
  source: 'lta_datamall',
  customEndpointUrl: 'http://localhost:8080/api/carparks',
  pollIntervalSecs: 30,
  autoRefresh: true,
  ltaAccountKey: '',
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

export interface LtaDataMallCarparkItem {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // "lat lng" e.g. "1.2935 103.8572"
  AvailableLots: number;
  LotType: 'C' | 'Y' | 'H';
  Agency: string; // "HDB" | "URA" | "LTA"
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

// Map Data.gov.sg carpark response to UI Carpark model
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

// Merge LTA DataMall CarParkAvailabilityv2 payload
export function mergeWithLtaData(
  currentCarparks: Carpark[],
  ltaItems: LtaDataMallCarparkItem[]
): Carpark[] {
  // Map by development name or CarParkID
  const ltaMap = new Map<string, LtaDataMallCarparkItem>();
  ltaItems.forEach((item) => {
    if (item.CarParkID) ltaMap.set(item.CarParkID.toLowerCase(), item);
    if (item.Development) ltaMap.set(item.Development.toLowerCase(), item);
  });

  return currentCarparks.map((cp) => {
    const ltaMatch =
      ltaMap.get(cp.id.toLowerCase()) ||
      ltaMap.get(cp.name.toLowerCase()) ||
      Array.from(ltaMap.values()).find((item) =>
        cp.name.toLowerCase().includes(item.Development.toLowerCase()) ||
        item.Development.toLowerCase().includes(cp.name.toLowerCase())
      );

    if (!ltaMatch) return cp;

    const lotType = ltaMatch.LotType || 'C';
    const existingTotal = cp.lots[lotType]?.total_lots || (lotType === 'C' ? 500 : 80);
    const available = Number(ltaMatch.AvailableLots) || 0;

    const updatedLots: Record<string, LotDetail> = {
      ...cp.lots,
      [lotType]: {
        total_lots: existingTotal,
        lot_type: lotType,
        lots_available: available,
      },
    };

    let totalAvail = 0;
    let totalLots = 0;
    Object.values(updatedLots).forEach((lot) => {
      totalAvail += lot.lots_available;
      totalLots += lot.total_lots;
    });

    const lotDelta = totalAvail - cp.availableLotsCombined;
    const occupancy =
      totalLots > 0
        ? Math.min(100, Math.round(((totalLots - totalAvail) / totalLots) * 100))
        : cp.occupancyPercent;

    return {
      ...cp,
      lots: updatedLots,
      availableLotsCombined: totalAvail,
      totalLotsCombined: totalLots > 0 ? totalLots : cp.totalLotsCombined,
      occupancyPercent: occupancy,
      status: calculateStatus(totalAvail, totalLots || cp.totalLotsCombined),
      update_datetime: new Date().toISOString(),
      lotDelta: lotDelta !== 0 ? lotDelta : undefined,
    };
  });
}

// Simulate real-time lot fluctuations
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

// Fetch carparks from configured data source
export async function fetchCarparks(
  config: BackendConfig,
  currentCarparks: Carpark[]
): Promise<{ carparks: Carpark[]; sourceUsed: string; error?: string }> {
  // Option 1: LTA DataMall proxy
  if (config.source === 'lta_datamall') {
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (config.ltaAccountKey) {
        headers['x-account-key'] = config.ltaAccountKey;
      }
      const res = await fetch('/api/lta/carparks', { headers });
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      
      if (data.value && Array.isArray(data.value) && data.value.length > 0) {
        const merged = mergeWithLtaData(
          currentCarparks.length ? currentCarparks : INITIAL_SINGAPORE_CARPARKS,
          data.value
        );
        return {
          carparks: merged,
          sourceUsed: 'LTA DataMall (CarParkAvailabilityv2 Live)',
        };
      } else if (data.items && Array.isArray(data.items)) {
        // Gov fallback
        const merged = mergeWithGovData(
          currentCarparks.length ? currentCarparks : INITIAL_SINGAPORE_CARPARKS,
          data.items[0]?.carpark_data || []
        );
        return {
          carparks: merged,
          sourceUsed: 'data.gov.sg (LTA Proxy Live Feed)',
        };
      }

      // If no items returned, simulate ticks
      return {
        carparks: simulateLotTicks(currentCarparks.length ? currentCarparks : INITIAL_SINGAPORE_CARPARKS),
        sourceUsed: 'LTA DataMall (Simulation - AccountKey not set)',
      };
    } catch (err: any) {
      console.warn('LTA carparks fetch failed:', err);
      return {
        carparks: simulateLotTicks(currentCarparks.length ? currentCarparks : INITIAL_SINGAPORE_CARPARKS),
        sourceUsed: 'Simulated Stream (LTA Server fallback)',
        error: err?.message,
      };
    }
  }

  // Option 2: Simulated Stream
  if (config.source === 'simulated') {
    return {
      carparks: simulateLotTicks(currentCarparks.length ? currentCarparks : INITIAL_SINGAPORE_CARPARKS),
      sourceUsed: 'Simulated Real-Time Stream (Demo)',
    };
  }

  // Option 3: Direct Gov API
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
      return {
        carparks: simulateLotTicks(currentCarparks.length ? currentCarparks : INITIAL_SINGAPORE_CARPARKS),
        sourceUsed: 'Simulated Stream (Gov API fallback)',
        error: err?.message,
      };
    }
  }

  // Option 4: Custom Backend
  if (config.source === 'custom_backend') {
    try {
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      }
      const res = await fetch(config.customEndpointUrl, { method: 'GET', headers });
      if (!res.ok) {
        throw new Error(`Custom backend responded with HTTP ${res.status}`);
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : data.carparks || data.data || [];
      if (!Array.isArray(list) || list.length === 0) {
        throw new Error('Custom backend returned empty payload');
      }
      return {
        carparks: list,
        sourceUsed: `Custom Backend: ${config.customEndpointUrl}`,
      };
    } catch (err: any) {
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

// Fetch Traffic Incidents from LTA DataMall
export async function fetchTrafficIncidents(ltaAccountKey?: string): Promise<TrafficIncident[]> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (ltaAccountKey) {
      headers['x-account-key'] = ltaAccountKey;
    }
    const res = await fetch('/api/lta/traffic-incidents', { headers });
    if (!res.ok) return [];
    const data = await res.json();
    return data.value || [];
  } catch (err) {
    console.error('Failed to fetch traffic incidents:', err);
    return [];
  }
}

// Fetch Train Service Alerts from LTA DataMall
export async function fetchTrainAlerts(ltaAccountKey?: string): Promise<TrainAlert | null> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (ltaAccountKey) {
      headers['x-account-key'] = ltaAccountKey;
    }
    const res = await fetch('/api/lta/train-alerts', { headers });
    if (!res.ok) return null;
    const data = await res.json();
    return data.value || null;
  } catch (err) {
    console.error('Failed to fetch train alerts:', err);
    return null;
  }
}

// Fetch Next Buses from LTA DataMall (v3)
export async function fetchBusArrivals(
  busStopCode: string = '83139',
  serviceNo?: string,
  ltaAccountKey?: string
): Promise<BusArrivalResponse | null> {
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (ltaAccountKey) {
      headers['x-account-key'] = ltaAccountKey;
    }
    let url = `/api/lta/bus-arrivals?BusStopCode=${encodeURIComponent(busStopCode)}`;
    if (serviceNo) {
      url += `&ServiceNo=${encodeURIComponent(serviceNo)}`;
    }
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch bus arrivals:', err);
    return null;
  }
}

// Test LTA AccountKey
export async function testLtaAccountKey(
  key: string
): Promise<{ success: boolean; latencyMs: number; message: string }> {
  try {
    const res = await fetch('/api/lta/test-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountKey: key }),
    });
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      latencyMs: 0,
      message: err?.message || 'Failed to ping test endpoint',
    };
  }
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
