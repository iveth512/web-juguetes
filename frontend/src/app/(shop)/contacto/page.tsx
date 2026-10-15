import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Contacto — Juguetes para Frikis',
  description:
    'Contacta a Juguetes para Frikis por WhatsApp, correo o Instagram. Estamos disponibles para ayudarte.',
};

export default function ContactoPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
        <Link href="/" className="hover:underline">Inicio</Link>
        <span className="mx-2">/</span>
        <span>Contacto</span>
      </nav>

      {/* Title */}
      <h1
        className="font-[family-name:var(--font-heading)] font-bold text-3xl md:text-4xl mb-4"
        style={{ color: 'var(--color-text)' }}
      >
        Contacto
      </h1>
      <p className="mb-10" style={{ color: 'var(--color-text-muted)' }}>
        Estamos aqui para ayudarte. Escribenos por cualquiera de nuestros canales y te responderemos
        lo antes posible.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Canales de contacto */}
        <div className="space-y-4">
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-xl mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Nuestros canales
          </h2>

          {/* WhatsApp */}
          <a
            href="https://wa.me/573001234567"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-xl border transition-colors hover:border-[var(--color-primary)]"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-2xl"
              style={{ backgroundColor: '#25D366' }}
            >
              💬
            </div>
            <div>
              <p
                className="font-semibold text-sm"
                style={{ color: 'var(--color-text)' }}
              >
                WhatsApp
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                +57 300 123 4567
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Lunes a sabado, 9am - 7pm
              </p>
            </div>
          </a>

          {/* Email */}
          <a
            href="mailto:hola@juguetesparafrikis.com"
            className="flex items-center gap-4 p-4 rounded-xl border transition-colors hover:border-[var(--color-primary)]"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-2xl"
              style={{ backgroundColor: 'var(--color-secondary)' }}
            >
              📧
            </div>
            <div>
              <p
                className="font-semibold text-sm"
                style={{ color: 'var(--color-text)' }}
              >
                Correo electronico
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                hola@juguetesparafrikis.com
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Respondemos en menos de 24h
              </p>
            </div>
          </a>

          {/* Instagram */}
          <a
            href="https://instagram.com/juguetesparafrikis"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-xl border transition-colors hover:border-[var(--color-primary)]"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-2xl"
              style={{ background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }}
            >
              📸
            </div>
            <div>
              <p
                className="font-semibold text-sm"
                style={{ color: 'var(--color-text)' }}
              >
                Instagram
              </p>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                @juguetesparafrikis
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                Siguenos para ver novedades y ofertas
              </p>
            </div>
          </a>

          {/* Horario */}
          <div
            className="p-4 rounded-xl border"
            style={{
              backgroundColor: 'var(--color-bg-alt)',
              borderColor: 'var(--color-border)',
            }}
          >
            <p
              className="font-semibold text-sm mb-2"
              style={{ color: 'var(--color-text)' }}
            >
              Horario de atencion
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Lunes a Viernes: 9:00am — 7:00pm
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Sabados: 10:00am — 3:00pm
            </p>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Domingos: Cerrado
            </p>
          </div>
        </div>

        {/* Formulario de contacto */}
        <div>
          <h2
            className="font-[family-name:var(--font-heading)] font-bold text-xl mb-4"
            style={{ color: 'var(--color-text)' }}
          >
            Envianos un mensaje
          </h2>
          <div
            className="rounded-xl border p-6 space-y-4"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              borderColor: 'var(--color-border)',
            }}
          >
            {/* Nombre */}
            <div>
              <label
                className="block text-sm font-semibold mb-1.5"
                style={{ color: 'var(--color-text)' }}
              >
                Nombre
              </label>
              <input
                type="text"
                placeholder="Tu nombre"
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
                disabled
              />
            </div>

            {/* Email */}
            <div>
              <label
                className="block text-sm font-semibold mb-1.5"
                style={{ color: 'var(--color-text)' }}
              >
                Correo electronico
              </label>
              <input
                type="email"
                placeholder="tu@correo.com"
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
                disabled
              />
            </div>

            {/* Asunto */}
            <div>
              <label
                className="block text-sm font-semibold mb-1.5"
                style={{ color: 'var(--color-text)' }}
              >
                Asunto
              </label>
              <input
                type="text"
                placeholder="¿En que te podemos ayudar?"
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
                disabled
              />
            </div>

            {/* Mensaje */}
            <div>
              <label
                className="block text-sm font-semibold mb-1.5"
                style={{ color: 'var(--color-text)' }}
              >
                Mensaje
              </label>
              <textarea
                placeholder="Escribe tu mensaje aqui..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none resize-none"
                style={{
                  backgroundColor: 'var(--color-bg)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
                disabled
              />
            </div>

            {/* Submit */}
            <button
              type="button"
              className="w-full py-3 rounded-lg text-white font-semibold text-sm transition-colors opacity-60 cursor-not-allowed"
              style={{ backgroundColor: 'var(--color-primary)' }}
              disabled
            >
              Enviar mensaje
            </button>

            <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
              Formulario en construccion. Por favor contactanos via WhatsApp o correo electronico.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
