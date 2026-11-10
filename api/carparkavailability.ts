import type { Request, Response } from 'express';

const LTA_DATAMALL_ENDPOINT = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';

export interface LtaRawCarparkItem {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // "latitude longitude" e.g. "1.29375 103.85718"
  AvailableLots: number;
  LotType: 'C' | 'Y' | 'H'; // C: Car, Y: Motorcycle, H: Heavy Vehicle
  Agency: 'HDB' | 'LTA' | 'URA';
}

export interface LtaDataMallResponse {
  'odata.metadata'?: string;
  value: LtaRawCarparkItem[];
}

/**
 * Serverless / Express handler for LTA CarParkAvailabilityv2
 * Endpoint: /api/carparkavailability
 */
export default async function handler(req: Request, res: Response) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, AccountKey, Authorization, X-Requested-With');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Retrieve AccountKey from environment or request headers
  const accountKey =
    process.env.LTA_DATAMALL_ACCOUNT_KEY ||
    process.env.ACCOUNT_KEY ||
    (req.headers['accountkey'] as string) ||
    (req.headers['account-key'] as string) ||
    (req.query['accountKey'] as string);

  // If no AccountKey is configured yet
  if (!accountKey || accountKey.trim() === '' || accountKey === 'YOUR_LTA_DATAMALL_ACCOUNT_KEY') {
    return res.status(200).json({
      status: 'pending_configuration',
      message:
        'LTA_DATAMALL_ACCOUNT_KEY is not yet configured. Set LTA_DATAMALL_ACCOUNT_KEY in your environment variables or provide the "AccountKey" header. Sample data in official LTA schema is returned below for testing.',
      targetEndpoint: LTA_DATAMALL_ENDPOINT,
      hasAccountKey: false,
      'odata.metadata': 'https://datamall2.mytransport.sg/ltaodataservice/$metadata#CarParkAvailabilityv2',
      value: [
        {
          CarParkID: '1',
          Area: 'Marina',
          Development: 'Suntec City',
          Location: '1.29375 103.85718',
          AvailableLots: 840,
          LotType: 'C',
          Agency: 'LTA',
        },
        {
          CarParkID: '2',
          Area: 'Marina',
          Development: 'Marina Bay Financial Centre',
          Location: '1.2798 103.8538',
          AvailableLots: 195,
          LotType: 'C',
          Agency: 'LTA',
        },
        {
          CarParkID: 'ACB',
          Area: 'Ang Mo Kio',
          Development: 'Blk 712 Ang Mo Kio Ave 6',
          Location: '1.3698 103.8475',
          AvailableLots: 114,
          LotType: 'C',
          Agency: 'HDB',
        },
        {
          CarParkID: 'HE12',
          Area: 'Toa Payoh',
          Development: 'HDB Hub Toa Payoh Central',
          Location: '1.3323 103.8477',
          AvailableLots: 72,
          LotType: 'C',
          Agency: 'HDB',
        },
        {
          CarParkID: 'URA-MAX',
          Area: 'Chinatown',
          Development: 'The URA Centre Maxwell Road',
          Location: '1.2796 103.8461',
          AvailableLots: 28,
          LotType: 'C',
          Agency: 'URA',
        },
        {
          CarParkID: 'TPM01',
          Area: 'Tampines',
          Development: 'Our Tampines Hub',
          Location: '1.3533 103.9404',
          AvailableLots: 310,
          LotType: 'C',
          Agency: 'URA',
        },
      ],
    });
  }

  try {
    // Support pagination parameter ($skip)
    const skip = req.query['$skip'] || req.query['skip'] || '0';
    const targetUrl = new URL(LTA_DATAMALL_ENDPOINT);
    if (skip && skip !== '0') {
      targetUrl.searchParams.set('$skip', String(skip));
    }

    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        AccountKey: accountKey.trim(),
        accept: 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: `LTA DataMall API responded with HTTP ${response.status}`,
        details: errorText,
        targetEndpoint: LTA_DATAMALL_ENDPOINT,
      });
    }

    const data = (await response.json()) as LtaDataMallResponse;

    // Optional query param ?normalize=true to parse LatLng and add formatted stats
    const shouldNormalize = req.query['normalize'] === 'true' || req.query['format'] === 'app';
    if (shouldNormalize && Array.isArray(data.value)) {
      const normalized = data.value.map((item) => {
        let lat: number | null = null;
        let lng: number | null = null;
        if (item.Location && typeof item.Location === 'string') {
          const parts = item.Location.trim().split(/\s+/);
          if (parts.length >= 2) {
            lat = parseFloat(parts[0]);
            lng = parseFloat(parts[1]);
          }
        }
        return {
          id: item.CarParkID,
          name: item.Development,
          area: item.Area,
          agency: item.Agency,
          lotType: item.LotType,
          availableLots: item.AvailableLots,
          coordinates: lat && lng ? { lat, lng } : null,
          rawLocation: item.Location,
        };
      });

      return res.status(200).json({
        success: true,
        source: 'LTA DataMall CarParkAvailabilityv2 (Live)',
        timestamp: new Date().toISOString(),
        count: normalized.length,
        data: normalized,
        rawOdataMetadata: data['odata.metadata'],
      });
    }

    // Default: Return standard LTA DataMall response payload
    return res.status(200).json(data);
  } catch (err: any) {
    console.error('Error proxying LTA DataMall CarParkAvailabilityv2:', err);
    return res.status(502).json({
      error: 'Failed to communicate with LTA DataMall server',
      message: err?.message || 'Network error',
      targetEndpoint: LTA_DATAMALL_ENDPOINT,
    });
  }
}
