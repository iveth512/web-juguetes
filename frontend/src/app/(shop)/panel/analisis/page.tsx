'use client';

import { AdminShell } from '@/components/admin/AdminShell';
import { AnalysisView } from '@/components/admin/insights/AnalysisView';

export default function AdminAnalysisPage() {
  return (
    <AdminShell title="Análisis" bleed>
      <AnalysisView />
    </AdminShell>
  );
}
