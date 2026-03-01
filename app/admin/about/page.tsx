'use client';

import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ImagePlus,
  Save,
  Loader2,
} from 'lucide-react';
import { UniversalUploader, type UploadedFile } from '@/components/admin/uploader/UniversalUploader';
import { AdminCard } from '@/components/admin/AdminCard';

const extensions = [
  StarterKit.configure({
    blockquote: false,
    code: false,
    codeBlock: false,
    heading: false,
    horizontalRule: false,
    strike: false,
    underline: false,
  }),
  Link.configure({ openOnClick: false }),
  Image.configure({ inline: false }),
];

export default function AdminAboutPage() {
  const [initialHtml, setInitialHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePickerOpen, setImagePickerOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/about-content', { credentials: 'same-origin' });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data?.bio_html != null && data.bio_html !== '') {
          setInitialHtml(data.bio_html);
        } else if (res.ok && data?.bio_text) {
          const fallback = String(data.bio_text)
            .split('\n\n')
            .filter(Boolean)
            .map((p: string) => `<p>${p}</p>`)
            .join('');
          setInitialHtml(fallback || '<p></p>');
        } else {
          setInitialHtml('<p></p>');
        }
      } catch {
        if (!cancelled) setInitialHtml('<p></p>');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const editor = useEditor(
    {
      extensions,
      content: initialHtml,
      immediatelyRender: false,
      editorProps: {
        attributes: {
          class:
            'min-h-[280px] px-4 py-3 text-slate-800 prose prose-slate max-w-none focus:outline-none',
        },
      },
    },
    [initialHtml]
  );

  const handleSave = useCallback(async () => {
    if (!editor) return;
    setSaving(true);
    setSaved(false);
    try {
      const html = editor.getHTML();
      const res = await fetch('/api/admin/about-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ bio_html: html }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        console.error('Save failed:', data?.error ?? res.statusText);
      }
    } catch (e) {
      console.error('Save error:', e);
    } finally {
      setSaving(false);
    }
  }, [editor]);

  const handleAddImage = useCallback(
    (files: UploadedFile[]) => {
      const file = files[0];
      if (!file?.url || !editor) return;
      editor.chain().focus().setImage({ src: file.url, alt: file.name ?? '' }).run();
      setImagePickerOpen(false);
    },
    [editor]
  );

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" aria-hidden />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-900 mb-6">About — Bio</h1>
      <AdminCard className="p-0">
        {/* Toolbar: single row, consistent height and border */}
        <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50/80 px-2 py-2 rounded-t-xl">
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={`h-8 w-8 flex items-center justify-center rounded border border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-200 hover:text-slate-900 ${editor?.isActive('bold') ? 'border-slate-300 bg-slate-200 text-slate-900' : ''}`}
            title="Bold"
            aria-pressed={editor?.isActive('bold')}
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={`h-8 w-8 flex items-center justify-center rounded border border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-200 hover:text-slate-900 ${editor?.isActive('italic') ? 'border-slate-300 bg-slate-200 text-slate-900' : ''}`}
            title="Italic"
            aria-pressed={editor?.isActive('italic')}
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              const prev = editor?.getAttributes('link').href;
              const url = window.prompt('Link URL:', prev || 'https://');
              if (url) editor?.chain().focus().setLink({ href: url }).run();
            }}
            className={`h-8 w-8 flex items-center justify-center rounded border border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-200 hover:text-slate-900 ${editor?.isActive('link') ? 'border-slate-300 bg-slate-200 text-slate-900' : ''}`}
            title="Link"
            aria-pressed={editor?.isActive('link')}
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <span className="w-px h-5 bg-slate-300 mx-0.5" aria-hidden />
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={`h-8 w-8 flex items-center justify-center rounded border border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-200 hover:text-slate-900 ${editor?.isActive('bulletList') ? 'border-slate-300 bg-slate-200 text-slate-900' : ''}`}
            title="Bullet list"
            aria-pressed={editor?.isActive('bulletList')}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={`h-8 w-8 flex items-center justify-center rounded border border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-200 hover:text-slate-900 ${editor?.isActive('orderedList') ? 'border-slate-300 bg-slate-200 text-slate-900' : ''}`}
            title="Numbered list"
            aria-pressed={editor?.isActive('orderedList')}
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <span className="w-px h-5 bg-slate-300 mx-0.5" aria-hidden />
          <div className="relative">
            <button
              type="button"
              onClick={() => setImagePickerOpen((o) => !o)}
              className="h-8 w-8 flex items-center justify-center rounded border border-transparent text-slate-600 hover:border-slate-300 hover:bg-slate-200 hover:text-slate-900"
              title="Insert image"
            >
              <ImagePlus className="w-4 h-4" />
            </button>
            {imagePickerOpen && (
              <div className="absolute left-0 top-full mt-1 z-10 bg-white border border-slate-200 rounded-lg shadow-lg p-3 min-w-[260px]">
                <UniversalUploader
                  acceptedTypes={['image']}
                  multiple={false}
                  onSelected={handleAddImage}
                  buttonLabel="Upload image"
                  onUploadingChange={setUploading}
                />
              </div>
            )}
          </div>
        </div>
        <div className="rounded-b-xl overflow-hidden">
          <EditorContent editor={editor} />
        </div>
        <div className="flex items-center gap-3 px-4 py-3 border-t border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploading}
            className="flex items-center gap-2 h-9 px-4 rounded-lg border border-slate-300 bg-slate-800 text-white font-medium hover:bg-slate-700 disabled:opacity-50 disabled:pointer-events-none"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            ) : saved ? (
              <>
                <span className="text-green-300">Saved ✓</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" aria-hidden />
                Save
              </>
            )}
          </button>
          {(saving || uploading) && !saved && (
            <span className="text-sm text-slate-500">
              {uploading ? 'Uploading…' : 'Saving…'}
            </span>
          )}
        </div>
      </AdminCard>
      <p className="mt-3 text-sm text-slate-500">
        Content is sanitized on save. Only paragraphs, bold, italic, links, lists, and images from
        the CDN are allowed.
      </p>
    </div>
  );
}
