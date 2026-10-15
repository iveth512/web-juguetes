'use client';

import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useReviews, useCreateReview } from '@/hooks/useReviews';
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
      setError('No se pudo publicar la resena. Intenta de nuevo.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <p className="text-[var(--color-text-muted)]">Cargando resenas...</p>
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-2xl font-heading font-bold text-[var(--color-text)] mb-8">
        Resenas de clientes
      </h2>

      {/* Summary + Form: 2-column on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* Review Summary */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-4xl font-bold text-[var(--color-text)]">
              {averageRating.toFixed(1)}
            </span>
            <div>
              <StarRating rating={averageRating} size="lg" />
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {count} {count === 1 ? 'resena' : 'resenas'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {distribution.map(({ stars, count: starCount, percentage }) => (
              <div key={stars} className="flex items-center gap-2 text-sm">
                <span className="w-8 text-right text-[var(--color-text-muted)]">
                  {stars} ★
                </span>
                <div className="flex-1 h-2 rounded-full bg-[var(--color-bg-alt)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)]"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-6 text-right text-[var(--color-text-muted)]">
                  {starCount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Review Form */}
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6">
          {!isAuthenticated ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-[var(--color-text-muted)]">
                Inicia sesion para dejar tu resena
              </p>
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg bg-[var(--color-primary)] text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Iniciar sesion
              </Link>
            </div>
          ) : hasReviewed ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-[var(--color-text-muted)]">
                Ya dejaste tu resena para este producto
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text)] mb-1">
                  Calificacion
                </label>
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
                  Titulo
                </label>
                <input
                  id="review-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
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
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] px-3 py-2 text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                  placeholder="Cuenta tu experiencia con el producto"
                />
                <p className="text-xs text-[var(--color-text-muted)] text-right mt-1">
                  {comment.length}/1000
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={
                  selectedRating === 0 ||
                  title.trim() === '' ||
                  comment.trim() === '' ||
                  createReviewMutation.isPending
                }
                className={cn(
                  'w-full py-2 rounded-lg font-semibold transition-opacity',
                  'bg-[var(--color-primary)] text-white',
                  (selectedRating === 0 || title.trim() === '' || comment.trim() === '')
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:opacity-90 cursor-pointer',
                )}
              >
                {createReviewMutation.isPending ? 'Publicando...' : 'Publicar resena'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-[var(--color-text-muted)] text-center py-8">
            Se el primero en dejar una resena
          </p>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-[var(--color-text)]">
                    {review.user_name}
                  </span>
                  <StarRating rating={review.rating} size="sm" />
                </div>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {new Date(review.created_at).toLocaleDateString('es-CO')}
                </span>
              </div>

              <h4 className="font-bold text-[var(--color-text)] mb-1">{review.title}</h4>
              <p className="text-sm text-[var(--color-text-muted)]">{review.comment}</p>

              {review.is_verified_purchase && (
                <span className="inline-block mt-3 text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded">
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
