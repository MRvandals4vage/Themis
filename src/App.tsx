/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardView from './components/DashboardView';
import IncidentsView from './components/IncidentsView';
import WorkflowsView from './components/WorkflowsView';
import PlaceholderView from './components/PlaceholderView';

import { 
  initialIncidents, 
  initialWorkflowNodes, 
  initialRecentFailures, 
  initialMetrics 
} from './data';
import { Incident, WorkflowNode, RecentFailure, ExecutiveMetrics } from './types';
import { 
  Sparkles, 
  CheckCircle2, 
  Bot, 
  Cpu, 
  Terminal, 
  AlertOctagon, 
  Plus, 
  Trash2, 
  X,
  FileText
} from 'lucide-react';

export default function App() {
  
  // Navigation and Query States
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [searchValue, setSearchValue] = useState<string>('');
  
  // Core Business Dataset States
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('inc-1');
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>(initialWorkflowNodes);
  const [recentFailures, setRecentFailures] = useState<RecentFailure[]>(initialRecentFailures);
  const [metrics, setMetrics] = useState<ExecutiveMetrics>(initialMetrics);

  // Remediation and Automated Engine States
  const [systemStable, setSystemStable] = useState<boolean>(false);
  const [deploying, setDeploying] = useState<boolean>(false);
  const [deployStep, setDeployStep] = useState<number>(0);
  const [showDeploymentModal, setShowDeploymentModal] = useState<boolean>(false);

  // Reporting and Audit States
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportText, setReportText] = useState<string>('');
  
  // Custom Node Builder Dialog States
  const [showAddNodeModal, setShowAddNodeModal] = useState<boolean>(false);
  const [customNodeName, setCustomNodeName] = useState<string>('');
  const [customNodeSpecialization, setCustomNodeSpecialization] = useState<string>('');
  const [customNodeType, setCustomNodeType] = useState<'trigger' | 'agent' | 'resolution'>('agent');

  // Custom Toast Banner notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'alert' } | null>(null);

  // Auto Dismiss Toast logic
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Toast helper trigger
  const triggerToast = (message: string, type: 'success' | 'info' | 'alert' = 'success') => {
    setToast({ message, type });
  };

  // 1. Interactive Action: Deploy Agent
  const handleDeployAgent = () => {
    setDeployStep(1);
    setDeploying(true);
    setShowDeploymentModal(true);
    
    // Simulate compilation steps
    setTimeout(() => setDeployStep(2), 600);
    setTimeout(() => setDeployStep(3), 1200);
    setTimeout(() => setDeployStep(4), 1800);
    
    setTimeout(() => {
      setDeploying(false);
      setShowDeploymentModal(false);
      triggerToast('AI Autonomous Workflow Agent successfully deployed to prod-cluster-01', 'success');
      
      // Update metrics slightly representing a deployment increase
      setMetrics(prev => ({
        ...prev,
        aiResolutionRate: Math.min(prev.aiResolutionRate + 2, 99)
      }));
    }, 2400);
  };

  // 2. Interactive Action: Select Incident from Recent failures table cross link
  const handleSelectIncidentByService = (serviceName: string) => {
    // Attempt to map service to one of our incidents
    const found = incidents.find(inc => inc.title.toLowerCase().includes(serviceName.toLowerCase()) || inc.resource.toLowerCase().includes(serviceName.toLowerCase()));
    
    if (found) {
      setSelectedIncidentId(found.id);
      setCurrentTab('incidents');
      setSearchValue(''); // reset search on page switch
      triggerToast(`Investigating anomaly trace for ${serviceName}`, 'info');
    } else {
      triggerToast(`No active critical case files open for ${serviceName}`, 'info');
    }
  };

  // 3. Interactive Action: Dismiss an alert from the table list or Details Workspace
  const handleDismissIncident = (id: string) => {
    setIncidents(prev => 
      prev.map(inc => inc.id === id ? { ...inc, status: 'DISMISSED' as const } : inc)
    );
    
    // Decrease count
    setMetrics(prev => ({
      ...prev,
      activeIncidentsCount: Math.max(prev.activeIncidentsCount - 1, 0)
    }));

    // Update failures list
    const dismissedInc = incidents.find(inc => inc.id === id);
    if (dismissedInc) {
      setRecentFailures(prev => 
        prev.map(rf => rf.service.toLowerCase().includes(dismissedInc.resource.toLowerCase().split('-')[0].toLowerCase()) 
          ? { ...rf, status: 'RESOLVED' as const } 
          : rf
        )
      );
    }

    triggerToast(`Incident Case ${id.toUpperCase()} dismissed and muted from dashboard`, 'info');
  };

  // 4. Interactive Action: Apply GIN indices/remediate an Incident live
  const [isRemediating, setIsRemediating] = useState<boolean>(false);
  const [remediatingText, setRemediatingText] = useState<string>('');

  const handleExecuteRemediation = (id: string) => {
    const inc = incidents.find(i => i.id === id);
    if (!inc) return;

    setIsRemediating(true);
    setRemediatingText(`Analyzing system state at ${inc.resource}...`);

    setTimeout(() => {
      setRemediatingText(`Connecting to telemetry and running automatic index optimizer...`);
    }, 1000);

    setTimeout(() => {
      setRemediatingText(`Running query trace compile and applying GIN indexing parameters...`);
    }, 2000);

    setTimeout(() => {
      setIsRemediating(false);
      
      // Update local Incident Status
      setIncidents(prev => 
        prev.map(item => item.id === id ? { ...item, status: 'RESOLVED' as const } : item)
      );

      // Mutate Table list too
      setRecentFailures(prev => 
        prev.map(f => {
          if (inc.title.toLowerCase().includes(f.service.toLowerCase()) || inc.resource.includes(f.service.toUpperCase())) {
            return { ...f, status: 'RESOLVED' as const };
          }
          return f;
        })
      );

      // Decrement metric list counts
      setMetrics(prev => ({
        ...prev,
        activeIncidentsCount: Math.max(prev.activeIncidentsCount - 1, 0),
        aiResolutionRate: Math.min(prev.aiResolutionRate + 1, 100)
      }));

      triggerToast(`Auto-remediation successful for Incident Case ${inc.caseCode}! DB connection Release verified.`, 'success');
    }, 3200);
  };

  // 5. Interactive Action: Generate PDF trigger mockup
  const handleExportPDF = () => {
    triggerToast('Preparing DevOps Copilot report compilation... PDF downloading will commence shortly.', 'success');
  };

  // 6. Interactive Action: Generate AI executive report inside modal
  const handleGenerateAIReport = () => {
    setReportText(`DEV-OPS-AI-EXECUTIVE-REPORT\nTIMESTAMP: ${new Date().toISOString()}\n====================================\n\n[1] METRICS IDENTIFIED:\n    - Average system resolution efficiency: ${metrics.aiResolutionRate}%\n    - Active incident threshold: ${metrics.activeIncidentsCount} production logs\n    - System recovery MTTR: ${metrics.avgRecoveryTime}\n\n[2] STRATEGISED ANOMALY REPORTING:\n    - Critical Connection Pooling exhaustion detected withinRDS-PROD-01 (Database Connection Timeout in us-east-1).\n    - Probable root cause mapped to query_optimizer.py:144.\n\n[3] REMEDIATION BLUEPRINT:\n    - RECOMMENDED: Apply recursive indexing and establish LRU token cache policies globally.\n    - MITIGATION OUTCOME: Real-time traffic latency dropped to nominal 24ms.`);
    setShowReportModal(true);
  };

  // 7. Interactive Action: Post GitHub issue preview callback
  const handlePostGithubIssue = (id: string, issueData: any) => {
    triggerToast(`GitHub issue proposed! "${issueData.title}" posted to github.com/devops-copilot`, 'success');
  };

  // 8. Interactive Action: Resolve AI Insights card action directly
  const handleResolveInsight = (id: string, message: string) => {
    triggerToast(`Executing autonomous patch: "${message.split('.')[0]}"`, 'success');
    
    // Decrement Failed Count & Increments rate
    setMetrics(prev => ({
      ...prev,
      failedPipelinesCount: Math.max(prev.failedPipelinesCount - 1, 0),
      aiResolutionRate: Math.min(prev.aiResolutionRate + 1, 100)
    }));
  };

  // 9. Interactive Action: Rollback Trigger Approval Workflow
  const handleApproveRollbackWorkflow = () => {
    setSystemStable(true);
    triggerToast('Rollback for service "billing-api" to version "v2.4.0" is approved! Deploying changes...', 'success');
    
    // Set metric delta successes
    setMetrics(prev => ({
      ...prev,
      failedPipelinesCount: Math.max(prev.failedPipelinesCount - 1, 0),
      aiResolutionRate: Math.min(prev.aiResolutionRate + 3, 100)
    }));
  };

  // 10. Reset workflows state
  const handleResetWorkflow = () => {
    setSystemStable(false);
    setWorkflowNodes(initialWorkflowNodes);
    triggerToast('Workflow trace and state monitors successfully reset.', 'info');
  };

  // 11. Interactive Action: Add custom Agent nodes dynamically to editor canvas
  const handleAddCustomNode = () => {
    setCustomNodeName('');
    setCustomNodeSpecialization('');
    setCustomNodeType('agent');
    setShowAddNodeModal(true);
  };

  const submitAddCustomNode = (e: FormEvent) => {
    e.preventDefault();
    if (!customNodeName) return;

    const newNodeId = `wf-custom-${Date.now()}`;
    const newNode: WorkflowNode = {
      id: newNodeId,
      type: customNodeType,
      label: customNodeName,
      subText: customNodeSpecialization || 'Auto-Provisioned Agent',
      icon: customNodeType === 'trigger' ? 'BellRing' : customNodeType === 'resolution' ? 'Slack' : 'Sliders',
      status: 'ONLINE',
      x: 50,
      y: 40
    };

    setWorkflowNodes(prev => [...prev, newNode]);
    setShowAddNodeModal(false);
    triggerToast(`Node "${customNodeName}" successfully integrated to active blueprint canvas`, 'success');
  };

  return (
    <div id="devops-copilot-root" className="min-h-screen bg-[#fbf9f9] text-[#1b1c1c] font-sans antialiased overflow-x-hidden">
      
      {/* 1. Global Interactive Sidebar Navigation panel */}
      <Sidebar 
        currentTab={currentTab} 
        onTabChange={(tab) => {
          setCurrentTab(tab);
          setSearchValue(''); // reset search when tab changes
        }}
        onDeployClick={handleDeployAgent}
        deploying={deploying}
        incidentCount={incidents.filter(i => i.status === 'INVESTIGATING' || i.status === 'PENDING').length}
      />

      {/* 2. Primary layout body (Header + dynamic viewport tabs) */}
      <div className="ml-64 flex flex-col min-h-screen">
        
        {/* Dynamic global header */}
        <Header 
          currentTab={currentTab}
          searchValue={searchValue}
          onSearchChange={setSearchValue}
          onSupportClick={() => triggerToast('DevOps Copilot active support line is ready.', 'info')}
          onHelpClick={() => triggerToast('DevOps core interactive user manual loaded.', 'info')}
          onNotificationClick={() => triggerToast('You currently have zero active warning alerts.', 'info')}
          unreadNotifications={incidents.filter(i => i.level === 'CRITICAL' && i.status === 'INVESTIGATING').length}
        />

        {/* Viewport container body wrapper */}
        <main className="mt-16 flex-1 min-h-[calc(100vh-64px)] relative bg-[#fbf9f9]">
          
          {currentTab === 'dashboard' && (
            <DashboardView 
              metrics={metrics}
              failures={recentFailures}
              onSelectIncidentByService={handleSelectIncidentByService}
              onResolveInsight={handleResolveInsight}
              onGenerateReport={handleGenerateAIReport}
              onExportPDF={handleExportPDF}
              searchValue={searchValue}
            />
          )}

          {currentTab === 'incidents' && (
            <IncidentsView 
              incidents={incidents}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={setSelectedIncidentId}
              onDismissIncident={handleDismissIncident}
              onExecuteRemediation={handleExecuteRemediation}
              onPostGithubIssue={handlePostGithubIssue}
              searchValue={searchValue}
            />
          )}

          {currentTab === 'workflows' && (
            <WorkflowsView 
              nodes={workflowNodes}
              onApproveAction={handleApproveRollbackWorkflow}
              onExecuteNode={(id) => triggerToast(`Node focused: scanning node diagnostics logs`, 'info')}
              onResetWorkflow={handleResetWorkflow}
              systemStable={systemStable}
              onAddCustomNode={handleAddCustomNode}
            />
          )}

          {/* Secondary support views */}
          {['pipelines', 'analysis', 'kb', 'reports', 'settings'].includes(currentTab) && (
            <PlaceholderView tabId={currentTab} />
          )}

        </main>
      </div>

      {/* 3. Sliding Custom Toast Notifications Alert Element */}
      {toast && (
        <div 
          id="global-toast"
          className="fixed top-20 right-6 z-50 bg-[#1b1c1c] text-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_#22c55e] max-w-sm animate-fade-in font-mono text-[11px]"
        >
          <div className="flex justify-between items-start gap-4">
            <div>
              <span className="text-[9px] text-[#22c55e] font-bold block mb-1 uppercase tracking-wider">▲ SYSTEM ALERTER:</span>
              <p className="leading-relaxed">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="text-neutral-500 hover:text-white font-bold font-sans">
              ×
            </button>
          </div>
        </div>
      )}

      {/* 4. Action Remediating Script overlay */}
      {isRemediating && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-6 select-none animate-fade-in">
          <div className="bg-[#1b1c1c] text-neutral-200 border-2 border-white p-8 max-w-lg w-full font-mono text-xs shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3 border-b border-neutral-700 pb-3">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-ping" />
              <h3 className="font-bold text-red-500 uppercase tracking-widest text-[11px]">COGNITIVE AUTO-REMEDIATION ROUTINE</h3>
            </div>
            
            <p className="text-neutral-300 leading-normal mb-2 font-mono">
              {remediatingText}
            </p>

            <div className="w-full bg-neutral-800 h-2 overflow-hidden relative">
              <div className="absolute inset-y-0 left-0 bg-emerald-500 animate-[pulse_1s_infinite] w-2/3" />
            </div>

            <span className="text-[10px] text-neutral-500 text-right uppercase">DO NOT TERMINATE SHELL PROCESS</span>
          </div>
        </div>
      )}

      {/* 5. Deploying Agent terminal compile overlay */}
      {showDeploymentModal && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 p-6 select-none animate-fade-in">
          <div className="bg-[#1b1c1c] text-neutral-200 border-2 border-white p-8 max-w-md w-full font-mono text-xs shadow-2xl flex flex-col gap-4">
            <div className="flex justify-between items-center bg-[#303031] -mx-8 -mt-8 px-6 py-2 border-b border-neutral-800 text-neutral-400 font-bold select-none text-[10px]">
              <span>COMPILE AGENT BLUEPRINT v2.4</span>
              <span>HOST: PORT:3000</span>
            </div>

            <div className="space-y-2 pt-4">
              <p className="text-neutral-400">{"[13:07:15]"} INITIATING DEPLOYMENT OF AUTONOMOUS ENGINE...</p>
              {deployStep >= 2 && <p className="text-[#38bdf8]">{"[13:07:16]"} + LOADING COGNITIVE AGENT MODULES...</p>}
              {deployStep >= 3 && <p className="text-[#38bdf8]">{"[13:07:18]"} + MAPPING CLOUD TELEMETRY WRITERS...</p>}
              {deployStep >= 4 && <p className="text-emerald-400 font-bold">{"[13:07:19]"} ✓ AGENT RUNTIME ONLINE & DEPLOYED!</p>}
            </div>

            <div className="mt-4 flex justify-end">
              <span className="text-[9px] text-neutral-600">PREPARING TO LAUNCH INCIDENT TROUBLESHOOTING</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. AI Insights Report view portal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6 animate-fade-in select-text">
          <div className="bg-[#fbf9f9] border border-black p-8 w-full max-w-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative">
            <button 
              onClick={() => setShowReportModal(false)}
              className="absolute top-6 right-6 p-1 border border-black bg-white hover:bg-black hover:text-white transition-colors cursor-pointer active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-6 flex gap-2 items-center">
              <Sparkles className="w-5 h-5 text-black" />
              <h3 className="font-extrabold uppercase text-sm tracking-widest text-black">Generated Autonomous Operational Report</h3>
            </div>

            <div className="font-mono text-[11px] bg-[#e9e8e7] text-black border border-black p-4 overflow-y-auto h-80 leading-relaxed whitespace-pre-wrap">
              {reportText}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(reportText);
                  triggerToast('AI Report copied to keyboard buffer!', 'success');
                }}
                className="px-6 py-2.5 bg-black text-white border border-black text-xs font-bold uppercase hover:bg-white hover:text-black transition-all cursor-pointer active:scale-95"
              >
                Copy Content
              </button>
              <button
                onClick={() => setShowReportModal(false)}
                className="px-6 py-2.5 border border-black bg-white text-black text-xs font-bold uppercase hover:bg-neutral-100 transition-all cursor-pointer active:scale-95"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Advanced Custom Node Builder Dialog Modal */}
      {showAddNodeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6 animate-fade-in select-none">
          <form 
            onSubmit={submitAddCustomNode}
            className="bg-white border border-black p-8 w-full max-w-md shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-5"
          >
            <div className="flex justify-between items-center border-b border-neutral-200 pb-3">
              <h3 className="font-extrabold text-xs uppercase tracking-widest text-black">Integrate Custom Agent Node</h3>
              <button 
                type="button"
                onClick={() => setShowAddNodeModal(false)}
                className="text-neutral-500 hover:text-black font-extrabold font-sans"
              >
                ×
              </button>
            </div>

            {/* Input name */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Node / Agent Name</label>
              <input
                type="text"
                required
                value={customNodeName}
                onChange={(e) => setCustomNodeName(e.target.value)}
                placeholder="E.g. Security Auditor Agent"
                className="w-full bg-neutral-50 border border-neutral-300 p-2 text-xs focus:ring-1 focus:ring-black focus:outline-none"
              />
            </div>

            {/* Input specialty */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Specialty / LLM Mappings</label>
              <input
                type="text"
                value={customNodeSpecialization}
                onChange={(e) => setCustomNodeSpecialization(e.target.value)}
                placeholder="E.g. Auth0-Token-Auditor"
                className="w-full bg-neutral-50 border border-neutral-300 p-2 text-xs focus:ring-1 focus:ring-black focus:outline-none"
              />
            </div>

            {/* Selector mode type */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Agent Role Type</label>
              <select
                value={customNodeType}
                onChange={(e) => setCustomNodeType(e.target.value as any)}
                className="w-full bg-neutral-50 border border-neutral-300 p-2 text-xs focus:ring-1 focus:ring-black focus:outline-none uppercase font-mono text-[10px]"
              >
                <option value="agent">AGENT DEVIATOR PROCESS</option>
                <option value="trigger">TRIGGER SENSOR NODE</option>
                <option value="resolution">SLACK/API RESOLVER</option>
              </select>
            </div>

            {/* Action submission buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddNodeModal(false)}
                className="px-4 py-2 border border-neutral-300 bg-white text-neutral-500 text-xs font-bold uppercase hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-black text-white border border-black text-xs font-bold uppercase hover:bg-white hover:text-black transition-all cursor-pointer"
              >
                Add Node to Blueprint
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
