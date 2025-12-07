import { useState, useEffect } from 'react';
import { ShoppingCart, ChevronDown, ChevronUp, Check, RefreshCw, Store, UtensilsCrossed, Settings } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../UI';
import { api } from '../../services/api';
import type { DishResponse, IngredientResponse, StoreResponse } from '../../types/api';
import { StoreManagerModal } from './StoreManagerModal';
import { toTitleCase } from '../../utils/formatters';

// CSS for animations
const animationStyles = `
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes checkPop {
  0% { transform: scale(0.8); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.animate-slide-in {
  animation: slideIn 0.3s ease-out forwards;
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

.loading-shimmer {
  background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

.animate-check-pop {
  animation: checkPop 0.3s ease-out;
}
`;

// Consolidated ingredient with all instances across dishes
interface ConsolidatedIngredient {
  ingredient: IngredientResponse;
  totalQuantity: number;
  instances: {
    dishId: number;
    dishName: string;
    quantity: number;
    notes: string | null;
    instanceId: number;
  }[];
}

export function ShoppingList() {
  const [consolidated, setConsolidated] = useState<ConsolidatedIngredient[]>([]);
  const [expandedIngredients, setExpandedIngredients] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [storeModalOpen, setStoreModalOpen] = useState(false);

  // Load dishes, stores, and consolidate ingredients
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dishResponse, storeResponse] = await Promise.all([
          api.listDishes(),
          api.listStores(),
        ]);
        setStores(storeResponse.stores);
        consolidateIngredients(dishResponse.dishes);
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const consolidateIngredients = (dishList: DishResponse[]) => {
    const ingredientMap = new Map<number, ConsolidatedIngredient>();

    dishList.forEach(dish => {
      dish.ingredient_instances.forEach(instance => {
        const ingredientId = instance.ingredient.id;
        if (!ingredientMap.has(ingredientId)) {
          ingredientMap.set(ingredientId, {
            ingredient: instance.ingredient,
            totalQuantity: 0,
            instances: [],
          });
        }
        const consolidated = ingredientMap.get(ingredientId)!;
        consolidated.totalQuantity += instance.quantity;
        consolidated.instances.push({
          dishId: dish.id,
          dishName: dish.name,
          quantity: instance.quantity,
          notes: instance.notes,
          instanceId: instance.id,
        });
      });
    });

    // Sort by ingredient name
    const sorted = Array.from(ingredientMap.values()).sort((a, b) =>
      a.ingredient.name.localeCompare(b.ingredient.name)
    );
    setConsolidated(sorted);
  };

  const refreshData = async () => {
    setLoading(true);
    try {
      const [dishResponse, storeResponse] = await Promise.all([
        api.listDishes(),
        api.listStores(),
      ]);
      setStores(storeResponse.stores);
      consolidateIngredients(dishResponse.dishes);
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (ingredientId: number) => {
    setExpandedIngredients(prev => {
      const next = new Set(prev);
      if (next.has(ingredientId)) next.delete(ingredientId);
      else next.add(ingredientId);
      return next;
    });
  };

  const togglePurchased = async (ingredientId: number) => {
    const item = consolidated.find(c => c.ingredient.id === ingredientId);
    if (!item) return;

    const newPurchased = !item.ingredient.is_purchased;
    try {
      await api.updateIngredient(ingredientId, { is_purchased: newPurchased });
      // Update local state
      setConsolidated(prev => prev.map(c =>
        c.ingredient.id === ingredientId
          ? { ...c, ingredient: { ...c.ingredient, is_purchased: newPurchased } }
          : c
      ));
    } catch (err) {
      console.error('Failed to update purchased status:', err);
    }
  };

  const handleStoreChange = async (ingredientId: number, storeId: number | null) => {
    try {
      await api.updateIngredient(ingredientId, { store_id: storeId ?? undefined });
      await refreshData();
    } catch (err) {
      console.error('Failed to update store:', err);
    }
  };

  // Group by store
  const getStoreName = (storeId: number | undefined) => {
    if (!storeId) return 'No Store Assigned';
    const store = stores.find(s => s.id === storeId);
    return store?.name || 'No Store Assigned';
  };

  const byStore = consolidated.reduce((acc, item) => {
    const storeName = getStoreName(item.ingredient.store_id);
    if (!acc[storeName]) acc[storeName] = [];
    acc[storeName].push(item);
    return acc;
  }, {} as Record<string, ConsolidatedIngredient[]>);

  const purchasedCount = consolidated.filter(c => c.ingredient.is_purchased).length;
  const totalCount = consolidated.length;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <style>{animationStyles}</style>
      <Card variant="festive">
        <CardHeader icon={<ShoppingCart size={18} className="sm:w-5 sm:h-5" />} className="w-full" >
          <div className='flex flex-row items-center justify-between w-full gap-2 sm:gap-8'>
            <div className='font-bold text-sm sm:text-base'>Shopping List</div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button onClick={() => setStoreModalOpen(true)} className="flex items-center gap-1 bg-gold/10 border border-gold/30 text-gold cursor-pointer px-2 sm:px-2.5 py-1.5 rounded text-xs transition-all duration-200 hover:bg-gold/20 hover:border-gold active:bg-gold/30" title="Manage Stores">
                <Settings size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Stores</span>
              </button>
              <button onClick={refreshData} className={`bg-transparent border-none text-gold cursor-pointer p-1.5 sm:p-1 opacity-70 transition-all duration-200 hover:opacity-100 active:opacity-100 ${loading ? 'animate-spin' : ''}`} title="Refresh">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && consolidated.length === 0 ? (
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Loading skeleton */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="loading-shimmer bg-white/5 rounded-xl border border-white/10 h-14 sm:h-16" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : consolidated.length === 0 ? (
            <div className="text-center text-snow/60 py-8 sm:py-12 px-4 text-sm italic animate-fade-in">
              <p>No ingredients yet! Add dishes to your Holiday Menu to build your shopping list. 🎄</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5 sm:gap-2 mb-4 sm:mb-6 animate-fade-in">
                <div className="h-2 bg-white/10 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-holly to-gold rounded transition-all duration-500 ease-out"
                    style={{ width: `${(purchasedCount / totalCount) * 100}%`, boxShadow: '0 0 10px rgba(232, 185, 35, 0.5)' }}
                  />
                </div>
                <span className="text-xs sm:text-sm text-snow/60 text-right">
                  {purchasedCount} of {totalCount} items purchased
                </span>
              </div>

              <div className="flex flex-col gap-4 sm:gap-6">
                {Object.entries(byStore).map(([store, items], storeIndex) => (
                  <div key={store} className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4 animate-fade-in" style={{ animationDelay: `${storeIndex * 0.1}s` }}>
                    <h3 className="flex items-center gap-2 text-base sm:text-lg text-gold m-0 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-dashed border-gold/30">
                      <Store size={14} className="sm:w-4 sm:h-4" /> {store}
                      <span className="text-xs sm:text-sm text-snow/60 font-normal ml-1">({items.length})</span>
                    </h3>
                    <div className="flex flex-col gap-2">
                      {items.map((item, itemIndex) => {
                        const isExpanded = expandedIngredients.has(item.ingredient.id);
                        const isPurchased = item.ingredient.is_purchased;

                        return (
                          <div
                            key={item.ingredient.id}
                            className={`animate-slide-in bg-white/5 border border-white/10 rounded-lg overflow-hidden transition-all duration-300 ${isPurchased ? 'opacity-60' : ''}`}
                            style={{ animationDelay: `${(storeIndex * 0.1) + (itemIndex * 0.03)}s` }}
                          >
                            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3">
                              <button
                                className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-holly/20 border-2 border-holly/40 rounded-md text-holly cursor-pointer transition-all duration-200 shrink-0 hover:bg-holly/30 hover:border-holly active:bg-holly/40 ${isPurchased ? 'bg-holly/40 border-holly' : ''}`}
                                onClick={() => togglePurchased(item.ingredient.id)}
                              >
                                {isPurchased ? (
                                  <Check size={16} className="sm:w-[18px] sm:h-[18px] animate-check-pop" />
                                ) : (
                                  <span className="block w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                )}
                              </button>

                              <div
                                className="flex-1 flex items-center gap-2 sm:gap-4 cursor-pointer flex-wrap"
                                onClick={() => toggleExpanded(item.ingredient.id)}
                              >
                                <span className={`font-medium text-snow text-sm sm:text-base ${isPurchased ? 'line-through text-snow/50' : ''}`}>
                                  {toTitleCase(item.ingredient.name)}
                                </span>
                                <span className="font-display text-gold font-semibold text-sm sm:text-base" style={{ textShadow: '0 0 8px rgba(232, 185, 35, 0.3)' }}>
                                  {item.totalQuantity} {item.ingredient.unit}
                                </span>
                                <span className="text-xs text-snow/50 italic hidden sm:inline">
                                  from {item.instances.length} dish{item.instances.length !== 1 ? 'es' : ''}
                                </span>
                              </div>

                              <select
                                className="hidden sm:block px-2 sm:px-2.5 py-1.5 border border-white/20 rounded bg-black/40 text-snow text-xs cursor-pointer min-w-[80px] sm:min-w-[100px] transition-all duration-200 hover:border-gold/50 focus:outline-none focus:border-gold"
                                value={item.ingredient.store_id || ''}
                                onChange={(e) => handleStoreChange(
                                  item.ingredient.id,
                                  e.target.value ? parseInt(e.target.value) : null
                                )}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <option value="">No store</option>
                                {stores.map((s) => (
                                  <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                              </select>

                              <button
                                className="flex items-center justify-center p-1 sm:p-1.5 bg-transparent border-none text-snow/50 cursor-pointer transition-all duration-200 hover:text-gold active:text-gold"
                                onClick={() => toggleExpanded(item.ingredient.id)}
                              >
                                {isExpanded ? <ChevronUp size={16} className="sm:w-[18px] sm:h-[18px]" /> : <ChevronDown size={16} className="sm:w-[18px] sm:h-[18px]" />}
                              </button>
                            </div>

                            {isExpanded && (
                              <div className="bg-white/5 border-t border-white/10 px-3 sm:px-4 py-2.5 sm:py-3 pl-10 sm:pl-14 flex flex-col gap-2 animate-fade-in">
                                {/* Mobile store selector */}
                                <div className="sm:hidden flex items-center gap-2 pb-2 mb-2 border-b border-white/10">
                                  <span className="text-xs text-snow/60">Store:</span>
                                  <select
                                    className="flex-1 px-2 py-1.5 border border-white/20 rounded bg-black/40 text-snow text-xs cursor-pointer transition-all duration-200 hover:border-gold/50 focus:outline-none focus:border-gold"
                                    value={item.ingredient.store_id || ''}
                                    onChange={(e) => handleStoreChange(
                                      item.ingredient.id,
                                      e.target.value ? parseInt(e.target.value) : null
                                    )}
                                  >
                                    <option value="">No store</option>
                                    {stores.map((s) => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                  </select>
                                </div>
                                {item.instances.map((inst, instIndex) => (
                                  <div key={inst.instanceId} className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-snow/60 animate-slide-in" style={{ animationDelay: `${instIndex * 0.05}s` }}>
                                    <UtensilsCrossed size={12} className="sm:w-3.5 sm:h-3.5 text-holly opacity-70 shrink-0" />
                                    <span className="text-snow/90 font-medium">{inst.dishName}</span>
                                    <span className="text-gold ml-auto">
                                      {inst.quantity} {item.ingredient.unit}
                                    </span>
                                    {inst.notes && (
                                      <span className="italic text-xs text-snow/50 w-full sm:w-auto">({inst.notes})</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <StoreManagerModal
        isOpen={storeModalOpen}
        onClose={() => setStoreModalOpen(false)}
        onStoresChanged={refreshData}
      />
    </div>
  );
}
