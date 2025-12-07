import { useState } from 'react';
import { BookOpen, Plus, Trash2, CookingPot, Star } from 'lucide-react';
import { Card, CardHeader, CardContent, Button, Input, TextArea } from '../UI';
import { api } from '../../services/api';
import type { DishIngredients } from '../../types/api';

interface RecipeFormData {
  dish_name: string;
  recipe_text: string;
}

const emptyRecipe: RecipeFormData = { dish_name: '', recipe_text: '' };

export function RecipeProcessor() {
  const [recipes, setRecipes] = useState<RecipeFormData[]>([{ ...emptyRecipe }]);
  const [processedDishes, setProcessedDishes] = useState<DishIngredients[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addRecipe = () => setRecipes([...recipes, { ...emptyRecipe }]);

  const removeRecipe = (index: number) => {
    if (recipes.length > 1) {
      setRecipes(recipes.filter((_, i) => i !== index));
    }
  };

  const updateRecipe = (index: number, field: keyof RecipeFormData, value: string) => {
    const updated = [...recipes];
    updated[index] = { ...updated[index], [field]: value };
    setRecipes(updated);
  };

  const handleProcess = async () => {
    const validRecipes = recipes.filter(r => r.dish_name.trim() && r.recipe_text.trim());
    if (validRecipes.length === 0) {
      setError('Please add at least one recipe with a name and ingredients');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.processRecipes({ recipes: validRecipes });
      setProcessedDishes(response.dishes);
    } catch (err) {
      setError('Failed to process recipes. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader icon={<BookOpen size={20} />}>
          Process Holiday Recipes
        </CardHeader>
        <CardContent>
          <p className="flex items-center gap-2 text-cocoa/70 italic mb-6 p-4 bg-frost rounded-lg">
            <CookingPot size={16} className="text-holly flex-shrink-0" />
            Add all your holiday recipes and we'll parse the ingredients from each one!
          </p>

          <div className="flex flex-col gap-6 mb-6">
            {recipes.map((recipe, index) => (
              <div key={index} className="flex flex-col gap-4 p-6 bg-frost rounded-lg border border-cinnamon/20">
                <div className="flex items-center gap-2 mb-2">
                  <Star size={16} className="text-gold" />
                  <span className="font-semibold text-cocoa flex-1">Recipe {index + 1}</span>
                  <button
                    className="flex items-center justify-center w-8 h-8 bg-transparent text-cocoa/70 rounded transition-all duration-200 hover:bg-cranberry/10 hover:text-cranberry disabled:opacity-30 disabled:cursor-not-allowed"
                    onClick={() => removeRecipe(index)}
                    disabled={recipes.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <Input
                  label="Dish Name"
                  placeholder="e.g., Roast Turkey, Cranberry Sauce..."
                  value={recipe.dish_name}
                  onChange={(e) => updateRecipe(index, 'dish_name', e.target.value)}
                />
                <TextArea
                  label="Recipe Ingredients"
                  placeholder="Enter all ingredients..."
                  value={recipe.recipe_text}
                  onChange={(e) => updateRecipe(index, 'recipe_text', e.target.value)}
                />
              </div>
            ))}
          </div>

          {error && <p className="text-cranberry bg-cranberry/10 px-4 py-2 rounded-lg text-sm mb-4">{error}</p>}

          <div className="flex gap-4 justify-end">
            <Button variant="outline" onClick={addRecipe} icon={<Plus size={18} />}>
              Add Recipe
            </Button>
            <Button onClick={handleProcess} loading={loading} size="lg" variant="secondary">
              Process All Recipes
            </Button>
          </div>
        </CardContent>
      </Card>

      {processedDishes.length > 0 && (
        <Card variant="festive">
          <CardHeader icon={<Star size={20} />}>
            Processed Recipes ({processedDishes.length} dishes)
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6">
              {processedDishes.map((dish, dishIndex) => (
                <div key={dishIndex} className="bg-frost rounded-lg p-6 border-l-4 border-gold">
                  <h3 className="flex items-center gap-2 text-lg m-0 mb-1 text-holly-dark">
                    <CookingPot size={18} /> {dish.dish_name}
                  </h3>
                  <p className="text-sm text-cocoa/70 m-0 mb-4">{dish.count} ingredients</p>
                  <ul className="list-none flex flex-col gap-1 p-0 m-0">
                    {dish.ingredients.map((ing, ingIndex) => (
                      <li key={ingIndex} className="flex justify-between px-2 py-1 bg-snow rounded text-sm">
                        <span className="text-cocoa">{ing.ingredient}</span>
                        {ing.qty !== null && (
                          <span className="text-cocoa/70 font-display">
                            {ing.qty} {ing.units || ''}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

