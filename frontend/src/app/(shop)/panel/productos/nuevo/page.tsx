'use client';

import { useRouter } from 'next/navigation';
import { AdminShell } from '@/components/admin/AdminShell';
import { ProductForm } from '@/components/admin/ProductForm';

export default function NewProductPage() {
  const router = useRouter();
  return (
    <AdminShell title="Nuevo producto">
      <div className="max-w-4xl">
        <ProductForm onSaved={(p) => router.push(`/panel/productos/${p.id}?creado=1`)} />
      </div>
    </AdminShell>
  );
}
