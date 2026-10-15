'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { useReviews, useCreateReview } from '@/hooks/useReviews';
import { Star } from 'lucide-react';
import { StarRating } from './StarRating';

interface ReviewSectionProps {
  productSlug: string;
  productId: string;
}

export function ReviewSection({ productSlug, productId }: ReviewSectionProps) {
  const { reviews, isLoading, averageRating, distribution, count } = useReviews(productSlug);
  const createReviewMutation = useCreateReview(productSlug);
  const { user, isAuthenticated } = useAuthStore();

  const [selectedRating, setSelectedRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const hasReviewed = reviews.some((r) => r.user_name === user?.first_name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await createReviewMutation.mutateAsync({
        product_id: productId,
        rating: selectedRating,
        title,
        comment,
      });
      setSelectedRating(0);
      setTitle('');
      setComment('');
    } catch {
      setError('No pudimos publicar tu reseña. Revisa tu conexión e intenta de nuevo; tu texto sigue aquí.');
    }
  };

  if (isLoading) {
    return (
      <div id="resenas" className="max-w-7xl mx-auto px-4 py-16">
        <p className="text-base text-[var(--color-text-muted)]">Cargando reseñas…</p>
      </div>
    );
  }

  return (
    <section id="resenas" aria-labelledby="resenas-title" className="max-w-7xl mx-auto scroll-mt-40 px-4 py-16">
      <h2 id="resenas-title" className="type-section mb-8 text-[var(--color-text)]">
        Reseñas de clientes
      </h2>

      {/* Summary + Form: 2-column on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Review Summary */}
        <div className="rounded-2xl bg-[var(--color-bg-alt)] p-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl font-bold tabular-nums text-[var(--color-text)]">
              {count > 0 ? averageRating.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '—'}
            </span>
            <div>
              <StarRating rating={averageRating} size="lg" />
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {count === 0 ? 'Aún sin reseñas' : `${count} ${count === 1 ? 'reseña' : 'reseñas'}`}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {distribution.map(({ stars, count: starCount, percentage }) => (
              <div key={stars} className="flex items-center gap-2 text-sm">
                <span className="flex w-10 items-center justify-end gap-1 tabular-nums text-[var(--color-text-muted)]">
                  {stars}
                  <Star className="h-3.5 w-3.5 fill-current" strokeWidth={1.75} aria-hidden="true" />
                  <span className="sr-only">{stars === 1 ? 'estrella' : 'estrellas'}</span>
                </span>
                <div className="flex-1 h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)]"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-6 text-right tabular-nums text-[var(--color-text-muted)]">
                  {starCount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Review Form */}
        <div className="rounded-2xl bg-[var(--color-bg-alt)] p-6">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <p className="text-base text-[var(--color-text)]">
                Inicia sesión para contar qué te pareció este producto.
              </p>
              <Link
                href={`/login?next=${encodeURIComponent(`/productos/${productSlug}`)}`}
                className="flex min-h-11 items-center rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]"
              >
                Iniciar sesión
              </Link>
            </div>
          ) : hasReviewed ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-base text-[var(--color-text-muted)]">
                Ya dejaste tu reseña para este producto. Gracias.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <p className="block text-sm font-semibold text-[var(--color-text)] mb-1">
                  Calificación
                </p>
                <StarRating
                  rating={selectedRating}
                  size="md"
                  interactive
                  onChange={setSelectedRating}
                />
              </div>

              <div>
                <label
                  htmlFor="review-title"
                  className="block text-sm font-semibold text-[var(--color-text)] mb-1"
                >
                  Título
                </label>
                <input
                  id="review-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  className="min-h-12 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                  placeholder="Resume tu experiencia"
                />
              </div>

              <div>
                <label
                  htmlFor="review-comment"
                  className="block text-sm font-semibold text-[var(--color-text)] mb-1"
                >
                  Comentario
                </label>
                <textarea
                  id="review-comment"
                  required
                  maxLength={1000}
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  aria-describedby="review-comment-count"
                  className="w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 text-base text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
                  placeholder="Cuenta tu experiencia con el producto"
                />
                <p id="review-comment-count" className="text-sm text-[var(--color-text-muted)] text-right mt-1">
                  {comment.length}/1000
                </p>
              </div>

              {error && (
                <p role="alert" className="text-sm text-[var(--color-error)]">{error}</p>
              )}

              <button
                type="submit"
                disabled={
                  selectedRating === 0 ||
                  title.trim() === '' ||
                  comment.trim() === '' ||
                  createReviewMutation.isPending
                }
                className="min-h-12 w-full rounded-full bg-[var(--color-primary)] px-6 text-base font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createReviewMutation.isPending ? 'Publicando…' : 'Publicar reseña'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Review List */}
      <div className="max-w-3xl space-y-4">
        {reviews.length === 0 ? (
          <p className="text-base text-[var(--color-text-muted)] py-4">
            Este producto aún no tiene reseñas. Si ya lo tienes, cuéntanos qué te pareció.
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="py-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold text-[var(--color-text)]">
                    {review.user_name}
                  </span>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                <span className="text-sm text-[var(--color-text-muted)]">
                  {new Date(review.created_at).toLocaleDateString('es-CO')}
                </span>
              </div>

              <h3 className="text-base font-bold text-[var(--color-text)] mb-1 [overflow-wrap:anywhere]">{review.title}</h3>
              <p className="max-w-[65ch] text-base text-[var(--color-text)] [overflow-wrap:anywhere]">{review.comment}</p>

              {review.is_verified_purchase && (
                <span className="inline-block mt-3 rounded-full bg-[var(--color-accent)] px-2.5 py-0.5 text-sm font-medium text-[var(--color-on-accent)]">
                  Compra verificada
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
