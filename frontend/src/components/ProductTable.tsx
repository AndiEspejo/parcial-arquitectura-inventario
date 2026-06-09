/**
 * ProductTable — renders the inventory list for the selected warehouse.
 * Pure presentational component: receives data, renders it.
 */

import type { InventoryItem } from '../api/types';

interface Props {
  products: InventoryItem[];
}

export function ProductTable({ products }: Props) {
  if (products.length === 0) {
    return <p className="status-text">Este almacén no tiene productos registrados.</p>;
  }

  return (
    <div className="table-wrapper">
      <table className="product-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>SKU</th>
            <th>Descripción</th>
            <th>Precio</th>
            <th>Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>
                <code>{p.sku}</code>
              </td>
              <td className="td-description">{p.description ?? '—'}</td>
              <td className="td-price">${parseFloat(p.price).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
              <td className="td-quantity">{p.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
