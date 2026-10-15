'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import Link from 'next/link';
import { AlertCircle, ImagePlus, RotateCcw, Star, Trash2, X } from 'lucide-react';
import { adminCreateProduct, adminUpdateProduct, getAdminOptions } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { AdminOptions, AdminProduct } from '@/types/admin';
import { inputClass, panelClass, primaryButtonClass, textButtonClass } from './productUi';

const labelClass = 'mb-1.5 block text-sm font-semibold text-[var(--color-text)]';
const helpClass = 'mt-1.5 text-sm text-[var(--color-text-muted)]';
const MAX_IMAGE_MB = 5;
const MAX_IMAGES = 10;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const errorRing = 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[color-mix(in_oklab,var(--color-error)_30%,transparent)]';

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

type FormState = ReturnType<typeof initialState>;

function Section({ title, description, children, id }: { title: string; description?: string; children: ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className={cn(panelClass, 'p-5 sm:p-6')}>
      <h2 id={id} className="text-lg font-semibold leading-tight text-[var(--color-text)]">{title}</h2>
      {description && <p className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function Toggle({ id, checked, onChange, label, help }: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  help?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="min-w-0 cursor-pointer py-0.5">
        <span className="block text-sm font-semibold text-[var(--color-text)]">{label}</span>
        {help && <span className="mt-0.5 block text-sm text-[var(--color-text-muted)]">{help}</span>}
      </label>
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="relative mt-0.5 h-6 w-11 shrink-0 cursor-pointer appearance-none rounded-full bg-[color-mix(in_oklab,var(--color-text)_22%,transparent)] transition-colors before:absolute before:left-0.5 before:top-0.5 before:h-5 before:w-5 before:rounded-full before:bg-white before:shadow-sm before:transition-transform checked:bg-[var(--color-primary)] checked:before:translate-x-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-card)]"
      />
    </div>
  );
}

function MoneyInput({ id, value, onChange, invalid, describedBy }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid: boolean;
  describedBy?: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-base text-[var(--color-text-muted)]" aria-hidden>$</span>
      <input
        id={id}
        type="number"
        min="0"
        step="1"
        inputMode="numeric"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        className={cn(inputClass, 'pl-7 tabular-nums', invalid && errorRing)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
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

  const previews = useMemo(() => newImages.map((file) => URL.createObjectURL(file)), [newImages]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);

  useEffect(() => {
    getAdminOptions()
      .then(setOptions)
      .catch(() => setOptionsError('No se pudieron cargar categorías, franquicias y marcas.'));
  }, []);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const existingImages = product?.images ?? [];
  const keptImages = existingImages.filter((img) => !removeIds.includes(img.id));
  const totalImages = keptImages.length + newImages.length;

  const validate = (): Errors => {
    const e: Errors = {};
    if (!form.name.trim()) e.name = 'El nombre es obligatorio.';
    if (!form.sku.trim()) e.sku = 'El SKU es obligatorio.';
    if (!form.category_id) e.category_id = 'Selecciona una categoría.';
    if (!form.franchise_id) e.franchise_id = 'Selecciona una franquicia.';
    if (!form.brand_id) e.brand_id = 'Selecciona una marca.';
    const base = Number(form.base_price);
    if (form.base_price === '' || Number.isNaN(base) || base < 0) e.base_price = 'Ingresa un precio válido.';
    if (form.compare_price !== '' && Number(form.compare_price) <= base) {
      e.compare_price = 'Debe ser mayor que el precio base.';
    }
    const stock = Number(form.stock);
    if (!Number.isInteger(stock) || stock < 0) e.stock = 'El stock debe ser un número entero mayor o igual a 0.';
    if (form.is_on_sale) {
      const pct = Number(form.sale_percentage);
      if (!Number.isInteger(pct) || pct < 1 || pct > 100) e.sale_percentage = 'Entre 1 y 100.';
    }
    const badImage = newImages.find((f) => !ALLOWED_TYPES.includes(f.type) || f.size > MAX_IMAGE_MB * 1024 * 1024);
    if (badImage) e.images = `${badImage.name}: usa JPG, PNG o WEBP de máximo ${MAX_IMAGE_MB} MB.`;
    if (totalImages > MAX_IMAGES) e.images = `Máximo ${MAX_IMAGES} imágenes por producto.`;
    return e;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setServerError('');
    const found = validate();
    setErrors(found);
    const firstInvalid = Object.keys(found).find((k) => found[k]);
    if (firstInvalid) {
      const el = document.getElementById(firstInvalid === 'images' ? 'images-section' : firstInvalid);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) el.focus({ preventScroll: true });
      return;
    }

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
    errors[key] ? (
      <p id={`${key}-error`} className="mt-1.5 flex items-start gap-1.5 text-sm text-[var(--color-error)]" role="alert">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
        {errors[key]}
      </p>
    ) : null;

  const invalid = (key: string) => Boolean(errors[key]);
  const describe = (key: string, help?: boolean) => (errors[key] ? `${key}-error` : help ? `${key}-help` : undefined);

  if (optionsError) {
    return (
      <div className="flex items-start gap-2 rounded-xl bg-[color-mix(in_oklab,var(--color-error)_12%,transparent)] p-4 text-sm text-[var(--color-text)]" role="alert">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-error)]" strokeWidth={1.75} aria-hidden />
        {optionsError}
      </div>
    );
  }
  if (!options) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]" aria-busy="true">
        <div className="space-y-6">
          {[180, 260].map((h) => (
            <div key={h} className={cn(panelClass, 'animate-pulse p-6')} style={{ height: h }}>
              <div className="h-5 w-40 rounded bg-[var(--color-bg-alt)]" />
              <div className="mt-6 h-11 rounded-lg bg-[var(--color-bg-alt)]" />
            </div>
          ))}
        </div>
        <div className="space-y-6">
          {[140, 200].map((h) => (
            <div key={h} className={cn(panelClass, 'animate-pulse p-6')} style={{ height: h }}>
              <div className="h-5 w-24 rounded bg-[var(--color-bg-alt)]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const select = (key: 'category_id' | 'franchise_id' | 'brand_id', label: string, items: { id: string; name: string }[]) => (
    <div>
      <label htmlFor={key} className={labelClass}>{label}</label>
      <select
        id={key}
        aria-invalid={invalid(key) || undefined}
        aria-describedby={describe(key)}
        className={cn(inputClass, invalid(key) && errorRing)}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
      >
        <option value="">Seleccionar</option>
        {items.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
      {fieldError(key)}
    </div>
  );

  const errorCount = Object.values(errors).filter(Boolean).length;
  // When nothing existing remains, the first new upload becomes the cover.
  const firstNewIsPrimary = !keptImages.some((img) => img.id === primaryId);

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && (
        <div className="mb-6 flex items-start gap-2 rounded-xl bg-[color-mix(in_oklab,var(--color-error)_12%,transparent)] p-4 text-sm text-[var(--color-text)]" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-error)]" strokeWidth={1.75} aria-hidden />
          {serverError}
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <Section id="info-title" title="Información" description="Lo que ve el cliente en la ficha del producto.">
            <div>
              <label htmlFor="name" className={labelClass}>Nombre</label>
              <input
                id="name"
                aria-invalid={invalid('name') || undefined}
                aria-describedby={describe('name')}
                className={cn(inputClass, invalid('name') && errorRing)}
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                maxLength={255}
              />
              {fieldError('name')}
            </div>
            <div>
              <label htmlFor="short_description" className={labelClass}>
                Descripción corta <span className="font-normal text-[var(--color-text-muted)]">(opcional)</span>
              </label>
              <input
                id="short_description"
                aria-describedby="short_description-help"
                className={inputClass}
                value={form.short_description}
                onChange={(e) => set('short_description', e.target.value)}
                maxLength={500}
              />
              <p id="short_description-help" className={helpClass}>Una línea que aparece bajo el nombre en el catálogo.</p>
            </div>
            <div>
              <label htmlFor="description" className={labelClass}>
                Descripción <span className="font-normal text-[var(--color-text-muted)]">(opcional)</span>
              </label>
              <textarea
                id="description"
                className={cn(inputClass, 'min-h-40 resize-y leading-relaxed')}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </div>
          </Section>

          <section id="images-section" aria-labelledby="images-title" className={cn(panelClass, 'p-5 sm:p-6')}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="images-title" className="text-lg font-semibold leading-tight text-[var(--color-text)]">Imágenes</h2>
              <span className={cn('text-sm tabular-nums', totalImages > MAX_IMAGES ? 'font-semibold text-[var(--color-error)]' : 'text-[var(--color-text-muted)]')}>
                {totalImages} de {MAX_IMAGES}
              </span>
            </div>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">
              JPG, PNG o WEBP de máximo {MAX_IMAGE_MB} MB. La imagen principal es la portada en la tienda.
            </p>

            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {existingImages.map((img) => {
                const removed = removeIds.includes(img.id);
                const isPrimary = primaryId === img.id && !removed;
                return (
                  <li key={img.id} className="group relative">
                    <div className={cn(
                      'relative aspect-square overflow-hidden rounded-lg bg-[var(--color-bg-alt)]',
                      isPrimary && 'ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-bg-card)]'
                    )}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.image} alt={img.alt_text || form.name} className={cn('h-full w-full object-contain', removed && 'opacity-30 grayscale')} />
                      {isPrimary && (
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)] px-2 py-1 text-xs font-semibold leading-none text-[var(--color-on-primary)]">
                          <Star className="h-3 w-3" strokeWidth={1.75} fill="currentColor" aria-hidden />
                          Principal
                        </span>
                      )}
                      {removed && (
                        <span className="absolute inset-x-2 top-2 rounded-full bg-[var(--color-bg-card)] px-2 py-1 text-center text-xs font-semibold text-[var(--color-error)]">
                          Se quitará al guardar
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-1">
                      {removed ? (
                        <button
                          type="button"
                          onClick={() => setRemoveIds((prev) => prev.filter((id) => id !== img.id))}
                          className={cn(textButtonClass, '-ml-3 gap-1.5')}
                        >
                          <RotateCcw className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                          Restaurar
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setPrimaryId(img.id)}
                            aria-pressed={isPrimary}
                            disabled={isPrimary}
                            className={cn(textButtonClass, '-ml-3 text-[var(--color-text-muted)] disabled:cursor-default disabled:hover:bg-transparent')}
                          >
                            {isPrimary ? 'Portada' : 'Hacer principal'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setRemoveIds((prev) => [...prev, img.id])}
                            aria-label={`Quitar imagen ${img.alt_text || ''}`.trim()}
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}

              {newImages.map((file, i) => (
                <li key={`${file.name}-${file.lastModified}-${i}`} className="relative">
                  <div className={cn(
                    'relative aspect-square overflow-hidden rounded-lg bg-[var(--color-bg-alt)]',
                    firstNewIsPrimary && i === 0 && 'ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-bg-card)]'
                  )}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={previews[i]} alt={file.name} className="h-full w-full object-contain" />
                    <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-[var(--color-bg-card)] px-2 py-1 text-xs font-semibold leading-none text-[var(--color-text)]">
                      {firstNewIsPrimary && i === 0 ? (
                        <>
                          <Star className="h-3 w-3 text-[var(--color-primary-text)]" strokeWidth={1.75} fill="currentColor" aria-hidden />
                          Principal
                        </>
                      ) : 'Nueva'}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <span className="min-w-0 truncate text-xs text-[var(--color-text-muted)]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => {
                        setNewImages((prev) => prev.filter((_, j) => j !== i));
                        setErrors((prev) => ({ ...prev, images: undefined }));
                      }}
                      aria-label={`Descartar ${file.name}`}
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-alt)] hover:text-[var(--color-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                    >
                      <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    </button>
                  </div>
                </li>
              ))}

              <li>
                <label
                  htmlFor="images"
                  className={cn(
                    'flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 text-center text-sm font-semibold transition-colors focus-within:ring-2 focus-within:ring-[var(--color-primary)]',
                    invalid('images')
                      ? 'border-[var(--color-error)] text-[var(--color-error)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-text)]'
                  )}
                >
                  <ImagePlus className="h-6 w-6" strokeWidth={1.75} aria-hidden />
                  Agregar imágenes
                  <input
                    id="images"
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    aria-describedby={describe('images')}
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      setNewImages((prev) => [...prev, ...files]);
                      setErrors((prev) => ({ ...prev, images: undefined }));
                      e.target.value = '';
                    }}
                  />
                </label>
              </li>
            </ul>
            {fieldError('images')}
          </section>
        </div>

        <div className="min-w-0 space-y-6">
          <Section id="status-title" title="Estado">
            <Toggle
              id="is_active"
              checked={form.is_active}
              onChange={(v) => set('is_active', v)}
              label="Activo"
              help={form.is_active ? 'Visible y a la venta en la tienda.' : 'Oculto en la tienda; los pedidos existentes no cambian.'}
            />
            <Toggle id="is_featured" checked={form.is_featured} onChange={(v) => set('is_featured', v)} label="Destacado" help="Aparece en la portada." />
            <Toggle id="is_new" checked={form.is_new} onChange={(v) => set('is_new', v)} label="Novedad" help="Lleva la etiqueta Nuevo." />
          </Section>

          <Section id="price-title" title="Precio" description="Pesos colombianos, sin decimales.">
            <div>
              <label htmlFor="base_price" className={labelClass}>Precio</label>
              <MoneyInput id="base_price" value={form.base_price} onChange={(v) => set('base_price', v)} invalid={invalid('base_price')} describedBy={describe('base_price')} />
              {fieldError('base_price')}
            </div>
            <div>
              <label htmlFor="compare_price" className={labelClass}>
                Precio antes <span className="font-normal text-[var(--color-text-muted)]">(opcional)</span>
              </label>
              <MoneyInput id="compare_price" value={form.compare_price} onChange={(v) => set('compare_price', v)} invalid={invalid('compare_price')} describedBy={describe('compare_price', true)} />
              {fieldError('compare_price') ?? <p id="compare_price-help" className={helpClass}>Se muestra tachado junto al precio.</p>}
            </div>
            <Toggle id="is_on_sale" checked={form.is_on_sale} onChange={(v) => set('is_on_sale', v)} label="En oferta" help="Aplica un descuento porcentual." />
            {form.is_on_sale && (
              <div>
                <label htmlFor="sale_percentage" className={labelClass}>Descuento</label>
                <div className="relative max-w-36">
                  <input
                    id="sale_percentage"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    inputMode="numeric"
                    aria-invalid={invalid('sale_percentage') || undefined}
                    aria-describedby={describe('sale_percentage')}
                    className={cn(inputClass, 'pr-8 tabular-nums', invalid('sale_percentage') && errorRing)}
                    value={form.sale_percentage}
                    onChange={(e) => set('sale_percentage', e.target.value)}
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-base text-[var(--color-text-muted)]" aria-hidden>%</span>
                </div>
                {fieldError('sale_percentage')}
              </div>
            )}
          </Section>

          <Section id="stock-title" title="Inventario">
            <div>
              <label htmlFor="sku" className={labelClass}>SKU</label>
              <input
                id="sku"
                aria-invalid={invalid('sku') || undefined}
                aria-describedby={describe('sku', true)}
                className={cn(inputClass, invalid('sku') && errorRing)}
                value={form.sku}
                onChange={(e) => set('sku', e.target.value)}
                maxLength={50}
                autoCapitalize="characters"
                spellCheck={false}
              />
              {fieldError('sku') ?? <p id="sku-help" className={helpClass}>Código único; también sirve para buscar.</p>}
            </div>
            <div>
              <label htmlFor="stock" className={labelClass}>Unidades disponibles</label>
              <input
                id="stock"
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                aria-invalid={invalid('stock') || undefined}
                aria-describedby={product?.has_variants ? 'stock-help' : describe('stock')}
                className={cn(inputClass, 'tabular-nums', invalid('stock') && errorRing)}
                value={form.stock}
                onChange={(e) => set('stock', e.target.value)}
                disabled={product?.has_variants}
              />
              {product?.has_variants
                ? <p id="stock-help" className={helpClass}>Se calcula con el stock de las variantes.</p>
                : fieldError('stock')}
            </div>
          </Section>

          <Section id="org-title" title="Organización" description="Define dónde aparece en los filtros del catálogo.">
            {select('category_id', 'Categoría', options.categories)}
            {select('franchise_id', 'Franquicia', options.franchises)}
            {select('brand_id', 'Marca', options.brands)}
          </Section>
        </div>
      </div>

      {/* The action bar follows the scroll so saving never needs a trip to the bottom. */}
      <div className="sticky bottom-0 z-20 mt-6 rounded-t-xl border border-b-0 border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 shadow-[0_-6px_16px_-10px_rgba(26,26,46,0.25)]">
        <div className="flex flex-wrap items-center justify-end gap-3">
          {errorCount > 0 && (
            <p className="mr-auto flex items-center gap-1.5 text-sm font-semibold text-[var(--color-error)]" role="status">
              <AlertCircle className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
              {errorCount === 1 ? 'Revisa 1 campo' : `Revisa ${errorCount} campos`}
            </p>
          )}
          <Link href="/panel/productos" className={textButtonClass}>Cancelar</Link>
          <button type="submit" disabled={submitting} aria-busy={submitting} className={cn(primaryButtonClass, 'px-7')}>
            {submitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </div>
    </form>
  );
}
