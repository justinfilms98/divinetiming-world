'use client';

import { useCallback, useEffect, useState } from 'react';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { Save, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { useAdminToast } from '@/components/admin/AdminToast';

type PolicySlug = 'privacy' | 'terms' | 'refund' | 'shipping';

const ORDER: { slug: PolicySlug; label: string }[] = [
  { slug: 'privacy', label: 'Privacy Policy' },
  { slug: 'terms', label: 'Terms of Service' },
  { slug: 'refund', label: 'Refund Policy' },
  { slug: 'shipping', label: 'Shipping Policy' },
];

interface PolicyRow {
  slug: PolicySlug;
  title: string;
  body_md: string;
  updated_at: string;
}

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState<Record<PolicySlug, PolicyRow | null>>({
    privacy: null,
    terms: null,
    refund: null,
    shipping: null,
  });
  const [open, setOpen] = useState<PolicySlug | null>('privacy');
  const [saving, setSaving] = useState<PolicySlug | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useAdminToast();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/admin/legal-policies', { credentials: 'same-origin' });
    const body = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(body.policies)) {
      const next: Record<PolicySlug, PolicyRow | null> = {
        privacy: null,
        terms: null,
        refund: null,
        shipping: null,
      };
      for (const p of body.policies as PolicyRow[]) {
        if (p.slug in next) next[p.slug] = p;
      }
      setPolicies(next);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateLocal = (slug: PolicySlug, patch: Partial<PolicyRow>) => {
    setPolicies((prev) => {
      const current = prev[slug];
      if (!current) return prev;
      return { ...prev, [slug]: { ...current, ...patch } };
    });
  };

  const save = async (slug: PolicySlug) => {
    const p = policies[slug];
    if (!p) return;
    setSaving(slug);
    const res = await fetch('/api/admin/legal-policies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ slug, title: p.title, body_md: p.body_md }),
    });
    setSaving(null);
    if (!res.ok) {
      showToast('error', 'Save failed');
      return;
    }
    showToast('success', `${p.title} saved`);
    await load();
  };

  return (
    <AdminPage
      title="Legal Policies"
      subtitle="Edit the public Privacy, Terms, Refund, and Shipping pages. Markdown-ish formatting supported (##, > blockquote, - list, **bold**)."
    >
      {loading ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="space-y-3">
          {ORDER.map(({ slug, label }) => {
            const policy = policies[slug];
            const isOpen = open === slug;
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
                  </div>
                  <div className="flex items-center gap-3">
                    {policy ? (
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
