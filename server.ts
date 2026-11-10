import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Helper to get LTA AccountKey
function getLtaAccountKey(req: Request): string | undefined {
  return (
    (req.headers['x-account-key'] as string) ||
    (req.headers['accountkey'] as string) ||
    process.env.LTA_DATAMALL_ACCOUNT_KEY ||
    process.env.LTA_ACCOUNT_KEY
  );
}

// 1. Live Carpark Availability Proxy (LTA DataMall CarParkAvailabilityv2)
app.get('/api/lta/carparks', async (req: Request, res: Response) => {
  const accountKey = getLtaAccountKey(req);

  if (!accountKey || accountKey.includes('YOUR_LTA')) {
    // If no custom LTA AccountKey provided, proxy official data.gov.sg or return helpful payload
    try {
      const govRes = await fetch('https://api.data.gov.sg/v1/transport/carpark-availability');
      if (govRes.ok) {
        const govData = await govRes.json();
        return res.json({
          source: 'data.gov.sg (CORS proxy fallback - set LTA_DATAMALL_ACCOUNT_KEY for direct DataMall feed)',
          accountKeyProvided: false,
          timestamp: new Date().toISOString(),
          items: govData.items,
        });
      }
    } catch (err: any) {
      console.warn('Gov API fetch failed:', err?.message);
    }

    return res.json({
      source: 'Mock/Seed (Provide LTA DataMall AccountKey to connect live)',
      accountKeyProvided: false,
      timestamp: new Date().toISOString(),
      value: [],
    });
  }

  try {
    const ltaUrl = 'https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2';
    const ltaRes = await fetch(ltaUrl, {
      method: 'GET',
      headers: {
        AccountKey: accountKey,
        Accept: 'application/json',
      },
    });

    if (!ltaRes.ok) {
      return res.status(ltaRes.status).json({
        error: `LTA DataMall returned HTTP ${ltaRes.status}: ${ltaRes.statusText}`,
        suggestion: 'Verify that your AccountKey is valid and active on datamall.lta.gov.sg',
      });
    }

    const data = await ltaRes.json();
    return res.json({
      source: 'LTA DataMall (CarParkAvailabilityv2)',
      accountKeyProvided: true,
      timestamp: new Date().toISOString(),
      count: data.value?.length || 0,
      value: data.value || [],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch LTA carpark availability' });
  }
});

// 2. Traffic Incidents Proxy
app.get('/api/lta/traffic-incidents', async (req: Request, res: Response) => {
  const accountKey = getLtaAccountKey(req);

  if (!accountKey || accountKey.includes('YOUR_LTA')) {
    // Return sample active Singapore expressway incidents
    return res.json({
      source: 'Sample Singapore Traffic Incidents (Set AccountKey for live feed)',
      accountKeyProvided: false,
      value: [
        {
          Type: 'Accident',
          Latitude: 1.3421,
          Longitude: 103.8432,
          Message: '(9/11) 19:35 Accident on PIE (towards Changi) after Toa Payoh Exit. Avoid lane 1.',
        },
        {
          Type: 'Roadwork',
          Latitude: 1.2955,
          Longitude: 103.8566,
          Message: '(9/11) 19:00 Roadworks on Nicoll Highway (towards City) after Ophir Rd. 1 lane closed.',
        },
        {
          Type: 'Heavy Traffic',
          Latitude: 1.3045,
          Longitude: 103.8325,
          Message: '(9/11) 19:40 Heavy traffic on Orchard Road towards Scotts Road. Expect slow crawl.',
        },
      ],
    });
  }

  try {
    const ltaRes = await fetch('https://datamall2.mytransport.sg/ltaodataservice/TrafficIncidents', {
      headers: { AccountKey: accountKey, Accept: 'application/json' },
    });
    if (!ltaRes.ok) {
      return res.status(ltaRes.status).json({ error: `LTA DataMall returned HTTP ${ltaRes.status}` });
    }
    const data = await ltaRes.json();
    return res.json({
      source: 'LTA DataMall (TrafficIncidents)',
      accountKeyProvided: true,
      value: data.value || [],
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch traffic incidents' });
  }
});

// 3. Train Service Alerts Proxy
app.get('/api/lta/train-alerts', async (req: Request, res: Response) => {
  const accountKey = getLtaAccountKey(req);

  if (!accountKey || accountKey.includes('YOUR_LTA')) {
    return res.json({
      source: 'Sample MRT Status (Set AccountKey for live feed)',
      accountKeyProvided: false,
      value: {
        Status: 1, // 1 = Normal, 2 = Disrupted
        Lines: [
          { code: 'NSL', name: 'North-South Line', status: 'Normal' },
          { code: 'EWL', name: 'East-West Line', status: 'Normal' },
          { code: 'NEL', name: 'North East Line', status: 'Normal' },
          { code: 'CCL', name: 'Circle Line', status: 'Normal' },
          { code: 'DTL', name: 'Downtown Line', status: 'Normal' },
          { code: 'TEL', name: 'Thomson-East Coast Line', status: 'Normal' },
        ],
        Message: [],
      },
    });
  }

  try {
    const ltaRes = await fetch('https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts', {
      headers: { AccountKey: accountKey, Accept: 'application/json' },
    });
    if (!ltaRes.ok) {
      return res.status(ltaRes.status).json({ error: `LTA DataMall returned HTTP ${ltaRes.status}` });
    }
    const data = await ltaRes.json();
    return res.json({
      source: 'LTA DataMall (TrainServiceAlerts)',
      accountKeyProvided: true,
      value: data.value,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch train alerts' });
  }
});

// 4. Next Bus Arrivals Proxy (v3)
app.get('/api/lta/bus-arrivals', async (req: Request, res: Response) => {
  const accountKey = getLtaAccountKey(req);
  const busStopCode = (req.query.BusStopCode as string) || '83139';
  const serviceNo = req.query.ServiceNo as string;

  if (!accountKey || accountKey.includes('YOUR_LTA')) {
    return res.json({
      source: 'Sample Bus Arrival (Set AccountKey for live feed)',
      accountKeyProvided: false,
      BusStopCode: busStopCode,
      Services: [
        {
          ServiceNo: serviceNo || '15',
          Operator: 'GAS',
          NextBus: {
            EstimatedArrival: new Date(Date.now() + 3 * 60000).toISOString(),
            Load: 'SEA',
            Feature: 'WAB',
            Type: 'SD',
          },
          NextBus2: {
            EstimatedArrival: new Date(Date.now() + 11 * 60000).toISOString(),
            Load: 'SDA',
            Feature: 'WAB',
            Type: 'DD',
          },
        },
        {
          ServiceNo: '65',
          Operator: 'SBST',
          NextBus: {
            EstimatedArrival: new Date(Date.now() + 5 * 60000).toISOString(),
            Load: 'SEA',
            Feature: 'WAB',
            Type: 'DD',
          },
          NextBus2: {
            EstimatedArrival: new Date(Date.now() + 14 * 60000).toISOString(),
            Load: 'LSD',
            Feature: 'WAB',
            Type: 'DD',
          },
        },
      ],
    });
  }

  try {
    let url = `https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=${encodeURIComponent(busStopCode)}`;
    if (serviceNo) {
      url += `&ServiceNo=${encodeURIComponent(serviceNo)}`;
    }
    const ltaRes = await fetch(url, {
      headers: { AccountKey: accountKey, Accept: 'application/json' },
    });
    if (!ltaRes.ok) {
      return res.status(ltaRes.status).json({ error: `LTA DataMall returned HTTP ${ltaRes.status}` });
    }
    const data = await ltaRes.json();
    return res.json({
      source: 'LTA DataMall (v3 BusArrival)',
      accountKeyProvided: true,
      ...data,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch bus arrivals' });
  }
});

// 5. Test LTA Key endpoint
app.post('/api/lta/test-key', async (req: Request, res: Response) => {
  const testKey = req.body.accountKey;
  if (!testKey) {
    return res.status(400).json({ success: false, message: 'AccountKey is required' });
  }

  const start = performance.now();
  try {
    const ltaRes = await fetch('https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts', {
      headers: { AccountKey: testKey, Accept: 'application/json' },
    });
    const duration = Math.round(performance.now() - start);

    if (ltaRes.ok) {
      return res.json({
        success: true,
        latencyMs: duration,
        message: 'LTA AccountKey is valid and authenticated successfully with LTA DataMall.',
      });
    } else {
      return res.status(ltaRes.status).json({
        success: false,
        latencyMs: duration,
        message: `LTA DataMall rejected key with HTTP ${ltaRes.status} (${ltaRes.statusText})`,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      latencyMs: Math.round(performance.now() - start),
      message: err?.message || 'Network error pinging LTA DataMall',
    });
  }
});

// Mount Vite middleware in development or serve static in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SG CarPark + LTA DataMall proxy running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
