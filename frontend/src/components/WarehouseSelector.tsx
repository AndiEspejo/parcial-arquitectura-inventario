/**
 * WarehouseSelector — loads and displays the warehouse list.
 * Calls onSelect(warehouse) when the user picks one.
 * Props-down / events-up pattern; no internal async state.
 */

import { useState, useEffect } from 'react';
import { fetchWarehouses, ApiError } from '../api/client';
import type { WarehouseWithLinks } from '../api/types';

interface Props {
  selectedId: number | null;
  onSelect: (warehouse: WarehouseWithLinks) => void;
}

export function WarehouseSelector({ selectedId, onSelect }: Props) {
  const [warehouses, setWarehouses] = useState<WarehouseWithLinks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetchWarehouses();
        if (!cancelled) setWarehouses(res.data);
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError) {
            setError(err.payload.message ?? 'Error al cargar almacenes');
          } else {
            setError('Error de red al cargar almacenes');
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <p className="status-text">Cargando almacenes…</p>;
  }

  if (error) {
    return <p className="status-error">Error: {error}</p>;
  }

  if (warehouses.length === 0) {
    return <p className="status-text">No hay almacenes registrados.</p>;
  }

  return (
    <section className="warehouse-selector">
      <h2>Almacenes</h2>
      <ul className="warehouse-list">
        {warehouses.map((w) => (
          <li
            key={w.id}
            className={`warehouse-item${selectedId === w.id ? ' warehouse-item--active' : ''}`}
          >
            <button
              type="button"
              className="warehouse-btn"
              onClick={() => onSelect(w)}
              aria-pressed={selectedId === w.id}
            >
              <span className="warehouse-name">{w.name}</span>
              <span className="warehouse-city">{w.city}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
