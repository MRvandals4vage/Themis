import { useState } from 'react';
import { 
  BellRing, 
  Network, 
  Cpu, 
  Terminal, 
  CheckCircle2, 
  Plus, 
  Minus, 
  MousePointer2,
  Trash2,
  Play,
  TrendingUp,
  Sliders,
  Maximize2
} from 'lucide-react';
import { WorkflowNode } from '../types';
import { initialWorkflowNodes, stepAnalysisLogs } from '../data';

interface WorkflowsViewProps {
  nodes: WorkflowNode[];
  onApproveAction: () => void;
  onExecuteNode: (id: string) => void;
  onResetWorkflow: () => void;
  systemStable: boolean;
  onAddCustomNode: () => void;
}

export default function WorkflowsView({
  nodes,
  onApproveAction,
  onExecuteNode,
  onResetWorkflow,
  systemStable,
  onAddCustomNode
}: WorkflowsViewProps) {
  
  // Interactive zoom scale state
  const [zoomScale, setZoomScale] = useState(1);
  const [activeNodeId, setActiveNodeId] = useState('wf-2'); // default active node 'Classifier Agent'
  const [showLogsModal, setShowLogsModal] = useState(false);

  const activeNode = nodes.find(n => n.id === activeNodeId) || nodes[1];

  const handleZoomIn = () => setZoomScale(prev => Math.min(prev + 0.1, 1.3));
  const handleZoomOut = () => setZoomScale(prev => Math.max(prev - 0.1, 0.7));
  const handleZoomReset = () => setZoomScale(1);

  // Helper mapping icon names to actual Lucide component icons
  const renderNodeIcon = (iconName: string) => {
    switch (iconName) {
      case 'BellRing':
        return <BellRing className="w-4 h-4" />;
      case 'GitBranch':
      case 'Network':
        return <Network className="w-4 h-4" />;
      case 'SearchCode':
        return <Cpu className="w-4 h-4 text-emerald-600" />;
      case 'Terminal':
        return <Terminal className="w-4 h-4" />;
      case 'Slack':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <Sliders className="w-4 h-4" />;
    }
  };

  return (
    <div id="workflows-workspace" className="flex flex-col flex-1 h-[calc(100vh-64px)] overflow-hidden font-sans">
      
      {/* Upper segment holding Canvas and Reasoning Panel */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Visual Workflow Canvas (Terminal aesthetic) */}
        <section className="flex-1 relative bg-white select-none overflow-hidden p-6 border-r border-black">
          {/* Dot Grid Background */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.4]" 
            style={{ 
              backgroundImage: 'radial-gradient(#000000 1px, transparent 1px)', 
              backgroundSize: '24px 24px' 
            }} 
          />

          {/* Interactive Zoom Map Controls Float */}
          <div className="absolute top-6 left-6 z-10 flex flex-col gap-1 border border-black p-1 bg-white shadow-[2px_2px_0px_0px_#000000]">
            <button 
              onClick={handleZoomIn} 
              title="Zoom In"
              className="p-1.5 hover:bg-neutral-100 transition-colors active:scale-95 cursor-pointer text-black"
            >
              <Plus className="w-4 h-4" />
            </button>
            <button 
              onClick={handleZoomOut} 
              title="Zoom Out"
              className="p-1.5 hover:bg-neutral-100 transition-colors active:scale-95 cursor-pointer text-black"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="h-[1px] bg-black my-0.5" />
            <button 
              onClick={handleZoomReset} 
              title="Fit to screen"
              className="p-1.5 hover:bg-neutral-100 transition-colors active:scale-95 cursor-pointer text-black"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>

          {/* Create Node Float Button */}
          <div className="absolute top-6 right-6 z-10">
            <button 
              onClick={onAddCustomNode}
              className="px-4 py-2 bg-black text-white hover:bg-white hover:text-black border border-black font-mono text-[10px] font-bold tracking-wider shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:scale-95 transition-all cursor-pointer"
            >
              + ADD NEW AGENT NODE
            </button>
          </div>

          {/* Connection Vector Layer */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* SVG line formulas corresponding to percentage layout spots */}
            <g opacity={zoomScale}>
              {/* Trigger to Classifier */}
              <line x1="22%" y1="50%" x2="38%" y2="50%" stroke="black" strokeWidth="2" strokeDasharray={nodes[1]?.status === 'ONLINE' ? '0' : '4'} />
              
              {/* Classifier to Root Cause Agent (Upper Split) */}
              <line x1="48%" y1="50%" x2="68%" y2="30%" stroke="black" strokeWidth="2" />
              
              {/* Classifier to Log Analyzer (Lower Split) */}
              <line x1="48%" y1="50%" x2="68%" y2="70%" stroke="black" strokeWidth="2" strokeDasharray="3" opacity="0.4" />
              
              {/* Root Cause Agent to Slack Notify (Resolution) */}
              <line x1="78%" y1="30%" x2="90%" y2="50%" stroke="black" strokeWidth="2" />
              
              {/* Log Analyzer to Slack Notify (Resolution) */}
              <line x1="78%" y1="70%" x2="90%" y2="50%" stroke="black" strokeWidth="1.5" strokeDasharray="4" opacity="0.4" />
            </g>
          </svg>

          {/* Workflow Nodes Block wrapper */}
          <div 
            className="absolute inset-0 p-12 flex items-center justify-around transition-all duration-300"
            style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
          >
            {nodes.map((node) => {
              const isSelected = node.id === activeNodeId;
              const isClassifierActive = node.type === 'classifier' && node.status === 'ONLINE';
              
              let styleCls = '';
              if (node.type === 'classifier') {
                styleCls = isSelected 
                  ? 'bg-black text-white shadow-[6px_6px_0px_0px_#e11d48] border-black' 
                  : 'bg-black text-white hover:bg-neutral-800 shadow-md border-black';
              } else if (node.status === 'OFFLINE') {
                styleCls = 'bg-white border border-neutral-300 opacity-40 hover:opacity-75';
              } else {
                styleCls = isSelected
                  ? 'bg-white border-2 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]'
                  : 'bg-white border border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]';
              }

              return (
                <div
                  key={node.id}
                  onClick={() => {
                    setActiveNodeId(node.id);
                    onExecuteNode(node.id);
                  }}
                  id={`node-box-${node.id}`}
                  className={`w-52 p-4 space-y-2 relative transition-all duration-150 cursor-pointer ${styleCls} hover:-translate-y-0.5`}
                  style={{ zIndex: isSelected ? 20 : 10 }}
                >
                  <div className={`text-[9px] font-bold uppercase tracking-wider ${
                    node.type === 'classifier' ? 'text-neutral-400' : 'text-neutral-500'
                  }`}>
                    {node.type === 'trigger' ? 'TRIGGER' : node.type === 'classifier' ? 'AGENT NODE' : node.type === 'resolution' ? 'RESOLUTION' : 'AGENT NODE'}
                  </div>
                  
                  <div className="text-xs font-black tracking-tight flex items-center gap-2">
                    {renderNodeIcon(node.icon)}
                    {node.label}
                  </div>

                  <div className={`font-mono text-[10px] ${
                    node.type === 'classifier' ? 'text-neutral-300' : 'text-neutral-500'
                  }`}>
                    {node.subText}
                  </div>

                  {/* Latency and Online indicators for custom node actions */}
                  {(node.latency || node.status) && (
                    <div className="pt-2 border-t border-neutral-200/50 flex justify-between items-center select-none">
                      {node.latency && <span className="text-[9px] font-mono opacity-80">Latency: {node.latency}</span>}
                      {node.status && (
                        <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase font-mono ${
                          node.status === 'ONLINE' ? 'text-green-500' : 'text-neutral-400'
                        }`}>
                          {node.status}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Connect Pin indicators for retro effect */}
                  {node.type !== 'trigger' && (
                    <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-black rounded-full" />
                  )}
                  {node.type !== 'resolution' && (
                    <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-white border border-black rounded-full" />
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 2. Reasoning Summary Sidebar Panel (Right segment) */}
        <aside id="reasoning-sidebar" className="w-80 border-l border-black bg-white flex flex-col justify-between select-none">
          <div>
            <div className="p-4 border-b border-black flex justify-between items-center bg-white">
              <h2 className="text-[10px] font-extrabold tracking-widest uppercase text-black">
                REASONING SUMMARY
              </h2>
              <MousePointer2 className="w-4 h-4 text-neutral-400" />
            </div>

            <div className="p-4 space-y-6">
              
              {/* Dynamic Active Trace Card section */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-neutral-500 uppercase">
                  <span className="w-2 h-2 bg-black rounded-full animate-pulse" />
                  Active Trace
                </div>
                
                <div className="p-4 bg-neutral-100 border-l-4 border-black text-xs">
                  <p className="leading-relaxed font-sans text-neutral-700">
                    <span className="font-extrabold text-black">Selected: </span>
                    {activeNode.label === 'Classifier Agent' 
                      ? 'Classifier: Identified alert as "High Priority" based on latency threshold breaches (>500ms).'
                      : activeNode.label === 'PagerDuty Alert'
                      ? 'Trigger inbound cluster monitor. Event payload validates RDS connection pooling saturated.'
                      : activeNode.label === 'Root Cause Agent'
                      ? 'Root Cause analysis loaded query optimizer traceback python file query_optimizer.py:144.'
                      : activeNode.label === 'Log Analyzer'
                      ? 'Staging analyzer scanning log streams for trace IDs mismatch.'
                      : 'Slack notify resolution channel #ops-critical initiated for rollback action approval.'
                    }
                  </p>
                </div>
              </div>

              {/* Step Analysis simulated log panel */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-neutral-500 uppercase">
                  <Terminal className="w-3.5 h-3.5" />
                  Step Analysis
                </div>

                <ul className="space-y-1.5 font-mono text-[11px] bg-neutral-50 p-3 border border-neutral-200">
                  {stepAnalysisLogs.map((log) => (
                    <li key={log.id} className={`flex gap-1.5 leading-normal ${
                      log.isItalic ? 'italic text-neutral-400' : 'text-neutral-700'
                    }`}>
                      <span className="text-neutral-400">{log.step}</span>
                      <span>
                        {log.text}
                        {log.status && (
                          <b className={`ml-1 ${log.isGreen ? 'text-green-600 font-extrabold' : 'text-amber-500 font-bold'}`}>
                            {log.status}
                          </b>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Confidence Score Bar */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[9px] font-extrabold text-neutral-500 uppercase">
                  <Sliders className="w-3.5 h-3.5" />
                  Confidence Score
                </div>

                <div className="h-2 bg-neutral-250 w-full relative border border-neutral-300">
                  <div 
                    className="absolute inset-y-0 left-0 bg-black transition-all duration-500" 
                    style={{ width: systemStable ? '98%' : '88%' }}
                  />
                </div>
                
                <div className="flex justify-between font-mono text-[9px] font-extrabold text-neutral-500">
                  <span>{systemStable ? '98%' : '88%'} Probability</span>
                  <span>THRESHOLD: 75%</span>
                </div>
              </div>

              {/* Action Approval widget */}
              <div className="p-4 border border-black space-y-3">
                <div className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
                  Recommended Action
                </div>
                
                <p className="text-xs font-bold leading-normal text-black font-sans">
                  {systemStable 
                    ? 'Rollback confirmed. Production billing-api stabilized to stable version "v2.4.0".' 
                    : "Rollback service 'billing-api' to stable version 'v2.4.0'."
                  }
                </p>
                
                <button
                  onClick={onApproveAction}
                  disabled={systemStable}
                  className={`w-full text-[10px] font-extrabold tracking-widest py-2 border uppercase cursor-pointer active:scale-95 transition-all ${
                    systemStable
                      ? 'bg-emerald-500 border-emerald-600 text-white cursor-default shadow-none pointer-events-none'
                      : 'bg-black border-black text-white hover:bg-white hover:text-black hover:shadow-[3px_3px_0px_0px_#000000]'
                  }`}
                >
                  {systemStable ? 'Approved & Solved ✓' : 'Approve'}
                </button>
              </div>

            </div>
          </div>

          <div className="p-4 border-t border-black bg-neutral-50">
            <button
              onClick={onResetWorkflow}
              className="text-[9px] font-black uppercase text-neutral-500 tracking-wider hover:text-black underline block w-full text-center"
            >
              Reset Workflow Remediator State
            </button>
          </div>
        </aside>

      </div>

      {/* 3. Bottom Status Metrics Table Footer */}
      <footer id="workflows-footer" className="h-16 border-t border-black bg-[#fbf9f9] flex items-center px-6 divide-x divide-black overflow-x-auto z-10 select-none">
        
        {/* Metric 1 */}
        <div className="flex-1 min-w-[120px] px-4">
          <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
            Throughput
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-black">12.4</span>
            <span className="text-[9px] font-bold text-neutral-400">req/s</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="flex-1 min-w-[125px] px-4">
          <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
            Success Rate
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-black text-black">99.8%</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="flex-1 min-w-[120px] px-4">
          <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
            AI Confidence
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-black">88.2%</span>
            <span className="text-[9px] font-bold text-neutral-400 font-mono">AVG</span>
          </div>
        </div>

        {/* Metric 4 (System Health status) */}
        <div className="flex-1 min-w-[180px] px-4 flex flex-col justify-center">
          <div className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-0.5">
            System Health
          </div>
          <div className="flex items-center gap-3">
            {/* Custom styled stack representation */}
            <div className="flex gap-0.5 select-none">
              <span className={`w-1.5 h-3 border border-black ${systemStable ? 'bg-black' : 'bg-black'}`} />
              <span className={`w-1.5 h-3 border border-black ${systemStable ? 'bg-black' : 'bg-black'}`} />
              <span className={`w-1.5 h-3 border border-black ${systemStable ? 'bg-black' : 'bg-black'}`} />
              <span className={`w-1.5 h-3 border border-black ${systemStable ? 'bg-black' : 'bg-black'}`} />
              <span className={`w-1.5 h-3 border border-black ${systemStable ? 'bg-black' : 'bg-neutral-200'}`} />
            </div>
            
            <span className="text-xs font-black font-mono uppercase text-black">
              {systemStable ? 'OPTIMAL' : 'STABLE'}
            </span>
          </div>
        </div>

        {/* Quick View Logs Action Trigger */}
        <div className="px-4 h-full flex items-center min-w-[100px]">
          <button 
            onClick={() => setShowLogsModal(true)}
            className="border border-black px-4 py-1.5 text-[9px] font-black uppercase bg-white text-black hover:bg-black hover:text-white transition-all cursor-pointer active:scale-95"
          >
            View Logs
          </button>
        </div>

      </footer>

      {/* Floating terminal logs overlay */}
      {showLogsModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6 animate-fade-in select-text">
          <div className="bg-[#1b1c1c] text-neutral-200 w-full max-w-2xl border-2 border-white font-mono text-xs shadow-2xl relative flex flex-col h-96">
            
            {/* Terminal Header */}
            <div className="flex justify-between items-center bg-[#303031] px-4 py-2 border-b border-neutral-700">
              <span className="text-[10px] font-bold text-emerald-400">DEV-OPS-SHELL-LOGS v2.4.1</span>
              <button 
                onClick={() => setShowLogsModal(false)}
                className="text-white hover:text-red-400 font-bold font-sans text-xs uppercase"
              >
                Close ×
              </button>
            </div>

            {/* Simulated live logs content */}
            <div className="p-4 flex-1 overflow-y-auto space-y-2 text-neutral-300">
              <p className="text-neutral-500">{"[2026-06-03 13:07:15]"} INITIATING HEALTH CHECK ON prod-cluster-01...</p>
              <p className="text-emerald-400">{"[2026-06-03 13:07:16]"} + API Gateway responds: latency NOMINAL (24ms)</p>
              <p className="text-neutral-500">{"[2026-06-03 13:07:18]"} VERIFYING DB POOL CAPACITY...</p>
              <p className={systemStable ? "text-emerald-400" : "text-amber-500 animate-pulse"}>
                {"[2026-06-03 13:07:19]"} ! DB connection Pool Alert: {systemStable ? 'STABILIZED' : 'HIGH_STRESS (98% pool usage)'}
              </p>
              <p className="text-neutral-400">{"[2026-06-03 13:07:24]"} Scanning trace sequence at query_optimizer.py:144 ...</p>
              <p className="text-neutral-400">{"[2026-06-03 13:07:30]"} Detected problematic non-indexed transaction_metadata sequence.</p>
              <p className="text-neutral-300">{"[2026-06-03 13:08:01]"} Executed automated forensic traceback analyzer.</p>
              {systemStable && (
                <>
                  <p className="text-emerald-400 font-bold">{"[2026-06-03 13:09:44]"} AUTOMATED REMEDIATION ROLLBACK TRIGGERED BY USER JD</p>
                  <p className="text-emerald-400">{"[2026-06-03 13:09:47]"} DB connections released! Pool usage decreased to 14.5%</p>
                  <p className="text-emerald-400 font-bold">{"[2026-06-03 13:09:48]"} SYSTEM STATE SET TO OPTIMAL ✓</p>
                </>
              )}
            </div>

            {/* Custom scroll support tip */}
            <div className="absolute bottom-2 right-4 text-[9px] text-neutral-600 tracking-wider">
              DRAG OR SCROLL TO VIEW ALL ENTRIES
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
