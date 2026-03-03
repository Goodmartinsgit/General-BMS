-- 024_create_website_builder.sql
-- Website Builder tables: pages, sections, global content, navigation

-- Pages managed through the website builder
CREATE TABLE IF NOT EXISTS website_pages (
  id           SERIAL PRIMARY KEY,
  org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  slug         VARCHAR(255) NOT NULL,
  page_type    VARCHAR(50)  NOT NULL DEFAULT 'custom', -- 'home','about','contact','custom'
  is_active    BOOLEAN NOT NULL DEFAULT true,
  show_in_nav  BOOLEAN NOT NULL DEFAULT true,
  nav_label    VARCHAR(255),
  nav_order    INTEGER NOT NULL DEFAULT 0,
  meta_title       VARCHAR(255),
  meta_description TEXT,
  og_image         VARCHAR(500),
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

-- Sections within a page (hero, features, text block, etc.)
CREATE TABLE IF NOT EXISTS website_sections (
  id           SERIAL PRIMARY KEY,
  page_id      INTEGER NOT NULL REFERENCES website_pages(id) ON DELETE CASCADE,
  section_type VARCHAR(100) NOT NULL,  -- 'hero','features','text_block','image_text','products_grid',...
  label        VARCHAR(255),           -- internal display name
  content      JSONB NOT NULL DEFAULT '{}',
  settings     JSONB NOT NULL DEFAULT '{}', -- bg_color, padding, etc.
  is_visible   BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Global components: header, footer, announcement bar
CREATE TABLE IF NOT EXISTS website_global_content (
  id          SERIAL PRIMARY KEY,
  org_id      INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  section_key VARCHAR(100) NOT NULL, -- 'header','footer','announcement_bar'
  content     JSONB NOT NULL DEFAULT '{}',
  settings    JSONB NOT NULL DEFAULT '{}',
  is_visible  BOOLEAN NOT NULL DEFAULT true,
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(org_id, section_key)
);

-- Navigation menu items (header nav, footer nav)
CREATE TABLE IF NOT EXISTS website_navigation (
  id               SERIAL PRIMARY KEY,
  org_id           INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  nav_type         VARCHAR(50) NOT NULL DEFAULT 'header', -- 'header','footer'
  label            VARCHAR(255) NOT NULL,
  url              VARCHAR(500),
  page_id          INTEGER REFERENCES website_pages(id) ON DELETE SET NULL,
  parent_id        INTEGER REFERENCES website_navigation(id) ON DELETE CASCADE,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  opens_in_new_tab BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_website_pages_org     ON website_pages(org_id);
CREATE INDEX IF NOT EXISTS idx_website_sections_page ON website_sections(page_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_website_nav_org_type  ON website_navigation(org_id, nav_type, sort_order);
