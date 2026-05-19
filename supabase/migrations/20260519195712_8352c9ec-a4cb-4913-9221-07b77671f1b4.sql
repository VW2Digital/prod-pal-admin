ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS share_facebook_url TEXT,
  ADD COLUMN IF NOT EXISTS share_twitter_url TEXT,
  ADD COLUMN IF NOT EXISTS share_linkedin_url TEXT,
  ADD COLUMN IF NOT EXISTS share_whatsapp_url TEXT;