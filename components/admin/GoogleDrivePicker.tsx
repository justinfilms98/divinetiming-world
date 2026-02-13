'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Search, Image as ImageIcon, Video, Loader2 } from 'lucide-react';

interface DriveFile {
  file_id: string;
  name: string;
  mime_type: string;
  size_bytes?: number;
  thumbnail_url?: string;
  web_view_link?: string;
  media_type: 'image' | 'video';
}

export interface DrivePickerAsset {
  id: string;
  url: string;
  thumbnailUrl?: string;
  mediaType: 'image' | 'video';
}

interface GoogleDrivePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (asset: DrivePickerAsset) => void;
  onSelectMultiple?: (assets: DrivePickerAsset[]) => void;
  acceptedTypes?: ('image' | 'video')[];
  multiSelect?: boolean;
}

export function GoogleDrivePicker({
  isOpen,
  onClose,
  onSelect,
  onSelectMultiple,
  acceptedTypes = ['image', 'video'],
  multiSelect = false,
}: GoogleDrivePickerProps) {
  const [step, setStep] = useState<'setup' | 'picker'>('setup');
  const [folderUrl, setFolderUrl] = useState('');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [selected, setSelected] = useState<DriveFile[]>([]);

  const validateFolder = useCallback(async () => {
    if (!folderUrl.trim()) {
      setError('Paste a Google Drive folder link');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/integrations/google-drive/folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderUrl: folderUrl.trim() }),
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid folder URL');
        return;
      }
      if (data.ok && data.folderId) {
        setFolderId(data.folderId);
        setStep('picker');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to validate folder');
    } finally {
      setLoading(false);
    }
  }, [folderUrl]);

  const loadFiles = useCallback(async () => {
    if (!folderId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('filter', filter);
      if (search) params.set('q', search);
      const res = await fetch(`/api/integrations/google-drive/folder/${folderId}/files?${params}`, {
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to list files');
        return;
      }
      setFiles(data.files || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, [folderId, filter, search]);

  useEffect(() => {
    if (step === 'picker' && folderId) loadFiles();
  }, [step, folderId, loadFiles]);

  const handleSelect = async (file: DriveFile) => {
    if (!acceptedTypes.includes(file.media_type)) return;

    if (multiSelect) {
      setSelected((prev) => {
        const exists = prev.filter((p) => p.file_id === file.file_id).length > 0;
        if (exists) return prev.filter((p) => p.file_id !== file.file_id);
        return [...prev, file];
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/integrations/google-drive/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_id: file.file_id,
          name: file.name,
          mime_type: file.mime_type,
          size_bytes: file.size_bytes,
          thumbnail_url: file.thumbnail_url,
          web_view_link: file.web_view_link,
          source_folder_id: folderId,
        }),
        credentials: 'same-origin',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      const asset = data.asset;
      const url = file.media_type === 'video'
        ? `https://drive.google.com/file/d/${file.file_id}/preview`
        : `https://drive.google.com/uc?export=view&id=${file.file_id}`;
      const thumb = file.thumbnail_url || `https://drive.google.com/thumbnail?id=${file.file_id}&sz=w400`;
      onSelect({
        id: asset.id,
        url,
        thumbnailUrl: thumb,
        mediaType: file.media_type,
      });
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to select');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMulti = async () => {
    if (selected.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const assets: DrivePickerAsset[] = [];
      for (const file of selected) {
        const res = await fetch('/api/integrations/google-drive/assets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file_id: file.file_id,
            name: file.name,
            mime_type: file.mime_type,
            thumbnail_url: file.thumbnail_url,
            web_view_link: file.web_view_link,
            source_folder_id: folderId,
          }),
          credentials: 'same-origin',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save');
        const asset = data.asset;
        const url = file.media_type === 'video'
          ? `https://drive.google.com/file/d/${file.file_id}/preview`
          : `https://drive.google.com/uc?export=view&id=${file.file_id}`;
        const thumb = file.thumbnail_url || `https://drive.google.com/thumbnail?id=${file.file_id}&sz=w400`;
        assets.push({ id: asset.id, url, thumbnailUrl: thumb, mediaType: file.media_type });
      }
      if (onSelectMultiple) onSelectMultiple(assets);
      else assets.forEach((a) => onSelect(a));
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to add selected');
    } finally {
      setLoading(false);
    }
  };

  const filteredFiles = files.filter((f) => {
    if (!acceptedTypes.includes(f.media_type)) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-hidden bg-[#0f0c10] border border-white/10 rounded-xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Select from Google Drive</h2>
          <button onClick={onClose} className="p-2 text-white/70 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {step === 'setup' ? (
          <div className="p-4 space-y-4">
            <p className="text-white/70 text-sm">
              Share your Google Drive folder with the service account, then paste the folder link below.
            </p>
            <input
              type="url"
              value={folderUrl}
              onChange={(e) => setFolderUrl(e.target.value)}
              placeholder="https://drive.google.com/drive/folders/..."
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={validateFolder}
                disabled={loading}
                className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Continue
              </button>
              <button onClick={onClose} className="px-6 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-white/10 flex flex-wrap gap-2">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-2 rounded-lg text-sm ${filter === 'all' ? 'bg-[var(--accent)] text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                >
                  All
                </button>
                {acceptedTypes.includes('image') && (
                  <button
                    onClick={() => setFilter('image')}
                    className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${filter === 'image' ? 'bg-[var(--accent)] text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                  >
                    <ImageIcon className="w-4 h-4" />
                    Images
                  </button>
                )}
                {acceptedTypes.includes('video') && (
                  <button
                    onClick={() => setFilter('video')}
                    className={`px-3 py-2 rounded-lg text-sm flex items-center gap-1 ${filter === 'video' ? 'bg-[var(--accent)] text-white' : 'bg-white/5 text-white/70 hover:bg-white/10'}`}
                  >
                    <Video className="w-4 h-4" />
                    Videos
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-[var(--accent)] animate-spin" />
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="text-center py-16 text-white/50">No files found</div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {filteredFiles.map((file) => (
                    <button
                      key={file.file_id}
                      onClick={() => handleSelect(file)}
                      className={`relative aspect-square rounded-lg overflow-hidden bg-white/5 border-2 transition-colors ${
                        selected.some((s) => s.file_id === file.file_id)
                          ? 'border-[var(--accent)]'
                          : 'border-transparent hover:border-white/20'
                      }`}
                    >
                      {file.media_type === 'image' ? (
                        <img
                          src={file.thumbnail_url || `https://drive.google.com/thumbnail?id=${file.file_id}&sz=w200`}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <Video className="w-12 h-12 text-white/70" />
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <p className="text-white text-xs truncate">{file.name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {multiSelect && selected.length > 0 && (
              <div className="p-4 border-t border-white/10 flex justify-between items-center">
                <span className="text-white/70 text-sm">{selected.length} selected</span>
                <button
                  onClick={handleConfirmMulti}
                  disabled={loading}
                  className="px-6 py-2 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] font-medium disabled:opacity-50"
                >
                  Add Selected
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
