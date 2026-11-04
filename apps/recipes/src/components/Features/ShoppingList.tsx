import { useState, useEffect } from 'react';
import { ShoppingCart, ChevronDown, ChevronUp, Check, RefreshCw, Store, UtensilsCrossed, Settings } from 'lucide-react';
import { Card, CardHeader, CardContent } from '../UI';
import { api } from '../../services/api';
import type { ShoppingListLineItem, StoreResponse } from '../../types/api';
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

export function ShoppingList() {
  const [items, setItems] = useState<ShoppingListLineItem[]>([]);
  const [conversions, setConversions] = useState<string[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [storeModalOpen, setStoreModalOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [listResponse, storeResponse] = await Promise.all([
        api.getShoppingList(),
        api.listStores(),
      ]);
      setItems(listResponse.items);
      setConversions(listResponse.conversions_applied);
      setStores(storeResponse.stores);
    } catch (err) {
      console.error('Failed to load shopping list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExpanded = (key: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleDone = async (item: ShoppingListLineItem) => {
    const newDone = !item.is_done;
    try {
      if (item.ingredient_id != null) {
        await api.updateIngredient(item.ingredient_id, { is_purchased: newDone });
      } else if (item.item_id != null) {
        await api.toggleShoppingItem(item.item_id);
      } else {
        return;
      }
      setItems(prev => prev.map(i =>
        i.key === item.key ? { ...i, is_done: newDone } : i
      ));
    } catch (err) {
      console.error('Failed to update item status:', err);
    }
  };

  const handleStoreChange = async (item: ShoppingListLineItem, storeId: number | null) => {
    try {
      if (item.ingredient_id != null) {
        await api.updateIngredient(item.ingredient_id, { store_id: storeId ?? undefined });
      } else if (item.item_id != null) {
        await api.updateShoppingItem(item.item_id, { store_id: storeId ?? 0 });
      }
      setItems(prev => prev.map(i =>
        i.key === item.key ? { ...i, store_id: storeId } : i
      ));
    } catch (err) {
      console.error('Failed to update store:', err);
    }
  };

  // Group by store
  const getStoreName = (storeId: number | null) => {
    if (!storeId) return 'No Store Assigned';
    const store = stores.find(s => s.id === storeId);
    return store?.name || 'No Store Assigned';
  };

  const byStore = items.reduce((acc, item) => {
    const storeName = getStoreName(item.store_id);
    if (!acc[storeName]) acc[storeName] = [];
    acc[storeName].push(item);
    return acc;
  }, {} as Record<string, ShoppingListLineItem[]>);

  const doneCount = items.filter(i => i.is_done).length;
  const totalCount = items.length;

  const formatQty = (qty: number | null) => {
    if (qty == null) return '—';
    return Number.isInteger(qty) ? qty : parseFloat(qty.toFixed(2));
  };

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
              <button onClick={fetchData} className={`bg-transparent border-none text-gold cursor-pointer p-1.5 sm:p-1 opacity-70 transition-all duration-200 hover:opacity-100 active:opacity-100 ${loading ? 'animate-spin' : ''}`} title="Refresh">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && items.length === 0 ? (
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Loading skeleton */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="loading-shimmer bg-white/5 rounded-xl border border-white/10 h-14 sm:h-16" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center text-snow/60 py-8 sm:py-12 px-4 text-sm italic animate-fade-in">
              <p>No items yet! Add dishes to your menu to build your shopping list.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5 sm:gap-2 mb-4 sm:mb-6 animate-fade-in">
                <div className="h-2 bg-white/10 rounded overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-holly to-gold rounded transition-all duration-500 ease-out"
                    style={{ width: `${(doneCount / totalCount) * 100}%`, boxShadow: '0 0 10px rgba(232, 185, 35, 0.5)' }}
                  />
                </div>
                <span className="text-xs sm:text-sm text-snow/60 text-right">
                  {doneCount} of {totalCount} items done
                </span>
              </div>

              <div className="flex flex-col gap-4 sm:gap-6">
                {Object.entries(byStore).map(([store, storeItems], storeIndex) => (
                  <div key={store} className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl p-3 sm:p-4 animate-fade-in" style={{ animationDelay: `${storeIndex * 0.1}s` }}>
                    <h3 className="flex items-center gap-2 text-base sm:text-lg text-gold m-0 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-dashed border-gold/30">
                      <Store size={14} className="sm:w-4 sm:h-4" /> {store}
                      <span className="text-xs sm:text-sm text-snow/60 font-normal ml-1">({storeItems.length})</span>
                    </h3>
                    <div className="flex flex-col gap-2">
                      {storeItems.map((item, itemIndex) => {
                        const isExpanded = expandedItems.has(item.key);
                        const isDone = item.is_done;

                        return (
                          <div
                            key={item.key}
                            className={`animate-slide-in bg-white/5 border border-white/10 rounded-lg overflow-hidden transition-all duration-300 ${isDone ? 'opacity-60' : ''}`}
                            style={{ animationDelay: `${(storeIndex * 0.1) + (itemIndex * 0.03)}s` }}
                          >
                            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3">
                              <button
                                className={`flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 bg-holly/20 border-2 border-holly/40 rounded-md text-holly cursor-pointer transition-all duration-200 shrink-0 hover:bg-holly/30 hover:border-holly active:bg-holly/40 ${isDone ? 'bg-holly/40 border-holly' : ''}`}
                                onClick={() => toggleDone(item)}
                              >
                                {isDone ? (
                                  <Check size={16} className="sm:w-[18px] sm:h-[18px] animate-check-pop" />
                                ) : (
                                  <span className="block w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                )}
                              </button>

                              <div
                                className="flex-1 flex items-center gap-2 sm:gap-4 cursor-pointer flex-wrap"
                                onClick={() => toggleExpanded(item.key)}
                              >
                                <span className={`font-medium text-snow text-sm sm:text-base ${isDone ? 'line-through text-snow/50' : ''}`}>
                                  {toTitleCase(item.name)}
                                </span>
                                <span className="font-display text-gold font-semibold text-sm sm:text-base" style={{ textShadow: '0 0 8px rgba(232, 185, 35, 0.3)' }}>
                                  {formatQty(item.quantity)}{item.unit ? ` ${item.unit}` : ''}
                                </span>
                                <span className="text-xs text-snow/50 italic hidden sm:inline">
                                  from {item.contributions.length} source{item.contributions.length !== 1 ? 's' : ''}
                                </span>
                              </div>

                              <select
                                className="hidden sm:block px-2 sm:px-2.5 py-1.5 border border-white/20 rounded bg-black/40 text-snow text-xs cursor-pointer min-w-[80px] sm:min-w-[100px] transition-all duration-200 hover:border-gold/50 focus:outline-none focus:border-gold"
                                value={item.store_id || ''}
                                onChange={(e) => handleStoreChange(
                                  item,
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
                                onClick={() => toggleExpanded(item.key)}
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
                                    value={item.store_id || ''}
                                    onChange={(e) => handleStoreChange(
                                      item,
                                      e.target.value ? parseInt(e.target.value) : null
                                    )}
                                  >
                                    <option value="">No store</option>
                                    {stores.map((s) => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                  </select>
                                </div>
                                {item.contributions.map((contrib, contribIndex) => (
                                  <div key={`${item.key}-${contribIndex}`} className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-snow/60 animate-slide-in" style={{ animationDelay: `${contribIndex * 0.05}s` }}>
                                    <UtensilsCrossed size={12} className="sm:w-3.5 sm:h-3.5 text-holly opacity-70 shrink-0" />
                                    <span className="text-snow/90 font-medium">{contrib.dish_name}</span>
                                    <span className="text-gold ml-auto">
                                      {formatQty(contrib.quantity)}{contrib.unit ? ` ${contrib.unit}` : ''}
                                    </span>
                                    {contrib.notes && (
                                      <span className="italic text-xs text-snow/50 w-full sm:w-auto">({contrib.notes})</span>
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

              {conversions.length > 0 && (
                <div className="mt-4 text-xs text-snow/40 italic">
                  Unit conversions applied: {conversions.join('; ')}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <StoreManagerModal
        isOpen={storeModalOpen}
        onClose={() => setStoreModalOpen(false)}
        onStoresChanged={fetchData}
      />
    </div>
  );
}
