"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { searchProducts } from "@/lib/api";
import type { ProductListItem } from "@/types/product";

interface SearchBarProps {
  className?: string;
  onSelect?: () => void; // called when a result is selected (used by MobileNav to close drawer)
}

export function SearchBar({ className, onSelect }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setTotalCount(0);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await searchProducts(q);
      setResults(data.results.slice(0, 5));
      setTotalCount(data.count);
      setIsOpen(true);
    } catch {
      setResults([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    setActiveIndex(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(value), 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
      onSelect?.();
    }
  };

  const navigateToProduct = (slug: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/productos/${slug}`);
    onSelect?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < results.length ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : results.length));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      if (activeIndex < results.length) {
        navigateToProduct(results[activeIndex].slug);
      } else {
        // "Ver todos" link
        setIsOpen(false);
        router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
        onSelect?.();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function highlightMatch(text: string, term: string) {
    if (!term) return text;
    const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="text-[var(--color-primary)] font-semibold">
          {part}
        </span>
      ) : (
        part
      )
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (results.length > 0 && query.length >= 2) setIsOpen(true);
            }}
            placeholder="Buscar Funko Pop!, Naruto, Marvel..."
            className="w-full rounded-lg px-4 py-2 pr-10 text-sm text-white placeholder-white/60 bg-white/10 border border-white/15 focus:bg-white/20 focus:outline-none focus:ring-1 focus:ring-white/30 transition-colors"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
            aria-label="Buscar"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </form>

      {/* Autocomplete dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-bg-card)] rounded-lg shadow-xl border border-[var(--color-border)] z-50 overflow-hidden">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
              Buscando...
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
              No se encontraron resultados
            </div>
          ) : (
            <>
              <ul role="listbox">
                {results.map((product, index) => (
                  <li
                    key={product.id}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors",
                      index === activeIndex
                        ? "bg-[var(--color-bg-alt)]"
                        : "hover:bg-[var(--color-bg-alt)]"
                    )}
                    onClick={() => navigateToProduct(product.slug)}
                    onMouseEnter={() => setActiveIndex(index)}
                  >
                    <div className="relative h-12 w-12 flex-shrink-0 rounded bg-[var(--color-bg-alt)] overflow-hidden">
                      {product.primary_image_url ? (
                        <Image
                          src={product.primary_image_url}
                          alt={product.name}
                          fill
                          className="object-contain"
                          sizes="48px"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)] text-xs">
                          Sin img
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text)] truncate">
                        {highlightMatch(product.name, query)}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {product.category} &middot; {product.franchise}
                      </p>
                    </div>
                    <span className="text-sm font-semibold font-[family-name:var(--font-heading)] text-[var(--color-primary)] flex-shrink-0">
                      {formatPrice(product.base_price)}
                    </span>
                  </li>
                ))}
              </ul>
              {totalCount > 5 && (
                <Link
                  href={`/buscar?q=${encodeURIComponent(query)}`}
                  onClick={() => {
                    setIsOpen(false);
                    onSelect?.();
                  }}
                  className={cn(
                    "block px-4 py-3 text-sm text-center text-[var(--color-primary)] hover:bg-[var(--color-bg-alt)] border-t border-[var(--color-border)] transition-colors font-medium",
                    activeIndex === results.length && "bg-[var(--color-bg-alt)]"
                  )}
                  onMouseEnter={() => setActiveIndex(results.length)}
                >
                  Ver los {totalCount} resultados para &quot;{query}&quot;
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
