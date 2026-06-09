/**
 * App — root component.
 * Owns warehouse selection state; delegates inventory state to useInventory.
 * Component tree: App → WarehouseSelector / InventoryPanel → ProductTable + AddProductForm
 */

import { useState } from 'react';
import { WarehouseSelector } from './components/WarehouseSelector';
import { InventoryPanel } from './components/InventoryPanel';
import { useInventory } from './hooks/useInventory';
import type { WarehouseWithLinks } from './api/types';

export function App() {
  const [selectedWarehouse, setSelectedWarehouse] = useState<WarehouseWithLinks | null>(null);
  const { inventory, loading, error, loadInventory, refresh } = useInventory();

  function handleWarehouseSelect(warehouse: WarehouseWithLinks) {
    setSelectedWarehouse(warehouse);
    void loadInventory(warehouse);
  }

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>Inventario de Almacenes</h1>
      </header>

      <main className="app-main">
        <aside className="app-sidebar">
          <WarehouseSelector
            selectedId={selectedWarehouse?.id ?? null}
            onSelect={handleWarehouseSelect}
          />
        </aside>

        <section className="app-content">
          <InventoryPanel
            inventory={inventory}
            loading={loading}
            error={error}
            onProductAdded={refresh}
          />
        </section>
      </main>
    </div>
  );
}
