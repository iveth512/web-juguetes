'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { AdminShell, adminCardClass, adminInputClass } from '@/components/admin/AdminShell';
import { adminDeleteProduct, adminListProducts } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import type { AdminProduct } from '@/types/admin';
import type { PaginatedResponse } from '@/types/product';

const PAGE_SIZE = 24;

function StockBadge({ product }: { product: AdminProduct }) {
  if (!product.is_active) {
    return <span className="whitespace-nowrap rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">Inactivo</span>;
  }
  if (product.stock === 0) {
    return <span className="whitespace-nowrap rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800">Agotado</span>;
  }
  if (product.stock <= product.low_stock_threshold) {
    return <span className="whitespace-nowrap rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">Stock bajo</span>;
  }
  return <span className="whitespace-nowrap rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">Activo</span>;
}

function AdminProductList() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState(searchParams.get('estado') ?? '');
  const [orden, setOrden] = useState('recientes');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<AdminProduct> | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    setError('');
    adminListProducts({ q: search, estado, orden, page })
      .then(setData)
      .catch(() => setError('No se pudieron cargar los productos.'));
  }, [search, estado, orden, page]);

  useEffect(load, [load]);

  // Debounced search box
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  const handleDelete = async (product: AdminProduct) => {
    if (!window.confirm(`¿Eliminar "${product.name}"? Si tiene ventas, solo se desactivara.`)) return;
    setBusyId(product.id);
    setNotice('');
    try {
      const result = await adminDeleteProduct(product.id);
      setNotice(result?.deactivated
        ? `"${product.name}" tiene pedidos, asi que se desactivo en lugar de eliminarse.`
        : `"${product.name}" fue eliminado.`);
      load();
    } catch (err: unknown) {
      setNotice(err instanceof Error ? err.message : 'No se pudo eliminar el producto.');
    } finally {
      setBusyId(null);
    }
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1;

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

      <div className={`${adminCardClass} overflow-x-auto`}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-sm font-medium text-[var(--color-text-muted)]">
              <th className="px-4 py-3 font-semibold">Producto</th>
              <th className="hidden xl:table-cell px-4 py-3 font-semibold">Categoría</th>
              <th className="px-4 py-3 font-semibold text-right">Precio</th>
              <th className="px-4 py-3 font-semibold text-right">Stock</th>
              <th className="px-4 py-3 font-semibold text-right">Vendidos</th>
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
            {data?.results.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-[var(--color-text-muted)]">
                  No hay productos que coincidan.{' '}
                  <Link href="/panel/productos/nuevo" className="font-semibold text-[var(--color-primary)] hover:underline">Crear uno</Link>
                </td>
              </tr>
            )}
            {data?.results.map((p) => {
              const image = p.images.find((i) => i.is_primary) ?? p.images[0];
              return (
                <tr key={p.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-bg-alt)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-[200px]">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={image.image} alt="" className="h-10 w-10 rounded object-cover bg-[var(--color-bg-alt)]" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-[var(--color-bg-alt)]" aria-hidden />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-[var(--color-text)] truncate max-w-[240px]" title={p.name}>{p.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="hidden xl:table-cell px-4 py-3 text-[var(--color-text-muted)] whitespace-nowrap">{p.category_name}</td>
                  <td className="px-4 py-3 text-right tabular-nums whitespace-nowrap text-[var(--color-text)]">{formatPrice(p.base_price)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--color-text)]">{p.stock}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-[var(--color-text)]">{p.units_sold ?? 0}</td>
                  <td className="px-4 py-3"><StockBadge product={p} /></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/panel/productos/${p.id}`}
                        className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold text-[var(--color-text)] hover:bg-[var(--color-bg)]"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(p)}
                        disabled={busyId === p.id}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        {busyId === p.id ? '...' : 'Eliminar'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data && data.count > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between text-sm text-[var(--color-text-muted)]">
          <span>{data.count} productos</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 disabled:opacity-40">Anterior</button>
            <span>Página {page} de {totalPages}</span>
            <button type="button" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 disabled:opacity-40">Siguiente</button>
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
          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-base font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
        >
          + Nuevo producto
        </Link>
      }
    >
      <Suspense fallback={null}>
        <AdminProductList />
      </Suspense>
    </AdminShell>
  );
}
