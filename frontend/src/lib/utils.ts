import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: string | number): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function getStockStatus(stock: number, threshold: number) {
  if (stock === 0)
    return { label: "Agotado", color: "error" as const };
  if (stock <= threshold)
    return {
      label: `Quedan ${stock} unidades`,
      color: "warning" as const,
    };
  return { label: "En stock", color: "success" as const };
}
