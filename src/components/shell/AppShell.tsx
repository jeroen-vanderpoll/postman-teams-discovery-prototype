import { Search, Bell, Settings, HelpCircle, ChevronDown } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="h-9 border-b border-gray-200 flex items-center px-3 gap-3 flex-shrink-0 bg-white z-40">
        {/* Left: Logo + Workspaces */}
        <div className="flex items-center gap-1 min-w-0">
          <div className="w-5 h-5 flex-shrink-0">
            <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <circle cx="16" cy="16" r="16" fill="#FF6C37"/>
              <path d="M21.5 10.5L14 18l-3.5-3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <button className="flex items-center gap-0.5 text-xs font-medium text-gray-800 hover:text-gray-900 px-1.5 py-0.5 rounded hover:bg-gray-100">
            Workspaces
            <ChevronDown size={11} className="text-gray-500" />
          </button>
        </div>

        {/* Center: Search */}
        <div className="flex-1 flex justify-center">
          <div className="relative w-full max-w-sm">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-7 pr-3 py-1 text-xs border border-gray-200 rounded bg-gray-50 placeholder-gray-400 outline-none focus:border-gray-400 focus:bg-white"
            />
          </div>
        </div>

        {/* Right: Icons */}
        <div className="flex items-center gap-1">
          <button className="relative p-1 rounded hover:bg-gray-100 text-gray-500">
            <Bell size={14} />
            <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-postman-orange rounded-full" />
          </button>
          <button className="p-1 rounded hover:bg-gray-100 text-gray-500">
            <Settings size={14} />
          </button>
          <button className="p-1 rounded hover:bg-gray-100 text-gray-500">
            <HelpCircle size={14} />
          </button>
          <div className="w-6 h-6 rounded-full bg-postman-orange text-white text-2xs font-bold flex items-center justify-center ml-1">
            JD
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
