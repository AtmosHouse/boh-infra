import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { ChefHat, Sparkles, Plus, Trash2, Check } from 'lucide-react';
import { Modal, Button, Input, TextArea } from '../UI';
import api from '../../services/api';
import type {
  CourseType,
  DishCreate,
  DishIngredientInput,
  ParsedIngredientItem,
} from '../../types/api';

interface CreateDishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDishCreated: () => void;
}

const COURSE_OPTIONS: { value: CourseType; label: string; emoji: string; color: string }[] = [
  { value: 'appetizer', label: 'Appetizer', emoji: '🥗', color: 'from-amber-500/20 to-amber-600/20 border-amber-500/40 hover:border-amber-400' },
  { value: 'soup', label: 'Soup', emoji: '🍲', color: 'from-orange-500/20 to-orange-600/20 border-orange-500/40 hover:border-orange-400' },
  { value: 'salad', label: 'Salad', emoji: '🥬', color: 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/40 hover:border-emerald-400' },
  { value: 'main', label: 'Main Course', emoji: '🍽️', color: 'from-red-500/20 to-red-600/20 border-red-500/40 hover:border-red-400' },
  { value: 'side', label: 'Side Dish', emoji: '🥔', color: 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/40 hover:border-yellow-400' },
  { value: 'dessert', label: 'Dessert', emoji: '🍰', color: 'from-pink-500/20 to-pink-600/20 border-pink-500/40 hover:border-pink-400' },
  { value: 'beverage', label: 'Beverage', emoji: '🥤', color: 'from-sky-500/20 to-sky-600/20 border-sky-500/40 hover:border-sky-400' },
  { value: 'other', label: 'Other', emoji: '📦', color: 'from-gray-500/20 to-gray-600/20 border-gray-500/40 hover:border-gray-400' },
];

export function CreateDishModal({ isOpen, onClose, onDishCreated }: CreateDishModalProps) {
  const [name, setName] = useState('');
  const [course, setCourse] = useState<CourseType>('main');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState('4');
  const [recipeUrl, setRecipeUrl] = useState('');
  const [ingredientText, setIngredientText] = useState('');
  const [parsedIngredients, setParsedIngredients] = useState<ParsedIngredientItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');

  const handleParseIngredients = async () => {
    if (!ingredientText.trim()) return;

    setParsing(true);
    setError('');
    try {
      const response = await api.parseIngredients({ text: ingredientText });
      setParsedIngredients(response.ingredients);
    } catch (err) {
      setError('Failed to parse ingredients. Please try again.');
      console.error(err);
    } finally {
      setParsing(false);
    }
  };

  const updateIngredient = (
    index: number,
    field: keyof ParsedIngredientItem,
    value: string | number | null | boolean
  ) => {
    setParsedIngredients(prev => prev.map((ing, i) =>
      i === index ? { ...ing, [field]: value } : ing
    ));
  };

  const removeIngredient = (index: number) => {
    setParsedIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const addEmptyIngredient = () => {
    setParsedIngredients(prev => [...prev, {
      name: '',
      quantity: null,
      unit: 'each',
      notes: '',
      existing_ingredient_id: null,
      is_new: true,
      converted_quantity: null,
      converted_unit: null,
    }]);
  };

  // Track if ingredients have been parsed (required before creating)
  const [hasParsed, setHasParsed] = useState(false);

  const handleParseIngredientsWithTracking = async () => {
    await handleParseIngredients();
    setHasParsed(true);
  };

  // Check if user can create dish
  const canCreate = name.trim() && (hasParsed || !ingredientText.trim());

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter a dish name');
      return;
    }

    // Require parsing if there's ingredient text
    if (ingredientText.trim() && !hasParsed) {
      setError('Please parse your ingredients first using the "Parse Ingredients" button');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Convert parsed ingredients to DishIngredientInput format
      // Use converted quantity/unit when available (for matched ingredients)
      const ingredients: DishIngredientInput[] = parsedIngredients
        .filter(ing => ing.name.trim())
        .map(ing => ({
          existing_ingredient_id: ing.existing_ingredient_id ?? undefined,
          name: ing.is_new ? ing.name : undefined,
          unit: ing.converted_unit ?? ing.unit,
          quantity: ing.converted_quantity ?? ing.quantity ?? 1,
          notes: ing.notes || undefined,
        }));

      const dishData: DishCreate = {
        name: name.trim(),
        course,
        description: description.trim() || undefined,
        servings: servings ? parseInt(servings) : undefined,
        recipe_url: recipeUrl.trim() || undefined,
        ingredients,
      };

      await api.createDish(dishData);

      onDishCreated();
      handleClose();
    } catch (err) {
      setError('Failed to create dish. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName('');
    setCourse('main');
    setDescription('');
    setServings('4');
    setRecipeUrl('');
    setIngredientText('');
    setParsedIngredients([]);
    setHasParsed(false);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Dish" size="lg">
      <div className="flex flex-col gap-5 sm:gap-6">
        {error && <div className="bg-red-600/10 border border-red-600/30 text-red-600 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm">{error}</div>}

        {/* Step 1: Dish Details */}
        <div className="flex flex-col gap-4 sm:gap-5 p-4 sm:p-5 bg-gradient-to-br from-white/60 to-white/40 rounded-xl border border-cinnamon/15 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-forest text-white text-xs font-bold">1</div>
            <h3 className="flex items-center gap-2 m-0 text-sm sm:text-base font-semibold text-forest">
              <ChefHat size={18} /> Dish Details
            </h3>
          </div>

          <Input
            label="Dish Name *"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="e.g., Honey Glazed Ham"
          />

          {/* Course Selection - Visual Cards */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-cocoa">Select Course</label>
            <div className="grid grid-cols-4 gap-2">
              {COURSE_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCourse(c.value)}
                  className={`flex flex-col items-center gap-1 p-2 sm:p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer
                    ${course === c.value
                      ? `bg-gradient-to-br ${c.color} border-2 scale-[1.02] shadow-md`
                      : 'bg-white/50 border-cinnamon/20 hover:border-cinnamon/40 hover:bg-white/70'
                    }`}
                >
                  <span className="text-xl sm:text-2xl">{c.emoji}</span>
                  <span className={`text-[0.65rem] sm:text-xs font-medium ${course === c.value ? 'text-cocoa' : 'text-cocoa/70'}`}>
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Servings"
              type="number"
              value={servings}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setServings(e.target.value)}
              placeholder="4"
            />
            <Input
              label="Recipe URL (optional)"
              value={recipeUrl}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setRecipeUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <Input
            label="Description (optional)"
            value={description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            placeholder="A family favorite..."
          />
        </div>

        {/* Step 2: Ingredients */}
        <div className="flex flex-col gap-4 sm:gap-5 p-4 sm:p-5 bg-gradient-to-br from-white/60 to-white/40 rounded-xl border border-cinnamon/15 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-forest text-white text-xs font-bold">2</div>
            <h3 className="flex items-center gap-2 m-0 text-sm sm:text-base font-semibold text-forest">
              <Sparkles size={18} /> Add Ingredients
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            <TextArea
              label="Paste your ingredients list"
              value={ingredientText}
              onChange={(e) => {
                setIngredientText(e.target.value);
                // Reset parsed state when text changes
                if (hasParsed && e.target.value !== ingredientText) {
                  setHasParsed(false);
                  setParsedIngredients([]);
                }
              }}
              placeholder="2 cups flour&#10;1 tsp vanilla extract&#10;3 large eggs&#10;1/2 cup butter, softened"
              rows={5}
            />

            {/* Prominent Parse Button */}
            {ingredientText.trim() && !hasParsed && (
              <div className="flex flex-col items-center gap-2 p-4 bg-gradient-to-r from-gold/10 via-gold/20 to-gold/10 rounded-lg border-2 border-dashed border-gold/50">
                <p className="text-sm text-cocoa/80 text-center m-0">
                  Ready to parse your ingredients? Click below to continue.
                </p>
                <Button
                  variant="primary"
                  onClick={handleParseIngredientsWithTracking}
                  loading={parsing}
                  className="bg-gradient-to-br from-gold to-gold-dark text-cocoa border-gold/50 shadow-[0_0_20px_rgba(232,185,35,0.4)] hover:shadow-[0_0_30px_rgba(232,185,35,0.6)]"
                >
                  <Sparkles size={18} /> Parse Ingredients
                </Button>
              </div>
            )}

            {/* Success state after parsing */}
            {hasParsed && parsedIngredients.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-2 bg-holly/10 rounded-lg border border-holly/30">
                <div className="flex items-center justify-center w-5 h-5 rounded-full bg-holly text-white">
                  <Check size={12} />
                </div>
                <span className="text-sm text-forest font-medium">
                  {parsedIngredients.length} ingredient{parsedIngredients.length !== 1 ? 's' : ''} parsed successfully
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setHasParsed(false);
                    setParsedIngredients([]);
                  }}
                  className="ml-auto text-xs text-cocoa/60 hover:text-cocoa underline cursor-pointer bg-transparent border-none"
                >
                  Re-parse
                </button>
              </div>
            )}
          </div>

          {parsedIngredients.length > 0 && (
            <div className="flex flex-col gap-2 mt-2 sm:mt-4 p-2 sm:p-4 bg-holly/5 rounded-lg border border-holly/10">
              {/* Desktop header */}
              <div className="hidden sm:grid grid-cols-[90px_80px_1fr_1fr_40px] gap-2 pb-2 border-b border-cinnamon/15 text-xs font-semibold text-forest uppercase tracking-wide">
                <span>Qty</span>
                <span>Unit</span>
                <span>Ingredient</span>
                <span>Notes</span>
                <span></span>
              </div>
              {parsedIngredients.map((ing, index) => (
                <div key={index} className={`flex flex-col sm:grid sm:grid-cols-[90px_80px_1fr_1fr_40px] gap-2 items-start p-2 sm:p-1 rounded-md ${!ing.is_new ? 'bg-gold/10' : 'bg-white/30 sm:bg-transparent'}`}>
                  {/* Mobile: Row 1 - Name and delete */}
                  <div className="flex sm:hidden w-full items-center gap-2">
                    <input
                      type="text"
                      value={ing.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      className={`flex-1 p-2 border rounded-md text-sm bg-white text-cocoa placeholder:text-cocoa/40 focus:outline-none focus:border-gold ${!ing.is_new ? 'border-gold/40' : 'border-cinnamon/20'}`}
                      placeholder="Ingredient"
                    />
                    <button
                      className="flex items-center justify-center p-2 bg-red-600/10 border-none rounded-md text-red-600 cursor-pointer transition-all duration-200 active:bg-red-600/20"
                      onClick={() => removeIngredient(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  {/* Mobile: Row 2 - Qty, Unit, Notes */}
                  <div className="flex sm:hidden w-full gap-2">
                    <input
                      type="number"
                      value={ing.converted_quantity ?? ing.quantity ?? ''}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value ? parseFloat(e.target.value) : null)}
                      className={`w-16 p-2 border rounded-md text-sm bg-white text-cocoa placeholder:text-cocoa/40 focus:outline-none focus:border-gold ${!ing.is_new ? 'border-gold/40' : 'border-cinnamon/20'}`}
                      placeholder="Qty"
                    />
                    <input
                      type="text"
                      value={ing.converted_unit ?? ing.unit}
                      onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                      className={`w-16 p-2 border rounded-md text-sm bg-white text-cocoa placeholder:text-cocoa/40 focus:outline-none focus:border-gold ${!ing.is_new ? 'border-gold/40' : 'border-cinnamon/20'}`}
                      placeholder="Unit"
                    />
                    <input
                      type="text"
                      value={ing.notes}
                      onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                      className={`flex-1 p-2 border rounded-md text-sm bg-white text-cocoa placeholder:text-cocoa/40 focus:outline-none focus:border-gold ${!ing.is_new ? 'border-gold/40' : 'border-cinnamon/20'}`}
                      placeholder="Notes"
                    />
                  </div>
                  {!ing.is_new && <span className="sm:hidden text-[0.65rem] bg-gold text-white px-1.5 py-0.5 rounded uppercase font-semibold w-fit">Matched</span>}

                  {/* Desktop layout */}
                  <div className="hidden sm:flex flex-col gap-0.5">
                    <input
                      type="number"
                      value={ing.converted_quantity ?? ing.quantity ?? ''}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value ? parseFloat(e.target.value) : null)}
                      className={`p-2 border rounded-md text-sm bg-white text-cocoa placeholder:text-cocoa/40 focus:outline-none focus:border-gold ${!ing.is_new ? 'border-gold/40' : 'border-cinnamon/20'}`}
                      placeholder="Qty"
                    />
                    {ing.converted_quantity !== null && ing.quantity !== null && (
                      <span className="text-[0.7rem] text-cocoa/60 line-through whitespace-nowrap" title="Original quantity">
                        was {ing.quantity} {ing.unit}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={ing.converted_unit ?? ing.unit}
                    onChange={(e) => updateIngredient(index, 'unit', e.target.value)}
                    className={`hidden sm:block p-2 border rounded-md text-sm bg-white text-cocoa placeholder:text-cocoa/40 focus:outline-none focus:border-gold ${!ing.is_new ? 'border-gold/40' : 'border-cinnamon/20'}`}
                    placeholder="Unit"
                  />
                  <div className="hidden sm:flex flex-col gap-1">
                    <input
                      type="text"
                      value={ing.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      className={`p-2 border rounded-md text-sm bg-white text-cocoa placeholder:text-cocoa/40 focus:outline-none focus:border-gold ${!ing.is_new ? 'border-gold/40' : 'border-cinnamon/20'}`}
                      placeholder="Ingredient"
                      title={!ing.is_new ? 'Matched to existing ingredient' : ''}
                    />
                    {!ing.is_new && <span className="text-[0.65rem] bg-gold text-white px-1.5 py-0.5 rounded uppercase font-semibold w-fit">Matched</span>}
                  </div>
                  <input
                    type="text"
                    value={ing.notes}
                    onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                    className={`hidden sm:block p-2 border rounded-md text-sm bg-white text-cocoa placeholder:text-cocoa/40 focus:outline-none focus:border-gold ${!ing.is_new ? 'border-gold/40' : 'border-cinnamon/20'}`}
                    placeholder="Notes"
                  />
                  <button
                    className="hidden sm:flex items-center justify-center p-2 bg-red-600/10 border-none rounded-md text-red-600 cursor-pointer transition-all duration-200 hover:bg-red-600/20"
                    onClick={() => removeIngredient(index)}
                    title="Remove ingredient"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button className="flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2 mt-2 bg-transparent border border-dashed border-holly/30 rounded-md text-forest text-sm cursor-pointer transition-all duration-200 active:bg-holly/5 hover:bg-holly/5 hover:border-forest" onClick={addEmptyIngredient}>
                <Plus size={16} /> Add Ingredient Manually
              </button>
            </div>
          )}
        </div>

        {/* Footer with Create Button */}
        <div className="flex flex-col gap-3 pt-4 border-t border-cinnamon/15">
          {/* Warning if ingredients not parsed */}
          {ingredientText.trim() && !hasParsed && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 rounded-lg border border-amber-500/30">
              <Sparkles size={16} className="text-amber-600" />
              <span className="text-sm text-amber-700">
                Don't forget to parse your ingredients before creating the dish!
              </span>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4">
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              loading={loading}
              disabled={!canCreate}
              className={!canCreate ? 'opacity-50' : ''}
            >
              <ChefHat size={18} /> Create Dish
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default CreateDishModal;

