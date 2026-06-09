/**
 * InventoryPanel — shows the inventory for the selected warehouse,
 * composed of ProductTable + AddProductForm.
 * Receives data and callbacks from App via the useInventory hook.
 */

import { ProductTable } from './ProductTable';
import { AddProductForm } from './AddProductForm';
import type { InventoryData } from '../api/types';

interface Props {
  inventory: InventoryData | null;
  loading: boolean;
  error: string | null;
  onProductAdded: () => void;
}

export function InventoryPanel({ inventory, loading, error, onProductAdded }: Props) {
  if (loading) {
    return (
      <div className="inventory-panel">
        <p className="status-text">Cargando inventario…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="inventory-panel">
        <p className="status-error">Error: {error}</p>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="inventory-panel inventory-panel--empty">
        <p className="status-text">Seleccioná un almacén para ver su inventario.</p>
      </div>
    );
  }

  const { warehouse, products, totalProducts } = inventory;

  return (
    <div className="inventory-panel">
      <header className="inventory-header">
        <div>
          <h2>{warehouse.name}</h2>
          <p className="inventory-meta">
            {warehouse.city} · {warehouse.address}
          </p>
        </div>
        <span className="inventory-count">
          {totalProducts} {totalProducts === 1 ? 'producto' : 'productos'}
        </span>
      </header>

      <ProductTable products={products} />

      <AddProductForm
        warehouseId={warehouse.id}
        onSuccess={onProductAdded}
      />
    </div>
  );
}
