import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { ChefHat, Save } from 'lucide-react';
import { Modal, Button, Input } from '../UI';
import api from '../../services/api';
import type {
  CourseType,
  DishResponse,
  DishUpdate,
} from '../../types/api';
import { COURSE_LABELS } from '../../types/api';

interface EditDishModalProps {
  dish: DishResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onDishUpdated: () => void;
}

const COURSE_OPTIONS: CourseType[] = [
  'appetizer', 'soup', 'salad', 'main', 'side', 'dessert', 'beverage', 'other'
];

export function EditDishModal({ dish, isOpen, onClose, onDishUpdated }: EditDishModalProps) {
  const [name, setName] = useState('');
  const [course, setCourse] = useState<CourseType>('main');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState('');
  const [recipeUrl, setRecipeUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (dish) {
      setName(dish.name);
      setCourse(dish.course);
      setDescription(dish.description || '');
      setServings(dish.servings?.toString() || '');
      setRecipeUrl(dish.recipe_url || '');
    }
  }, [dish]);

  const handleSubmit = async () => {
    if (!dish || !name.trim()) {
      setError('Please enter a dish name');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const updateData: DishUpdate = {
        name: name.trim(),
        course,
        description: description.trim() || undefined,
        servings: servings ? parseInt(servings) : undefined,
        recipe_url: recipeUrl.trim() || undefined,
      };

      await api.updateDish(dish.id, updateData);
      onDishUpdated();
      onClose();
    } catch (err) {
      setError('Failed to update dish. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!dish) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Dish" size="lg">
      <div className="flex flex-col gap-4 sm:gap-6">
        {error && <div className="bg-red-600/10 border border-red-600/30 text-red-600 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm">{error}</div>}

        <div className="flex flex-col gap-3 sm:gap-4 p-3 sm:p-4 bg-white/50 rounded-xl border border-cinnamon/10">
          <h3 className="flex items-center gap-2 m-0 text-sm sm:text-base font-semibold text-forest"><ChefHat size={16} className="sm:w-[18px] sm:h-[18px]" /> Dish Details</h3>

          <Input
            label="Dish Name *"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="e.g., Honey Glazed Ham"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-cocoa">Course</label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value as CourseType)}
                className="px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-cinnamon/20 rounded-lg bg-white text-cocoa cursor-pointer focus:outline-none focus:border-gold text-sm sm:text-base"
              >
                {COURSE_OPTIONS.map((c) => (
                  <option key={c} value={c}>{COURSE_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <Input
              label="Servings"
              type="number"
              value={servings}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setServings(e.target.value)}
            />
          </div>

          <Input
            label="Recipe URL"
            value={recipeUrl}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setRecipeUrl(e.target.value)}
            placeholder="https://..."
          />

          <Input
            label="Description"
            value={description}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)}
            placeholder="A family favorite..."
          />
        </div>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4 pt-4 border-t border-cinnamon/15">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading} disabled={!name.trim()}>
            <Save size={16} className="sm:w-[18px] sm:h-[18px]" /> Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default EditDishModal;
