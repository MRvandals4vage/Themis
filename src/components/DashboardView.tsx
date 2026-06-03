import { useState } from 'react';
import { 
  AlertTriangle, 
  XOctagon, 
  Sparkles, 
  Timer, 
  TrendingUp, 
  ArrowRight,
  Brain,
  ShieldCheck,
  FileDown,
  RefreshCw,
  Clock
} from 'lucide-react';
import { RecentFailure, ExecutiveMetrics } from '../types';
import { aiInsights } from '../data';

interface DashboardViewProps {
  metrics: ExecutiveMetrics;
  failures: RecentFailure[];
  onSelectIncidentByService: (serviceName: string) => void;
  onResolveInsight: (id: string, message: string) => void;
  onGenerateReport: () => void;
  onExportPDF: () => void;
  searchValue: string;
}

export default function DashboardView({
  metrics,
  failures,
  onSelectIncidentByService,
  onResolveInsight,
  onGenerateReport,
  onExportPDF,
  searchValue
}: DashboardViewProps) {
  
  // Hovered node state for the interactive SVG pipeline chart
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number, y: number, successVal: number, failVal: number, day: string } | null>(null);

  const pipelineChartData = [
    { day: 'Mon', success: 80, failure: 20, x: 20, ySuccess: 140, yFailure: 180 },
    { day: 'Tue', success: 95, failure: 40, x: 130, ySuccess: 110, yFailure: 160 },
    { day: 'Wed', success: 110, failure: 25, x: 240, ySuccess: 95, yFailure: 175 },
    { day: 'Thu', success: 85, failure: 50, x: 350, ySuccess: 130, yFailure: 150 },
    { day: 'Fri', success: 130, failure: 60, x: 460, ySuccess: 70, yFailure: 140 },
    { day: 'Sat', success: 105, failure: 35, x: 570, ySuccess: 105, yFailure: 165 },
    { day: 'Sun', success: 140, failure: 45, x: 680, ySuccess: 50, yFailure: 155 },
    { day: 'Today', success: 120, failure: 30, x: 790, ySuccess: 80, yFailure: 170 }
  ];

  // Filter failures based on search value helper
  const filteredFailures = failures.filter(f =>
    f.service.toLowerCase().includes(searchValue.toLowerCase()) ||
    f.environment.toLowerCase().includes(searchValue.toLowerCase()) ||
    f.errorType.toLowerCase().includes(searchValue.toLowerCase()) ||
    f.status.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="p-12 animate-fade-in font-sans">
      
      {/* Dashboard Top Header */}
      <div className="flex justify-between items-end mb-16">
        <div>
          <p className="text-[10px] tracking-widest uppercase font-bold text-neutral-500 mb-2">
            EXECUTIVE OVERVIEW
          </p>
          <h2 className="text-4xl font-extrabold tracking-tighter uppercase text-black">
            Operations Dashboard
          </h2>
        </div>
        <div className="flex gap-4">
          <button
            onClick={onExportPDF}
            className="flex items-center gap-2 px-6 py-3 border border-black text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-neutral-100 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer active:scale-95"
          >
            <FileDown className="w-4 h-4" />
            Export PDF
          </button>
          
          <button
            onClick={onGenerateReport}
            className="flex items-center gap-2 px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-wider border border-black hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            Generate AI Report
          </button>
        </div>
      </div>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Metric Card 1: Active Incidents */}
        <div className="col-span-12 md:col-span-3 border border-black p-6 bg-white group hover:bg-black transition-colors duration-300">
          <div className="flex justify-between items-start mb-10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 group-hover:text-neutral-400">
              Active Incidents
            </span>
            <AlertTriangle className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tighter text-black group-hover:text-white transition-colors">
              {metrics.activeIncidentsCount}
            </span>
            <span className="text-xs font-bold text-red-600 group-hover:text-red-400 transition-colors">
              {metrics.activeIncidentsDelta}
            </span>
          </div>
          <p className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors mt-2">
            Across production clusters
          </p>
        </div>

        {/* Metric Card 2: Failed Pipelines */}
        <div className="col-span-12 md:col-span-3 border border-black p-6 bg-white group hover:bg-black transition-colors duration-300">
          <div className="flex justify-between items-start mb-10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 group-hover:text-neutral-400">
              Failed Pipelines
            </span>
            <XOctagon className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tighter text-black group-hover:text-white transition-colors">
              {String(metrics.failedPipelinesCount).padStart(2, '0')}
            </span>
            <span className="text-xs font-bold text-neutral-500 group-hover:text-neutral-400 transition-colors uppercase">
              {metrics.failedPipelinesStatus}
            </span>
          </div>
          <p className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors mt-2">
            Last 24 hours
          </p>
        </div>

        {/* Metric Card 3: AI Resolution Rate */}
        <div className="col-span-12 md:col-span-3 border border-black p-6 bg-white group hover:bg-black transition-colors duration-300">
          <div className="flex justify-between items-start mb-10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 group-hover:text-neutral-400">
              AI Resolution Rate
            </span>
            <Sparkles className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tighter text-black group-hover:text-white transition-colors">
              {metrics.aiResolutionRate}%
            </span>
            <span className="text-xs font-bold text-green-600 group-hover:text-green-400 transition-colors">
              {metrics.aiResolutionDelta}
            </span>
          </div>
          <p className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors mt-2">
            Autonomous fixes applied
          </p>
        </div>

        {/* Metric Card 4: Avg. Recovery (MTTR) */}
        <div className="col-span-12 md:col-span-3 border border-black p-6 bg-white group hover:bg-black transition-colors duration-300">
          <div className="flex justify-between items-start mb-10">
            <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-500 group-hover:text-neutral-400">
              Avg. Recovery (MTTR)
            </span>
            <Timer className="w-5 h-5 text-neutral-400 group-hover:text-white transition-colors" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-black tracking-tighter text-black group-hover:text-white transition-colors">
              {metrics.avgRecoveryTime}
            </span>
            <span className="text-xs font-bold text-neutral-500 group-hover:text-neutral-400 transition-colors">
              {metrics.avgRecoveryDelta}
            </span>
          </div>
          <p className="text-xs text-neutral-500 group-hover:text-neutral-400 transition-colors mt-2">
            Industry avg: 4.2h
          </p>
        </div>

        {/* Pipeline Health Chart */}
        <div className="col-span-12 md:col-span-8 border border-black p-8 bg-white relative min-h-[420px]">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-black" />
              <h3 className="text-sm font-black uppercase tracking-tight text-black">
                Pipeline Health Trend
              </h3>
            </div>
            
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-black">
                <span className="w-3 h-3 bg-black"></span> Success
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-neutral-400">
                <span className="w-3 h-3 border border-neutral-300 bg-neutral-200"></span> Failure
              </span>
            </div>
          </div>

          {/* Custom vector graph */}
          <div className="relative w-full h-64 border-l border-b border-black">
            <svg 
              className="w-full h-full" 
              viewBox="0 0 800 200" 
              preserveAspectRatio="none"
              onMouseLeave={() => setHoveredPoint(null)}
            >
              {/* Grid Lines simulation */}
              <line x1="0" y1="50" x2="800" y2="50" stroke="#f0eded" strokeWidth="1" strokeDasharray="3" />
              <line x1="0" y1="100" x2="800" y2="100" stroke="#f0eded" strokeWidth="1" strokeDasharray="3" />
              <line x1="0" y1="150" x2="800" y2="150" stroke="#f0eded" strokeWidth="1" strokeDasharray="3" />
              
              {pipelineChartData.map((pt, idx) => (
                <line key={`grid-${idx}`} x1={pt.x} y1="0" x2={pt.x} y2="200" stroke="#f5f3f3" strokeWidth="1" />
              ))}

              {/* Failure path (grey) */}
              <path 
                d="M 20 160 L 130 150 L 240 170 L 350 145 L 460 135 L 570 160 L 680 150 L 790 165" 
                fill="none" 
                stroke="#cfc4c5" 
                strokeWidth="2" 
              />

              {/* Success path (black) */}
              <path 
                d="M 20 100 L 130 80 L 240 65 L 350 90 L 460 50 L 570 75 L 680 45 L 790 60" 
                fill="none" 
                stroke="#000000" 
                strokeWidth="3.5" 
              />

              {/* Interactive points & hover logic */}
              {pipelineChartData.map((pt, idx) => (
                <g key={`interactive-${idx}`}>
                  {/* Hover Area Slices */}
                  <rect
                    x={pt.x - 30}
                    y="0"
                    width="60"
                    height="200"
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={(e) => {
                      setHoveredPoint({
                        x: pt.x,
                        y: pt.ySuccess,
                        successVal: pt.success,
                        failVal: pt.failure,
                        day: pt.day
                      });
                    }}
                  />
                  
                  {/* Success Node Circle */}
                  <circle 
                    cx={pt.x} 
                    cy={pt.ySuccess} 
                    r="5" 
                    fill="#000000" 
                    stroke="#ffffff" 
                    strokeWidth="1.5"
                    className="transition-transform duration-100 hover:scale-150 cursor-pointer"
                  />

                  {/* Failure Node Circle */}
                  <circle 
                    cx={pt.x} 
                    cy={pt.yFailure} 
                    r="4" 
                    fill="#cfc4c5" 
                    stroke="#ffffff" 
                    strokeWidth="1.5"
                  />
                </g>
              ))}
            </svg>

            {/* Floating detail popup on hover */}
            {hoveredPoint && (
              <div 
                className="absolute bg-black text-white p-3 border border-white font-mono text-[10px] pointer-events-none z-30"
                style={{ 
                  left: `${Math.min(hoveredPoint.x / 8, 85)}%`, 
                  top: `${Math.max(hoveredPoint.y / 2 - 40, 10)}px` 
                }}
              >
                <div className="font-extrabold uppercase border-b border-neutral-700 pb-1 mb-1 text-[11px] text-[#fbf9f9]">
                  {hoveredPoint.day} Pipeline
                </div>
                <div>SUCCESS RATE: <span className="text-emerald-400 font-bold">{hoveredPoint.successVal} build/h</span></div>
                <div>FAILURES: <span className="text-red-400 font-bold">{hoveredPoint.failVal} build/h</span></div>
              </div>
            )}
          </div>

          <div className="flex justify-between mt-4 text-[10px] font-bold text-neutral-500 font-mono">
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
            <span>SUN</span>
            <span>TODAY</span>
          </div>
        </div>

        {/* AI Insights Panel (The right side panel) */}
        <div className="col-span-12 md:col-span-4 border border-black p-8 bg-black text-white relative flex flex-col justify-between overflow-hidden">
          {/* Faded vector brain art style */}
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Brain className="w-40 h-40" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-8">
              <Brain className="w-5 h-5 text-neutral-300 animate-pulse" />
              <h3 className="text-sm font-black uppercase tracking-tight text-white">
                AI Insights
              </h3>
            </div>
            
            <div className="space-y-6">
              {aiInsights.map((insight) => (
                <div key={insight.id} className="border-l-2 border-white pl-4 group transition-all">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    {insight.category}
                  </p>
                  <p className="text-xs text-neutral-200 leading-relaxed font-sans mb-3">
                    {insight.message}
                  </p>
                  {insight.actionText && (
                    <button
                      onClick={() => onResolveInsight(insight.id, insight.message)}
                      className="text-[10px] font-black tracking-widest border border-white px-2 py-1 bg-transparent text-white hover:bg-white hover:text-black transition-all cursor-pointer active:scale-95"
                    >
                      {insight.actionText}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 border-t border-neutral-800 pt-4 flex items-center justify-between text-neutral-400 text-[10px] font-mono">
            <span className="flex items-center gap-1.5 font-bold uppercase"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Auto-protect active</span>
            <span>CONFIDENCE: 94%</span>
          </div>
        </div>

        {/* Incident Trends Bar Chart */}
        <div className="col-span-12 md:col-span-4 border border-black p-8 bg-white flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight text-black mb-8">
              Incident Trends
            </h3>
            
            {/* Custom SVG bars or div bars */}
            <div className="flex items-end gap-3 h-48 px-3">
              {[
                { day: 'MON', value: 40 },
                { day: 'TUE', value: 60 },
                { day: 'WED', value: 35 },
                { day: 'THU', value: 85 },
                { day: 'FRI', value: 50 },
                { day: 'SAT', value: 45 },
                { day: 'SUN', value: 20 }
              ].map((bar, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end cursor-pointer">
                  <div className="w-full relative">
                    {/* Hover Tooltip inside individual bar state */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white px-1.5 py-0.5 text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity z-10 select-none">
                      {bar.value / 5}
                    </div>
                    {/* Bar solid line */}
                    <div 
                      className="bg-black hover:bg-neutral-800 transition-all border-l border-r border-black" 
                      style={{ height: `${bar.value}%`, minHeight: '4px' }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between mt-4 text-[10px] font-bold text-neutral-400 font-mono px-3">
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
            <span>SUN</span>
          </div>
        </div>

        {/* Recent Failures Table list */}
        <div className="col-span-12 md:col-span-8 border border-black bg-white flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-black flex justify-between items-center bg-[#fbf9f9]">
              <h3 className="text-sm font-black uppercase tracking-tight text-black">
                Recent Failures
              </h3>
              <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-neutral-500">
                <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-ping" />
                LIVE FEED
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-black text-[9px] font-bold uppercase tracking-wider text-neutral-400 bg-neutral-50 font-mono">
                    <th className="px-6 py-4">SERVICE</th>
                    <th className="px-6 py-4">ENVIRONMENT</th>
                    <th className="px-6 py-4">ERROR TYPE</th>
                    <th className="px-6 py-4">DURATION</th>
                    <th className="px-6 py-4">STATUS</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  {filteredFailures.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-neutral-400 font-mono">
                        No recent matching failure logs found
                      </td>
                    </tr>
                  ) : (
                    filteredFailures.map((fail) => {
                      // Determine status colors
                      const getStatusBadge = (status: string) => {
                        switch (status) {
                          case 'CRITICAL':
                            return 'border border-red-600 bg-red-50 text-red-600 group-hover:bg-red-600 group-hover:text-white transition-colors';
                          case 'RESOLVED':
                            return 'border border-green-600 bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors';
                          case 'ONGOING':
                            return 'border border-amber-600 bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors';
                          default:
                            return 'border border-black bg-neutral-100 text-black group-hover:bg-black group-hover:text-white transition-colors';
                        }
                      };

                      return (
                        <tr 
                          key={fail.id} 
                          onClick={() => onSelectIncidentByService(fail.service)}
                          className="border-b border-neutral-200 hover:bg-black hover:text-white transition-colors group cursor-pointer"
                        >
                          <td className="px-6 py-4 font-bold font-mono">
                            {fail.service}
                          </td>
                          <td className="px-6 py-4 text-neutral-600 group-hover:text-neutral-300">
                            {fail.environment}
                          </td>
                          <td className="px-6 py-4 font-mono text-neutral-600 group-hover:text-neutral-300 text-[11px]">
                            {fail.errorType}
                          </td>
                          <td className="px-6 py-4 text-neutral-600 group-hover:text-neutral-300">
                            {fail.duration}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-[10px] font-bold px-2.5 py-1 uppercase tracking-wider ${getStatusBadge(fail.status)}`}>
                              {fail.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* Footer System Status details */}
      <div className="mt-16 pt-8 border-t border-black flex justify-between items-center text-neutral-500 text-[10px] font-bold font-mono uppercase">
        <div className="flex gap-8">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse" />
            API GATEWAY: NOMINAL
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-black rounded-full" />
            K8S CONTROL PLANE: ACTIVE
          </div>
        </div>
        <p className="flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          LAST UPDATED: 2026-06-03 13:07:15 UTC
        </p>
      </div>

    </div>
  );
}
