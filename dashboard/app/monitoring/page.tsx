"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend 
} from 'recharts';
import ReactFlow, { 
  Background, Controls, Handle, Position, MarkerType, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange, Node, Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Server, Activity, ShieldAlert, GitCommit, CheckCircle, XCircle, Clock, 
  TrendingUp, TrendingDown, Users, Shield, Play, Pause, ChevronDown, ChevronRight, Search, Filter 
} from 'lucide-react';

// --- DATA MODELS ---
interface UpdateHistory {
  version: number;
  client_id: string;
  framework: string;
  start_version: number;
  delay: number;
  robustness_score: number;
  accepted: boolean;
  timestamp: string;
  reason?: string;
  weight_summary?: string;
}

interface MaliciousClient {
  client_id: string;
  attempts: number;
  rejected_updates: number;
  last_activity: string;
}

interface MetricHistory {
  time: string;
  accuracy: number;
  loss: number;
}

interface UpdateFreq {
  time: string;
  updates: number;
}

// --- REACT FLOW COMPONENT: Custom Client Node ---
const CustomClientNode = ({ data }: { data: any }) => {
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'accepted': return 'bg-green-500 border-green-400';
      case 'delayed': return 'bg-yellow-500 border-yellow-400';
      case 'rejected': return 'bg-red-500 border-red-400';
      default: return 'bg-slate-700 border-slate-600';
    }
  };

  return (
    <div className={`px-4 py-2 rounded-xl border-2 shadow-lg bg-[#0F172A] ${getStatusColor(data.status)} bg-opacity-20`}>
      <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-slate-500" />
      <div className="flex flex-col">
        <span className="text-sm font-bold text-white">{data.label}</span>
        <span className="text-xs text-slate-400">{data.framework}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-slate-500" />
    </div>
  );
};

const CustomServerNode = ({ data }: { data: any }) => {
  return (
    <div className="px-6 py-4 rounded-xl border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] bg-[#1E293B]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-blue-500" />
      <div className="flex flex-col items-center gap-2">
        <Server className="text-blue-400 w-8 h-8" />
        <span className="text-lg font-bold text-white tracking-widest">{data.label}</span>
        <span className="text-xs text-slate-300 font-mono">v{data.version}</span>
      </div>
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-blue-500" />
    </div>
  );
};

const nodeTypes = {
  client: CustomClientNode,
  server: CustomServerNode,
};

export default function MonitoringDashboard() {
  // --- STATE ---
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [globalStatus, setGlobalStatus] = useState({
    version: 23,
    accuracy: 92.1,
    loss: 0.24,
    active_clients: 7,
    updates_per_min: 4,
    rejected_updates: 12
  });

  const [metricsHistory, setMetricsHistory] = useState<MetricHistory[]>([]);
  const [updateFreq, setUpdateFreq] = useState<UpdateFreq[]>([]);
  const [commitHistory, setCommitHistory] = useState<UpdateHistory[]>([]);
  const [maliciousClients, setMaliciousClients] = useState<MaliciousClient[]>([]);
  const [aggregationMetrics, setAggregationMetrics] = useState({
    threshold: 0.85,
    trimmed: 24,
    median_distance: 0.04
  });

  // Flow State
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedCommit, setExpandedCommit] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);

  // --- INIT SIMULATION OR WS ---
  useEffect(() => {
    if (isDemoMode) {
      if (wsRef.current) wsRef.current.close();
      setIsConnected(true);
      startSimulation();
    } else {
      connectWebSocket();
      fetchInitialData();
    }
    
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [isDemoMode]);

  // --- WEBSOCKET CONNECTION ---
  const connectWebSocket = () => {
    wsRef.current = new WebSocket('ws://localhost:8000/ws/updates');
    
    wsRef.current.onopen = () => setIsConnected(true);
    wsRef.current.onclose = () => setIsConnected(false);
    
    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'global_update') {
        setGlobalStatus(prev => ({ ...prev, ...data.payload }));
      } else if (data.type === 'new_commit') {
        setCommitHistory(prev => [data.payload, ...prev]);
        triggerNodeAnimation(data.payload.client_id, data.payload.accepted ? 'accepted' : 'rejected');
      }
    };
  };

  const fetchInitialData = async () => {
    try {
      // Mocking fetch logic since we don't have the backend. 
      // In real scenario: fetch('/global-model-status'), etc.
    } catch (err) {
      console.error("Failed to connect to backend", err);
    }
  };

  // --- DEMO SIMULATION LOGIC ---
  const startSimulation = () => {
    // Initial Network
    const initialNodes: Node[] = [
      { id: 'server', type: 'server', position: { x: 400, y: 50 }, data: { label: 'ASYNC-SHIELD', version: globalStatus.version } },
      { id: 'client_1', type: 'client', position: { x: 150, y: 250 }, data: { label: 'Client-1', framework: 'PyTorch', status: 'idle' } },
      { id: 'client_2', type: 'client', position: { x: 300, y: 250 }, data: { label: 'Client-2', framework: 'TensorFlow', status: 'idle' } },
      { id: 'client_3', type: 'client', position: { x: 500, y: 250 }, data: { label: 'Client-3', framework: 'PyTorch', status: 'idle' } },
      { id: 'client_4', type: 'client', position: { x: 650, y: 250 }, data: { label: 'Client-4', framework: 'TensorFlow', status: 'idle' } },
    ];
    
    const initialEdges: Edge[] = [
      { id: 'e1', source: 'client_1', target: 'server', animated: true, style: { stroke: '#475569' }, markerEnd: { type: MarkerType.ArrowClosed } },
      { id: 'e2', source: 'client_2', target: 'server', animated: true, style: { stroke: '#475569' }, markerEnd: { type: MarkerType.ArrowClosed } },
      { id: 'e3', source: 'client_3', target: 'server', animated: true, style: { stroke: '#475569' }, markerEnd: { type: MarkerType.ArrowClosed } },
      { id: 'e4', source: 'client_4', target: 'server', animated: true, style: { stroke: '#475569' }, markerEnd: { type: MarkerType.ArrowClosed } },
    ];

    setNodes(initialNodes);
    setEdges(initialEdges);

    // Initial Chart Data
    const initialMetrics = Array.from({ length: 20 }).map((_, i) => ({
      time: `12:${(10 + i).toString().padStart(2, '0')}`,
      accuracy: 80 + i * 0.5 + Math.random() * 2,
      loss: 1.5 - i * 0.05 + Math.random() * 0.1
    }));
    setMetricsHistory(initialMetrics);

    const initialFreq = Array.from({ length: 10 }).map((_, i) => ({
      time: `12:${(20 + i).toString().padStart(2, '0')}`,
      updates: Math.floor(Math.random() * 10)
    }));
    setUpdateFreq(initialFreq);

    // Initial Commits
    setCommitHistory([
      { version: 23, client_id: "client_2", framework: "TensorFlow", start_version: 21, delay: 2, robustness_score: 0.94, accepted: true, timestamp: "2026-03-24T12:30:11" },
      { version: 22, client_id: "client_4", framework: "TensorFlow", start_version: 20, delay: 2, robustness_score: 0.12, accepted: false, reason: "Trimmed Mean Outlier", timestamp: "2026-03-24T12:28:45" },
      { version: 22, client_id: "client_1", framework: "PyTorch", start_version: 21, delay: 1, robustness_score: 0.88, accepted: true, timestamp: "2026-03-24T12:25:33" }
    ]);

    setMaliciousClients([
      { client_id: "client_4", attempts: 12, rejected_updates: 9, last_activity: "12:28:45" }
    ]);

    // Sim Loop
    const interval = setInterval(() => {
      simulateUpdate();
    }, 4000);

    return () => clearInterval(interval);
  };

  const simulateUpdate = () => {
    const isMalicious = Math.random() < 0.3;
    const clientId = `client_${Math.floor(Math.random() * 4) + 1}`;
    const acc = isMalicious ? false : true;

    setGlobalStatus(prev => {
      const newVersion = acc ? prev.version + 1 : prev.version;
      
      // Update Server Node version immediately
      setNodes(nds => nds.map(n => n.id === 'server' ? { ...n, data: { ...n.data, version: newVersion } } : n));

      return {
        ...prev,
        version: newVersion,
        accuracy: acc ? Math.min(99.9, prev.accuracy + Math.random() * 0.2) : prev.accuracy,
        loss: acc ? Math.max(0.01, prev.loss - Math.random() * 0.02) : prev.loss,
        rejected_updates: isMalicious ? prev.rejected_updates + 1 : prev.rejected_updates
      };
    });

    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

    if (acc) {
      setMetricsHistory(prev => {
        const next = [...prev, { time: timeStr, accuracy: globalStatus.accuracy, loss: globalStatus.loss }];
        if (next.length > 20) next.shift();
        return next;
      });
    }

    const newCommit: UpdateHistory = {
      version: globalStatus.version + (acc ? 1 : 0),
      client_id: clientId,
      framework: Math.random() > 0.5 ? 'PyTorch' : 'TensorFlow',
      start_version: globalStatus.version - Math.floor(Math.random() * 3),
      delay: Math.floor(Math.random() * 3),
      robustness_score: isMalicious ? Math.random() * 0.3 : 0.8 + Math.random() * 0.2,
      accepted: acc,
      reason: isMalicious ? "Deviation Threshold Exceeded" : undefined,
      timestamp: new Date().toISOString()
    };

    setCommitHistory(prev => [newCommit, ...prev]);
    
    if (isMalicious) {
      setMaliciousClients(prev => {
        const exists = prev.find(c => c.client_id === clientId);
        if (exists) {
          return prev.map(c => c.client_id === clientId ? { ...c, attempts: c.attempts + 1, rejected_updates: c.rejected_updates + 1, last_activity: timeStr } : c);
        }
        return [...prev, { client_id: clientId, attempts: 1, rejected_updates: 1, last_activity: timeStr }];
      });
    }

    triggerNodeAnimation(clientId, acc ? 'accepted' : 'rejected');
  };

  const triggerNodeAnimation = (clientId: string, status: string) => {
    setNodes(nds => nds.map(node => {
      if (node.id === clientId) {
        return { ...node, data: { ...node.data, status } };
      }
      return node;
    }));

    setEdges(eds => eds.map(edge => {
      if (edge.source === clientId) {
        return { 
          ...edge, 
          style: { stroke: status === 'accepted' ? '#22c55e' : '#ef4444', strokeWidth: 3 },
          animated: true
        };
      }
      return edge;
    }));

    setTimeout(() => {
      setNodes(nds => nds.map(node => node.id === clientId ? { ...node, data: { ...node.data, status: 'idle' } } : node));
      setEdges(eds => eds.map(edge => edge.source === clientId ? { ...edge, style: { stroke: '#475569', strokeWidth: 1 } } : edge));
    }, 1500);
  };


  // --- RENDER HELPERS ---
  const filteredCommits = commitHistory.filter(c => {
    if (filterStatus === 'accepted' && !c.accepted) return false;
    if (filterStatus === 'rejected' && c.accepted) return false;
    if (searchQuery && !c.client_id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 font-sans selection:bg-blue-500/30">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            AsyncShield <span className="text-blue-500 font-light">Monitoring</span>
          </h1>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            Distributed Federated Learning System 
            <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              {isConnected ? 'LIVE' : 'DISCONNECTED'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/50 backdrop-blur-md">
          <button 
            onClick={() => setIsDemoMode(false)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${!isDemoMode ? 'bg-blue-500 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Live Server
          </button>
          <button 
            onClick={() => setIsDemoMode(true)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${isDemoMode ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]' : 'text-slate-400 hover:text-white'}`}
          >
            <Play className="w-4 h-4 fill-current" /> Demo Mode
          </button>
        </div>
      </div>

      {/* 1. Global Model Status Panel */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <MetricCard label="Global Version" value={`v${globalStatus.version}`} icon={<GitCommit />} color="blue" />
        <MetricCard label="Global Accuracy" value={`${globalStatus.accuracy.toFixed(2)}%`} icon={<TrendingUp />} color="green" trend="+0.12%" />
        <MetricCard label="Global Loss" value={globalStatus.loss.toFixed(4)} icon={<TrendingDown />} color="emerald" trend="-0.01" />
        <MetricCard label="Active Clients" value={globalStatus.active_clients} icon={<Users />} color="indigo" />
        <MetricCard label="Updates / min" value={globalStatus.updates_per_min} icon={<Activity />} color="amber" />
        <MetricCard label="Rejected Malicious" value={globalStatus.rejected_updates} icon={<ShieldAlert />} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* 2. Training Metrics Visualization */}
        <div className="lg:col-span-2 space-y-8">
          
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <TrendingUp className="text-green-400" /> Training Convergence
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsHistory}>
                  <defs>
                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#22c55e" domain={['auto', 'auto']} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#ef4444" domain={['auto', 'auto']} fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" name="Accuracy (%)" dataKey="accuracy" stroke="#22c55e" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="stepAfter" name="Loss" dataKey="loss" stroke="#ef4444" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Activity className="text-amber-400" /> Update Frequency
            </h2>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={updateFreq}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Bar dataKey="updates" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* 3. Client Network Visualization */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm flex flex-col">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Server className="text-blue-400" /> Live Network Topology
          </h2>
          <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-700/50 overflow-hidden relative min-h-[500px]">
            <ReactFlow 
              nodes={nodes} 
              edges={edges} 
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
              className="bg-[#020617]"
            >
              <Background color="#334155" gap={16} />
              <Controls className="!bg-slate-800 !border-slate-700 !fill-slate-300" />
            </ReactFlow>
            
            {/* Network Legend */}
            <div className="absolute top-4 left-4 bg-slate-800/80 p-3 rounded-lg border border-slate-700/50 backdrop-blur-sm text-xs space-y-2">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div> Accepted</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div> Rejected (Malicious)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Delayed</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* 4. GitHub-Style Commit History Timeline */}
        <div className="xl:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
             <h2 className="text-xl font-bold flex items-center gap-2">
              <GitCommit className="text-slate-300" /> Update Timeline
            </h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search client ID..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-900/50 border border-slate-700 rounded-lg pl-9 pr-4 py-1.5 text-sm outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div className="relative group">
                <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-sm cursor-pointer hover:border-blue-500 transition-colors">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <span className="capitalize">{filterStatus}</span>
                </div>
                <div className="absolute right-0 mt-2 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <div onClick={() => setFilterStatus('all')} className="px-4 py-2 hover:bg-slate-700 cursor-pointer text-sm">All</div>
                  <div onClick={() => setFilterStatus('accepted')} className="px-4 py-2 hover:bg-slate-700 cursor-pointer text-sm text-green-400">Accepted</div>
                  <div onClick={() => setFilterStatus('rejected')} className="px-4 py-2 hover:bg-slate-700 cursor-pointer text-sm text-red-400">Rejected</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredCommits.length === 0 ? (
              <div className="text-center py-10 text-slate-500">No updates match your filters.</div>
            ) : (
              filteredCommits.map((commit, idx) => (
                <div key={idx} className="flex gap-4">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-[#020617] z-10 ${commit.accepted ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                      {commit.accepted ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </div>
                    {idx !== filteredCommits.length - 1 && <div className="w-0.5 h-full bg-slate-700/50 -my-2"></div>}
                  </div>

                  {/* Commit Card */}
                  <div className="flex-1 bg-slate-900/40 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors mb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-blue-400 font-bold">v{commit.version}</span>
                          <span className="text-slate-300">from {commit.client_id}</span>
                          <span className="text-xs px-2 py-0.5 bg-slate-800 rounded text-slate-400">{commit.framework}</span>
                        </div>
                        {commit.reason && <p className="text-sm text-red-400 mt-1">{commit.reason}</p>}
                      </div>
                      <div className="flex items-center gap-2 text-slate-500 text-xs font-mono">
                        <Clock className="w-3 h-3" />
                         {new Date(commit.timestamp).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-4 text-sm">
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-xs uppercase tracking-wider">Base</span>
                        <span className="font-mono text-slate-300">v{commit.start_version}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-xs uppercase tracking-wider">Delay</span>
                        <span className={`${commit.delay > 1 ? 'text-yellow-400' : 'text-green-400'} font-bold`}>{commit.delay} hops</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-slate-500 text-xs uppercase tracking-wider">Robustness Rank</span>
                        <span className="text-slate-300">{(commit.robustness_score * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    {/* Expandable Section */}
                    <div className="mt-4 border-t border-slate-700/50 pt-2">
                      <button 
                        onClick={() => setExpandedCommit(expandedCommit === `${idx}` ? null : `${idx}`)}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {expandedCommit === `${idx}` ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                        {expandedCommit === `${idx}` ? 'Hide Details' : 'View Update Vector'}
                      </button>
                      
                      {expandedCommit === `${idx}` && (
                        <div className="mt-3 p-3 bg-slate-950 rounded-lg font-mono text-xs text-slate-400 whitespace-pre-wrap">
                          {`# Aggregation Details\nStatus: ${commit.accepted ? 'Merged into Global' : 'Dropped by Filter'}\nDistance from Median: ${(1 - commit.robustness_score).toFixed(4)}\n\n# Vector Summary\nParameters Updated: 421,642\nSparsity: 12.4%\nL2 Norm: ${(Math.random() * 5 + 1).toFixed(3)}`}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 5. Attack Detection & Robust Aggregation Panel */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-sm h-fit">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
             <ShieldAlert className="text-purple-400" /> Defense Mechanisms
          </h2>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Outliers Trimmed</div>
              <div className="text-2xl font-bold text-slate-200">{aggregationMetrics.trimmed}</div>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Median Dist</div>
              <div className="text-2xl font-bold text-slate-200">{aggregationMetrics.median_distance.toFixed(3)}</div>
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-300 mb-3 border-b border-slate-700 pb-2">Flagged Entities</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-400">
              <thead className="bg-slate-900/50 text-slate-300 border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-lg">Client ID</th>
                  <th className="px-4 py-3 font-medium">Attempts</th>
                  <th className="px-4 py-3 font-medium text-red-400">Rejected</th>
                  <th className="px-4 py-3 font-medium rounded-tr-lg">Last Seen</th>
                </tr>
              </thead>
              <tbody>
                {maliciousClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-slate-500 italic">No malicious activity detected.</td>
                  </tr>
                ) : (
                  maliciousClients.map((client, idx) => (
                     <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-300">{client.client_id}</td>
                      <td className="px-4 py-3">{client.attempts}</td>
                      <td className="px-4 py-3 text-red-400 font-bold">{client.rejected_updates}</td>
                      <td className="px-4 py-3 text-xs">{client.last_activity}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(51, 65, 85, 0.8); border-radius: 8px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(71, 85, 105, 1); }
      `}</style>
    </div>
  );
}

// Subcomponent for Metrics
function MetricCard({ label, value, icon, color, trend }: any) {
  const colorMap: any = {
    blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    red: "text-red-400 bg-red-500/10 border-red-500/20",
  };

  return (
    <div className={`p-4 rounded-2xl border backdrop-blur-sm flex flex-col justify-between ${colorMap[color]}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 bg-slate-900/50 rounded-lg">
          {icon}
        </div>
        {trend && (
          <span className={`text-xs font-bold px-2 py-1 rounded bg-slate-900/50 ${trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
            {trend}
          </span>
        )}
      </div>
      <div>
        <div className="text-slate-400 text-xs uppercase tracking-wider mb-1 font-semibold">{label}</div>
        <div className="text-2xl font-black text-white">{value}</div>
      </div>
    </div>
  );
}
