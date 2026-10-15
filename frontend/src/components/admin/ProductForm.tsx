'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { adminCreateProduct, adminUpdateProduct, getAdminOptions } from '@/lib/api';
import type { AdminOptions, AdminProduct } from '@/types/admin';
import { adminCardClass, adminInputClass as inputClass } from './AdminShell';

const labelClass = 'block text-sm font-medium text-[var(--color-text)] mb-1';
const MAX_IMAGE_MB = 5;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type Errors = Partial<Record<string, string>>;

interface Props {
  product?: AdminProduct;
  onSaved: (product: AdminProduct) => void;
}

function initialState(p?: AdminProduct) {
  return {
    name: p?.name ?? '',
    short_description: p?.short_description ?? '',
    description: p?.description ?? '',
    sku: p?.sku ?? '',
    category_id: p?.category_id ?? '',
    franchise_id: p?.franchise_id ?? '',
    brand_id: p?.brand_id ?? '',
    base_price: p ? String(Math.round(Number(p.base_price))) : '',
    compare_price: p?.compare_price ? String(Math.round(Number(p.compare_price))) : '',
    stock: p ? String(p.stock) : '0',
    is_active: p?.is_active ?? true,
    is_featured: p?.is_featured ?? false,
    is_new: p?.is_new ?? false,
    is_on_sale: p?.is_on_sale ?? false,
    sale_percentage: p?.sale_percentage ? String(p.sale_percentage) : '',
  };
}

export function ProductForm({ product, onSaved }: Props) {
  const isEdit = Boolean(product);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [options, setOptions] = useState<AdminOptions | null>(null);
  const [optionsError, setOptionsError] = useState('');
  const [form, setForm] = useState(() => initialState(product));
  const [newImages, setNewImages] = useState<File[]>([]);
  const [removeIds, setRemoveIds] = useState<string[]>([]);
  const [primaryId, setPrimaryId] = useState(product?.images.find((i) => i.is_primary)?.id ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getAdminOptions()
      .then(setOptions)
      .catch(() => setOptionsError('No se pudieron cargar categorias, franquicias y marcas.'));
  }, []);

  const set = <K extends keyof ReturnType<typeof initialState>>(key: K, value: ReturnType<typeof initialState>[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.name.trim()) e.name = 'El nombre es obligatorio.';
    if (!form.sku.trim()) e.sku = 'El SKU es obligatorio.';
    if (!form.category_id) e.category_id = 'Selecciona una categoria.';
    if (!form.franchise_id) e.franchise_id = 'Selecciona una franquicia.';
    if (!form.brand_id) e.brand_id = 'Selecciona una marca.';
    const base = Number(form.base_price);
    if (form.base_price === '' || Number.isNaN(base) || base < 0) e.base_price = 'Ingresa un precio valido.';
    if (form.compare_price !== '' && Number(form.compare_price) <= base) {
      e.compare_price = 'Debe ser mayor que el precio base.';
    }
    const stock = Number(form.stock);
    if (!Number.isInteger(stock) || stock < 0) e.stock = 'El stock debe ser un numero entero mayor o igual a 0.';
    if (form.is_on_sale) {
      const pct = Number(form.sale_percentage);
      if (!Number.isInteger(pct) || pct < 1 || pct > 100) e.sale_percentage = 'Entre 1 y 100.';
    }
    const badImage = newImages.find((f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_IMAGE_MB * 1024 * 1024);
    if (badImage) e.images = `${badImage.name}: usa JPG, PNG o WEBP de maximo ${MAX_IMAGE_MB} MB.`;
    const keptImages = (product?.images.length ?? 0) - removeIds.length;
    if (keptImages + newImages.length > 10) e.images = 'Maximo 10 imagenes por producto.';
    return e;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setServerError('');
    const found = validate();
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    const data = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (key === 'sale_percentage' && !form.is_on_sale) return;
      data.append(key, typeof value === 'boolean' ? String(value) : value.trim());
    });
    newImages.forEach((file) => data.append('images', file));
    removeIds.forEach((id) => data.append('remove_image_ids', id));
    if (primaryId && !removeIds.includes(primaryId)) data.append('primary_image_id', primaryId);

    setSubmitting(true);
    try {
      const saved = product
        ? await adminUpdateProduct(product.id, data)
        : await adminCreateProduct(data);
      setNewImages([]);
      setRemoveIds([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (!product) setForm(initialState());
      onSaved(saved);
    } catch (err: unknown) {
      setServerError(err instanceof Error && !err.message.startsWith('API error')
        ? err.message
        : 'No se pudo guardar el producto. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const fieldError = (key: string) =>
    errors[key] ? <p className="mt-1 text-xs text-red-600" role="alert">{errors[key]}</p> : null;

  const errorRing = (key: string) => (errors[key] ? ' border-red-500 focus:ring-red-500' : '');

  if (optionsError) {
    return <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{optionsError}</div>;
  }
  if (!options) {
    return (
      <div className={`${adminCardClass} p-6 animate-pulse space-y-4`}>
        {[1, 2, 3, 4].map((i) => <div key={i} className="h-10 bg-[var(--color-bg-alt)] rounded" />)}
      </div>
    );
  }

  const select = (key: 'category_id' | 'franchise_id' | 'brand_id', label: string, items: { id: string; name: string }[]) => (
    <div>
      <label htmlFor={key} className={labelClass}>{label} *</label>
      <select id={key} className={inputClass + errorRing(key)} value={form[key]} onChange={(e) => set(key, e.target.value)}>
        <option value="">-- Seleccionar --</option>
        {items.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
      {fieldError(key)}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className={`${adminCardClass} p-6 space-y-5`}>
      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700" role="alert">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <label htmlFor="name" className={labelClass}>Nombre *</label>
          <input id="name" className={inputClass + errorRing('name')} value={form.name} onChange={(e) => set('name', e.target.value)} maxLength={255} />
          {fieldError('name')}
        </div>
        <div>
          <label htmlFor="sku" className={labelClass}>SKU *</label>
          <input id="sku" className={inputClass + errorRing('sku')} value={form.sku} onChange={(e) => set('sku', e.target.value)} maxLength={50} />
          {fieldError('sku')}
        </div>
      </div>

      <div>
        <label htmlFor="short_description" className={labelClass}>Descripcion corta</label>
        <input id="short_description" className={inputClass} value={form.short_description} onChange={(e) => set('short_description', e.target.value)} maxLength={500} />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>Descripcion</label>
        <textarea id="description" className={`${inputClass} min-h-[110px] resize-y`} value={form.description} onChange={(e) => set('description', e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {select('category_id', 'Categoria', options.categories)}
        {select('franchise_id', 'Franquicia', options.franchises)}
        {select('brand_id', 'Marca', options.brands)}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="base_price" className={labelClass}>Precio (COP) *</label>
          <input id="base_price" type="number" min="0" step="1" inputMode="numeric" className={inputClass + errorRing('base_price')} value={form.base_price} onChange={(e) => set('base_price', e.target.value)} />
          {fieldError('base_price')}
        </div>
        <div>
          <label htmlFor="compare_price" className={labelClass}>Precio antes (COP)</label>
          <input id="compare_price" type="number" min="0" step="1" inputMode="numeric" className={inputClass + errorRing('compare_price')} value={form.compare_price} onChange={(e) => set('compare_price', e.target.value)} />
          {fieldError('compare_price') ?? <p className="mt-1 text-xs text-[var(--color-text-muted)]">Opcional. Se muestra tachado.</p>}
        </div>
        <div>
          <label htmlFor="stock" className={labelClass}>Stock *</label>
          <input id="stock" type="number" min="0" step="1" inputMode="numeric" className={inputClass + errorRing('stock')} value={form.stock} onChange={(e) => set('stock', e.target.value)} disabled={product?.has_variants} />
          {product?.has_variants
            ? <p className="mt-1 text-xs text-[var(--color-text-muted)]">Se calcula con el stock de las variantes.</p>
            : fieldError('stock')}
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>Visibilidad</legend>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            ['is_active', 'Activo (visible en tienda)'],
            ['is_featured', 'Destacado'],
            ['is_new', 'Novedad'],
            ['is_on_sale', 'En oferta'],
          ] as const).map(([key, label]) => (
            <label key={key} className="flex items-center gap-2 text-sm text-[var(--color-text)] cursor-pointer">
              <input type="checkbox" checked={form[key]} onChange={(e) => set(key, e.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {form.is_on_sale && (
        <div className="max-w-xs">
          <label htmlFor="sale_percentage" className={labelClass}>Descuento (%) *</label>
          <input id="sale_percentage" type="number" min="1" max="100" step="1" className={inputClass + errorRing('sale_percentage')} value={form.sale_percentage} onChange={(e) => set('sale_percentage', e.target.value)} />
          {fieldError('sale_percentage')}
        </div>
      )}

      <div>
        <span className={labelClass}>Imagenes</span>
        {product && product.images.length > 0 && (
          <ul className="mb-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {product.images.map((img) => {
              const removed = removeIds.includes(img.id);
              return (
                <li key={img.id} className={`rounded-lg border border-[var(--color-border)] p-2 ${removed ? 'opacity-40' : ''}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.image} alt={img.alt_text || form.name} className="aspect-square w-full rounded object-cover bg-[var(--color-bg-alt)]" />
                  <label className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-text)]">
                    <input type="radio" name="primary" checked={primaryId === img.id} disabled={removed} onChange={() => setPrimaryId(img.id)} className="accent-[var(--color-primary)]" />
                    Principal
                  </label>
                  <label className="mt-1 flex items-center gap-1.5 text-xs text-red-600">
                    <input
                      type="checkbox"
                      checked={removed}
                      onChange={(e) => setRemoveIds((prev) => e.target.checked ? [...prev, img.id] : prev.filter((id) => id !== img.id))}
                    />
                    Eliminar
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className={inputClass + errorRing('images')}
          onChange={(e) => {
            setNewImages(Array.from(e.target.files ?? []));
            setErrors((prev) => ({ ...prev, images: undefined }));
          }}
        />
        {fieldError('images') ?? (
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            JPG, PNG o WEBP, maximo {MAX_IMAGE_MB} MB cada una.{' '}
            {isEdit ? 'Las nuevas se agregan a las actuales.' : 'La primera sera la imagen principal.'}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-[var(--color-primary)] text-white font-semibold text-sm hover:bg-[var(--color-primary-hover)] transition-colors disabled:opacity-50"
        >
          {submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </div>
    </form>
  );
}
