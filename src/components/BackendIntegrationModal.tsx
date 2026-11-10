import React, { useState } from 'react';
import { BackendConfig, DataSourceMode } from '../types/carpark';
import { testBackendConnection, testLtaAccountKey } from '../services/carparkApi';
import { 
  X, 
  Server, 
  Check, 
  Copy, 
  Play, 
  Code, 
  Radio, 
  ShieldCheck, 
  Globe, 
  Cpu, 
  Activity,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Bus,
  Train,
  AlertTriangle,
  Car
} from 'lucide-react';

interface BackendIntegrationModalProps {
  config: BackendConfig;
  onUpdateConfig: (newConfig: BackendConfig) => void;
  onClose: () => void;
}

export const BackendIntegrationModal: React.FC<BackendIntegrationModalProps> = ({
  config,
  onUpdateConfig,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'lta_datamall' | 'settings' | 'contract' | 'starter_code'>('lta_datamall');
  const [source, setSource] = useState<DataSourceMode>(config.source);
  const [url, setUrl] = useState<string>(config.customEndpointUrl);
  const [apiKey, setApiKey] = useState<string>(config.apiKey || '');
  const [ltaAccountKey, setLtaAccountKey] = useState<string>(config.ltaAccountKey || '');
  const [interval, setInterval] = useState<number>(config.pollIntervalSecs);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(config.autoRefresh);

  const [isTestingLta, setIsTestingLta] = useState<boolean>(false);
  const [ltaTestResult, setLtaTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
  } | null>(null);

  const [isTestingCustom, setIsTestingCustom] = useState<boolean>(false);
  const [customTestResult, setCustomTestResult] = useState<{
    success: boolean;
    latencyMs: number;
    message: string;
    sampleData?: any;
  } | null>(null);

  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleSave = () => {
    onUpdateConfig({
      source,
      customEndpointUrl: url,
      apiKey: apiKey.trim() || undefined,
      ltaAccountKey: ltaAccountKey.trim() || undefined,
      pollIntervalSecs: interval,
      autoRefresh,
    });
    onClose();
  };

  const handleTestLta = async () => {
    if (!ltaAccountKey.trim()) return;
    setIsTestingLta(true);
    setLtaTestResult(null);
    try {
      const res = await testLtaAccountKey(ltaAccountKey.trim());
      setLtaTestResult(res);
    } catch (e: any) {
      setLtaTestResult({ success: false, latencyMs: 0, message: e?.message || 'Test failed' });
    } finally {
      setIsTestingLta(false);
    }
  };

  const handleTestCustom = async () => {
    if (!url) return;
    setIsTestingCustom(true);
    setCustomTestResult(null);
    try {
      const result = await testBackendConnection(url, apiKey || undefined);
      setCustomTestResult(result);
    } catch (e: any) {
      setCustomTestResult({
        success: false,
        latencyMs: 0,
        message: e?.message || 'Failed to ping',
      });
    } finally {
      setIsTestingCustom(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const ltaEndpointsSpec = `// Singapore LTA DataMall Endpoints & Headers:
// Header required: AccountKey: <Your_LTA_Account_Key>

1. Live Carpark Availability (HDB + LTA + URA):
GET https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2

2. Traffic Incidents & Expressway Alerts:
GET https://datamall2.mytransport.sg/ltaodataservice/TrafficIncidents

3. MRT / LRT Train Service Alerts:
GET https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts

4. Next Bus Arrivals (v3 - 20s refresh):
GET https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=83139
// Optional service filter: &ServiceNo=15`;

  const nodeExpressCode = `// Node.js + Express Proxy for LTA DataMall (server.ts / server.js)
const express = require('express');
const axios = require('axios');

const app = express();
const LTA_KEY = process.env.LTA_DATAMALL_ACCOUNT_KEY || 'YOUR_LTA_KEY';

// 1. Live Carparks (HDB + LTA + URA)
app.get('/api/lta/carparks', async (req, res) => {
  const response = await axios.get('https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2', {
    headers: { AccountKey: req.headers['x-account-key'] || LTA_KEY }
  });
  res.json(response.data);
});

// 2. Traffic Incidents
app.get('/api/lta/traffic-incidents', async (req, res) => {
  const response = await axios.get('https://datamall2.mytransport.sg/ltaodataservice/TrafficIncidents', {
    headers: { AccountKey: LTA_KEY }
  });
  res.json(response.data);
});

// 3. Train Service Alerts
app.get('/api/lta/train-alerts', async (req, res) => {
  const response = await axios.get('https://datamall2.mytransport.sg/ltaodataservice/TrainServiceAlerts', {
    headers: { AccountKey: LTA_KEY }
  });
  res.json(response.data);
});

// 4. Next Bus Arrival (v3)
app.get('/api/lta/bus-arrivals', async (req, res) => {
  const { BusStopCode, ServiceNo } = req.query;
  let url = \`https://datamall2.mytransport.sg/ltaodataservice/v3/BusArrival?BusStopCode=\${BusStopCode}\`;
  if (ServiceNo) url += \`&ServiceNo=\${ServiceNo}\`;
  
  const response = await axios.get(url, { headers: { AccountKey: LTA_KEY } });
  res.json(response.data);
});

app.listen(3000, () => console.log('LTA DataMall Proxy running on port 3000'));`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Backend &amp; LTA DataMall Hub
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Full-Stack Ready
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Configure Singapore LTA DataMall AccountKey and custom backend endpoints
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center px-6 pt-3 border-b border-slate-800 bg-slate-950/40 gap-4 text-xs font-semibold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('lta_datamall')}
            className={`pb-3 transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'lta_datamall'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>LTA DataMall &amp; AccountKey</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Data Sources &amp; Polling</span>
          </button>
          <button
            onClick={() => setActiveTab('contract')}
            className={`pb-3 transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'contract'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Endpoints Specification</span>
          </button>
          <button
            onClick={() => setActiveTab('starter_code')}
            className={`pb-3 transition border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'starter_code'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Express Proxy Code</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Tab 1: LTA DataMall AccountKey & Endpoints */}
          {activeTab === 'lta_datamall' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/30 border border-emerald-500/30 p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-emerald-300 font-semibold text-xs mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Integrated LTA DataMall Endpoints</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  All requests to LTA DataMall require an <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400 font-mono text-[11px]">AccountKey: &lt;key&gt;</code> header.
                  Our server proxy in <code className="font-mono text-slate-200">server.ts</code> handles this securely without exposing keys in client code or hitting CORS limitations.
                </p>
              </div>

              {/* AccountKey Input & Tester */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                    Enter Your LTA DataMall AccountKey
                  </label>
                  <a
                    href="https://datamall.lta.gov.sg/content/datamall/en/request-for-api.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Get Free LTA Key ↗
                  </a>
                </div>

                <div className="flex gap-2">
                  <input
                    type="password"
                    value={ltaAccountKey}
                    onChange={(e) => setLtaAccountKey(e.target.value)}
                    placeholder="e.g. jKLmNpQrStUvWxYz1234567890..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleTestLta}
                    disabled={isTestingLta || !ltaAccountKey.trim()}
                    className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shrink-0 transition disabled:opacity-50"
                  >
                    <Play className="w-3 h-3 fill-slate-950" />
                    <span>{isTestingLta ? 'Testing...' : 'Test Key'}</span>
                  </button>
                </div>

                {/* Test Feedback */}
                {ltaTestResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      ltaTestResult.success
                        ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-600/50 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      {ltaTestResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span>{ltaTestResult.message}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Supported LTA Endpoints Cards */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300 block">Connected LTA Endpoints:</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-1.5 font-semibold text-emerald-400 mb-1">
                      <Car className="w-3.5 h-3.5" />
                      <span>CarParkAvailabilityv2</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Live carpark availability for all HDB, LTA &amp; URA carparks across Singapore.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-1.5 font-semibold text-cyan-400 mb-1">
                      <Bus className="w-3.5 h-3.5" />
                      <span>BusArrival (v3)</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Real-time next bus arrival timings, loads (SEA/SDA/LSD), and wheelchair accessibility.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-1.5 font-semibold text-rose-400 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>TrafficIncidents</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Live expressway accidents, roadworks, and traffic delays across SG.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="flex items-center gap-1.5 font-semibold text-amber-400 mb-1">
                      <Train className="w-3.5 h-3.5" />
                      <span>TrainServiceAlerts</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Status of MRT lines (NSL, EWL, NEL, CCL, DTL, TEL) and LRT loops.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: General Data Source & Polling */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Select Active Data Source
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => setSource('lta_datamall')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                      source === 'lta_datamall'
                        ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-white">LTA DataMall (Official)</span>
                      <Radio className={`w-3.5 h-3.5 ${source === 'lta_datamall' ? 'text-emerald-400' : 'text-slate-600'}`} />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Uses server proxy with your AccountKey for CarParkAvailabilityv2 &amp; Transit.
                    </p>
                  </div>

                  <div
                    onClick={() => setSource('direct_gov')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                      source === 'direct_gov'
                        ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-white">data.gov.sg (CORS Open)</span>
                      <Radio className={`w-3.5 h-3.5 ${source === 'direct_gov' ? 'text-emerald-400' : 'text-slate-600'}`} />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Fetches directly from Singapore Gov open API (1-minute update frequency).
                    </p>
                  </div>

                  <div
                    onClick={() => setSource('custom_backend')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                      source === 'custom_backend'
                        ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-white">Custom Server URL</span>
                      <Radio className={`w-3.5 h-3.5 ${source === 'custom_backend' ? 'text-emerald-400' : 'text-slate-600'}`} />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Connect to your own custom backend server endpoint.
                    </p>
                  </div>

                  <div
                    onClick={() => setSource('simulated')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                      source === 'simulated'
                        ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-white">Simulated Stream</span>
                      <Radio className={`w-3.5 h-3.5 ${source === 'simulated' ? 'text-emerald-400' : 'text-slate-600'}`} />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Simulates ingress/egress ticks for offline development and testing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Polling Interval */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">
                    Auto-Refresh Polling Interval
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Controls how frequently the frontend polls for fresh lot numbers
                  </span>
                </div>
                <select
                  value={interval}
                  onChange={(e) => setInterval(parseInt(e.target.value, 10))}
                  className="bg-slate-900 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none cursor-pointer"
                >
                  <option value={15}>Every 15s</option>
                  <option value={20}>Every 20s (LTA Bus standard)</option>
                  <option value={30}>Every 30s</option>
                  <option value={60}>Every 60s (LTA Carpark standard)</option>
                </select>
              </div>
            </div>
          )}

          {/* Tab 3: Endpoints Specification */}
          {activeTab === 'contract' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Exact LTA DataMall Endpoints &amp; Header requirements:
                </span>
                <button
                  onClick={() => copyToClipboard(ltaEndpointsSpec, 'spec')}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-mono"
                >
                  {copiedCode === 'spec' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'spec' ? 'Copied' : 'Copy Endpoints'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-[380px]">
                {ltaEndpointsSpec}
              </pre>
            </div>
          )}

          {/* Tab 4: Starter Code */}
          {activeTab === 'starter_code' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Full server-side Express proxy (already mounted in <code className="text-emerald-400">server.ts</code>):
                </span>
                <button
                  onClick={() => copyToClipboard(nodeExpressCode, 'proxy')}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-mono"
                >
                  {copiedCode === 'proxy' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'proxy' ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-[380px]">
                {nodeExpressCode}
              </pre>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            Source: <span className="text-emerald-400 font-semibold">{source}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20"
            >
              Save &amp; Apply
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
