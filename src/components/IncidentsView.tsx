import { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  Search, 
  Activity, 
  CheckCircle, 
  Cpu, 
  Clock, 
  FileCode, 
  ArrowRight,
  ShieldAlert,
  Send,
  Trash2,
  GitPullRequest,
  CheckSquare
} from 'lucide-react';
import { Incident } from '../types';

interface IncidentsViewProps {
  incidents: Incident[];
  selectedIncidentId: string;
  onSelectIncident: (id: string) => void;
  onDismissIncident: (id: string) => void;
  onExecuteRemediation: (id: string) => void;
  onPostGithubIssue: (id: string, issueData: any) => void;
  searchValue: string;
}

export default function IncidentsView({
  incidents,
  selectedIncidentId,
  onSelectIncident,
  onDismissIncident,
  onExecuteRemediation,
  onPostGithubIssue,
  searchValue
}: IncidentsViewProps) {
  
  // Find the currently active incident
  const incident = incidents.find(inc => inc.id === selectedIncidentId) || incidents[0];
  
  // Local state for editable issue elements
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedFix, setEditedFix] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isPosted, setIsPosted] = useState(false);

  // Sync state whenever the selected incident changes
  useEffect(() => {
    if (incident && incident.proposedIssue) {
      setEditedTitle(incident.proposedIssue.title);
      setEditedDescription(incident.proposedIssue.description);
      setEditedFix(incident.proposedIssue.proposedFix);
      setIsPosted(false);
    }
  }, [selectedIncidentId, incident]);

  if (!incident) {
    return (
      <div className="p-12 text-center text-neutral-400 font-mono font-bold">
        No incidents available or loaded.
      </div>
    );
  }

  // Filter incident lists based on search
  const filteredIncidents = incidents.filter(inc =>
    inc.title.toLowerCase().includes(searchValue.toLowerCase()) ||
    inc.resource.toLowerCase().includes(searchValue.toLowerCase()) ||
    inc.rootCauseAnalysis.toLowerCase().includes(searchValue.toLowerCase()) ||
    inc.caseCode.toLowerCase().includes(searchValue.toLowerCase())
  );

  const getLevelBadgeClass = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-black text-white font-bold px-1.5 py-0.5 text-[9px] font-sans tracking-wide';
      case 'HIGH':
        return 'border border-black text-black bg-neutral-100 font-bold px-1.5 py-0.5 text-[9px] font-sans tracking-wide';
      default:
        return 'border border-neutral-400 text-neutral-600 font-medium px-1.5 py-0.5 text-[9px] font-sans tracking-wide';
    }
  };

  const handlePostSubmit = () => {
    setIsPosting(true);
    setTimeout(() => {
      setIsPosting(false);
      setIsPosted(true);
      onPostGithubIssue(incident.id, {
        title: editedTitle,
        description: editedDescription,
        proposedFix: editedFix,
        labels: incident.proposedIssue.labels
      });
    }, 1200);
  };

  return (
    <div id="incidents-workspace" className="flex flex-1 min-h-[calc(100vh-64px)] animate-fade-in">
      
      {/* 1. Incident List Left Sidebar Section */}
      <section className="w-80 border-r border-black bg-[#f5f3f3] flex flex-col select-none">
        <div className="p-4 border-b border-black flex justify-between items-center bg-white">
          <h2 className="text-[10px] font-bold tracking-wider uppercase text-neutral-800">
            Active Incidents ({filteredIncidents.length})
          </h2>
          <Clock className="w-4 h-4 text-neutral-400" />
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredIncidents.length === 0 ? (
            <p className="p-6 text-center text-xs text-neutral-400 font-mono">
              No matching incidents
            </p>
          ) : (
            filteredIncidents.map((inc) => {
              const isSelected = inc.id === selectedIncidentId;
              
              return (
                <div
                  key={inc.id}
                  onClick={() => onSelectIncident(inc.id)}
                  id={`incident-item-${inc.id}`}
                  className={`p-4 border-b border-black cursor-pointer transition-all duration-150 relative ${
                    isSelected 
                      ? 'bg-black text-white' 
                      : 'hover:bg-white hover:text-black bg-[#f5f3f3] text-neutral-600'
                  }`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className={isSelected 
                      ? "bg-white text-black text-[9px] font-bold px-1 py-0.5 tracking-wider uppercase" 
                      : getLevelBadgeClass(inc.level)
                    }>
                      {inc.level}
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {inc.time}
                    </span>
                  </div>
                  
                  <p className="font-sans text-xs font-extrabold mb-2 leading-tight tracking-tight">
                    {inc.title}
                  </p>
                  
                  <div className="flex items-center gap-1.5 opacity-80">
                    <Cpu className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-[10px] font-mono leading-none tracking-wider uppercase">
                      {inc.resource}
                    </span>
                  </div>

                  {/* Status Indicator Pill */}
                  {inc.status === 'RESOLVED' && (
                    <span className="absolute bottom-4 right-4 text-[10px] bg-emerald-500 text-white font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                      FIXED
                    </span>
                  )}
                  {inc.status === 'DISMISSED' && (
                    <span className="absolute bottom-4 right-4 text-[10px] bg-neutral-400 text-white font-bold px-1.5 py-0.5 rounded uppercase font-mono">
                      MUTED
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* 2. Main Forensic Investigation Workspace Panel */}
      <section className="flex-1 bg-[#fbf9f9] overflow-y-auto">
        <div className="p-12">
          
          {/* Incident Headers */}
          <div className="flex justify-between items-start mb-12">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-3">
                <span className="px-2 py-0.5 bg-black text-white font-bold text-[9px] tracking-wider uppercase">
                  {incident.caseCode}
                </span>
                <span className="text-neutral-500 font-bold text-[9px] tracking-wider uppercase flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${incident.status === 'RESOLVED' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                  {incident.status === 'RESOLVED' 
                    ? 'RESOLVED & VERIFIED' 
                    : incident.status === 'DISMISSED' 
                    ? 'ALERT DISMISSED' 
                    : 'INVESTIGATION IN PROGRESS'
                  }
                </span>
              </div>
              
              <h1 className="text-3xl font-extrabold uppercase tracking-tighter text-black mb-3">
                {incident.title}
              </h1>
              
              <p className="text-sm text-neutral-500 leading-relaxed font-sans">
                {incident.description}
              </p>
            </div>

            {/* AI Confidence Score Card */}
            <div className="flex flex-col items-end gap-1 select-none">
              <div className="p-4 border border-black bg-white flex flex-col items-center min-w-[124px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <span className="text-[10px] font-bold text-neutral-500 tracking-wider uppercase text-center mb-1">
                  AI CONFIDENCE
                </span>
                <span className="text-4xl font-black leading-none tracking-tighter text-black font-sans">
                  {incident.aiConfidence}%
                </span>
              </div>
            </div>
          </div>

          {/* Forensic Bento Grid Analysis details */}
          <div className="grid grid-cols-12 gap-6">
            
            {/* Root Cause Analysis Python Trace Frame (Col 8) */}
            <div className="col-span-12 md:col-span-8 border border-black p-6 bg-white relative">
              <div className="flex items-center gap-2 mb-6">
                <ShieldAlert className="w-5 h-5 text-black" />
                <h3 className="text-xs font-black uppercase tracking-wider text-black">
                  ROOT CAUSE ANALYSIS
                </h3>
              </div>

              {/* Terminal Warning Screen */}
              <div className="bg-black text-white p-4 mb-6 border-l-4 border-neutral-600">
                <p className="font-mono text-xs leading-relaxed">
                  {incident.rootCauseAnalysis}
                </p>
              </div>

              {/* Simulated Code Compiler Trace Block */}
              <div className="font-mono bg-[#e9e8e7] text-xs border border-black overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,0.05)]">
                <div className="flex justify-between border-b border-neutral-300 px-4 py-2 bg-neutral-200 text-[10px] font-bold text-neutral-500 select-none">
                  <span>SOURCE: {incident.sourceFile}</span>
                  <span>LINE {incident.sourceLine}</span>
                </div>
                
                <div className="p-4 overflow-x-auto select-text leading-relaxed text-black">
                  <pre className="whitespace-pre-wrap">
                    {incident.codeSnippet}
                  </pre>
                  <pre className="bg-red-200 text-black px-1.5 py-1 font-bold inline-block w-full text-[12px] border-l-2 border-red-600 my-1">
                    {incident.highlightedLine}
                  </pre>
                  <pre className="whitespace-pre">
                    {/* @ts-ignore */}
                    {incident.codeSnippetTail}
                  </pre>
                </div>
              </div>
            </div>

            {/* Event Timeline Trace List (Col 4) */}
            <div className="col-span-12 md:col-span-4 border border-black p-6 bg-white flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Clock className="w-5 h-5 text-black" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-black">
                    EVENT TIMELINE
                  </h3>
                </div>

                <div className="space-y-6 relative before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1.5px] before:bg-black">
                  {incident.timeline.map((ev) => (
                    <div key={ev.id} className="pl-6 relative group">
                      <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border border-black bg-white flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-black rounded-full" />
                      </div>
                      <span className="font-mono text-[9px] font-bold text-neutral-500 block">
                        {ev.time}
                      </span>
                      <span className="font-sans text-xs font-bold text-black block leading-snug">
                        {ev.title}
                      </span>
                      {ev.description && (
                        <span className="text-[10px] text-neutral-400 font-sans tracking-wide">
                          {ev.description}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Static health reference */}
              <div className="mt-6 border-t border-neutral-100 pt-4 text-[10px] font-mono text-neutral-400">
                SCANNED SECONDS AGO VIA SHELL
              </div>
            </div>

            {/* Latency Profile Bar Charts (Col 4) */}
            <div className="col-span-12 md:col-span-4 border border-black p-6 bg-white">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-5 h-5 text-black" />
                <h3 className="text-xs font-black uppercase tracking-wider text-black">
                  LATENCY PROFILE
                </h3>
              </div>

              <div className="h-32 flex items-end gap-1.5">
                {incident.latencyProfile.map((point, index) => (
                  <div key={index} className="flex-1 flex flex-col h-full justify-end group relative cursor-pointer">
                    <div className="absolute -top-7 left-1/2 -dash translate-x-1/2 bg-black text-white px-1 py-0.5 text-[8px] font-mono opacity-0 group-hover:opacity-100 transition-opacity z-10 select-none whitespace-nowrap">
                      {point.value}% stress
                    </div>
                    <div 
                      className={`w-full transition-all duration-150 ${
                        point.isCore 
                          ? 'bg-black hover:bg-neutral-800' 
                          : 'bg-neutral-300 hover:bg-neutral-500'
                      }`} 
                      style={{ height: `${point.value}%`, minHeight: '3px' }} 
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-between mt-3 font-mono text-[9px] font-extrabold text-neutral-400">
                <span>T-30M</span>
                <span>NOW</span>
                <span>+15M EST</span>
              </div>
            </div>

            {/* Proposed GitHub Issue preview box (Col 8) */}
            <div className="col-span-12 md:col-span-8 border border-black p-6 bg-white flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <FileCode className="w-5 h-5 text-black" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-black font-sans">
                      PROPOSED GITHUB ISSUE
                    </h3>
                  </div>
                  
                  <button
                    disabled={isPosting || isPosted}
                    onClick={handlePostSubmit}
                    className={`px-4 py-1.5 font-bold text-[9px] tracking-widest uppercase border border-black transition-all cursor-pointer active:scale-95 flex items-center gap-1.5 ${
                      isPosted 
                        ? 'bg-emerald-500 text-white border-emerald-500' 
                        : isPosting
                        ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed border-neutral-300'
                        : 'bg-black text-white hover:bg-white hover:text-black hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]'
                    }`}
                  >
                    {isPosted ? (
                      <>
                        <CheckSquare className="w-3.5 h-3.5" />
                        POSTED ✔
                      </>
                    ) : isPosting ? (
                      'POSTING...'
                    ) : (
                      'GENERATE & POST'
                    )}
                  </button>
                </div>

                {/* Substantially realistic styled Issue Container */}
                <div className="border border-black p-4 bg-[#fbf9f9] text-xs font-sans">
                  
                  {/* Issue Title Input */}
                  <div className="mb-3">
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                      ISSUE TITLE
                    </label>
                    <input 
                      type="text" 
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full bg-white border border-neutral-300 px-2 py-1 font-sans text-xs font-bold text-black focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  {/* Description Input */}
                  <div className="mb-3">
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                      DESCRIPTION
                    </label>
                    <textarea 
                      rows={2}
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      className="w-full bg-white border border-neutral-300 px-2 py-1 font-sans text-xs text-neutral-600 focus:outline-none focus:ring-1 focus:ring-black leading-normal"
                    />
                  </div>

                  {/* Proposed Fix Input */}
                  <div className="mb-4">
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">
                      PROPOSED FIX
                    </label>
                    <input 
                      type="text" 
                      value={editedFix}
                      onChange={(e) => setEditedFix(e.target.value)}
                      className="w-full bg-white border border-neutral-300 px-2 py-1 font-sans text-xs text-neutral-600 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>

                  {/* Visual labels badge */}
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">
                      LABELS
                    </label>
                    <div className="flex gap-2">
                      {incident.proposedIssue.labels.map((lbl, idx) => (
                        <span key={idx} className="font-mono text-[10px] font-bold px-2 py-0.5 border border-black uppercase bg-white">
                          {lbl}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* Bottom Remediating Actions row */}
          <div className="mt-12 flex justify-end gap-4">
            <button
              onClick={() => onDismissIncident(incident.id)}
              disabled={incident.status === 'DISMISSED'}
              className={`border border-black px-8 py-3.5 text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-neutral-100 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:pointer-events-none`}
            >
              Dismiss Alert
            </button>
            
            <button
              id={`btn-remediate-${incident.id}`}
              onClick={() => onExecuteRemediation(incident.id)}
              disabled={incident.status === 'RESOLVED'}
              className={`bg-black text-white px-8 py-3.5 text-xs font-bold uppercase tracking-wider border border-black hover:bg-white hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:border-neutral-200 disabled:shadow-none disabled:pointer-events-none`}
            >
              {incident.status === 'RESOLVED' ? 'REMEDIATION COMPLETE ✓' : 'Execute Auto-Remediation'}
            </button>
          </div>

        </div>
      </section>

    </div>
  );
}
