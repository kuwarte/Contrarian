-- 1. EXTENSIONS
-- Enable UUID generation support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. AUTOMATIC TIMESTAMP TRIGGER
-- Function to automatically update the 'updated_at' column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. TABLES

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    emoji TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opinions Table
CREATE TABLE IF NOT EXISTS public.opinions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content TEXT NOT NULL CHECK (char_length(content) >= 10 AND char_length(content) <= 500),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    author_device_id TEXT NOT NULL,
    anonymous_name TEXT NOT NULL,
    avatar_seed TEXT NOT NULL,
    votes_unpopular INTEGER DEFAULT 0,
    votes_common INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to update 'updated_at' when votes change
CREATE TRIGGER update_opinions_updated_at
    BEFORE UPDATE ON public.opinions
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Votes Table
CREATE TABLE IF NOT EXISTS public.votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opinion_id UUID NOT NULL REFERENCES public.opinions(id) ON DELETE CASCADE,
    device_id TEXT NOT NULL,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('unpopular', 'common')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- UNIQUE CONSTRAINT: This enforces the "One Vote Per Device" rule
    UNIQUE(opinion_id, device_id)
);

-- 4. ATOMIC VOTE FUNCTION (RPC)
-- This is called via supabase.rpc() in your FastAPI backend
CREATE OR REPLACE FUNCTION increment_vote(row_id UUID, column_name TEXT)
RETURNS VOID AS $$
BEGIN
    IF column_name = 'votes_unpopular' THEN
        UPDATE opinions SET votes_unpopular = votes_unpopular + 1 WHERE id = row_id;
    ELSIF column_name = 'votes_common' THEN
        UPDATE opinions SET votes_common = votes_common + 1 WHERE id = row_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_opinions_author ON public.opinions(author_device_id);
CREATE INDEX IF NOT EXISTS idx_opinions_created_at ON public.opinions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_lookup ON public.votes(opinion_id, device_id);

-- 6. REALTIME CONFIGURATION
-- Enable the opinions table for Supabase Realtime broadcasting
ALTER TABLE public.opinions REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
    ALTER PUBLICATION supabase_realtime ADD TABLE opinions;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 7. SEED DATA
INSERT INTO public.categories (name, emoji) VALUES 
('Food', '🍕'),
('Tech', '💻'),
('Gaming', '🎮'),
('Movies', '🎬'),
('Music', '🎵'),
('Lifestyle', '✨')
ON CONFLICT (name) DO NOTHING;
