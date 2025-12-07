import { UtensilsCrossed, ShoppingCart } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'dishes', label: 'Holiday Menu', shortLabel: 'Menu', icon: UtensilsCrossed },
  { id: 'shopping', label: 'Shopping List', shortLabel: 'Shopping', icon: ShoppingCart },
];

export function Navigation({ activeTab, onTabChange }: NavigationProps) {
  return (
    <nav className="bg-black/60 backdrop-blur-md border-b border-gold/20 sticky top-0 z-[100]"
      style={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)' }}>
      <div className="max-w-[1200px] mx-auto flex gap-2 px-3 py-2 sm:px-6 sm:py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-6 sm:py-2 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base
                ${isActive
                  ? 'bg-gradient-to-br from-cranberry/80 to-cranberry-dark/80 text-snow border border-gold/30'
                  : 'bg-white/5 text-snow/70 border border-white/10 hover:bg-white/10 hover:text-gold hover:border-gold/30 active:bg-white/20'
                }`}
              style={isActive ? { boxShadow: '0 0 20px rgba(166, 61, 64, 0.4), inset 0 0 20px rgba(232, 185, 35, 0.1)' } : {}}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon size={18} className="sm:w-5 sm:h-5" style={isActive ? { filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.5))' } : {}} />
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

