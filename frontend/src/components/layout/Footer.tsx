"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Logo } from "@/components/brand/Logo";
import { getFranchises, getNewProducts, getOnSaleProducts, getProducts } from "@/lib/api";

interface FooterLink {
  href: string;
  label: string;
  count?: number;
}

/** Real counts for the store index; a missing count just hides the number. */
function useStoreCounts() {
  const all = useQuery({ queryKey: ["footer", "all"], queryFn: () => getProducts() });
  const fresh = useQuery({ queryKey: ["footer", "new"], queryFn: getNewProducts });
  const sale = useQuery({ queryKey: ["footer", "sale"], queryFn: getOnSaleProducts });
  const franchises = useQuery({ queryKey: ["footer", "franchises"], queryFn: getFranchises });
  return {
    all: all.data?.count,
    fresh: fresh.data?.count,
    sale: sale.data?.count,
    franchises: franchises.data?.length,
  };
}

function CountLink({ href, label, count }: FooterLink) {
  return (
    <li>
      <Link href={href} className="group flex min-h-12 items-baseline gap-3">
        <span className="w-[2.6ch] text-right font-[family-name:var(--font-display)] text-[28px] leading-none tabular-nums text-[var(--color-primary)] transition-transform duration-200 group-hover:-translate-y-0.5">
          {count ?? ""}
        </span>
        <span className="text-[17px] text-[var(--color-stage-text)] transition-colors group-hover:text-[var(--color-primary)]">
          {label}
        </span>
      </Link>
    </li>
  );
}

function LeaderLink({ href, label }: FooterLink) {
  return (
    <li>
      <Link href={href} className="group flex min-h-11 items-baseline gap-3 text-[17px] text-[var(--color-stage-text)]">
        <span className="transition-colors group-hover:text-[var(--color-primary)]">{label}</span>
        {/* Dotted leader, like the contents page of a magazine. */}
        <i
          aria-hidden="true"
          className="h-px flex-1 translate-y-[-0.3em] border-b-2 border-dotted border-[var(--color-stage-muted)]/40 transition-colors group-hover:border-[var(--color-primary)]"
        />
      </Link>
    </li>
  );
}

export function Footer() {
  const pathname = usePathname();
  const counts = useStoreCounts();
  if (pathname.startsWith("/panel")) return null;

  const shop: FooterLink[] = [
    { href: "/novedades", label: "Novedades", count: counts.fresh },
    { href: "/ofertas", label: "Ofertas de la semana", count: counts.sale },
    { href: "/productos", label: "Todo el catálogo", count: counts.all },
    { href: "/franquicias", label: "Franquicias", count: counts.franchises },
  ];
  const help: FooterLink[] = [
    { href: "/envios", label: "Envíos y entregas" },
    { href: "/devoluciones", label: "Devoluciones" },
    { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
  ];
  const headingClass =
    "font-[family-name:var(--font-display)] text-2xl uppercase leading-none text-[var(--color-stage-text)]";

  return (
    <footer className="mt-auto">
      <div className="grain bg-[var(--color-stage)] text-[var(--color-stage-text)]">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-12 md:pt-16">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-16">
            <div className="max-w-sm">
              {/* The live logo: its mascot follows the pointer. */}
              <Logo className="w-[min(260px,70vw)] [&_svg]:!h-auto [&_svg]:!w-full" hop={5} />
              <p className="mt-6 text-base leading-relaxed text-[var(--color-stage-muted)]">
                Funko Pop! originales de anime, Marvel, Star Wars, Pokémon, música y mucho más, con envío a toda
                Colombia.
              </p>
            </div>

            <div className="grid gap-x-16 gap-y-10 sm:grid-cols-2">
              <nav aria-label="Tienda">
                <h3 className={headingClass}>Tienda</h3>
                <ul className="mt-3">
                  {shop.map((link) => (
                    <CountLink key={link.href} {...link} />
                  ))}
                </ul>
              </nav>
              <nav aria-label="Ayuda">
                <h3 className={headingClass}>Ayuda</h3>
                <ul className="mt-3">
                  {help.map((link) => (
                    <LeaderLink key={link.href} {...link} />
                  ))}
                </ul>
              </nav>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--color-stage-muted)]">
            <p>&copy; {new Date().getFullYear()} Juguetes para Frikis</p>
            <Link href="/privacidad" className="underline-offset-4 hover:text-[var(--color-stage-text)] hover:underline">
              Privacidad
            </Link>
            <Link href="/terminos" className="underline-offset-4 hover:text-[var(--color-stage-text)] hover:underline">
              Términos
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
