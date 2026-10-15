'use client';

import { useState, useMemo, useCallback, useId } from 'react';
import { ChevronDown, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import type { Franchise, Brand } from '@/types/product';

const FRANCHISE_PREVIEW_COUNT = 8;

const fieldClass =
  'w-full min-h-11 lg:min-h-10 px-3 text-base lg:text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';

const optionRowClass =
  'flex items-center gap-3 min-h-11 lg:min-h-9 text-base lg:text-sm text-[var(--color-text)] cursor-pointer rounded-md px-1 -mx-1 hover:bg-[var(--color-bg-alt)] transition-colors';

const checkboxClass = 'w-4 h-4 shrink-0 accent-[var(--color-primary)]';

interface FilterSection {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = true, children }: FilterSection) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="py-3 first:pt-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center justify-between w-full min-h-11 text-base font-semibold text-[var(--color-text)]"
      >
        {title}
        <ChevronDown
          strokeWidth={1.75}
          className={cn('w-4 h-4 transition-transform', open && 'rotate-180')}
        />
      </button>
      {open && <div className="mt-1">{children}</div>}
    </section>
  );
}

export interface FilterValues {
  franchise: string[];
  brand: string[];
  min_price: string;
  max_price: string;
  in_stock: boolean;
  ordering: string;
  page: number;
}

interface ProductFiltersProps {
  franchises: Franchise[];
  brands: Brand[];
  filters: FilterValues;
  onFilterChange: (filters: Partial<FilterValues>) => void;
  onClearAll: () => void;
  className?: string;
}

export function ProductFilters({
  franchises,
  brands,
  filters,
  onFilterChange,
  onClearAll,
  className,
}: ProductFiltersProps) {
  const [franchiseSearch, setFranchiseSearch] = useState('');
  const [showAllFranchises, setShowAllFranchises] = useState(false);
  const availabilityName = useId();

  const filteredFranchises = useMemo(() => {
    if (!franchiseSearch.trim()) return franchises;
    const q = franchiseSearch.toLowerCase();
    return franchises.filter((f) => f.name.toLowerCase().includes(q));
  }, [franchises, franchiseSearch]);

  // Selected franchises stay visible even when the list is collapsed.
  const visibleFranchises = useMemo(() => {
    if (showAllFranchises || franchiseSearch.trim()) return filteredFranchises;
    const head = filteredFranchises.slice(0, FRANCHISE_PREVIEW_COUNT);
    const selectedTail = filteredFranchises
      .slice(FRANCHISE_PREVIEW_COUNT)
      .filter((f) => filters.franchise.includes(f.slug));
    return [...head, ...selectedTail];
  }, [filteredFranchises, showAllFranchises, franchiseSearch, filters.franchise]);

  const canToggleFranchises =
    !franchiseSearch.trim() && filteredFranchises.length > FRANCHISE_PREVIEW_COUNT;

  const handleCheckbox = useCallback(
    (key: 'franchise' | 'brand', slug: string, checked: boolean) => {
      const current = filters[key];
      const updated = checked ? [...current, slug] : current.filter((s) => s !== slug);
      onFilterChange({ [key]: updated, page: 1 });
    },
    [filters, onFilterChange]
  );

  const handlePriceChange = useCallback(
    (field: 'min_price' | 'max_price', value: string) => {
      const sanitized = value.replace(/\D/g, '');
      onFilterChange({ [field]: sanitized, page: 1 });
    },
    [onFilterChange]
  );

  return (
    <div className={cn('flex flex-col', className)}>
      {franchises.length > 1 && (
        <CollapsibleSection title="Franquicia">
          <div className="relative mb-2">
            <Search
              strokeWidth={1.75}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]"
            />
            <input
              type="search"
              placeholder="Buscar franquicia"
              aria-label="Buscar franquicia"
              value={franchiseSearch}
              onChange={(e) => setFranchiseSearch(e.target.value)}
              className={cn(fieldClass, 'pl-9')}
            />
          </div>
          <div className="flex flex-col">
            {visibleFranchises.map((f) => (
              <label key={f.id} className={optionRowClass}>
                <input
                  type="checkbox"
                  checked={filters.franchise.includes(f.slug)}
                  onChange={(e) => handleCheckbox('franchise', f.slug, e.target.checked)}
                  className={checkboxClass}
                />
                <span className="flex-1 truncate">{f.name}</span>
              </label>
            ))}
            {filteredFranchises.length === 0 && (
              <p className="py-2 text-sm text-[var(--color-text-muted)]">
                Ninguna franquicia coincide con tu búsqueda.
              </p>
            )}
          </div>
          {canToggleFranchises && (
            <button
              type="button"
              onClick={() => setShowAllFranchises((v) => !v)}
              aria-expanded={showAllFranchises}
              className="mt-1 min-h-11 lg:min-h-9 text-sm font-semibold text-[var(--color-primary-text)] hover:underline underline-offset-4"
            >
              {showAllFranchises ? 'Ver menos' : `Ver todas (${filteredFranchises.length})`}
            </button>
          )}
        </CollapsibleSection>
      )}

      {brands.length > 1 && (
        <CollapsibleSection title="Marca">
          <div className="flex flex-col">
            {brands.map((b) => (
              <label key={b.id} className={optionRowClass}>
                <input
                  type="checkbox"
                  checked={filters.brand.includes(b.slug)}
                  onChange={(e) => handleCheckbox('brand', b.slug, e.target.checked)}
                  className={checkboxClass}
                />
                <span className="flex-1 truncate">{b.name}</span>
              </label>
            ))}
          </div>
        </CollapsibleSection>
      )}

      <CollapsibleSection title="Precio (COP)">
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Mínimo"
            aria-label="Precio mínimo"
            value={filters.min_price}
            onChange={(e) => handlePriceChange('min_price', e.target.value)}
            className={fieldClass}
          />
          <span className="text-sm text-[var(--color-text-muted)] shrink-0" aria-hidden="true">
            a
          </span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Máximo"
            aria-label="Precio máximo"
            value={filters.max_price}
            onChange={(e) => handlePriceChange('max_price', e.target.value)}
            className={fieldClass}
          />
        </div>
        {(filters.min_price || filters.max_price) && (
          <p className="text-sm text-[var(--color-text-muted)] mt-2 tabular-nums">
            {filters.min_price ? formatPrice(filters.min_price) : '$0'} a{' '}
            {filters.max_price ? formatPrice(filters.max_price) : 'sin límite'}
          </p>
        )}
      </CollapsibleSection>

      <CollapsibleSection title="Disponibilidad">
        <div className="flex flex-col" role="radiogroup" aria-label="Disponibilidad">
          <label className={optionRowClass}>
            <input
              type="radio"
              name={availabilityName}
              checked={!filters.in_stock}
              onChange={() => onFilterChange({ in_stock: false, page: 1 })}
              className={checkboxClass}
            />
            <span>Todos, incluidos agotados</span>
          </label>
          <label className={optionRowClass}>
            <input
              type="radio"
              name={availabilityName}
              checked={filters.in_stock}
              onChange={() => onFilterChange({ in_stock: true, page: 1 })}
              className={checkboxClass}
            />
            <span>Solo disponibles</span>
          </label>
        </div>
      </CollapsibleSection>

      <button
        type="button"
        onClick={onClearAll}
        className="mt-4 min-h-11 w-full rounded-full bg-[var(--color-bg-alt)] text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-border)] transition-colors"
      >
        Limpiar filtros
      </button>
    </div>
  );
}

interface ActiveFiltersProps {
  filters: FilterValues;
  franchises: Franchise[];
  brands: Brand[];
  onRemove: (key: string, value?: string) => void;
  onClearAll: () => void;
}

export function ActiveFilterChips({
  filters,
  franchises,
  brands,
  onRemove,
  onClearAll,
}: ActiveFiltersProps) {
  const chips: { label: string; key: string; value?: string }[] = [];

  filters.franchise.forEach((slug) => {
    const fr = franchises.find((f) => f.slug === slug);
    chips.push({ label: fr?.name || slug, key: 'franchise', value: slug });
  });
  filters.brand.forEach((slug) => {
    const br = brands.find((b) => b.slug === slug);
    chips.push({ label: br?.name || slug, key: 'brand', value: slug });
  });
  if (filters.min_price) {
    chips.push({ label: `Desde ${formatPrice(filters.min_price)}`, key: 'min_price' });
  }
  if (filters.max_price) {
    chips.push({ label: `Hasta ${formatPrice(filters.max_price)}`, key: 'max_price' });
  }
  if (filters.in_stock) {
    chips.push({ label: 'Solo disponibles', key: 'in_stock' });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {chips.map((chip, i) => (
        <button
          key={`${chip.key}-${chip.value || i}`}
          type="button"
          onClick={() => onRemove(chip.key, chip.value)}
          aria-label={`Quitar filtro ${chip.label}`}
          className="inline-flex items-center gap-1.5 min-h-11 lg:min-h-9 pl-4 pr-3 text-sm font-medium bg-[var(--color-bg-alt)] text-[var(--color-text)] rounded-full hover:bg-[var(--color-border)] transition-colors"
        >
          {chip.label}
          <X strokeWidth={1.75} className="w-4 h-4" />
        </button>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="min-h-11 lg:min-h-9 px-2 text-sm font-semibold text-[var(--color-primary-text)] hover:underline underline-offset-4"
      >
        Limpiar todos
      </button>
    </div>
  );
}
