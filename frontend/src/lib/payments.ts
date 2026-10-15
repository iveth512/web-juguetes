import { initPayment } from '@/lib/api';
import { openBoldCheckout } from '@/lib/bold';

/** "bold" in production; "simulado" in the local demo (set by docker-compose). */
export const paymentProvider = process.env.NEXT_PUBLIC_PAYMENT_PROVIDER || 'bold';

export const payButtonLabel = paymentProvider === 'simulado' ? 'Ir a pagar' : 'Pagar con Bold';

export const paymentHint = paymentProvider === 'simulado'
  ? 'Entorno local: el pago se hace en una pasarela simulada, sin cobros reales. Tu pedido se reserva por 60 minutos.'
  : 'Pago seguro con tarjeta, PSE y otros medios a traves de Bold. Tu pedido se reserva por 60 minutos.';

/** Start paying an order with whatever gateway the backend is configured for. */
export async function payOrder(orderId: string): Promise<void> {
  const start = await initPayment(orderId);
  if (start.provider === 'simulado') {
    window.location.assign(start.checkout_url);
    return;
  }
  await openBoldCheckout(start.script_url, start.config);
}
