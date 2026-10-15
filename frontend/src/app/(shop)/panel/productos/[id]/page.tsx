'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, ChevronLeft, ExternalLink, X } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { DeleteProductControl } from '@/components/admin/DeleteProductControl';
import { ProductForm } from '@/components/admin/ProductForm';
import { StatusChip, StockChip, panelClass } from '@/components/admin/productUi';
import { cn } from '@/lib/utils';
import { adminGetProduct } from '@/lib/api';
import type { AdminProduct } from '@/types/admin';

function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [product, setProduct] = useState<AdminProduct | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(searchParams.get('creado') ? 'Producto creado.' : '');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    adminGetProduct(id)
      .then(setProduct)
      .catch(() => setError('No se encontró el producto.'));
  }, [id]);

  if (error) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[color-mix(in_oklab,var(--color-error)_12%,transparent)] p-4 text-sm text-[var(--color-text)]" role="alert">
        <AlertCircle className="h-4 w-4 shrink-0 text-[var(--color-error)]" strokeWidth={1.75} aria-hidden />
        {error}
        <Link href="/panel/productos" className="font-semibold text-[var(--color-primary-text)] underline underline-offset-2">Volver al listado</Link>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]" aria-busy="true">
        <div className="h-96 animate-pulse rounded-xl bg-[var(--color-bg-alt)]" />
        <div className="h-72 animate-pulse rounded-xl bg-[var(--color-bg-alt)]" />
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href="/panel/productos" className="-ml-1 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          Productos
        </Link>
        <span className="min-w-0 truncate text-base font-semibold text-[var(--color-text)]">{product.name}</span>
        <StatusChip active={product.is_active} />
        <StockChip product={product} />
        <span className="text-sm tabular-nums text-[var(--color-text-muted)]">
          {product.units_sold ?? 0} {product.units_sold === 1 ? 'unidad vendida' : 'unidades vendidas'}
        </span>
        {product.is_active && (
          <Link href={`/productos/${product.slug}`} target="_blank" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-[var(--color-primary-text)] hover:underline sm:ml-auto">
            Ver en la tienda
            <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </Link>
        )}
      </div>
      {saved && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-xl bg-[color-mix(in_oklab,var(--color-accent)_22%,transparent)] py-2 pl-4 pr-2 text-sm font-semibold text-[var(--color-text)]" role="status">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
            {saved}
          </span>
          <button type="button" onClick={() => setSaved('')} aria-label="Cerrar aviso" className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-[var(--color-bg)]">
            <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      )}
      <ProductForm
        key={product.updated_at}
        product={product}
        onSaved={(p) => {
          setProduct(p);
          setSaved('Cambios guardados.');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
      <section className={cn(panelClass, 'mt-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6')} aria-labelledby="delete-title">
        <div>
          <h2 id="delete-title" className="text-lg font-semibold leading-tight text-[var(--color-text)]">Eliminar producto</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">Si tiene ventas, solo se desactivará y dejará de verse en la tienda.</p>
          {deleteError && <p className="mt-2 text-sm text-[var(--color-error)]" role="alert">{deleteError}</p>}
        </div>
        <DeleteProductControl
          productId={product.id}
          label="Eliminar producto"
          onError={setDeleteError}
          onDeleted={(deactivated) => {
            const param = deactivated ? 'desactivado' : 'eliminado';
            router.push(`/panel/productos?${param}=${encodeURIComponent(product.name)}`);
          }}
          className="shrink-0"
        />
      </section>
    </>
  );
}

export default function EditProductPage() {
  return (
    <AdminShell title="Editar producto">
      <EditProduct />
    </AdminShell>
  );
}
