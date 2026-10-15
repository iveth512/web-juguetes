import type { BoldCheckoutConfig } from '@/lib/api';

// Bold's library exposes a global BoldCheckout class once loaded.
// Docs: https://developers.bold.co/pagos-en-linea/boton-de-pagos/integracion-manual/integracion-personalizada
interface BoldCheckoutInstance {
  open: () => void;
}

declare global {
  interface Window {
    BoldCheckout?: new (config: BoldCheckoutConfig) => BoldCheckoutInstance;
  }
}

let loading: Promise<void> | null = null;

function loadBoldScript(src: string): Promise<void> {
  if (window.BoldCheckout) return Promise.resolve();
  if (loading) return loading;

  loading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error('No se pudo cargar la pasarela de pagos. Revisa tu conexion e intenta de nuevo.'));
    };
    document.head.appendChild(script);
  });
  return loading;
}

/**
 * Opens Bold's checkout with a config our backend signed.
 * Bold then redirects to /pedido-confirmado/<id>.
 */
export async function openBoldCheckout(scriptUrl: string, config: BoldCheckoutConfig): Promise<void> {
  await loadBoldScript(scriptUrl);
  if (!window.BoldCheckout) {
    throw new Error('La pasarela de pagos no esta disponible en este momento.');
  }
  const checkout = new window.BoldCheckout(config);
  checkout.open();
}
