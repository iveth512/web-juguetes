'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { ProductForm } from '@/components/admin/ProductForm';

export default function NewProductPage() {
  const router = useRouter();
  return (
    <AdminShell title="Nuevo producto">
      <Link href="/panel/productos" className="-ml-1 mb-4 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
        <ChevronLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        Productos
      </Link>
      <ProductForm onSaved={(p) => router.push(`/panel/productos/${p.id}?creado=1`)} />
    </AdminShell>
  );
}
