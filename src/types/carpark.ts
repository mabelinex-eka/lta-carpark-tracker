export type VehicleLotType = 'C' | 'Y' | 'H'; // C: Car, Y: Motorcycle, H: Heavy Vehicle

export type AgencyType = 'HDB' | 'URA' | 'LTA' | 'COMMERCIAL';

export type CarparkStructureType = 'BASEMENT' | 'MULTI-STOREY' | 'SURFACE' | 'MECHANISED' | 'COVERED';

export type AvailabilityStatus = 'available' | 'filling_fast' | 'almost_full' | 'full';

export interface LotDetail {
  total_lots: number;
  lot_type: VehicleLotType;
  lots_available: number;
}

export interface ParkingRates {
  weekday_day: string;
  weekday_night: string;
  weekend: string;
  grace_period_mins: number;
  per_half_hour_cents?: number; // e.g. 60 cents
}

export interface Carpark {
  id: string; // Carpark code e.g. "ACB", "HE12", "PL7", "MBS01"
  name: string;
  address: string;
  agency: AgencyType;
  structure: CarparkStructureType;
  coordinates: {
    lat: number;
    lng: number;
  };
  zone: 'Central / CBD' | 'Orchard' | 'Marina Bay' | 'East' | 'West' | 'North' | 'North-East' | 'Changi';
  lots: {
    C?: LotDetail; // Cars
    Y?: LotDetail; // Motorcycles
    H?: LotDetail; // Heavy
  };
  totalLotsCombined: number;
  availableLotsCombined: number;
  occupancyPercent: number; // 0 - 100
  status: AvailabilityStatus;
  update_datetime: string;
  gantry_height_m: number | null; // in meters, e.g. 2.1
  free_parking: boolean;
  free_parking_desc?: string;
  night_parking: boolean;
  has_ev_charging: boolean;
  ev_charging_count?: number;
  rates: ParkingRates;
  hourly_occupancy_trend: number[]; // 24-hour occupancy percentages (0h - 23h)
  distanceKm?: number; // Calculated relative to user's location
  lotDelta?: number; // Real-time delta e.g. +3 or -2 since previous poll
}

export type DataSourceMode = 'lta_datamall' | 'direct_gov' | 'custom_backend' | 'simulated';

export interface BackendConfig {
  source: DataSourceMode;
  customEndpointUrl: string;
  pollIntervalSecs: number; // e.g. 30s
  apiKey?: string;
  ltaAccountKey?: string;
  autoRefresh: boolean;
}

export interface FilterState {
  searchQuery: string;
  vehicleType: 'all' | 'C' | 'Y' | 'H';
  agency: 'all' | 'HDB' | 'URA' | 'LTA' | 'COMMERCIAL';
  status: 'all' | 'available' | 'filling_fast' | 'almost_full' | 'full';
  zone: string;
  hasEvCharging: boolean;
  freeParkingOnly: boolean;
  highClearanceOnly: boolean; // >= 2.1m
  sortBy: 'availability_desc' | 'availability_asc' | 'distance_asc' | 'name_asc';
  onlyFavorites: boolean;
}

// LTA Transit Types
export interface TrafficIncident {
  Type: string;
  Latitude: number;
  Longitude: number;
  Message: string;
}

export interface TrainAlert {
  Status: number; // 1 = Normal, 2 = Disrupted
  Lines?: Array<{ code: string; name: string; status: string }>;
  Message?: string[];
}

export interface BusArrivalNextBus {
  EstimatedArrival: string;
  Load: 'SEA' | 'SDA' | 'LSD' | string; // Seats Available, Standing Available, Limited Standing
  Feature: string; // e.g. WAB (Wheelchair Accessible Bus)
  Type: string; // SD (Single Deck), DD (Double Deck), BD (Bendy)
}

export interface BusServiceArrival {
  ServiceNo: string;
  Operator: string;
  NextBus: BusArrivalNextBus;
  NextBus2?: Partial<BusArrivalNextBus>;
  NextBus3?: Partial<BusArrivalNextBus>;
}

export interface BusArrivalResponse {
  BusStopCode: string;
  Services: BusServiceArrival[];
  source?: string;
  accountKeyProvided?: boolean;
}
