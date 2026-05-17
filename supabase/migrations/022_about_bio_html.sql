-- Step 3: WYSIWYG About — add bio_html for rich content; public page uses bio_html if set, else bio_text
ALTER TABLE about_content ADD COLUMN IF NOT EXISTS bio_html TEXT;
