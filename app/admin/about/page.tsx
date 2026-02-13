'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminCard } from '@/components/admin/AdminCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { Save, Check, Plus, Trash2, ChevronUp, ChevronDown, Upload, X } from 'lucide-react';
import { compressMedia } from '@/lib/utils/compressMedia';
import { revalidatePaths } from '@/lib/revalidate';
import Image from 'next/image';
import { FileText, Image as ImageIcon, Clock } from 'lucide-react';

interface AboutContent {
  id: string;
  bio_text: string;
}

interface AboutPhoto {
  id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
}

interface AboutTimelineItem {
  id: string;
  year: string;
  title: string;
  description: string | null;
  display_order: number;
}

export default function AdminAboutPage() {
  const [bio, setBio] = useState<AboutContent | null>(null);
  const [photos, setPhotos] = useState<AboutPhoto[]>([]);
  const [timeline, setTimeline] = useState<AboutTimelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [timelineModal, setTimelineModal] = useState<AboutTimelineItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [bioRes, photosRes, timelineRes] = await Promise.all([
      supabase.from('about_content').select('*').limit(1).single(),
      supabase.from('about_photos').select('*').order('display_order', { ascending: true }),
      supabase.from('about_timeline').select('*').order('display_order', { ascending: true }),
    ]);
    setBio(bioRes.data);
    setPhotos((photosRes.data || []) as AboutPhoto[]);
    setTimeline((timelineRes.data || []) as AboutTimelineItem[]);
    setIsLoading(false);
  };

  const handleSaveBio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bio) return;
    setSaving('bio');
    const { error } = await supabase
      .from('about_content')
      .update({ bio_text: bio.bio_text, updated_at: new Date().toISOString() })
      .eq('id', bio.id);
    if (error) alert('Error: ' + error.message);
    else {
      await revalidatePaths(['/about']);
      setSaved('bio');
      setTimeout(() => setSaved(null), 3000);
    }
    setSaving(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const compressed = await compressMedia(file);
      const ext = compressed.name.split('.').pop() || 'jpg';
      const path = `about-photos/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('media').upload(path, compressed, { cacheControl: '3600', upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      const maxOrder = photos.length > 0 ? Math.max(...photos.map((p) => p.display_order)) : -1;
      await supabase.from('about_photos').insert({ image_url: urlData.publicUrl, display_order: maxOrder + 1 });
      await loadData();
      await revalidatePaths(['/about']);
    } catch (err: any) {
      alert('Upload failed: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (id: string) => {
    if (!confirm('Remove this photo?')) return;
    await supabase.from('about_photos').delete().eq('id', id);
    await loadData();
    await revalidatePaths(['/about']);
  };

  const handleMovePhoto = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= photos.length) return;
    const a = photos[index];
    const b = photos[target];
    await supabase.from('about_photos').update({ display_order: b.display_order }).eq('id', a.id);
    await supabase.from('about_photos').update({ display_order: a.display_order }).eq('id', b.id);
    await loadData();
    await revalidatePaths(['/about']);
  };

  const handleSaveTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelineModal) return;
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = {
      year: formData.get('year') as string,
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || null,
      updated_at: new Date().toISOString(),
    };
    if (timelineModal.id) {
      await supabase.from('about_timeline').update(data).eq('id', timelineModal.id);
    } else {
      const maxOrder = timeline.length > 0 ? Math.max(...timeline.map((t) => t.display_order)) : -1;
      await supabase.from('about_timeline').insert({ ...data, display_order: maxOrder + 1 });
    }
    await loadData();
    await revalidatePaths(['/about']);
    setTimelineModal(null);
  };

  const handleDeleteTimeline = async (id: string) => {
    if (!confirm('Delete this timeline item?')) return;
    await supabase.from('about_timeline').delete().eq('id', id);
    await loadData();
    await revalidatePaths(['/about']);
  };

  const handleMoveTimeline = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= timeline.length) return;
    const a = timeline[index];
    const b = timeline[target];
    await supabase.from('about_timeline').update({ display_order: b.display_order, updated_at: new Date().toISOString() }).eq('id', a.id);
    await supabase.from('about_timeline').update({ display_order: a.display_order, updated_at: new Date().toISOString() }).eq('id', b.id);
    await loadData();
    await revalidatePaths(['/about']);
  };

  if (isLoading) {
    return (
      <div>
        <PageHeader title="About" description="Edit about page content" />
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  if (!bio) {
    return (
      <div>
        <PageHeader title="About" description="Edit about page content" />
        <div className="text-white/60">About content not found. Run migrations.</div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="About Editor" description="Bio, photos, and timeline" />

      {/* Bio */}
      <AdminCard className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Bio
        </h2>
        <form onSubmit={handleSaveBio}>
          <textarea
            value={bio.bio_text}
            onChange={(e) => setBio({ ...bio, bio_text: e.target.value })}
            rows={8}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white resize-y"
            placeholder="Bio text (paragraphs separated by blank lines)"
          />
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving === 'bio'}
              className="flex items-center gap-2 px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] font-medium disabled:opacity-50"
            >
              {saved === 'bio' ? <><Check className="w-4 h-4" />Saved!</> : <><Save className="w-4 h-4" />{saving === 'bio' ? 'Saving...' : 'Save Bio'}</>}
            </button>
          </div>
        </form>
      </AdminCard>

      {/* Photos */}
      <AdminCard className="mb-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Photos
        </h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" id="photo-upload" disabled={uploading} />
          <label
            htmlFor="photo-upload"
            className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed border-white/20 rounded-lg cursor-pointer ${uploading ? 'opacity-50' : 'hover:border-[var(--accent)]'}`}
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload photo'}
          </label>
        </div>
        {photos.length === 0 ? (
          <EmptyState icon={ImageIcon} title="No photos" description="Upload photos to display with the bio." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {photos.map((photo, i) => (
              <div key={photo.id} className="relative group">
                <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-white/5">
                  <Image src={photo.image_url} alt={photo.alt_text || 'About'} fill className="object-cover" sizes="200px" />
                </div>
                <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex">
                    <button type="button" onClick={() => handleMovePhoto(i, 'up')} disabled={i === 0} className="p-1.5 bg-black/60 rounded disabled:opacity-30">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => handleMovePhoto(i, 'down')} disabled={i === photos.length - 1} className="p-1.5 bg-black/60 rounded disabled:opacity-30">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <button type="button" onClick={() => handleDeletePhoto(photo.id)} className="p-1.5 bg-red-500/80 rounded self-end">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {/* Timeline */}
      <AdminCard>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Timeline
        </h2>
        <button
          onClick={() => setTimelineModal({ id: '', year: '', title: '', description: null, display_order: 0 })}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] font-medium mb-4"
        >
          <Plus className="w-4 h-4" />
          Add timeline item
        </button>
        {timeline.length === 0 ? (
          <EmptyState icon={Clock} title="No timeline items" description="Add milestones to the timeline." />
        ) : (
          <div className="space-y-3">
            {timeline.map((item, i) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div>
                  <span className="text-[var(--accent)] font-semibold">{item.year}</span>
                  <span className="text-white/70 mx-2">·</span>
                  <span className="text-white font-medium">{item.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col">
                    <button type="button" onClick={() => handleMoveTimeline(i, 'up')} disabled={i === 0} className="p-1 text-white/50 hover:text-white disabled:opacity-30">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => handleMoveTimeline(i, 'down')} disabled={i === timeline.length - 1} className="p-1 text-white/50 hover:text-white disabled:opacity-30">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                  <button type="button" onClick={() => setTimelineModal(item)} className="p-2 text-white/70 hover:text-white hover:bg-white/5 rounded">
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDeleteTimeline(item.id)} className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AdminCard>

      {/* Timeline modal */}
      {timelineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setTimelineModal(null)} />
          <div className="relative w-full max-w-md bg-[#0f0c10] border border-white/10 rounded-xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">{timelineModal.id ? 'Edit' : 'Add'} timeline item</h3>
            <form onSubmit={handleSaveTimeline} className="space-y-4">
              <div>
                <label className="block text-white/70 text-sm mb-2">Year</label>
                <input type="text" name="year" defaultValue={timelineModal.year} required placeholder="2024" className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Title</label>
                <input type="text" name="title" defaultValue={timelineModal.title} required className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
              </div>
              <div>
                <label className="block text-white/70 text-sm mb-2">Description (optional)</label>
                <textarea name="description" defaultValue={timelineModal.description || ''} rows={3} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] font-medium">
                  {timelineModal.id ? 'Update' : 'Add'}
                </button>
                <button type="button" onClick={() => setTimelineModal(null)} className="px-6 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
