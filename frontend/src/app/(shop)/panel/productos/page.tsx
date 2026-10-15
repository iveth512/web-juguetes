'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, PackageOpen, Plus, Search, SearchX, X } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DeleteProductControl } from '@/components/admin/DeleteProductControl';
import {
  ProductThumb,
  StatusChip,
  StockChip,
  inputClass,
  panelClass,
  primaryButtonClass,
  secondaryButtonClass,
  textButtonClass,
} from '@/components/admin/productUi';
import { adminListProducts } from '@/lib/api';
import { cn, formatPrice } from '@/lib/utils';
import type { AdminProduct } from '@/types/admin';
import type { PaginatedResponse } from '@/types/product';

const PAGE_SIZE = 24;

const VIEWS = [
  { value: '', label: 'Todos' },
  { value: 'activos', label: 'Activos' },
  { value: 'inactivos', label: 'Inactivos' },
  { value: 'bajo_stock', label: 'Stock bajo' },
];

const SORTS = [
  { value: 'recientes', label: 'Más recientes' },
  { value: 'nombre', label: 'Nombre A-Z' },
  { value: 'vendidos', label: 'Más vendidos' },
  { value: 'stock', label: 'Menor stock' },
  { value: 'precio', label: 'Precio menor' },
  { value: '-precio', label: 'Precio mayor' },
];

function deletedNotice(name: string, deactivated: boolean) {
  return deactivated
    ? `"${name}" tiene pedidos, así que se desactivó en lugar de eliminarse.`
    : `"${name}" fue eliminado.`;
}

function Price({ product }: { product: AdminProduct }) {
  const compare = product.compare_price && Number(product.compare_price) > Number(product.base_price)
    ? product.compare_price
    : null;
  return (
    <span className="inline-flex flex-col items-end leading-tight tabular-nums">
      <span className="font-semibold text-[var(--color-text)]">{formatPrice(product.base_price)}</span>
      {compare && (
        <span className="text-xs text-[var(--color-text-muted)] line-through">{formatPrice(compare)}</span>
      )}
    </span>
  );
}

function Stock({ product }: { product: AdminProduct }) {
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap">
      <span className="w-8 text-right tabular-nums text-[var(--color-text)]">{product.stock}</span>
      <StockChip product={product} />
    </span>
  );
}

function AdminProductList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState(searchParams.get('estado') ?? '');
  const [orden, setOrden] = useState('recientes');
  const [page, setPage] = useState(1);
  const [reload, setReload] = useState(0);
  // Results remember the query they answer; the last list stays visible while the next one loads.
  const [result, setResult] = useState<{ key: string; data?: PaginatedResponse<AdminProduct>; error?: string } | null>(null);
  // A delete from the edit page lands here with its result in the URL.
  const [notice, setNotice] = useState(() => {
    const desactivado = searchParams.get('desactivado');
    const eliminado = searchParams.get('eliminado');
    if (desactivado) return deletedNotice(desactivado, true);
    if (eliminado) return deletedNotice(eliminado, false);
    return '';
  });

  useEffect(() => {
    if (searchParams.has('eliminado') || searchParams.has('desactivado')) {
      router.replace('/panel/productos', { scroll: false });
    }
  }, [searchParams, router]);

  const key = JSON.stringify([search, estado, orden, page, reload]);
  useEffect(() => {
    let cancelled = false;
    adminListProducts({ q: search, estado, orden, page })
      .then((data) => !cancelled && setResult({ key, data }))
      .catch(() => !cancelled && setResult({ key, error: 'No se pudieron cargar los productos.' }));
    return () => { cancelled = true; };
  }, [key, search, estado, orden, page]);

  const data = result?.data ?? null;
  const error = result?.key === key ? result.error ?? '' : '';
  const pending = result !== null && result.key !== key;
  const load = () => setReload((n) => n + 1);

  // Debounced search box
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const filtered = Boolean(search || estado);
  const clearFilters = () => {
    setQ('');
    setSearch('');
    setEstado('');
    setPage(1);
  };

  const editHref = (p: AdminProduct) => `/panel/productos/${p.id}`;
  const actions = (p: AdminProduct) => (
    <>
      <Link href={editHref(p)} className={textButtonClass}>Editar</Link>
      <DeleteProductControl
        productId={p.id}
        variant="quiet"
        onDeleted={(deactivated) => {
          setNotice(deletedNotice(p.name, deactivated));
          load();
        }}
        onError={setNotice}
      />
    </>
  );

  const count = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const isEmpty = data?.results.length === 0;
  const first = (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(page * PAGE_SIZE, count);

  const emptyState = filtered ? (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <SearchX className="h-8 w-8 text-[var(--color-text-muted)]" strokeWidth={1.75} aria-hidden />
      <p className="mt-3 text-base font-semibold text-[var(--color-text)]">
        {search ? `Ningún producto coincide con «${search}»` : 'Ningún producto en esta vista'}
      </p>
      <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">Prueba con otro nombre o SKU, o quita los filtros para ver todo el catálogo.</p>
      <button type="button" onClick={clearFilters} className={cn(secondaryButtonClass, 'mt-5')}>Limpiar filtros</button>
    </div>
  ) : (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <PackageOpen className="h-8 w-8 text-[var(--color-text-muted)]" strokeWidth={1.75} aria-hidden />
      <p className="mt-3 text-base font-semibold text-[var(--color-text)]">Aún no hay productos</p>
      <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">Crea el primero con su precio, stock e imágenes; aparecerá en la tienda cuando esté activo.</p>
      <Link href="/panel/productos/nuevo" className={cn(primaryButtonClass, 'mt-5')}>
        <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        Nuevo producto
      </Link>
    </div>
  );

  return (
    <>
      {notice && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-xl bg-[var(--color-bg-alt)] py-2 pl-4 pr-2 text-sm text-[var(--color-text)]" role="status">
          <span className="py-2.5">{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label="Cerrar aviso" className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)]">
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      )}

      <section className={cn(panelClass, 'overflow-hidden')} aria-label="Productos">
        {/* Views and toolbar */}
        <div className="border-b border-[var(--color-border)]">
          <div role="tablist" aria-label="Filtrar por estado" className="flex gap-1 px-2 pt-2 sm:px-3">
            {VIEWS.map((v) => {
              const selected = estado === v.value;
              return (
                <button
                  key={v.value || 'todos'}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => { setEstado(v.value); setPage(1); }}
                  className={cn(
                    '-mb-px min-h-11 shrink-0 whitespace-nowrap border-b-2 px-3 text-sm font-semibold transition-colors',
                    selected
                      ? 'border-[var(--color-primary)] text-[var(--color-text)]'
                      : 'border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
                  )}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-3 border-b border-[var(--color-border)] bg-[var(--color-bg-alt)] p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" strokeWidth={1.75} aria-hidden />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre o SKU"
              aria-label="Buscar productos"
              className={cn(inputClass, 'pl-9')}
            />
          </div>
          <div className="flex items-center gap-3 sm:ml-auto">
            <label htmlFor="orden" className="shrink-0 text-sm text-[var(--color-text-muted)]">Ordenar por</label>
            <select id="orden" value={orden} onChange={(e) => { setOrden(e.target.value); setPage(1); }} className={cn(inputClass, 'sm:w-48')}>
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex min-h-10 items-center justify-between gap-3 px-4 text-sm text-[var(--color-text-muted)]" aria-live="polite">
          <span className="tabular-nums">
            {data ? (count === 1 ? '1 producto' : `${count.toLocaleString('es-CO')} productos`) : 'Cargando…'}
            {pending && data ? ', actualizando…' : ''}
          </span>
          {filtered && !isEmpty && (
            <button type="button" onClick={clearFilters} className="font-semibold text-[var(--color-primary-text)] hover:underline">Limpiar filtros</button>
          )}
        </div>

        {error && (
          <div className="mx-3 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[color-mix(in_oklab,var(--color-error)_12%,transparent)] px-4 py-2 text-sm text-[var(--color-text)]" role="alert">
            {error}
            <button type="button" onClick={load} className={textButtonClass}>Reintentar</button>
          </div>
        )}

        {isEmpty && emptyState}

        {/* Below md each product is a card; the table needs the width. */}
        {!isEmpty && (
          <ul className={cn('divide-y divide-[var(--color-border)] border-t border-[var(--color-border)] md:hidden', pending && 'opacity-60')}>
            {!data && !error && [1, 2, 3].map((i) => (
              <li key={i} className="flex gap-3 p-4">
                <div className="h-14 w-14 animate-pulse rounded-lg bg-[var(--color-bg-alt)]" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-[var(--color-bg-alt)]" />
                  <div className="h-3 w-1/3 animate-pulse rounded bg-[var(--color-bg-alt)]" />
                </div>
              </li>
            ))}
            {data?.results.map((p) => (
              <li key={p.id} className="p-4">
                <Link href={editHref(p)} className="flex gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
                  <ProductThumb product={p} className="h-14 w-14" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold leading-snug text-[var(--color-text)]">{p.name}</p>
                    <p className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                      {p.sku}{p.franchise_name ? `, ${p.franchise_name}` : ''}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusChip active={p.is_active} />
                      <StockChip product={p} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-sm">
                    <Price product={p} />
                    <p className="mt-1 text-xs tabular-nums text-[var(--color-text-muted)]">{p.stock} uds.</p>
                  </div>
                </Link>
                <div className="-ml-3 mt-2 flex flex-wrap items-center gap-1">{actions(p)}</div>
              </li>
            ))}
          </ul>
        )}

        {!isEmpty && (
          <div className="hidden overflow-x-auto md:block">
            <table className={cn('w-full text-sm', pending && 'opacity-60')}>
              <thead>
                <tr className="border-y border-[var(--color-border)] text-left text-xs font-semibold text-[var(--color-text-muted)]">
                  <th scope="col" className="px-4 py-2.5 font-semibold">Producto</th>
                  <th scope="col" className="hidden px-4 py-2.5 font-semibold lg:table-cell">Franquicia</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">Precio</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Inventario</th>
                  <th scope="col" className="hidden px-4 py-2.5 text-right font-semibold xl:table-cell">Vendidos</th>
                  <th scope="col" className="px-4 py-2.5 font-semibold">Estado</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold"><span className="sr-only">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {!data && !error && [1, 2, 3, 4, 5, 6].map((i) => (
                  <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 animate-pulse rounded-lg bg-[var(--color-bg-alt)]" />
                        <div className="space-y-2">
                          <div className="h-4 w-48 animate-pulse rounded bg-[var(--color-bg-alt)]" />
                          <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-bg-alt)]" />
                        </div>
                      </div>
                    </td>
                    <td colSpan={6} className="px-4 py-3"><div className="ml-auto h-4 w-2/3 animate-pulse rounded bg-[var(--color-bg-alt)]" /></td>
                  </tr>
                ))}
                {data?.results.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(editHref(p))}
                    className="group cursor-pointer border-b border-[var(--color-border)] transition-colors last:border-0 hover:bg-[var(--color-bg-alt)]"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex min-w-[240px] items-center gap-3">
                        <ProductThumb product={p} className="h-12 w-12" />
                        <div className="min-w-0">
                          <Link
                            href={editHref(p)}
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold text-[var(--color-text)] hover:underline focus-visible:underline focus-visible:outline-none"
                          >
                            {p.name}
                          </Link>
                          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-4 py-2.5 text-[var(--color-text-muted)] lg:table-cell">{p.franchise_name || 'Sin franquicia'}</td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right"><Price product={p} /></td>
                    <td className="px-4 py-2.5"><Stock product={p} /></td>
                    <td className="hidden px-4 py-2.5 text-right tabular-nums text-[var(--color-text)] xl:table-cell">{p.units_sold ?? 0}</td>
                    <td className="px-4 py-2.5"><StatusChip active={p.is_active} /></td>
                    <td className="cursor-default px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">{actions(p)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && count > PAGE_SIZE && (
          <nav aria-label="Paginación" className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)]">
            <span className="tabular-nums">{first}–{last} de {count.toLocaleString('es-CO')}</span>
            <div className="flex items-center gap-1">
              <button type="button" disabled={page <= 1} onClick={() => setPage((n) => n - 1)} aria-label="Página anterior" className={cn(textButtonClass, 'w-11 justify-center px-0 disabled:opacity-40 disabled:hover:bg-transparent')}>
                <ChevronLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </button>
              <span className="tabular-nums text-[var(--color-text)]">Página {page} de {totalPages}</span>
              <button type="button" disabled={page >= totalPages} onClick={() => setPage((n) => n + 1)} aria-label="Página siguiente" className={cn(textButtonClass, 'w-11 justify-center px-0 disabled:opacity-40 disabled:hover:bg-transparent')}>
                <ChevronRight className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          </nav>
        )}
      </section>
    </>
  );
}

export default function AdminProductsPage() {
  return (
    <AdminShell
      title="Productos"
      actions={
        <Link href="/panel/productos/nuevo" className={cn(primaryButtonClass, 'self-start sm:self-auto')}>
          <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          Nuevo producto
        </Link>
      }
    >
      <Suspense fallback={null}>
        <AdminProductList />
      </Suspense>
    </AdminShell>
  );
}
