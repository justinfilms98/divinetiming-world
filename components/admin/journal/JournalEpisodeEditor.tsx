'use client';

import { useMemo, useState } from 'react';
import { X, ImageIcon, Film } from 'lucide-react';
import { UniversalUploader, type UploadedFile } from '@/components/admin/uploader/UniversalUploader';
import { MediaLibraryPicker } from '@/components/admin/MediaLibraryPicker';
import { useAdminDialog } from '@/components/admin/AdminDialog';
import { useUnsavedChangesGuard } from '@/components/admin/useUnsavedChangesGuard';
import { normalizeHeroEmbed } from '@/lib/embed';
import { describeSaveError } from '@/lib/admin/saveErrors';
import { changedFields, EMPTY_JOURNAL_FORM, episodeToForm, journalPayload, type JournalForm } from '@/lib/journal/editorForm';
import { isPublicJournalStatus, isSlugLocked, JOURNAL_LIMITS, publicReadinessProblems, suggestJournalSlug } from '@/lib/journal/rules';
import type { AdminJournalEpisode, JournalStatus } from '@/lib/journal/types';

const inputClass = 'w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white';
const labelClass = 'block text-white/70 text-sm font-medium mb-2';
const hintClass = 'text-white/50 text-xs mt-1';

const STATUS_OPTIONS: { value: JournalStatus; label: string; hint: string }[] = [
  { value: 'draft', label: 'Draft (hidden)', hint: 'Only admins can see it. Its page returns “not found”.' },
  { value: 'coming_soon', label: 'Coming soon (card only, no video)', hint: 'A teaser card and page with the title, cover, summary and release note. The video stays private.' },
  { value: 'published', label: 'Published (visible on site)', hint: 'The full episode page, including the video if one is set.' },
  { value: 'archived', label: 'Archived (hidden)', hint: 'Removed from the site; kept here with its number and URL.' },
];

export interface GalleryOption {
  id: string;
  name: string;
  status: string | null;
}

function Counter({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return <span className={`text-xs ${over ? 'text-red-400' : 'text-white/40'}`}>{value.length}/{max}</span>;
}

export function JournalEpisodeEditor({
  episode,
  galleries,
  onClose,
  onSaved,
}: {
  episode: AdminJournalEpisode | null;
  galleries: GalleryOption[];
  onClose: () => void;
  onSaved: (saved: AdminJournalEpisode, message: string) => void;
}) {
  const initial = useMemo(() => (episode ? episodeToForm(episode) : EMPTY_JOURNAL_FORM), [episode]);
  const [form, setForm] = useState<JournalForm>(initial);
  const [slugEdited, setSlugEdited] = useState(!!episode);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialog = useAdminDialog();

  const dirty = changedFields(initial, form).length > 0;
  useUnsavedChangesGuard(dirty, 'This episode has unsaved changes. Leaving now discards them.');

  const slugLocked = isSlugLocked(episode);
  const video = form.video_url.trim() ? normalizeHeroEmbed(form.video_url) : null;
  const videoInvalid = !!form.video_url.trim() && !video;
  const missing = publicReadinessProblems({ title: form.title, cover_image_url: form.cover_image_url, summary: form.summary });
  const statusHint = STATUS_OPTIONS.find((o) => o.value === form.status)?.hint;

  const set = <K extends keyof JournalForm>(key: K, value: JournalForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (!slugEdited && !slugLocked && (key === 'title' || key === 'episode_number')) {
        next.slug = suggestJournalSlug(Number(next.episode_number) || null, next.title);
      }
      return next;
    });
  };

  const setCover = (url: string, assetId: string | null) => {
    setForm((prev) => ({ ...prev, cover_image_url: url, external_cover_asset_id: assetId ?? '' }));
  };

  const requestClose = async () => {
    if (dirty) {
      const leave = await dialog.confirm({
        title: 'Close without saving?',
        message: 'Your changes to this episode will be lost.',
        confirmLabel: 'Close without saving',
        cancelLabel: 'Keep editing',
        tone: 'danger',
      });
      if (!leave) return;
    }
    onClose();
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (videoInvalid) {
      setError('Fix the video link first: use a plain YouTube or Vimeo link. Your changes are still here.');
      return;
    }
    if (isPublicJournalStatus(form.status) && missing.length > 0) {
      setError(`To make this episode public it still needs ${missing.join(', ')}. Save it as a draft for now, or add them. Your changes are still here.`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(journalPayload(form, episode ? initial : null, episode?.id)),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body.ok) {
        setError(describeSaveError({ status: res.status, serverMessage: body.error, subject: 'the episode' }));
        return;
      }
      const saved = body.data.episode as AdminJournalEpisode;
      const label = STATUS_OPTIONS.find((o) => o.value === saved.status)?.label.split(' (')[0] ?? saved.status;
      onSaved(saved, `“${saved.title}” saved — ${label.toLowerCase()}.`);
    } catch {
      setError(describeSaveError({ status: 0, subject: 'the episode' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="journal-editor-title">
      <div className="absolute inset-0 bg-black/70" onClick={requestClose} />
      <div className="relative w-full sm:max-w-2xl max-h-[100svh] sm:max-h-[90svh] overflow-y-auto bg-[#0f0c10] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 p-4 border-b border-white/10 bg-[#0f0c10]">
          <h2 id="journal-editor-title" className="text-xl font-semibold text-white truncate">
            {episode ? 'Edit episode' : 'New episode'}
          </h2>
          <button type="button" onClick={requestClose} className="admin-icon-btn text-white/70 hover:text-white hover:bg-white/5 rounded-lg" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={save} className="p-4 space-y-5" noValidate>
          <div>
            <label className={labelClass} htmlFor="journal-status">Visibility</label>
            <select id="journal-status" value={form.status} onChange={(e) => set('status', e.target.value as JournalStatus)} className={inputClass}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className={hintClass}>{statusHint}</p>
            {isPublicJournalStatus(form.status) && missing.length > 0 && (
              <p className="text-amber-400 text-xs mt-1" role="status">Before it can be public it needs {missing.join(', ')}.</p>
            )}
            {form.status === 'coming_soon' && (
              <p className={hintClass}>Everything typed here except the video can be read publicly once it’s Coming soon, so leave the description empty until release.</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem] gap-4">
            <div>
              <div className="flex items-baseline justify-between">
                <label className={labelClass} htmlFor="journal-title">Title</label>
                <Counter value={form.title} max={JOURNAL_LIMITS.title} />
              </div>
              <input id="journal-title" type="text" required value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Barcelona" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="journal-number">Episode no.</label>
              <input id="journal-number" type="number" inputMode="numeric" min={1} max={9999} value={form.episode_number} onChange={(e) => set('episode_number', e.target.value)} placeholder="3" className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="journal-slug">Episode URL</label>
            <div className="flex items-center gap-1 text-white/50 text-sm">
              <span className="shrink-0">/journal/</span>
              <input
                id="journal-slug"
                type="text"
                value={form.slug}
                readOnly={slugLocked}
                onChange={(e) => {
                  setSlugEdited(true);
                  set('slug', e.target.value);
                }}
                placeholder="episode-3-barcelona"
                className={`${inputClass} ${slugLocked ? 'opacity-60' : ''}`}
              />
            </div>
            <p className={hintClass}>{slugLocked ? 'Locked: this episode has been published, so shared links must keep working.' : 'Suggested from the number and title. Lowercase words and hyphens.'}</p>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label className={labelClass} htmlFor="journal-location">Location</label>
              <Counter value={form.location} max={JOURNAL_LIMITS.location} />
            </div>
            <input id="journal-location" type="text" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Barcelona, Spain" className={inputClass} />
          </div>

          <div>
            <span className={labelClass}>Cover image</span>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-32 aspect-video rounded-lg overflow-hidden bg-white/5 flex-shrink-0 flex items-center justify-center">
                {form.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.cover_image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-7 h-7 text-white/25" />
                )}
              </div>
              <div className="flex flex-wrap items-start gap-2 min-w-0 flex-1">
                <button type="button" onClick={() => setPickerOpen(true)} disabled={uploading} className="admin-tap px-4 py-2.5 rounded-lg border border-white/20 text-white/80 hover:border-[#C6A75E]/60 hover:text-white text-sm font-medium transition-colors disabled:opacity-50">
                  Choose from library
                </button>
                <UniversalUploader
                  acceptedTypes={['image']}
                  acceptOverride="image/*"
                  multiple={false}
                  onSelected={(files: UploadedFile[]) => files[0] && setCover(files[0].url, files[0].id ?? null)}
                  onUploadingChange={setUploading}
                  buttonLabel={form.cover_image_url ? 'Upload a new cover' : 'Upload cover'}
                  hideStorageTip
                />
                {form.cover_image_url && (
                  <button type="button" onClick={() => setCover('', null)} className="admin-tap px-3 py-2.5 rounded-lg text-red-400/80 hover:text-red-400 hover:bg-red-400/10 text-sm">
                    Remove
                  </button>
                )}
              </div>
            </div>
            <p className={hintClass}>16:9 works best. Removing the cover never deletes the file from the Media Library.</p>
            <div className="mt-3">
              <div className="flex items-baseline justify-between">
                <label className={labelClass} htmlFor="journal-cover-alt">Cover description (for screen readers)</label>
                <Counter value={form.cover_alt} max={JOURNAL_LIMITS.cover_alt} />
              </div>
              <input id="journal-cover-alt" type="text" value={form.cover_alt} onChange={(e) => set('cover_alt', e.target.value)} placeholder="What the photo shows" className={inputClass} />
            </div>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label className={labelClass} htmlFor="journal-summary">Summary</label>
              <Counter value={form.summary} max={JOURNAL_LIMITS.summary} />
            </div>
            <textarea id="journal-summary" rows={2} value={form.summary} onChange={(e) => set('summary', e.target.value)} placeholder="One or two sentences for the card and search results" className={inputClass} />
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <label className={labelClass} htmlFor="journal-description">Description</label>
              <Counter value={form.description} max={JOURNAL_LIMITS.description} />
            </div>
            <textarea id="journal-description" rows={6} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="The story. Leave a blank line between paragraphs." className={inputClass} />
            <p className={hintClass}>Shown on the published episode page only.</p>
          </div>

          <div>
            <label className={labelClass} htmlFor="journal-video">Video link (optional)</label>
            <input id="journal-video" type="url" inputMode="url" value={form.video_url} onChange={(e) => set('video_url', e.target.value)} placeholder="https://youtu.be/… or https://vimeo.com/…" className={inputClass} aria-invalid={videoInvalid} aria-describedby="journal-video-hint" />
            <p id="journal-video-hint" className={`text-xs mt-1 ${videoInvalid ? 'text-red-400' : 'text-white/50'}`} role={videoInvalid ? 'alert' : undefined}>
              {videoInvalid
                ? 'Not a YouTube or Vimeo video link we can play. Paste the video’s share or watch link.'
                : video
                  ? `${video.provider === 'youtube' ? 'YouTube' : 'Vimeo'} video ${video.id}. Upload it as unlisted; visitors only see it once the episode is Published.`
                  : 'YouTube (unlisted until release) or Vimeo. The video is never shown while the episode is a draft or coming soon.'}
            </p>
            {video?.provider === 'youtube' && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`} alt="" className="mt-2 w-40 aspect-video object-cover rounded-lg border border-white/10" />
            )}
            {video && (
              <label className="mt-2 flex items-center gap-3 text-white/80 text-sm admin-tap">
                <input type="checkbox" checked={form.video_is_vertical} onChange={(e) => set('video_is_vertical', e.target.checked)} className="w-4 h-4" />
                <Film className="w-4 h-4 text-white/50" aria-hidden />
                Vertical video (9:16)
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-baseline justify-between">
                <label className={labelClass} htmlFor="journal-release-note">Release note</label>
                <Counter value={form.release_note} max={JOURNAL_LIMITS.release_note} />
              </div>
              <input id="journal-release-note" type="text" value={form.release_note} onChange={(e) => set('release_note', e.target.value)} placeholder="e.g. Coming in December" className={inputClass} />
            </div>
            <div>
              <label className={labelClass} htmlFor="journal-scheduled">Planned date (optional)</label>
              <input id="journal-scheduled" type="date" value={form.scheduled_for} onChange={(e) => set('scheduled_for', e.target.value)} className={inputClass} />
            </div>
          </div>
          <p className={`${hintClass} -mt-3`}>Shown on coming-soon episodes only, and only while the date is ahead. Nothing publishes automatically.</p>

          <div>
            <label className={labelClass} htmlFor="journal-gallery">Photos from a Collection (optional)</label>
            <select id="journal-gallery" value={form.gallery_id} onChange={(e) => set('gallery_id', e.target.value)} className={inputClass}>
              <option value="">None</option>
              {galleries.map((g) => (
                <option key={g.id} value={g.id}>{g.name}{g.status && g.status !== 'published' ? ` (${g.status})` : ''}</option>
              ))}
            </select>
            <p className={hintClass}>A published Collection’s photos appear on the published episode page.</p>
          </div>

          <details className="rounded-lg border border-white/10 p-3">
            <summary className="cursor-pointer text-white/80 text-sm font-medium admin-tap">Search and sharing (optional)</summary>
            <div className="mt-3 space-y-4">
              <div>
                <div className="flex items-baseline justify-between">
                  <label className={labelClass} htmlFor="journal-seo-title">Search title</label>
                  <Counter value={form.seo_title} max={JOURNAL_LIMITS.seo_title} />
                </div>
                <input id="journal-seo-title" type="text" value={form.seo_title} onChange={(e) => set('seo_title', e.target.value)} placeholder="Defaults to “Episode 3 — Barcelona”" className={inputClass} />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <label className={labelClass} htmlFor="journal-seo-description">Search description</label>
                  <Counter value={form.seo_description} max={JOURNAL_LIMITS.seo_description} />
                </div>
                <textarea id="journal-seo-description" rows={2} value={form.seo_description} onChange={(e) => set('seo_description', e.target.value)} placeholder="Defaults to the summary" className={inputClass} />
              </div>
            </div>
          </details>

          {error && (
            <p className="rounded-lg border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-300" role="alert">
              {error}
            </p>
          )}

          <div className="admin-sticky-actions -mx-4 -mb-4 mt-6 px-4">
            <button type="button" onClick={requestClose} className="admin-tap px-4 py-2.5 rounded-lg border border-white/20 text-white/80 hover:text-white text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={saving || uploading || (!dirty && !!episode)} className="admin-btn-primary admin-tap px-6 py-2.5 rounded-lg font-medium text-white disabled:opacity-50">
              {saving ? 'Saving…' : episode ? 'Save changes' : 'Save episode'}
            </button>
          </div>
        </form>
      </div>

      {pickerOpen && (
        <MediaLibraryPicker
          open
          filter="image"
          currentUrl={form.cover_image_url || null}
          title="Choose a cover from the library"
          emptyMessage="No images in the library yet. Upload a cover instead."
          onClose={() => setPickerOpen(false)}
          onSelect={(asset) => {
            setPickerOpen(false);
            setCover(asset.preview_url, asset.id);
          }}
        />
      )}
    </div>
  );
}
