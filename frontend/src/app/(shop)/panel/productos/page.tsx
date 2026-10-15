'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AdminShell, adminCardClass, adminInputClass, adminSecondaryButtonClass } from '@/components/admin/AdminShell';
import { DeleteProductControl } from '@/components/admin/DeleteProductControl';
import { adminListProducts } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { AdminProduct } from '@/types/admin';
import type { PaginatedResponse } from '@/types/product';

const PAGE_SIZE = 24;

function StatusBadge({ active }: { active: boolean }) {
  return active
    ? <span className="whitespace-nowrap rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">Activo</span>
    : <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">Inactivo</span>;
}

function StockValue({ product }: { product: AdminProduct }) {
  const hint = product.stock === 0
    ? <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">agotado</span>
    : product.stock <= product.low_stock_threshold
      ? <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">bajo</span>
      : null;
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap tabular-nums text-[var(--color-text)]">
      {product.stock}
      {hint}
    </span>
  );
}

function Thumb({ product, size }: { product: AdminProduct; size: string }) {
  const image = product.images.find((i) => i.is_primary) ?? product.images[0];
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image.image} alt="" className={`${size} shrink-0 rounded object-cover bg-[var(--color-bg-alt)]`} />
  ) : (
    <div className={`${size} shrink-0 rounded bg-[var(--color-bg-alt)]`} aria-hidden />
  );
}

function deletedNotice(name: string, deactivated: boolean) {
  return deactivated
    ? `"${name}" tiene pedidos, así que se desactivó en lugar de eliminarse.`
    : `"${name}" fue eliminado.`;
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
  const load = () => setReload((n) => n + 1);

  // Debounced search box
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const actions = (p: AdminProduct) => (
    <>
      <Link href={`/panel/productos/${p.id}`} className={adminSecondaryButtonClass}>Editar</Link>
      <DeleteProductControl
        productId={p.id}
        onDeleted={(deactivated) => {
          setNotice(deletedNotice(p.name, deactivated));
          load();
        }}
        onError={setNotice}
      />
    </>
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;
  const isEmpty = data?.results.length === 0;
  const emptyMessage = (
    <>
      No hay productos que coincidan.{' '}
      <Link href="/panel/productos/nuevo" className="font-semibold text-[var(--color-primary-text)] hover:underline">Crear uno</Link>
    </>
  );

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre o SKU"
          aria-label="Buscar productos"
          className={`${adminInputClass} md:max-w-sm`}
        />
        <select aria-label="Filtrar por estado" value={estado} onChange={(e) => { setEstado(e.target.value); setPage(1); }} className={`${adminInputClass} md:w-48`}>
          <option value="">Todos</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
          <option value="bajo_stock">Stock bajo</option>
        </select>
        <select aria-label="Ordenar" value={orden} onChange={(e) => { setOrden(e.target.value); setPage(1); }} className={`${adminInputClass} md:w-48`}>
          <option value="recientes">Más recientes</option>
          <option value="nombre">Nombre A-Z</option>
          <option value="vendidos">Más vendidos</option>
          <option value="stock">Menor stock</option>
          <option value="precio">Precio menor</option>
          <option value="-precio">Precio mayor</option>
        </select>
      </div>

      {notice && (
        <div className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-alt)] p-3 text-sm text-[var(--color-text)]" role="status">
          {notice}
        </div>
      )}
      {error && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

      {/* Below md each product is a card; the table needs the width. */}
      <ul className={`${adminCardClass} divide-y divide-[var(--color-border)] md:hidden`} aria-label="Productos">
        {!data && !error && [1, 2, 3].map((i) => (
          <li key={i} className="p-4"><div className="h-24 animate-pulse rounded bg-[var(--color-bg-alt)]" /></li>
        ))}
        {isEmpty && <li className="px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">{emptyMessage}</li>}
        {data?.results.map((p) => (
          <li key={p.id} className="p-4">
            <div className="flex gap-3">
              <Thumb product={p} size="h-14 w-14" />
              <div className="min-w-0">
                <p className="font-semibold text-[var(--color-text)]">{p.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {p.sku}{p.franchise_name ? `, ${p.franchise_name}` : ''}
                </p>
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <dt className="text-xs text-[var(--color-text-muted)]">Precio</dt>
                <dd className="tabular-nums text-[var(--color-text)]">{formatPrice(p.base_price)}</dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-text-muted)]">Stock</dt>
                <dd><StockValue product={p} /></dd>
              </div>
              <div>
                <dt className="text-xs text-[var(--color-text-muted)]">Estado</dt>
                <dd><StatusBadge active={p.is_active} /></dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">{actions(p)}</div>
          </li>
        ))}
      </ul>

      <div className={`${adminCardClass} hidden overflow-x-auto md:block`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-sm font-medium text-[var(--color-text-muted)]">
              <th className="px-4 py-3 font-semibold">Producto</th>
              <th className="hidden lg:table-cell px-4 py-3 font-semibold">Franquicia</th>
              <th className="px-4 py-3 font-semibold text-right">Precio</th>
              <th className="px-4 py-3 font-semibold">Stock</th>
              <th className="hidden lg:table-cell px-4 py-3 font-semibold text-right">Vendidos</th>
              <th className="px-4 py-3 font-semibold">Estado</th>
              <th className="px-4 py-3 font-semibold text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!data && !error && [1, 2, 3, 4, 5].map((i) => (
              <tr key={i} className="border-b border-[var(--color-border)]">
                <td colSpan={7} className="px-4 py-3"><div className="h-8 animate-pulse rounded bg-[var(--color-bg-alt)]" /></td>
              </tr>
            ))}
            {isEmpty && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--color-text-muted)]">{emptyMessage}</td>
              </tr>
            )}
            {data?.results.map((p) => (
              <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-alt)]">
                <td className="px-4 py-3">
                  <div className="flex min-w-[220px] items-center gap-3">
                    <Thumb product={p} size="h-10 w-10" />
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--color-text)]">{p.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{p.sku}</p>
                    </div>
                  </div>
                </td>
                <td className="hidden lg:table-cell px-4 py-3 text-[var(--color-text-muted)]">{p.franchise_name || '—'}</td>
                <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap text-[var(--color-text)]">{formatPrice(p.base_price)}</td>
                <td className="px-4 py-3"><StockValue product={p} /></td>
                <td className="hidden lg:table-cell px-4 py-3 text-right tabular-nums text-[var(--color-text)]">{p.units_sold ?? 0}</td>
                <td className="px-4 py-3"><StatusBadge active={p.is_active} /></td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-2">{actions(p)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.count > PAGE_SIZE && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--color-text-muted)]">
          <span>{data.count} productos</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className={`${adminSecondaryButtonClass} disabled:opacity-40`}>Anterior</button>
            <span>Página {page} de {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className={`${adminSecondaryButtonClass} disabled:opacity-40`}>Siguiente</button>
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminProductsPage() {
  return (
    <AdminShell
      title="Productos"
      actions={
        <Link
          href="/panel/productos/nuevo"
          className="inline-flex min-h-11 items-center justify-center self-start rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-base font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] sm:self-auto"
        >
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
