import React, { useState } from 'react';
import { BackendConfig, DataSourceMode } from '../types/carpark';
import { testBackendConnection } from '../services/carparkApi';
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
  AlertCircle
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
  const [activeTab, setActiveTab] = useState<'settings' | 'contract' | 'starter_code'>('settings');
  const [source, setSource] = useState<DataSourceMode>(config.source);
  const [url, setUrl] = useState<string>(config.customEndpointUrl);
  const [apiKey, setApiKey] = useState<string>(config.apiKey || '');
  const [interval, setInterval] = useState<number>(config.pollIntervalSecs);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(config.autoRefresh);

  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
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
      pollIntervalSecs: interval,
      autoRefresh,
    });
    onClose();
  };

  const handleTestPing = async () => {
    if (!url) return;
    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await testBackendConnection(url, apiKey || undefined);
      setTestResult(result);
    } catch (e: any) {
      setTestResult({
        success: false,
        latencyMs: 0,
        message: e?.message || 'Failed to ping',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sampleJsonSchema = `// Sample GET /api/carparks Response JSON:
[
  {
    "id": "ACB",
    "name": "Ang Mo Kio Central Blk 712",
    "address": "Blk 712 Ang Mo Kio Ave 6, Singapore 560712",
    "agency": "HDB",
    "structure": "MULTI-STOREY",
    "coordinates": { "lat": 1.3698, "lng": 103.8475 },
    "zone": "North",
    "lots": {
      "C": { "total_lots": 420, "lot_type": "C", "lots_available": 114 },
      "Y": { "total_lots": 80, "lot_type": "Y", "lots_available": 32 }
    },
    "totalLotsCombined": 500,
    "availableLotsCombined": 146,
    "occupancyPercent": 70,
    "status": "available",
    "update_datetime": "2026-11-10T03:34:00Z",
    "gantry_height_m": 2.1,
    "free_parking": true,
    "free_parking_desc": "Sundays 7am - 10:30pm",
    "night_parking": true,
    "has_ev_charging": true,
    "rates": {
      "weekday_day": "$0.60 per 30 mins",
      "weekday_night": "$0.60 per 30 mins",
      "weekend": "$0.60 per 30 mins",
      "grace_period_mins": 15
    }
  }
]`;

  const nodeExpressCode = `// Node.js + Express Backend Starter (server.js)
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors()); // Allow frontend requests

// Route: Get real-time carparks from data.gov.sg or your database
app.get('/api/carparks', async (req, res) => {
  try {
    // 1. Fetch live lot availability from Singapore Gov API
    const govRes = await axios.get('https://api.data.gov.sg/v1/transport/carpark-availability');
    const items = govRes.data.items[0]?.carpark_data || [];
    
    // 2. Return data or enriched database records
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      count: items.length,
      carparks: items
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(\`SG Carpark API running on port \${PORT}\`));`;

  const pythonFastApiCode = `# Python + FastAPI Starter (main.py)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import httpx

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/carparks")
async def get_carparks():
    async with httpx.AsyncClient() as client:
        res = await client.get("https://api.data.gov.sg/v1/transport/carpark-availability")
        return res.json()`;

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
                Backend Integration Hub
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  Ready to Connect
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Plug your custom backend server, test connection, or switch live data sources
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
        <div className="flex items-center px-6 pt-3 border-b border-slate-800 bg-slate-950/40 gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3 transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Connection &amp; Endpoints</span>
          </button>
          <button
            onClick={() => setActiveTab('contract')}
            className={`pb-3 transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'contract'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>API JSON Contract</span>
          </button>
          <button
            onClick={() => setActiveTab('starter_code')}
            className={`pb-3 transition border-b-2 flex items-center gap-1.5 ${
              activeTab === 'starter_code'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Backend Starter Templates</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'settings' && (
            <div className="space-y-5">
              {/* Data Source Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Select Active Data Source
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Option 1: Simulated Stream */}
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
                      Generates authentic vehicle ingress/egress ticks for frontend testing without network dependencies.
                    </p>
                  </div>

                  {/* Option 2: Direct Official Gov API */}
                  <div
                    onClick={() => setSource('direct_gov')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                      source === 'direct_gov'
                        ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-white">data.gov.sg (Live)</span>
                      <Radio className={`w-3.5 h-3.5 ${source === 'direct_gov' ? 'text-emerald-400' : 'text-slate-600'}`} />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Fetches directly from official Singapore Gov API with 1-min updates across island.
                    </p>
                  </div>

                  {/* Option 3: Custom Backend */}
                  <div
                    onClick={() => setSource('custom_backend')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                      source === 'custom_backend'
                        ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-xs text-white">Custom Backend</span>
                      <Radio className={`w-3.5 h-3.5 ${source === 'custom_backend' ? 'text-emerald-400' : 'text-slate-600'}`} />
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Connect to your own custom server endpoint (e.g. Node, Python, Spring, Go).
                    </p>
                  </div>
                </div>
              </div>

              {/* Custom Backend Settings (Active if custom_backend or testing) */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">
                    Custom Backend Endpoint Configuration
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">REST / JSON</span>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Target Endpoint URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="http://localhost:8080/api/carparks or https://api.myserver.com/carparks"
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleTestPing}
                      disabled={isTesting || !url}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition disabled:opacity-50"
                    >
                      <Play className="w-3 h-3 text-emerald-400 fill-emerald-400" />
                      <span>{isTesting ? 'Testing...' : 'Test Ping'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Authorization Header (Optional Bearer Token)
                  </label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Bearer token or API key..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-100 placeholder-slate-600 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Test Result Feedback */}
                {testResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs ${
                      testResult.success
                        ? 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-600/50 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      {testResult.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span>{testResult.message}</span>
                    </div>
                    {testResult.sampleData && (
                      <pre className="mt-2 p-2 bg-slate-950 rounded-lg text-[10px] font-mono text-slate-300 max-h-24 overflow-y-auto">
                        {JSON.stringify(testResult.sampleData, null, 2)}
                      </pre>
                    )}
                  </div>
                )}
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
                <div className="flex items-center gap-2">
                  <select
                    value={interval}
                    onChange={(e) => setInterval(parseInt(e.target.value, 10))}
                    className="bg-slate-900 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono outline-none cursor-pointer"
                  >
                    <option value={15}>Every 15s</option>
                    <option value={30}>Every 30s</option>
                    <option value={60}>Every 60s (Gov standard)</option>
                    <option value={120}>Every 2 mins</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contract' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Your backend should return JSON matching this schema:
                </span>
                <button
                  onClick={() => copyToClipboard(sampleJsonSchema, 'schema')}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-mono"
                >
                  {copiedCode === 'schema' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === 'schema' ? 'Copied' : 'Copy Schema'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-[380px]">
                {sampleJsonSchema}
              </pre>
            </div>
          )}

          {activeTab === 'starter_code' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-300">
                    Node.js Express Proxy Server
                  </span>
                  <button
                    onClick={() => copyToClipboard(nodeExpressCode, 'node')}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-mono"
                  >
                    {copiedCode === 'node' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'node' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-48">
                  {nodeExpressCode}
                </pre>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-slate-300">
                    Python FastAPI Starter
                  </span>
                  <button
                    onClick={() => copyToClipboard(pythonFastApiCode, 'python')}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-mono"
                  >
                    {copiedCode === 'python' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode === 'python' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto max-h-40">
                  {pythonFastApiCode}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-mono">
            Active: <span className="text-slate-300">{source}</span>
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
