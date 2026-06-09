/**
 * AddProductForm — controlled form to register a new product.
 *
 * Validation mirrors the backend rules in productsController.ts:
 * - name: required, non-empty string
 * - sku:  required, non-empty string
 * - price: required, non-negative number
 * - quantity: required, non-negative integer
 * - warehouseId is injected via prop (already selected)
 *
 * On 400 responses, the `errors` array from the API is rendered directly
 * (same source of truth as the server validation).
 * On 409, a specific duplicate-SKU message is surfaced.
 */

import { useState, type FormEvent } from 'react';
import { createProduct, ApiError } from '../api/client';
import type { CreateProductDto } from '../api/types';

interface Props {
  warehouseId: number;
  onSuccess: () => void; // called after 201 so parent can refresh inventory
}

interface FormState {
  name: string;
  sku: string;
  description: string;
  price: string;
  quantity: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  sku: '',
  description: '',
  price: '',
  quantity: '',
};

// Client-side validation — mirrors productsController.ts rules
function validate(form: FormState): string[] {
  const errors: string[] = [];

  if (!form.name.trim()) {
    errors.push('El nombre es requerido.');
  }
  if (!form.sku.trim()) {
    errors.push('El SKU es requerido.');
  }
  if (form.price === '') {
    errors.push('El precio es requerido.');
  } else {
    const priceNum = parseFloat(form.price);
    if (isNaN(priceNum) || priceNum < 0) {
      errors.push('El precio debe ser un número no negativo.');
    }
  }
  if (form.quantity === '') {
    errors.push('La cantidad es requerida.');
  } else {
    const qtyNum = parseInt(form.quantity, 10);
    if (!Number.isInteger(qtyNum) || qtyNum < 0 || String(qtyNum) !== form.quantity) {
      errors.push('La cantidad debe ser un entero no negativo.');
    }
  }

  return errors;
}

export function AddProductForm({ warehouseId, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [clientErrors, setClientErrors] = useState<string[]>([]);
  const [serverErrors, setServerErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  function handleChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      // Clear messages as user edits
      setClientErrors([]);
      setServerErrors([]);
      setSuccessMsg(null);
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSuccessMsg(null);
    setServerErrors([]);

    const validationErrors = validate(form);
    if (validationErrors.length > 0) {
      setClientErrors(validationErrors);
      return;
    }
    setClientErrors([]);

    const dto: CreateProductDto = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      description: form.description.trim() || undefined,
      price: parseFloat(form.price),
      quantity: parseInt(form.quantity, 10),
      warehouseId,
    };

    setSubmitting(true);
    try {
      await createProduct(dto);
      setForm(EMPTY_FORM);
      setSuccessMsg(`Producto "${dto.name}" registrado exitosamente.`);
      onSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setServerErrors([`SKU duplicado: "${dto.sku}" ya existe en el sistema.`]);
        } else if (err.status === 400 && err.payload.errors) {
          setServerErrors(err.payload.errors);
        } else {
          setServerErrors([err.payload.message ?? 'Error al registrar el producto.']);
        }
      } else {
        setServerErrors(['Error de red al registrar el producto.']);
      }
    } finally {
      setSubmitting(false);
    }
  }

  const allErrors = [...clientErrors, ...serverErrors];

  return (
    <section className="add-product-form">
      <h3>Agregar producto</h3>

      {allErrors.length > 0 && (
        <ul className="form-errors" role="alert">
          {allErrors.map((msg, i) => (
            <li key={i}>{msg}</li>
          ))}
        </ul>
      )}

      {successMsg && (
        <p className="form-success" role="status">{successMsg}</p>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <label htmlFor="product-name">Nombre *</label>
          <input
            id="product-name"
            type="text"
            value={form.name}
            onChange={handleChange('name')}
            placeholder="Laptop ProBook 450"
            disabled={submitting}
            required
          />
        </div>

        <div className="form-row">
          <label htmlFor="product-sku">SKU *</label>
          <input
            id="product-sku"
            type="text"
            value={form.sku}
            onChange={handleChange('sku')}
            placeholder="SKU-LP-001"
            disabled={submitting}
            required
          />
        </div>

        <div className="form-row">
          <label htmlFor="product-description">Descripción</label>
          <input
            id="product-description"
            type="text"
            value={form.description}
            onChange={handleChange('description')}
            placeholder="Descripción opcional"
            disabled={submitting}
          />
        </div>

        <div className="form-row form-row--half">
          <div>
            <label htmlFor="product-price">Precio *</label>
            <input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange('price')}
              placeholder="1299.99"
              disabled={submitting}
              required
            />
          </div>
          <div>
            <label htmlFor="product-quantity">Cantidad *</label>
            <input
              id="product-quantity"
              type="number"
              min="0"
              step="1"
              value={form.quantity}
              onChange={handleChange('quantity')}
              placeholder="0"
              disabled={submitting}
              required
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Registrando…' : 'Registrar producto'}
        </button>
      </form>
    </section>
  );
}
