'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/admin/PageHeader';
import { AdminCard } from '@/components/admin/AdminCard';
import { Save, Check, Upload, X } from 'lucide-react';
import { compressMedia } from '@/lib/utils/compressMedia';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*').single();
    setSettings(data);
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from('site_settings')
      .update(settings)
      .eq('id', settings.id);

    if (error) {
      alert('Error saving settings: ' + error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setIsSaving(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      alert('Please upload an image (jpg, png, webp) or video (mp4, webm) file.');
      return;
    }

    // Update media type based on file
    const newMediaType = isImage ? 'image' : 'video';
    setSettings({ ...settings, hero_media_type: newMediaType });

    setUploading(true);
    setUploadProgress(0);
    setCompressing(true);

    try {
      // Compress the file automatically (like Instagram/YouTube)
      const compressedFile = await compressMedia(file, (progress) => {
        // Compression progress: 0-80%
        setUploadProgress(Math.floor(progress * 0.8));
      });
      
      setCompressing(false);
      
      const originalSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const compressedSizeMB = (compressedFile.size / (1024 * 1024)).toFixed(2);
      
      if (compressedFile.size < file.size) {
        console.log(`Compressed ${file.type}: ${originalSizeMB}MB → ${compressedSizeMB}MB`);
      }

      // Generate unique filename
      const fileExt = compressedFile.name.split('.').pop() || file.name.split('.').pop();
      const fileName = `hero-${Date.now()}.${fileExt}`;
      const filePath = `hero-media/${fileName}`;

      // Check if user is authenticated and get session
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError);
        throw new Error('You must be logged in to upload files. Please refresh the page and try again.');
      }

      console.log('User authenticated:', user.email);
      console.log('User ID:', user.id);
      
      // Get and refresh the session to ensure it's available for storage API
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        throw new Error('Session expired. Please refresh the page and log in again.');
      }
      
      console.log('Session available:', !!session);
      console.log('Session access token exists:', !!session?.access_token);
      console.log('Session user ID:', session?.user?.id);
      
      // Refresh the session to ensure it's valid
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn('Session refresh warning:', refreshError);
        // Don't fail, but log it
      } else if (refreshedSession) {
        console.log('Session refreshed successfully');
      }
      
      // Verify user is in admin_users table
      const { data: adminCheck, error: adminError } = await supabase
        .from('admin_users')
        .select('email')
        .eq('email', user.email)
        .single();
      
      if (adminError || !adminCheck) {
        console.warn('User not found in admin_users table:', adminError);
        // Don't block upload, but log it
      } else {
        console.log('User confirmed in admin_users table');
      }

      // Test bucket access first
      setUploadProgress(80);
      console.log('Testing bucket access...');
      const { data: testList, error: testError } = await supabase.storage
        .from('media')
        .list('hero-media', { limit: 1 });
      
      if (testError) {
        console.error('Bucket access test failed:', testError);
        // Don't fail yet, might still be able to upload
      } else {
        console.log('Bucket access test passed');
      }

      // Upload to Supabase Storage (85-95%)
      setUploadProgress(85);
      console.log('Starting upload...', { filePath, fileSize: compressedFile.size, fileType: compressedFile.type });
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        // Log the full error object to see its structure
        console.error('Upload error (full object):', uploadError);
        console.error('Upload error (JSON):', JSON.stringify(uploadError, null, 2));
        console.error('Upload error (message):', uploadError.message);
        console.error('Upload error (name):', uploadError.name);
        console.error('Upload error (statusCode):', (uploadError as any).statusCode);
        
        // Get error message - handle different error formats
        const errorMessage = uploadError.message || String(uploadError);
        const errorString = errorMessage.toLowerCase();
        
        console.error('Parsed error message:', errorMessage);
        
        // Provide more helpful error messages based on error content
        if (errorString.includes('row-level security') || 
            errorString.includes('rls') || 
            errorString.includes('permission denied') ||
            errorString.includes('new row violates row-level security')) {
          throw new Error('Storage bucket permissions issue. The error suggests RLS is blocking the upload. Please:\n1. Verify you are logged in (refresh the page)\n2. Check Storage → Policies tab and ensure all 4 policies are active\n3. Try logging out and back in\n4. If still failing, the policies may need to be recreated');
        }
        if (errorString.includes('bucket not found') || errorString.includes('does not exist')) {
          throw new Error('Media bucket not found. Please create the "media" bucket in Supabase Storage settings.');
        }
        if (errorString.includes('file size') || errorString.includes('too large')) {
          throw new Error(`File is too large. ${errorMessage}`);
        }
        
        // Generic error with full message
        throw new Error(`Upload failed: ${errorMessage || 'Unknown error. Check browser console for details.'}`);
      }

      setUploadProgress(95);

      // Get public URL
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
      
      if (urlData?.publicUrl) {
        setSettings({ ...settings, hero_media_url: urlData.publicUrl, hero_media_type: newMediaType });
        setUploadProgress(100);
        alert(`File uploaded successfully!${compressedFile.size < file.size ? ` Compressed from ${originalSizeMB}MB to ${compressedSizeMB}MB.` : ''} Don't forget to save settings.`);
      } else {
        throw new Error('Failed to get public URL');
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      const errorMsg = isVideo && fileSizeMB > '50'
        ? `Video file is too large (${fileSizeMB}MB). Maximum size is 50MB. Please compress the video using a tool like HandBrake or VLC before uploading.`
        : `Error uploading file: ${error.message || 'Unknown error'}. Make sure the file is not too large (max 50MB for videos, 5MB for images).`;
      alert(errorMsg);
    } finally {
      setUploading(false);
      setCompressing(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveMedia = () => {
    setSettings({ ...settings, hero_media_url: '', hero_media_type: 'default' });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <PageHeader title="Settings" description="Manage site settings and configuration" />
        <div className="text-white/60">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your site settings, branding, and integrations"
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Branding */}
        <AdminCard>
          <h2 className="text-xl font-semibold text-white mb-4">Branding</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Artist Name</label>
              <input
                type="text"
                value={settings?.artist_name || ''}
                onChange={(e) => setSettings({ ...settings, artist_name: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Member 1 Name</label>
                <input
                  type="text"
                  value={settings?.member_1_name || ''}
                  onChange={(e) => setSettings({ ...settings, member_1_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
              <div>
                <label className="block text-white/70 text-sm font-medium mb-2">Member 2 Name</label>
                <input
                  type="text"
                  value={settings?.member_2_name || ''}
                  onChange={(e) => setSettings({ ...settings, member_2_name: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>
          </div>
        </AdminCard>

        {/* Hero Media */}
        <AdminCard>
          <h2 className="text-xl font-semibold text-white mb-4">Hero Media</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Hero Media Type</label>
              <select
                value={settings?.hero_media_type || 'default'}
                onChange={(e) => setSettings({ ...settings, hero_media_type: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              >
                <option value="default">Default (Eclipse Image)</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Hero Media</label>
              {settings?.hero_media_url && settings?.hero_media_type !== 'default' ? (
                <div className="space-y-3">
                  <div className="relative">
                    {settings.hero_media_type === 'image' ? (
                      <img
                        src={settings.hero_media_url}
                        alt="Hero preview"
                        className="w-full h-48 object-cover rounded-lg border border-white/10"
                      />
                    ) : (
                      <video
                        src={settings.hero_media_url}
                        className="w-full h-48 object-cover rounded-lg border border-white/10"
                        controls
                      />
                    )}
                    <button
                      type="button"
                      onClick={handleRemoveMedia}
                      className="absolute top-2 right-2 p-2 bg-red-500/80 hover:bg-red-500 text-white rounded-full transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-white/50 text-xs">
                    Current: {settings.hero_media_type === 'image' ? 'Image' : 'Video'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="hero-media-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="hero-media-upload"
                    className={`
                      flex items-center justify-center gap-2 px-6 py-4 border-2 border-dashed border-white/20 rounded-lg
                      cursor-pointer transition-colors
                      ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-[var(--accent)] hover:bg-white/5'}
                    `}
                  >
                    <Upload className="w-5 h-5 text-white/70" />
                    <span className="text-white/70 font-medium">
                      {compressing 
                        ? `Compressing... ${uploadProgress}%` 
                        : uploading 
                        ? `Uploading... ${uploadProgress}%` 
                        : 'Upload Image or Video'}
                    </span>
                  </label>
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className="bg-[var(--accent)] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  )}
                  <p className="text-white/50 text-xs">
                    Upload an image (jpg, png, webp) or video (mp4, webm). Leave empty to use default eclipse image.
                  </p>
                </div>
              )}
            </div>
          </div>
        </AdminCard>

        {/* Social Links */}
        <AdminCard>
          <h2 className="text-xl font-semibold text-white mb-4">Social Links</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Instagram URL</label>
              <input
                type="url"
                value={settings?.instagram_url || ''}
                onChange={(e) => setSettings({ ...settings, instagram_url: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">YouTube URL</label>
              <input
                type="url"
                value={settings?.youtube_url || ''}
                onChange={(e) => setSettings({ ...settings, youtube_url: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Spotify URL</label>
              <input
                type="url"
                value={settings?.spotify_url || ''}
                onChange={(e) => setSettings({ ...settings, spotify_url: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Apple Music URL</label>
              <input
                type="url"
                value={settings?.apple_music_url || ''}
                onChange={(e) => setSettings({ ...settings, apple_music_url: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>
        </AdminCard>

        {/* Booking */}
        <AdminCard>
          <h2 className="text-xl font-semibold text-white mb-4">Booking</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Booking Phone</label>
              <input
                type="tel"
                value={settings?.booking_phone || ''}
                onChange={(e) => setSettings({ ...settings, booking_phone: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-white/70 text-sm font-medium mb-2">Booking Email</label>
              <input
                type="email"
                value={settings?.booking_email || ''}
                onChange={(e) => setSettings({ ...settings, booking_email: e.target.value })}
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>
        </AdminCard>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-lg hover:bg-[var(--accent2)] transition-colors font-medium disabled:opacity-50"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4" />
                Saved!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Settings'}
              </>
            )}
          </button>
        </div>
      </form>
    </>
  );
}
