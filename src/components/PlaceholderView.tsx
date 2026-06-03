import { Cpu, Terminal, Hammer, ArrowRight, Settings, BookOpen, GitBranch, BarChart3, Brain } from 'lucide-react';

interface PlaceholderViewProps {
  tabId: string;
}

export default function PlaceholderView({ tabId }: PlaceholderViewProps) {
  
  const getTabDetails = () => {
    switch (tabId) {
      case 'pipelines':
        return {
          title: 'CI/CD Pipelines Monitor',
          description: 'Autonomous deployment orchestration and container delivery pipeline verification console.',
          icon: <GitBranch className="w-12 h-12 text-black" />,
          details: 'All automated delivery pipelines are currently in NOMINAL status. Zero active blocking events.'
        };
      case 'analysis':
        return {
          title: 'AI Forensic Core Engine',
          description: 'Autonomous anomaly parsing and database performance troubleshooting agent sandbox.',
          icon: <Brain className="w-12 h-12 text-black" />,
          details: 'AI Agent is actively monitoring telemetry lines. Confidence limit configured at 75% threshold.'
        };
      case 'kb':
        return {
          title: 'DevOps Knowledge Base',
          description: 'Self-healing playbooks, team runbooks, and autonomous remediation history trace repository.',
          icon: <BookOpen className="w-12 h-12 text-black" />,
          details: 'Indexed 12 active playbooks. Last updated automatically 2 hours ago from GitHub documentation.'
        };
      case 'reports':
        return {
          title: 'System Performance Reports',
          description: 'Export executive reports, MTTR summaries, and automated resolution efficiency trackers.',
          icon: <BarChart3 className="w-12 h-12 text-black" />,
          details: 'Monthly average recovery time decreased by 14% due to autonomous Agent workflows.'
        };
      case 'settings':
        return {
          title: 'DevOps Copilot Settings',
          description: 'Configure prompt thresholds, active service integrations, and client credentials.',
          icon: <Settings className="w-12 h-12 text-black" />,
          details: 'Autonomous action policy limits: P1 auto-approve threshold 80% confidence level.'
        };
      default:
        return {
          title: 'System Modules Core',
          description: 'Auxiliary DevOps module under automated maintenance.',
          icon: <Hammer className="w-12 h-12 text-black" />,
          details: 'Initializing remote cluster nodes.'
        };
    }
  };

  const details = getTabDetails();

  return (
    <div className="p-12 max-w-4xl animate-fade-in font-sans">
      <div className="mb-8">
        <span className="text-[10px] tracking-widest uppercase font-bold text-neutral-500 mb-2 block">
          AUXILIARY RETRIEVING MODULE
        </span>
        <h2 className="text-4xl font-extrabold tracking-tighter uppercase text-black">
          {details.title}
        </h2>
      </div>

      <div className="border border-black p-8 bg-white shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] space-y-6">
        
        <div className="flex items-start gap-4">
          <div className="bg-neutral-100 p-3 border border-black shadow-[2px_2px_0px_0px_#000]">
            {details.icon}
          </div>
          <div>
            <p className="text-sm text-neutral-600 leading-relaxed font-sans font-medium">
              {details.description}
            </p>
          </div>
        </div>

        <div className="bg-black text-white p-4 font-mono text-xs border-l-4 border-neutral-400">
          <span className="text-neutral-500 uppercase font-bold block mb-1">MODULE FEED:</span>
          {details.details}
        </div>

        <div className="flex justify-end pt-2">
          <button className="flex items-center gap-2 px-6 py-2.5 bg-black text-white border border-black font-sans text-xs font-bold uppercase transition-all duration-200 hover:bg-white hover:text-black hover:shadow-[3px_3px_0px_0px_#000] cursor-pointer active:scale-95">
            Initialize Module Integration
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
