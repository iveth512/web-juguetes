import Link from 'next/link';

/** Shown where a customer would buy: admin accounts can't place orders. */
export function StaffNotice({ title = 'Las compras están desactivadas para administradores' }: { title?: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 md:py-24">
      <h1 className="type-page text-[var(--color-text)]">{title}</h1>
      <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-[var(--color-text-muted)]">
        Tu cuenta es de administración: puedes recorrer la tienda para revisar cómo la ven los clientes, pero no
        agregar productos al carrito ni pagar. Para probar una compra, entra con una cuenta de cliente.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link
          href="/panel/dashboard"
          className="inline-flex min-h-12 items-center rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          Ir al panel
        </Link>
        <Link
          href="/productos"
          className="inline-flex min-h-11 items-center text-base font-semibold text-[var(--color-primary-text)] underline decoration-2 underline-offset-[6px]"
        >
          Ver el catálogo
        </Link>
      </div>
    </div>
  );
}
