import { 
  LayoutDashboard, 
  AlertTriangle, 
  GitBranch, 
  Brain, 
  BookOpen, 
  Bot, 
  BarChart3, 
  Settings 
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onDeployClick: () => void;
  deploying: boolean;
  incidentCount: number;
}

export default function Sidebar({ 
  currentTab, 
  onTabChange, 
  onDeployClick, 
  deploying,
  incidentCount 
}: SidebarProps) {
  
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'incidents', label: 'Incidents', icon: AlertTriangle, badge: incidentCount > 0 ? incidentCount : undefined },
    { id: 'pipelines', label: 'Pipelines', icon: GitBranch },
    { id: 'analysis', label: 'AI Analysis', icon: Brain },
    { id: 'kb', label: 'Knowledge Base', icon: BookOpen },
    { id: 'workflows', label: 'Agent Workflows', icon: Bot },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside id="app-sidebar" className="fixed left-0 top-0 h-screen w-64 flex flex-col border-r border-black bg-[#fbf9f9] z-50">
      {/* Brand area */}
      <div className="p-6 border-b border-black flex flex-col gap-1 bg-[#fbf9f9]">
        <span className="text-xl font-extrabold text-black tracking-tighter uppercase whitespace-nowrap">
          DevOps Copilot
        </span>
        <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">
          AI Operations
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 select-none">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = currentTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  id={`tab-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors duration-150 group text-left cursor-pointer ${
                    isActive 
                      ? 'bg-black text-white hover:bg-neutral-900' 
                      : 'text-neutral-600 hover:bg-neutral-200/60 hover:text-black'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className={`w-5 h-5 transition-transform duration-100 group-hover:scale-105 ${isActive ? 'text-white' : 'text-neutral-500 group-hover:text-black'}`} />
                    <span className="text-xs font-bold uppercase tracking-wider font-sans">{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white text-black' : 'bg-black text-white'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer Deploy Agent Button */}
      <div className="p-6 border-t border-black bg-[#fbf9f9]">
        <button
          id="btn-deploy-agent"
          disabled={deploying}
          onClick={onDeployClick}
          className={`w-full text-xs font-bold uppercase tracking-widest py-3 border border-black transition-all duration-200 active:scale-95 disabled:pointer-events-none ${
            deploying 
              ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed border-neutral-300' 
              : 'bg-black text-white hover:bg-[#fbf9f9] hover:text-black hover:shadow-[4px_4px_0px_0px_#000000]'
          }`}
        >
          {deploying ? 'Deploying Agent...' : 'Deploy Agent'}
        </button>
      </div>
    </aside>
  );
}
