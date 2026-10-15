'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/utils';
import type { Franchise, Brand } from '@/types/product';

interface FilterSection {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = true, children }: FilterSection) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-[var(--color-border)] pb-4 mb-4 last:border-b-0 last:mb-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-semibold text-[var(--color-text)] mb-2"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {open && children}
    </div>
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

  const filteredFranchises = useMemo(() => {
    if (!franchiseSearch.trim()) return franchises;
    const q = franchiseSearch.toLowerCase();
    return franchises.filter((f) => f.name.toLowerCase().includes(q));
  }, [franchises, franchiseSearch]);

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
      // Only allow digits
      const sanitized = value.replace(/\D/g, '');
      onFilterChange({ [field]: sanitized, page: 1 });
    },
    [onFilterChange]
  );

  return (
    <div className={cn('bg-[var(--color-bg-card)] rounded-lg p-4', className)}>
      {/* Franchises */}
      <CollapsibleSection title="Franquicia">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Buscar franquicia..."
            value={franchiseSearch}
            onChange={(e) => setFranchiseSearch(e.target.value)}
            className="w-full pl-7 pr-2 py-1.5 text-xs border border-[var(--color-border)] rounded bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {filteredFranchises.map((f) => (
            <label
              key={f.id}
              className="flex items-center gap-2 text-sm text-[var(--color-text)] cursor-pointer hover:text-[var(--color-primary)]"
            >
              <input
                type="checkbox"
                checked={filters.franchise.includes(f.slug)}
                onChange={(e) => handleCheckbox('franchise', f.slug, e.target.checked)}
                className="rounded border-[var(--color-border)] text-[var(--color-primary)] accent-[var(--color-primary)]"
              />
              <span className="flex-1 truncate">{f.name}</span>
            </label>
          ))}
          {filteredFranchises.length === 0 && (
            <p className="text-xs text-[var(--color-text-muted)]">Sin resultados</p>
          )}
        </div>
      </CollapsibleSection>

      {/* Brands */}
      <CollapsibleSection title="Marca">
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {brands.map((b) => (
            <label
              key={b.id}
              className="flex items-center gap-2 text-sm text-[var(--color-text)] cursor-pointer hover:text-[var(--color-primary)]"
            >
              <input
                type="checkbox"
                checked={filters.brand.includes(b.slug)}
                onChange={(e) => handleCheckbox('brand', b.slug, e.target.checked)}
                className="rounded border-[var(--color-border)] text-[var(--color-primary)] accent-[var(--color-primary)]"
              />
              <span className="flex-1 truncate">{b.name}</span>
            </label>
          ))}
          {brands.length === 0 && (
            <p className="text-xs text-[var(--color-text-muted)]">Sin marcas</p>
          )}
        </div>
      </CollapsibleSection>

      {/* Price range */}
      <CollapsibleSection title="Precio (COP)">
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Min"
            value={filters.min_price}
            onChange={(e) => handlePriceChange('min_price', e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
          <span className="text-xs text-[var(--color-text-muted)] shrink-0">—</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Max"
            value={filters.max_price}
            onChange={(e) => handlePriceChange('max_price', e.target.value)}
            className="w-full px-2 py-1.5 text-xs border border-[var(--color-border)] rounded bg-[var(--color-bg)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
          />
        </div>
        {(filters.min_price || filters.max_price) && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1.5">
            {filters.min_price ? formatPrice(filters.min_price) : '$0'} — {filters.max_price ? formatPrice(filters.max_price) : '...'}
          </p>
        )}
      </CollapsibleSection>

      {/* Availability */}
      <CollapsibleSection title="Disponibilidad">
        <div className="space-y-1.5">
          <label className="flex items-center gap-2 text-sm text-[var(--color-text)] cursor-pointer hover:text-[var(--color-primary)]">
            <input
              type="checkbox"
              checked={filters.in_stock}
              onChange={(e) => onFilterChange({ in_stock: e.target.checked, page: 1 })}
              className="rounded border-[var(--color-border)] text-[var(--color-primary)] accent-[var(--color-primary)]"
            />
            <span>En stock</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--color-text)] cursor-pointer hover:text-[var(--color-primary)]">
            <input
              type="checkbox"
              checked={!filters.in_stock}
              onChange={(e) => onFilterChange({ in_stock: !e.target.checked, page: 1 })}
              className="rounded border-[var(--color-border)] text-[var(--color-primary)] accent-[var(--color-primary)]"
            />
            <span>Incluir agotados</span>
          </label>
        </div>
      </CollapsibleSection>

      {/* Clear all */}
      <button
        type="button"
        onClick={onClearAll}
        className="w-full mt-2 py-2 text-sm font-medium text-[var(--color-primary)] border border-[var(--color-primary)] rounded hover:bg-[var(--color-primary)] hover:text-white transition-colors"
      >
        Limpiar filtros
      </button>
    </div>
  );
}

/* Active filter chips */
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
    chips.push({ label: `Min: ${formatPrice(filters.min_price)}`, key: 'min_price' });
  }
  if (filters.max_price) {
    chips.push({ label: `Max: ${formatPrice(filters.max_price)}`, key: 'max_price' });
  }
  if (filters.in_stock) {
    chips.push({ label: 'En stock', key: 'in_stock' });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      {chips.map((chip, i) => (
        <span
          key={`${chip.key}-${chip.value || i}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[var(--color-bg-alt)] text-[var(--color-text)] rounded-full border border-[var(--color-border)]"
        >
          {chip.label}
          <button
            type="button"
            onClick={() => onRemove(chip.key, chip.value)}
            className="hover:text-[var(--color-error)] transition-colors"
            aria-label={`Quitar filtro ${chip.label}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <button
        type="button"
        onClick={onClearAll}
        className="text-xs text-[var(--color-primary)] hover:underline font-medium"
      >
        Limpiar todos
      </button>
    </div>
  );
}
