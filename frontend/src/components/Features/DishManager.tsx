import { useState, useEffect } from 'react';
import {
  UtensilsCrossed, Plus, Trash2, ExternalLink,
  ChevronDown, ChevronUp, Users, Edit2, Soup, Salad,
  Beef, Cookie, Wine, Coffee, Sparkles, GripVertical
} from 'lucide-react';
import { Card, CardHeader, CardContent, Button, ConfirmModal } from '../UI';
import { CreateDishModal } from './CreateDishModal';
import { EditDishModal } from './EditDishModal';
import { EditIngredientModal } from './EditIngredientModal';
import api from '../../services/api';
import type { DishResponse, CourseType, DishIngredientResponse, IngredientResponse } from '../../types/api';
import { COURSE_LABELS } from '../../types/api';
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

@keyframes slideOut {
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-10px);
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
`;

const COURSE_ORDER: CourseType[] = [
  'appetizer', 'soup', 'salad', 'main', 'side', 'dessert', 'beverage', 'other'
];

// Course icons for visual distinction
const COURSE_ICONS: Record<CourseType, React.ReactNode> = {
  appetizer: <Sparkles size={18} />,
  soup: <Soup size={18} />,
  salad: <Salad size={18} />,
  main: <Beef size={18} />,
  side: <GripVertical size={18} />,
  dessert: <Cookie size={18} />,
  beverage: <Wine size={18} />,
  other: <Coffee size={18} />,
};



export default function DishManager() {
  const [dishes, setDishes] = useState<DishResponse[]>([]);
  const [allIngredients, setAllIngredients] = useState<IngredientResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDish, setEditingDish] = useState<DishResponse | null>(null);
  const [editingIngredient, setEditingIngredient] = useState<DishIngredientResponse | null>(null);
  const [expandedDishes, setExpandedDishes] = useState<Set<number>>(new Set());

  // Delete confirmation state
  const [deletingDish, setDeletingDish] = useState<DishResponse | null>(null);
  const [deletingIngredient, setDeletingIngredient] = useState<{ instanceId: number; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Add ingredient state
  const [addingToDish, setAddingToDish] = useState<number | null>(null);
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>('');
  const [addQuantity, setAddQuantity] = useState('');

  const fetchDishes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.listDishes();
      setDishes(response.dishes);
    } catch (err) {
      setError('Failed to load dishes. Is the backend running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchIngredients = async () => {
    try {
      const ingredients = await api.listIngredients();
      setAllIngredients(ingredients);
    } catch (err) {
      console.error('Failed to fetch ingredients', err);
    }
  };

  useEffect(() => {
    fetchDishes();
    fetchIngredients();
  }, []);

  const confirmDeleteDish = async () => {
    if (!deletingDish) return;

    setDeleteLoading(true);
    try {
      // Optimistic update - remove from UI immediately
      setDishes(prev => prev.filter(d => d.id !== deletingDish.id));
      setExpandedDishes(prev => { prev.delete(deletingDish.id); return new Set(prev); });

      await api.deleteDish(deletingDish.id);
      setDeletingDish(null);
    } catch (err) {
      // Revert on error
      await fetchDishes();
      setError('Failed to delete dish');
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedDishes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddIngredient = async (dishId: number) => {
    if (!selectedIngredientId || !addQuantity) return;

    try {
      await api.createIngredientInstance({
        dish_id: dishId,
        ingredient_id: parseInt(selectedIngredientId),
        quantity: parseFloat(addQuantity),
      });
      // Reset form
      setAddingToDish(null);
      setSelectedIngredientId('');
      setAddQuantity('');
      // Refresh dishes immediately
      await fetchDishes();
    } catch (err) {
      setError('Failed to add ingredient');
      console.error(err);
    }
  };

  const cancelAddIngredient = () => {
    setAddingToDish(null);
    setSelectedIngredientId('');
    setAddQuantity('');
  };

  // Group dishes by course
  const dishesByCourse = COURSE_ORDER.reduce((acc, course) => {
    const courseDishes = dishes.filter(d => d.course === course);
    if (courseDishes.length > 0) {
      acc[course] = courseDishes;
    }
    return acc;
  }, {} as Record<CourseType, DishResponse[]>);

  const confirmDeleteIngredient = async () => {
    if (!deletingIngredient) return;

    setDeleteLoading(true);
    try {
      // Optimistic update - remove from UI immediately
      setDishes(prev => prev.map(dish => ({
        ...dish,
        ingredient_instances: dish.ingredient_instances.filter(ing => ing.id !== deletingIngredient.instanceId)
      })));

      await api.deleteIngredientInstance(deletingIngredient.instanceId);
      setDeletingIngredient(null);
    } catch (err) {
      // Revert on error
      await fetchDishes();
      setError('Failed to delete ingredient');
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderIngredient = (_dish: DishResponse, ing: DishIngredientResponse) => (
    <div key={ing.id} className="group flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 bg-white/5 rounded-md text-xs sm:text-sm border border-white/5">
      <span className="min-w-[60px] sm:min-w-[80px] font-medium text-holly">
        {ing.quantity ? `${ing.quantity} ${ing.ingredient.unit || ''}`.trim() : ''}
      </span>
      <span className="flex-1 text-snow/90 min-w-0">{toTitleCase(ing.ingredient.name)}</span>
      {ing.ingredient.store && (
        <span className="text-xs text-holly bg-holly/20 px-1.5 sm:px-2 py-0.5 rounded border border-holly/30 whitespace-nowrap">@ {ing.ingredient.store.name}</span>
      )}
      {ing.notes && <span className="text-xs text-snow/50 italic w-full sm:w-auto">({ing.notes})</span>}
      <div className="flex items-center gap-1 ml-auto sm:ml-0">
        <button
          className="bg-transparent border-none text-snow/60 sm:text-snow/40 p-1.5 sm:p-1 cursor-pointer sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 hover:text-gold active:text-gold"
          onClick={() => setEditingIngredient(ing)}
          title="Edit ingredient"
        >
          <Edit2 size={14} />
        </button>
        <button
          className="bg-transparent border-none text-snow/60 sm:text-snow/40 p-1.5 sm:p-1 cursor-pointer sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 hover:text-red-400 active:text-red-400"
          onClick={() => setDeletingIngredient({ instanceId: ing.id, name: toTitleCase(ing.ingredient.name) })}
          title="Remove ingredient"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );

  const renderDish = (dish: DishResponse) => {
    const isExpanded = expandedDishes.has(dish.id);

    return (
      <div key={dish.id} className="bg-black/30 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden transition-all duration-200 shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_25px_rgba(0,0,0,0.3)] hover:border-gold/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 sm:px-5 py-3 sm:py-4 cursor-pointer bg-white/5 transition-colors duration-200 hover:bg-white/10 active:bg-white/15 gap-2 sm:gap-0" onClick={() => toggleExpanded(dish.id)}>
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <span className="font-semibold text-snow text-base sm:text-lg">{dish.name}</span>
            {dish.servings && (
              <span className="flex items-center gap-1 text-xs sm:text-sm text-holly">
                <Users size={12} className="sm:w-3.5 sm:h-3.5" /> {dish.servings}
              </span>
            )}
            {dish.recipe_url && (
              <a
                href={dish.recipe_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs sm:text-sm text-gold no-underline px-2 py-1 rounded transition-all duration-200 hover:bg-gold/20"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={12} className="sm:w-3.5 sm:h-3.5" /> Recipe
              </a>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 text-snow/80 justify-between sm:justify-end">
            <span className="text-xs text-holly bg-holly/20 px-2 sm:px-3 py-1 rounded-full border border-holly/30">
              {dish.ingredient_instances.length} item{dish.ingredient_instances.length !== 1 ? 's' : ''}
            </span>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                className="bg-transparent border-none text-snow/70 p-2 sm:p-1.5 rounded-md cursor-pointer transition-all duration-200 flex items-center justify-center hover:bg-gold/20 hover:text-gold active:bg-gold/30"
                onClick={(e) => { e.stopPropagation(); setEditingDish(dish); }}
                title="Edit dish"
              >
                <Edit2 size={16} />
              </button>
              <button
                className="bg-transparent border-none text-snow/70 p-2 sm:p-1.5 rounded-md cursor-pointer transition-all duration-200 flex items-center justify-center hover:bg-red-500/20 hover:text-red-400 active:bg-red-500/30"
                onClick={(e) => { e.stopPropagation(); setDeletingDish(dish); }}
                title="Delete dish"
              >
                <Trash2 size={16} />
              </button>
              {isExpanded ? <ChevronUp size={18} className="sm:w-5 sm:h-5" /> : <ChevronDown size={18} className="sm:w-5 sm:h-5" />}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="px-3 sm:px-5 py-3 sm:py-4 border-t border-white/10 bg-black/20 animate-fade-in">
            {dish.description && (
              <p className="m-0 mb-3 sm:mb-4 text-xs sm:text-sm text-snow/70 italic">{dish.description}</p>
            )}
            {dish.ingredient_instances.length > 0 ? (
              <div className="flex flex-col gap-2">
                {dish.ingredient_instances.map((ing, index) => (
                  <div key={ing.id} className="animate-slide-in" style={{ animationDelay: `${index * 0.05}s` }}>
                    {renderIngredient(dish, ing)}
                  </div>
                ))}
              </div>
            ) : (
              <p className="m-0 text-xs sm:text-sm text-snow/50 italic">No ingredients added yet.</p>
            )}

            {/* Add Ingredient Form */}
            {addingToDish === dish.id ? (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-4 p-3 bg-holly/10 rounded-lg border border-dashed border-holly/30">
                <select
                  className="w-full sm:flex-1 px-3 py-2.5 sm:py-2 border border-white/20 rounded-md bg-black/40 text-sm text-snow cursor-pointer focus:outline-none focus:border-gold/50"
                  value={selectedIngredientId}
                  onChange={(e) => setSelectedIngredientId(e.target.value)}
                >
                  <option value="">Select ingredient...</option>
                  {allIngredients.map(ing => (
                    <option key={ing.id} value={ing.id}>
                      {toTitleCase(ing.name)} ({ing.unit})
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <input
                    type="number"
                    className="w-20 sm:w-[70px] px-3 py-2.5 sm:py-2 border border-white/20 rounded-md bg-black/40 text-sm text-snow text-center focus:outline-none focus:border-gold/50"
                    placeholder="Qty"
                    value={addQuantity}
                    onChange={(e) => setAddQuantity(e.target.value)}
                    step="0.25"
                  />
                  <button
                    className="flex-1 sm:flex-none px-4 py-2.5 sm:py-2 bg-holly text-snow border border-holly/50 rounded-md text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-holly/80 active:bg-holly/70 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleAddIngredient(dish.id)}
                    disabled={!selectedIngredientId || !addQuantity}
                  >
                    Add
                  </button>
                  <button
                    className="px-3 py-2.5 sm:py-2 bg-transparent text-snow/70 border border-white/20 rounded-md text-sm cursor-pointer transition-all duration-200 hover:bg-white/10 active:bg-white/20"
                    onClick={cancelAddIngredient}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="flex items-center gap-1.5 mt-3 px-3 py-2.5 sm:py-2 bg-transparent text-holly border border-dashed border-holly/40 rounded-md text-sm cursor-pointer transition-all duration-200 hover:bg-holly/20 hover:border-holly active:bg-holly/30"
                onClick={() => setAddingToDish(dish.id)}
              >
                <Plus size={14} /> Add Ingredient
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <style>{animationStyles}</style>
      <Card variant="festive">
        <CardHeader icon={<UtensilsCrossed size={18} className="sm:w-5 sm:h-5" />}><div className="font-bold text-sm sm:text-base">Holiday Menu</div></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
            <p className="text-snow/80 text-xs sm:text-sm leading-relaxed m-0 sm:flex-1">
              Plan your holiday feast! Create dishes, add ingredients, and keep your menu organized by course. 🎄
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="w-full sm:w-auto">
              <div className="flex flex-row items-center justify-center gap-2">
              <Plus size={16} className="sm:w-[18px] sm:h-[18px]" /> <span>Add New Dish</span></div>
            </Button>
          </div>

          {error && <div className="bg-red-500/15 border border-red-500/30 text-red-400 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm my-3 sm:my-4 animate-fade-in">{error}</div>}

          {loading && dishes.length === 0 ? (
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Loading skeleton */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="loading-shimmer bg-white/5 rounded-xl border border-white/10 h-16 sm:h-20" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : dishes.length === 0 ? (
            <div className="text-center py-8 sm:py-12 px-4 sm:px-8 text-snow/60 text-sm italic bg-white/5 rounded-xl border border-white/10 animate-fade-in">
              <p>No dishes yet. Start planning your holiday feast! 🍽️</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6 sm:gap-8">
              {Object.entries(dishesByCourse).map(([course, courseDishes], courseIndex) => (
                <div key={course} className="flex flex-col gap-3 sm:gap-4 animate-fade-in" style={{ animationDelay: `${courseIndex * 0.1}s` }}>
                  <h3 className="m-0 text-base sm:text-lg font-semibold text-gold pb-2 border-b-2 border-gold/30 flex items-center gap-2" style={{ textShadow: '0 0 10px rgba(232, 185, 35, 0.3)' }}>
                    {COURSE_ICONS[course as CourseType]}
                    {COURSE_LABELS[course as CourseType]}
                  </h3>
                  <div className="flex flex-col gap-3">
                    {courseDishes.map((dish, dishIndex) => (
                      <div key={dish.id} className="animate-slide-in" style={{ animationDelay: `${(courseIndex * 0.1) + (dishIndex * 0.05)}s` }}>
                        {renderDish(dish)}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateDishModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onDishCreated={fetchDishes}
      />

      <EditDishModal
        dish={editingDish}
        isOpen={editingDish !== null}
        onClose={() => setEditingDish(null)}
        onDishUpdated={fetchDishes}
      />

      <EditIngredientModal
        ingredient={editingIngredient}
        isOpen={editingIngredient !== null}
        onClose={() => setEditingIngredient(null)}
        onSaved={fetchDishes}
      />

      <ConfirmModal
        isOpen={deletingDish !== null}
        onClose={() => setDeletingDish(null)}
        onConfirm={confirmDeleteDish}
        title="Delete Dish"
        message={
          <>
            Are you sure you want to delete <strong>{deletingDish?.name}</strong>?
            This will also remove all its ingredients.
          </>
        }
        confirmText="Delete"
        variant="danger"
        loading={deleteLoading}
      />

      <ConfirmModal
        isOpen={deletingIngredient !== null}
        onClose={() => setDeletingIngredient(null)}
        onConfirm={confirmDeleteIngredient}
        title="Remove Ingredient"
        message={
          <>
            Are you sure you want to remove <strong>{deletingIngredient?.name}</strong> from this dish?
          </>
        }
        confirmText="Remove"
        variant="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
