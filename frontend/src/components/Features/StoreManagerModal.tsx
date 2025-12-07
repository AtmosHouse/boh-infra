import { useState, useEffect } from 'react';
import { Store, Plus, Trash2, Edit2, Save, X } from 'lucide-react';
import { Modal, Button, Input } from '../UI';
import api from '../../services/api';
import type { StoreResponse } from '../../types/api';

interface StoreManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStoresChanged: () => void;
}

export function StoreManagerModal({ isOpen, onClose, onStoresChanged }: StoreManagerModalProps) {
  const [stores, setStores] = useState<StoreResponse[]>([]);
  const [newStoreName, setNewStoreName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchStores();
    }
  }, [isOpen]);

  const fetchStores = async () => {
    try {
      const response = await api.listStores();
      setStores(response.stores);
    } catch (err) {
      console.error('Failed to fetch stores:', err);
      setError('Failed to load stores');
    }
  };

  const handleAddStore = async () => {
    if (!newStoreName.trim()) return;

    setLoading(true);
    setError('');
    try {
      await api.createStore({ name: newStoreName.trim() });
      setNewStoreName('');
      await fetchStores();
      onStoresChanged();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add store';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (store: StoreResponse) => {
    setEditingId(store.id);
    setEditName(store.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleSaveEdit = async (storeId: number) => {
    if (!editName.trim()) return;

    setLoading(true);
    setError('');
    try {
      await api.updateStore(storeId, { name: editName.trim() });
      cancelEdit();
      await fetchStores();
      onStoresChanged();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update store';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storeId: number) => {
    if (!confirm('Delete this store? Ingredients assigned to it will become unassigned.')) {
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.deleteStore(storeId);
      await fetchStores();
      onStoresChanged();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete store';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Stores" size="md">
      <div className="flex flex-col gap-4 sm:gap-6">
        {error && <div className="bg-red-700/20 border border-red-700/40 text-red-300 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-sm">{error}</div>}

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 sm:items-end [&>div:first-child]:flex-1">
          <Input
            label="Add New Store"
            value={newStoreName}
            onChange={(e) => setNewStoreName(e.target.value)}
            placeholder="e.g., Costco, Trader Joe's..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddStore()}
          />
          <Button onClick={handleAddStore} disabled={!newStoreName.trim() || loading}>
            <Plus size={16} className="sm:w-[18px] sm:h-[18px]" /> Add Store
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="flex items-center gap-2 text-sm sm:text-base text-gold m-0 mb-2 pb-2 border-b border-dashed border-gold/20"><Store size={16} className="sm:w-[18px] sm:h-[18px]" /> Your Stores</h3>
          {stores.length === 0 ? (
            <p className="text-cocoa/70 italic text-center p-4 text-sm">No stores yet. Add one above!</p>
          ) : (
            stores.map((store) => (
              <div key={store.id} className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-cocoa/40 border border-gold/10 rounded-lg">
                {editingId === store.id ? (
                  <>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 min-w-0 px-2 sm:px-3 py-2 border border-gold/30 rounded bg-cocoa/60 text-cream text-sm focus:outline-none focus:border-gold"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(store.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                    />
                    <button
                      className="flex items-center justify-center p-1.5 sm:p-2 rounded cursor-pointer transition-all duration-200 bg-holly/20 border border-forest text-forest active:bg-holly/30 hover:bg-holly/30"
                      onClick={() => handleSaveEdit(store.id)}
                      disabled={loading}
                    >
                      <Save size={16} />
                    </button>
                    <button className="flex items-center justify-center p-1.5 sm:p-2 rounded cursor-pointer transition-all duration-200 bg-gray-500/20 border border-gray-500/30 text-cocoa/70 active:bg-gray-500/30 hover:bg-gray-500/30" onClick={cancelEdit}>
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium text-cream text-sm sm:text-base truncate">{store.name}</span>
                    <button className="flex items-center justify-center p-1.5 sm:p-2 rounded cursor-pointer transition-all duration-200 bg-gold/10 border border-gold/20 text-gold active:bg-gold/20 hover:bg-gold/20 hover:border-gold" onClick={() => startEdit(store)}>
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="flex items-center justify-center p-1.5 sm:p-2 rounded cursor-pointer transition-all duration-200 bg-red-700/10 border border-red-700/20 text-red-400 active:bg-red-700/20 hover:bg-red-700/20 hover:border-red-400"
                      onClick={() => handleDelete(store.id)}
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-gold/10">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}

export default StoreManagerModal;

