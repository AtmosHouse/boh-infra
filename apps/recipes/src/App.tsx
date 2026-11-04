import { useState } from 'react';
import { UtensilsCrossed, ShoppingCart } from 'lucide-react';
import { DishManager, ShoppingList } from './components/Features';

const tabs = [
  { id: 'dishes', label: 'Menu', icon: UtensilsCrossed },
  { id: 'shopping', label: 'Shopping List', icon: ShoppingCart },
] as const;

type TabId = (typeof tabs)[number]['id'];

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('dishes');

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      <header className="border-b border-white/10 px-4 py-4 sm:px-6">
        <h1 className="text-lg sm:text-xl font-semibold text-zinc-100 tracking-wide">
          Recipe Planner
        </h1>
      </header>

      <nav className="bg-black/60 border-b border-white/10 sticky top-0 z-[100]">
        <div className="max-w-[1200px] mx-auto flex gap-2 px-3 py-2 sm:px-6 sm:py-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-6 sm:py-2 rounded-lg font-medium transition-colors text-sm sm:text-base
                  ${isActive
                    ? 'bg-zinc-700 text-zinc-50 border border-zinc-500'
                    : 'bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-zinc-200'
                  }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} className="sm:w-5 sm:h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 py-4 sm:py-8 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto">
          {activeTab === 'dishes' ? <DishManager /> : <ShoppingList />}
        </div>
      </main>
    </div>
  );
}

export default App;
