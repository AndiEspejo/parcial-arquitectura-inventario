/**
 * Custom hook that owns all inventory-related state.
 * Components stay pure — they receive data and callbacks only.
 */

import { useState, useCallback } from 'react';
import { fetchInventory, followLink, ApiError } from '../api/client';
import type { InventoryData, WarehouseWithLinks } from '../api/types';

interface UseInventoryResult {
  inventory: InventoryData | null;
  loading: boolean;
  error: string | null;
  loadInventory: (warehouse: WarehouseWithLinks) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useInventory(): UseInventoryResult {
  const [inventory, setInventory] = useState<InventoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Keep the last-loaded warehouse so refresh can repeat the same call
  const [lastWarehouse, setLastWarehouse] = useState<WarehouseWithLinks | null>(null);

  const loadInventory = useCallback(async (warehouse: WarehouseWithLinks) => {
    setLoading(true);
    setError(null);
    setLastWarehouse(warehouse);

    try {
      // HATEOAS: prefer the `inventory` link advertised by the warehouse
      const inventoryHref = followLink(warehouse._links, 'inventory');
      const response = await fetchInventory(warehouse.id, inventoryHref);
      setInventory(response.data);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.payload.message ?? 'Error al cargar el inventario');
      } else {
        setError('Error de red al cargar el inventario');
      }
      setInventory(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (lastWarehouse) {
      await loadInventory(lastWarehouse);
    }
  }, [lastWarehouse, loadInventory]);

  return { inventory, loading, error, loadInventory, refresh };
}
