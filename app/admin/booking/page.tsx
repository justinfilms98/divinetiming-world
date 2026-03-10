'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { Save, ExternalLink, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';
import { useAdminToast } from '@/components/admin/AdminToast';

interface HeroRow {
  headline: string | null;
  subtext: string | null;
  cta_text: string | null;
  cta_url: string | null;
}

interface SectionRow {
  id: string;
  title: string;
  description: string | null;
  display_order: number;
  align_preference: string | null;
  accent: string | null;
}

const HEADING_SOFT_MAX = 80;
const BODY_SOFT_MAX = 1500;

export default function AdminBookingPage() {
  const [hero, setHero] = useState<HeroRow | null>(null);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [bookingEmail, setBookingEmail] = useState('');
  const [bookingPhone, setBookingPhone] = useState('');
  const [bookingSponsors, setBookingSponsors] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const { showToast } = useAdminToast();

  const load = useCallback(async () => {
    const supabase = createClient();
    const [heroRes, sectionsRes, settingsRes, pageRes] = await Promise.all([
      supabase.from('hero_sections').select('headline, subtext, cta_text, cta_url').eq('page_slug', 'booking').single(),
      supabase.from('booking_content').select('*').order('display_order', { ascending: true }),
      supabase.from('site_settings').select('booking_email, booking_phone').limit(1).single(),
      supabase.from('page_settings').select('booking_sponsors').eq('page_slug', 'booking').single(),
    ]);
    if (heroRes.data) setHero(heroRes.data as HeroRow);
    if (sectionsRes.data && Array.isArray(sectionsRes.data)) setSections(sectionsRes.data as SectionRow[]);
    if (settingsRes.data) {
      setBookingEmail((settingsRes.data as { booking_email?: string }).booking_email ?? '');
      setBookingPhone((settingsRes.data as { booking_phone?: string }).booking_phone ?? '');
    }
    if (pageRes.data) setBookingSponsors((pageRes.data as { booking_sponsors?: string }).booking_sponsors ?? '');
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveHero = async (): Promise<boolean> => {
    if (!hero) return false;
    const res = await fetch('/api/admin/page-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        page_slug: 'booking',
        hero: {
          headline: hero.headline,
          subtext: hero.subtext,
          cta_text: hero.cta_text,
          cta_url: hero.cta_url,
        },
      }),
    });
    return res.ok;
  };

  const saveSection = async (section: SectionRow): Promise<boolean> => {
    const res = await fetch('/api/admin/booking-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        id: section.id,
        title: section.title,
        description: section.description,
        display_order: section.display_order,
        align_preference: section.align_preference || 'auto',
        accent: section.accent || null,
      }),
    });
    return res.ok;
  };

  const saveContact = async (): Promise<boolean> => {
    const [siteRes, pageRes] = await Promise.all([
      fetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ booking_email: bookingEmail, booking_phone: bookingPhone }),
      }),
      fetch('/api/admin/page-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ page_slug: 'booking', booking_sponsors: bookingSponsors }),
      }),
    ]);
    return siteRes.ok && pageRes.ok;
  };

  const saveAll = async () => {
    setSaving('all');
    const failed: string[] = [];
    if (!(await saveHero())) failed.push('Hero');
    for (const section of sections) {
      if (!(await saveSection(section))) failed.push(`Section "${section.title.slice(0, 20)}…"`);
    }
    if (!(await saveContact())) failed.push('Contact');
    setSaving(null);
    if (failed.length === 0) {
      showToast('success');
      load();
    } else {
      showToast('error', `Failed: ${failed.join(', ')}`);
    }
  };

  const moveSection = (index: number, dir: 'up' | 'down') => {
    const next = dir === 'up' ? index - 1 : index + 1;
    if (next < 0 || next >= sections.length) return;
    const copy = [...sections];
    const [removed] = copy.splice(index, 1);
    copy.splice(next, 0, removed);
    setSections(copy.map((s, i) => ({ ...s, display_order: i })));
  };

  const resetToDefaults = async () => {
    if (!confirm('Replace all story blocks with the 4 default sections? This cannot be undone.')) return;
    setSaving('reset');
    const res = await fetch('/api/admin/booking-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ reset: true }),
    });
    setSaving(null);
    if (res.ok) {
      showToast('success');
      load();
    } else {
      const d = await res.json();
      showToast('error', d.error || 'Reset failed');
    }
  };

  const saveHeroForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('hero');
    const ok = await saveHero();
    setSaving(null);
    if (ok) showToast('success');
    else showToast('error', 'Failed to save hero');
  };

  const saveContactForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving('contact');
    const ok = await saveContact();
    setSaving(null);
    if (ok) showToast('success');
    else showToast('error', 'Failed to save contact');
  };

  return (
    <AdminPage
      title="Booking"
      subtitle="Edit booking page hero, story blocks, and contact. Hero media: Dashboard → Hero editor (select Booking)."
    >
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <button
          type="button"
          onClick={saveAll}
          disabled={!!saving}
          className="admin-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg"
        >
          {saving === 'all' ? 'Saving…' : <><Save className="w-4 h-4" /> Save All</>}
        </button>
        <a href="/booking" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800">
          View booking page <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="space-y-8">
        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Hero</h2>
          <p className="text-sm text-slate-600 mb-4">
            CTA URL should be <code className="bg-slate-100 px-1 rounded">#booking-form</code> for smooth scroll to the form.
          </p>
          {hero && (
            <form onSubmit={saveHeroForm} className="space-y-4">
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">Hero title</label>
                <input
                  type="text"
                  value={hero.headline ?? ''}
                  onChange={(e) => setHero({ ...hero, headline: e.target.value })}
                  className="admin-input w-full px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">Hero subtitle</label>
                <input
                  type="text"
                  value={hero.subtext ?? ''}
                  onChange={(e) => setHero({ ...hero, subtext: e.target.value })}
                  className="admin-input w-full px-4 py-2"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-sm font-medium mb-2">Primary CTA label</label>
                  <input
                    type="text"
                    value={hero.cta_text ?? ''}
                    onChange={(e) => setHero({ ...hero, cta_text: e.target.value })}
                    placeholder="Book Now"
                    className="admin-input w-full px-4 py-2"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 text-sm font-medium mb-2">CTA scroll target</label>
                  <input
                    type="text"
                    value={hero.cta_url ?? ''}
                    onChange={(e) => setHero({ ...hero, cta_url: e.target.value })}
                    placeholder="#booking-form"
                    className="admin-input w-full px-4 py-2"
                  />
                </div>
              </div>
              <button type="submit" disabled={!!saving} className="admin-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg">
                {saving === 'hero' ? 'Saving…' : <><Save className="w-4 h-4" /> Save hero</>}
              </button>
            </form>
          )}
        </AdminCard>

        <AdminCard>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Story blocks</h2>
              <p className="text-sm text-slate-600 mt-1">Order with Up/Down. Use Save All to persist order and content.</p>
            </div>
            <button
              type="button"
              onClick={resetToDefaults}
              disabled={!!saving}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 text-sm"
            >
              <RotateCcw className="w-4 h-4" /> Reset to defaults
            </button>
          </div>
          <div className="space-y-6">
            {sections.map((section, index) => (
              <div key={section.id} className="p-4 border border-slate-200 rounded-lg space-y-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <span className="text-sm font-medium text-slate-500">Order {index + 1}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveSection(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                      aria-label="Move up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(index, 'down')}
                      disabled={index === sections.length - 1}
                      className="p-1.5 rounded border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
                      aria-label="Move down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, title: e.target.value } : s))}
                    placeholder="Heading"
                    className="admin-input w-full px-4 py-2"
                  />
                  <p className={`text-xs mt-1 ${(section.title?.length ?? 0) > HEADING_SOFT_MAX ? 'text-amber-600' : 'text-slate-500'}`}>
                    {(section.title?.length ?? 0)} / {HEADING_SOFT_MAX} chars
                    {(section.title?.length ?? 0) > HEADING_SOFT_MAX ? ' — consider shortening' : ''}
                  </p>
                </div>
                <div>
                  <textarea
                    value={section.description ?? ''}
                    onChange={(e) => setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, description: e.target.value } : s))}
                    placeholder="Body text"
                    rows={4}
                    className="admin-input w-full px-4 py-2"
                  />
                  <p className={`text-xs mt-1 ${(section.description?.length ?? 0) > BODY_SOFT_MAX ? 'text-amber-600' : 'text-slate-500'}`}>
                    {(section.description?.length ?? 0)} / {BODY_SOFT_MAX} chars
                    {(section.description?.length ?? 0) > BODY_SOFT_MAX ? ' — consider shortening' : ''}
                  </p>
                </div>
                <div className="flex gap-4">
                  <select
                    value={section.align_preference ?? 'auto'}
                    onChange={(e) => setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, align_preference: e.target.value } : s))}
                    className="admin-input px-4 py-2"
                  >
                    <option value="auto">Auto (alternate)</option>
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                  </select>
                  <select
                    value={section.accent ?? ''}
                    onChange={(e) => setSections((prev) => prev.map((s) => s.id === section.id ? { ...s, accent: e.target.value || null } : s))}
                    className="admin-input px-4 py-2"
                  >
                    <option value="">No accent</option>
                    <option value="star">Star</option>
                    <option value="clock">Clock</option>
                    <option value="sunset">Sunset</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>

        <AdminCard>
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Contact & sponsors</h2>
          <form onSubmit={saveContactForm} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">Booking email</label>
                <input
                  type="email"
                  value={bookingEmail}
                  onChange={(e) => setBookingEmail(e.target.value)}
                  className="admin-input w-full px-4 py-2"
                />
              </div>
              <div>
                <label className="block text-slate-700 text-sm font-medium mb-2">Booking phone</label>
                <input
                  type="text"
                  value={bookingPhone}
                  onChange={(e) => setBookingPhone(e.target.value)}
                  className="admin-input w-full px-4 py-2"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-2">Sponsors / affiliations (one per line or comma-separated)</label>
              <textarea
                value={bookingSponsors}
                onChange={(e) => setBookingSponsors(e.target.value)}
                rows={3}
                className="admin-input w-full px-4 py-2"
              />
            </div>
            <button type="submit" disabled={!!saving} className="admin-btn-primary inline-flex items-center gap-2 px-4 py-2 rounded-lg">
              {saving === 'contact' ? 'Saving…' : <><Save className="w-4 h-4" /> Save contact</>}
            </button>
          </form>
        </AdminCard>
      </div>
    </AdminPage>
  );
}
