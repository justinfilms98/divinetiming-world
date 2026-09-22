'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { Save, ExternalLink, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { useAdminToast } from '@/components/admin/AdminToast';
import type { LegalPolicySlug, LegalPolicyStatus } from '@/lib/types/content';

const ORDER: { slug: LegalPolicySlug; label: string }[] = [
  { slug: 'privacy', label: 'Privacy Policy' },
  { slug: 'terms', label: 'Terms of Service' },
  { slug: 'refund', label: 'Refund Policy' },
  { slug: 'shipping', label: 'Shipping Policy' },
];

interface PolicyRow {
  slug: LegalPolicySlug;
  title: string;
  body_md: string;
  updated_at: string;
  status: LegalPolicyStatus;
  effective_date: string | null;
}

function looksUnreviewed(body: string): boolean {
  return (
    body.includes('UNREVIEWED DRAFT') ||
    body.includes('[SQUARE BRACKETS]') ||
    /\[[A-Z][A-Z0-9 /,_.'-]{2,}\]/.test(body)
  );
}

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<Record<LegalPolicySlug, PolicyRow | null>>({
    privacy: null,
    terms: null,
    refund: null,
    shipping: null,
  });
  const [open, setOpen] = useState<LegalPolicySlug | null>('privacy');
  const [saving, setSaving] = useState<LegalPolicySlug | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useAdminToast();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/legal-policies', { credentials: 'same-origin' });
    const body = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(body.policies)) {
      const next: Record<LegalPolicySlug, PolicyRow | null> = {
        privacy: null,
        terms: null,
        refund: null,
        shipping: null,
      };
      for (const p of body.policies as PolicyRow[]) {
        if (p.slug in next) {
          next[p.slug] = {
            ...p,
            status: p.status === 'published' ? 'published' : 'draft',
            effective_date: p.effective_date ?? null,
          };
        }
      }
      setPolicies(next);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateLocal = (slug: LegalPolicySlug, patch: Partial<PolicyRow>) => {
    setPolicies((prev) => {
      const current = prev[slug];
      if (!current) return prev;
      return { ...prev, [slug]: { ...current, ...patch } };
    });
  };

  const save = async (slug: LegalPolicySlug) => {
    const p = policies[slug];
    if (!p) return;
    if (p.status === 'published' && !p.body_md.trim()) {
      showToast('error', 'Cannot publish an empty policy. Paste reviewed copy first.');
      return;
    }
    if (p.status === 'published' && looksUnreviewed(p.body_md)) {
      const ok = window.confirm(
        'This copy still has [BRACKET] placeholders or the unreviewed-draft banner. Placeholder text is not legally binding. Publish only after a lawyer has reviewed the finished document. Continue?'
      );
      if (!ok) return;
    }
    setSaving(slug);
    const res = await fetch('/api/admin/legal-policies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        slug,
        title: p.title,
        body_md: p.body_md,
        status: p.status,
        effective_date: p.effective_date,
      }),
    });
    setSaving(null);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      showToast('error', (err.error as string) || 'Save failed');
      return;
    }
    showToast('success', `${p.title} saved as ${p.status}`);
    await load();
  };

  return (
    <AdminPage
      title="Legal Policies"
      subtitle="Draft and publish Privacy, Terms, Refund, and Shipping. Public pages only show published documents."
    >
      <AdminCard className="border-amber-300 bg-amber-50">
        <div className="flex gap-3 items-start">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden />
          <div className="space-y-1">
            <p className="font-semibold text-amber-950">
              Placeholder copy must be lawyer-reviewed before you publish.
            </p>
            <p className="text-sm text-amber-900">
              The seeded skeletons are not legally binding. Replace every [BRACKET] with real
              commitments, have a qualified lawyer review the finished text, then set an effective
              date and switch the document to Published. Drafts 404 on the public site.
            </p>
          </div>
        </div>
      </AdminCard>

      {loading ? (
        <p className="text-slate-500 mt-4">Loading…</p>
      ) : (
        <div className="space-y-3 mt-4">
          {ORDER.map(({ slug, label }) => {
            const policy = policies[slug];
            const isOpen = open === slug;
            const isPublished = policy?.status === 'published';
            return (
              <AdminCard key={slug} className="p-0 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : slug)}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                    <span className="font-medium text-slate-800">{label}</span>
                    {policy && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded ${
                          isPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {isPublished ? 'Published' : 'Draft'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {policy ? (
                      isPublished ? (
                        <a
                          href={`/${slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400">Hidden on site</span>
                      )
                    ) : (
                      <span className="text-xs text-amber-600">Not seeded</span>
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="p-4 border-t border-slate-200 space-y-3">
                    {!policy ? (
                      <p className="text-slate-500 text-sm">
                        This policy is missing from the database. Run migration <code>036_legal_policies.sql</code>.
                      </p>
                    ) : (
                      <>
                        <div>
                          <label className="block text-slate-700 text-xs font-medium mb-1">Title</label>
                          <input
                            type="text"
                            value={policy.title}
                            onChange={(e) => updateLocal(slug, { title: e.target.value })}
                            className="admin-input w-full px-3 py-2"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-700 text-xs font-medium mb-1">Status</label>
                            <select
                              value={policy.status}
                              onChange={(e) =>
                                updateLocal(slug, { status: e.target.value as LegalPolicyStatus })
                              }
                              className="admin-input w-full px-3 py-2"
                            >
                              <option value="draft">Draft (404 on public site)</option>
                              <option value="published">Published (live)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-700 text-xs font-medium mb-1">
                              Effective date
                            </label>
                            <input
                              type="date"
                              value={policy.effective_date ?? ''}
                              onChange={(e) =>
                                updateLocal(slug, { effective_date: e.target.value || null })
                              }
                              className="admin-input w-full px-3 py-2"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                              Independent of last-edited. Leave blank until the lawyer-reviewed version takes effect.
                            </p>
                          </div>
                        </div>
                        <div>
                          <label className="block text-slate-700 text-xs font-medium mb-1">
                            Body (markdown-ish)
                          </label>
                          <textarea
                            value={policy.body_md}
                            onChange={(e) => updateLocal(slug, { body_md: e.target.value })}
                            rows={18}
                            className="admin-input w-full px-3 py-2 resize-vertical font-mono text-sm"
                            spellCheck={false}
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Supported: <code>## heading</code>, <code>&gt; blockquote</code>, <code>- bullet</code>, <code>**bold**</code>, blank-line paragraphs.
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-500">
                            Last updated: {new Date(policy.updated_at).toLocaleString()}
                          </p>
                          <button
                            type="button"
                            onClick={() => save(slug)}
                            disabled={saving === slug}
                            className="admin-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
                          >
                            {saving === slug ? 'Saving…' : <><Save className="w-4 h-4" /> Save</>}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </AdminCard>
            );
          })}
        </div>
      )}
    </AdminPage>
  );
}
