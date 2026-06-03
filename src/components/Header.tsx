import { Search, Bell, HelpCircle } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  searchValue: string;
  onSearchChange: (val: string) => void;
  onSupportClick: () => void;
  onHelpClick: () => void;
  onNotificationClick: () => void;
  unreadNotifications: number;
}

export default function Header({
  currentTab,
  searchValue,
  onSearchChange,
  onSupportClick,
  onHelpClick,
  onNotificationClick,
  unreadNotifications
}: HeaderProps) {
  
  // Custom placeholder depending on the active tab
  const getSearchPlaceholder = () => {
    switch (currentTab) {
      case 'dashboard':
        return 'Search operations, agents, or logs...';
      case 'incidents':
        return 'Search incidents, traces, or logs...';
      case 'workflows':
        return 'Search workflow components...';
      default:
        return 'Search DevOps Copilot...';
    }
  };

  return (
    <header id="app-header" className="fixed top-0 right-0 left-64 h-16 bg-[#fbf9f9] border-b border-black flex justify-between items-center px-6 z-40">
      
      {/* Search Input Box */}
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96 group">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            <Search className="w-5 h-5 text-neutral-400 group-focus-within:text-black transition-colors" />
          </span>
          <input
            id="global-search"
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-[#f5f3f3] border border-black px-10 py-1.5 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-black placeholder-neutral-400 text-black placeholder:font-sans"
            placeholder={getSearchPlaceholder()}
          />
          {searchValue && (
            <button 
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-neutral-400 hover:text-black"
            >
              clear
            </button>
          )}
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-6">
        <button
          id="btn-header-support"
          onClick={onSupportClick}
          className="text-xs uppercase tracking-wider font-bold text-neutral-500 hover:text-black cursor-pointer hover:underline"
        >
          Support
        </button>
        
        <div className="flex gap-4">
          <button
            id="btn-header-notifications"
            onClick={onNotificationClick}
            className="relative text-neutral-500 hover:text-black transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5 text-neutral-500" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-600 rounded-full animate-ping" />
            )}
          </button>
          
          <button
            id="btn-header-help"
            onClick={onHelpClick}
            className="text-neutral-500 hover:text-black transition-colors cursor-pointer"
          >
            <HelpCircle className="w-5 h-5 text-neutral-500" />
          </button>
        </div>
        
        {/* User Badge */}
        <div className="w-8 h-8 bg-black flex items-center justify-center select-none shadow-[2px_2px_0px_0px_#000000_inset]">
          <span className="text-[10px] text-white font-extrabold tracking-wider">JD</span>
        </div>
      </div>
    </header>
  );
}
