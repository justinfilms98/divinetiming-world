'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminPage } from '@/components/admin/AdminPage';
import { AdminCard } from '@/components/admin/AdminCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { Plus, Disc3, Trash2, X } from 'lucide-react';
import { revalidateAfterSave } from '@/lib/revalidate';
import { useAdminToast } from '@/components/admin/AdminToast';
import { UniversalUploader, type UploadedFile } from '@/components/admin/uploader/UniversalUploader';
import { MediaLibraryPicker } from '@/components/admin/MediaLibraryPicker';
import type { Release, ReleaseStatus, ReleaseType } from '@/lib/types/content';

const RELEASE_TYPES: { value: ReleaseType; label: string }[] = [
  { value: 'single', label: 'Single' },
  { value: 'ep', label: 'EP' },
  { value: 'album', label: 'Album' },
  { value: 'remix', label: 'Remix' },
  { value: 'compilation', label: 'Compilation' },
  { value: 'mix', label: 'DJ mix' },
];

const inputClass = 'w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white';
const labelClass = 'block text-white/70 text-sm font-medium mb-2';

const STATUS_BADGE: Record<Exclude<ReleaseStatus, 'published'>, string> = {
  draft: 'bg-amber-500/20 text-amber-400',
  scheduled: 'bg-sky-500/20 text-sky-400',
  archived: 'bg-slate-500/20 text-slate-400',
};

export default function AdminReleasesPage() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Release | null>(null);
  const [previewCover, setPreviewCover] = useState<string | null>(null);
  const [pendingCoverUrl, setPendingCoverUrl] = useState<string | null>(null);
  const [pendingCoverAssetId, setPendingCoverAssetId] = useState<string | null>(null);
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);
  const { showToast } = useAdminToast();

  const loadReleases = useCallback(async () => {
    const res = await fetch('/api/admin/releases', { credentials: 'same-origin' });
    const body = await res.json().catch(() => ({}));
    setReleases(res.ok && body.ok && Array.isArray(body.data) ? (body.data as Release[]) : []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadReleases();
  }, [loadReleases]);

  const openCreate = () => {
    setEditing(null);
    setPreviewCover(null);
    setPendingCoverUrl(null);
    setPendingCoverAssetId(null);
    setModalOpen(true);
  };

  const openEdit = (release: Release) => {
    setEditing(release);
    setPreviewCover(release.cover_image_url ?? null);
    setPendingCoverUrl(null);
    setPendingCoverAssetId(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setPreviewCover(null);
    setPendingCoverUrl(null);
    setPendingCoverAssetId(null);
  };

  const handleCoverUploaded = (files: UploadedFile[]) => {
    const file = files[0];
    if (!file) return;
    setPendingCoverUrl(file.url);
    setPendingCoverAssetId(file.id ?? null);
    setPreviewCover(file.url);
  };

  const handleCoverFromLibrary = (asset: { id: string; preview_url: string }) => {
    setPendingCoverUrl(asset.preview_url);
    setPendingCoverAssetId(asset.id);
    setPreviewCover(asset.preview_url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const payload: Record<string, unknown> = {
      title: formData.get('title'),
      slug: (formData.get('slug') as string)?.trim() || undefined,
      release_type: formData.get('release_type'),
      release_date: (formData.get('release_date') as string) || null,
      status: formData.get('status'),
      spotify_url: formData.get('spotify_url'),
      apple_music_url: formData.get('apple_music_url'),
      youtube_url: formData.get('youtube_url'),
      soundcloud_url: formData.get('soundcloud_url'),
      beatport_url: formData.get('beatport_url'),
      description: formData.get('description'),
      credits: formData.get('credits'),
      video_url: formData.get('video_url'),
      is_featured: formData.get('is_featured') === 'on',
      cover_image_url: pendingCoverUrl ?? editing?.cover_image_url ?? null,
      external_cover_asset_id: pendingCoverAssetId ?? editing?.external_cover_asset_id ?? null,
    };

    if (editing) {
      payload.id = editing.id;
    } else {
      const maxOrder = releases.length > 0 ? Math.max(...releases.map((r) => r.display_order)) : -1;
      payload.display_order = maxOrder + 1;
    }

    const res = await fetch('/api/admin/releases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'same-origin',
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) {
      showToast('error', (body.error as string) ?? res.statusText);
      return;
    }

    await loadReleases();
    await revalidateAfterSave('music');
    showToast('success', editing ? 'Release updated' : 'Release created');
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete permanently? This cannot be undone.')) return;
    const res = await fetch(`/api/admin/releases?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) {
      showToast('error', (body.error as string) ?? res.statusText);
      return;
    }
    await loadReleases();
    await revalidateAfterSave('music');
    showToast('success', 'Release deleted');
  };

  if (isLoading) {
    return (
      <AdminPage title="Music" subtitle="Manage releases">
        <div className="text-slate-500">Loading…</div>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      title="Music"
      subtitle="Releases shown on the public Music page"
      actions={
        <button
          type="button"
          onClick={openCreate}
          className="admin-btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white"
        >
          <Plus className="w-4 h-4" />
          New Release
        </button>
      }
    >
      {releases.length === 0 ? (
        <AdminCard>
          <EmptyState
            icon={Disc3}
            title="No releases yet"
            description="Add your first release to build the music catalogue. The newest release automatically becomes Now Playing on the homepage."
            action={
              <button
                type="button"
                onClick={openCreate}
                className="admin-btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium mx-auto"
              >
                <Plus className="w-4 h-4" />
                Add Your First Release
              </button>
            }
          />
        </AdminCard>
      ) : (
        <div className="grid gap-4">
          {releases.map((release) => (
            <AdminCard key={release.id} className="p-0 overflow-hidden">
              <div
                className="flex cursor-pointer"
                role="button"
                tabIndex={0}
                onClick={() => openEdit(release)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openEdit(release);
                  }
                }}
                aria-label={`Edit ${release.title}`}
              >
                <div className="w-28 flex-shrink-0 aspect-square bg-white/5">
                  {release.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={release.cover_image_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Disc3 className="w-8 h-8 text-[#C6A75E]/50" />
                    </div>
                  )}
                </div>

                <div className="flex-1 flex items-center justify-between p-4 gap-4 min-w-0">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[var(--accent)] text-xs uppercase tracking-wider font-semibold">
                        {release.release_type}
                      </span>
                      {release.release_date && (
                        <span className="text-white/50 text-xs">{release.release_date}</span>
                      )}
                      {release.status !== 'published' && (
                        <span className={`px-2 py-0.5 text-xs rounded capitalize ${STATUS_BADGE[release.status]}`}>
                          {release.status}
                        </span>
                      )}
                      {release.is_featured && (
                        <span className="px-2 py-0.5 bg-[var(--accent)]/20 text-[var(--accent)] text-xs rounded">
                          Now Playing
                        </span>
                      )}
                    </div>
                    <h3
                      className="text-xl font-semibold text-white truncate"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      {release.title}
                    </h3>
                  </div>

                  <div onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleDelete(release.id)}
                      className="p-2 text-red-400/70 hover:text-red-400"
                      title="Delete release"
                      aria-label={`Delete ${release.title}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeModal} />
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#0f0c10] border border-white/10 rounded-xl shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between p-4 border-b border-white/10 bg-[#0f0c10] z-10">
              <h2 className="text-xl font-semibold text-white">
                {editing ? 'Edit Release' : 'Create Release'}
              </h2>
              <button onClick={closeModal} className="p-2 text-white/70 hover:text-white rounded-lg" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form key={editing?.id ?? 'new'} onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className={labelClass}>Cover art</label>
                <div className="flex items-center gap-3">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                    {previewCover ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={previewCover} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Disc3 className="w-7 h-7 text-white/25" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <UniversalUploader
                      acceptedTypes={['image']}
                      acceptOverride="image/*"
                      onSelected={handleCoverUploaded}
                      buttonLabel={previewCover ? 'Replace cover' : 'Upload cover'}
                      hideStorageTip
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-white/20 text-white/80 hover:border-[#C6A75E]/60 hover:text-white text-sm font-medium transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setLibraryPickerOpen(true)}
                      className="px-4 py-2.5 rounded-lg border border-white/20 text-white/80 hover:border-[#C6A75E]/60 hover:text-white text-sm font-medium transition-colors"
                    >
                      Choose from library
                    </button>
                    {previewCover && (
                      <button
                        type="button"
                        onClick={() => {
                          setPendingCoverUrl(null);
                          setPendingCoverAssetId(null);
                          setPreviewCover(null);
                          if (editing) {
                            setEditing({ ...editing, cover_image_url: null, external_cover_asset_id: null });
                          }
                        }}
                        className="text-red-400/80 hover:text-red-400 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="release-title">Title</label>
                <input
                  id="release-title"
                  type="text"
                  name="title"
                  required
                  defaultValue={editing?.title ?? ''}
                  placeholder="Release title"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="release-type">Type</label>
                  <select
                    id="release-type"
                    name="release_type"
                    defaultValue={editing?.release_type ?? 'single'}
                    className={inputClass}
                  >
                    {RELEASE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass} htmlFor="release-date">Release date</label>
                  <input
                    id="release-date"
                    type="date"
                    name="release_date"
                    defaultValue={editing?.release_date ?? ''}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass} htmlFor="release-status">Visibility</label>
                <select
                  id="release-status"
                  name="status"
                  defaultValue={editing?.status ?? 'draft'}
                  className={inputClass}
                >
                  <option value="published">Published (visible on site)</option>
                  <option value="scheduled">Scheduled (hidden until release date)</option>
                  <option value="draft">Draft (hidden)</option>
                  <option value="archived">Archived (hidden)</option>
                </select>
                <p className="text-white/50 text-xs mt-1">
                  Published releases with a future date stay hidden until that date passes.
                </p>
              </div>

              <div>
                <label className={labelClass} htmlFor="release-slug">Release URL</label>
                <input
                  id="release-slug"
                  type="text"
                  name="slug"
                  defaultValue={editing?.slug ?? ''}
                  placeholder={editing ? 'e.g. right-place-right-time' : 'Leave empty to auto-generate from title'}
                  className={inputClass}
                />
                <p className="text-white/50 text-xs mt-1">Used in links (e.g. /music/right-place-right-time).</p>
              </div>

              <fieldset className="space-y-3">
                <legend className={labelClass}>Streaming links</legend>
                {([
                  ['spotify_url', 'Spotify'],
                  ['apple_music_url', 'Apple Music'],
                  ['youtube_url', 'YouTube'],
                  ['soundcloud_url', 'SoundCloud'],
                  ['beatport_url', 'Beatport'],
                ] as const).map(([name, label]) => (
                  <div key={name}>
                    <label className="sr-only" htmlFor={`release-${name}`}>{label} URL</label>
                    <input
                      id={`release-${name}`}
                      type="url"
                      name={name}
                      defaultValue={(editing?.[name] as string | null) ?? ''}
                      placeholder={`${label} URL`}
                      className={inputClass}
                    />
                  </div>
                ))}
              </fieldset>

              <div>
                <label className={labelClass} htmlFor="release-description">Release story</label>
                <textarea
                  id="release-description"
                  name="description"
                  rows={4}
                  defaultValue={editing?.description ?? ''}
                  placeholder="Short story behind the release"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="release-credits">Credits</label>
                <textarea
                  id="release-credits"
                  name="credits"
                  rows={3}
                  defaultValue={editing?.credits ?? ''}
                  placeholder="Written by… Mixed by… Mastered by…"
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="release-video">Video URL (optional)</label>
                <input
                  id="release-video"
                  type="url"
                  name="video_url"
                  defaultValue={editing?.video_url ?? ''}
                  placeholder="YouTube link for the official video"
                  className={inputClass}
                />
              </div>

              <label className="flex items-center gap-3 text-white/80 text-sm">
                <input
                  type="checkbox"
                  name="is_featured"
                  defaultChecked={editing?.is_featured ?? false}
                  className="w-4 h-4"
                />
                Pin as “Now Playing” on the homepage
              </label>
              <p className="text-white/50 text-xs -mt-2">
                Leave unchecked to let the newest published release fill that slot automatically.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded-lg border border-white/20 text-white/80 hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn-primary px-4 py-2 rounded-lg text-white text-sm font-medium"
                >
                  {editing ? 'Save changes' : 'Create release'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {libraryPickerOpen && (
        <MediaLibraryPicker
          open={libraryPickerOpen}
          onClose={() => setLibraryPickerOpen(false)}
          onSelect={handleCoverFromLibrary}
        />
      )}
    </AdminPage>
  );
}
