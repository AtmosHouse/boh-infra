import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { Save } from 'lucide-react';
import { Modal, Button, Input } from '../UI';
import api from '../../services/api';
import type { DishIngredientResponse, IngredientInstanceUpdate } from '../../types/api';
import { toTitleCase } from '../../utils/formatters';

interface EditIngredientModalProps {
  ingredient: DishIngredientResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export function EditIngredientModal({ ingredient, isOpen, onClose, onSaved }: EditIngredientModalProps) {
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ingredient) {
      setQuantity(ingredient.quantity?.toString() || '');
      setNotes(ingredient.notes || '');
    }
  }, [ingredient]);

  const handleSubmit = async () => {
    if (!ingredient) return;

    setLoading(true);
    setError('');
    try {
      const update: IngredientInstanceUpdate = {
        quantity: quantity ? parseFloat(quantity) : undefined,
        notes: notes.trim() || undefined,
      };
      await api.updateIngredientInstance(ingredient.id, update);
      onSaved();
      onClose();
    } catch (err) {
      setError('Failed to update ingredient. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!ingredient) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Ingredient" size="sm">
      <div className="flex flex-col gap-4 sm:gap-5">
        {error && <div className="bg-red-600/10 border border-red-600/30 text-red-600 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm">{error}</div>}

        <div className="text-base sm:text-lg font-semibold text-forest px-3 sm:px-4 py-2.5 sm:py-3 bg-holly/5 rounded-lg border-l-[3px] border-forest">
          {toTitleCase(ingredient.ingredient.name)}
          {ingredient.ingredient.unit && (
            <span className="font-normal text-cocoa text-xs sm:text-sm"> ({ingredient.ingredient.unit})</span>
          )}
        </div>

        <Input
          label="Quantity"
          type="number"
          step="0.25"
          value={quantity}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)}
          placeholder="e.g., 2"
        />

        <Input
          label="Notes"
          value={notes}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
          placeholder="e.g., diced, at room temperature"
        />

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-4 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>
            <Save size={16} className="sm:w-[18px] sm:h-[18px]" /> Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default EditIngredientModal;

