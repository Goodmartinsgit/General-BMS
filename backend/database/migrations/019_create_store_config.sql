-- Migration 019: Create store configuration table
CREATE TABLE IF NOT EXISTS store_config (
  id SERIAL PRIMARY KEY,
  organization_id INT REFERENCES organizations(id),
  store_slug VARCHAR(100) UNIQUE NOT NULL,
  store_name VARCHAR(255) NOT NULL,
  tagline VARCHAR(255),
  description TEXT,

  -- Branding
  logo_primary TEXT,
  logo_icon TEXT,
  logo_dark TEXT,

  -- Theme
  primary_color VARCHAR(20) DEFAULT '#3B82F6',
  secondary_color VARCHAR(20) DEFAULT '#1E40AF',
  accent_color VARCHAR(20) DEFAULT '#F59E0B',
  background_color VARCHAR(20) DEFAULT '#FFFFFF',
  text_color VARCHAR(20) DEFAULT '#111827',
  font_family VARCHAR(100) DEFAULT 'Inter',

  -- Layout
  header_style VARCHAR(50) DEFAULT 'standard',
  product_card_style VARCHAR(50) DEFAULT 'standard',
  grid_columns INT DEFAULT 4,

  -- Feature flags
  features JSONB DEFAULT '{"wishlist":false,"reviews":false,"compareProducts":false,"quickView":true,"recentlyViewed":true,"relatedProducts":true}',

  -- Contact
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  contact_whatsapp VARCHAR(50),
  contact_address TEXT,

  -- Social
  social_links JSONB DEFAULT '{}',

  -- SEO
  seo_meta_title VARCHAR(255),
  seo_meta_description TEXT,
  seo_og_image TEXT,

  -- Homepage config
  hero_banners JSONB DEFAULT '[]',
  featured_category_ids JSONB DEFAULT '[]',
  featured_product_ids JSONB DEFAULT '[]',
  show_promo_bar BOOLEAN DEFAULT false,
  promo_bar_text VARCHAR(255),

  -- Status
  is_active BOOLEAN DEFAULT true,
  maintenance_mode BOOLEAN DEFAULT false,
  maintenance_message TEXT,
  custom_domain VARCHAR(255),

  -- Commerce config
  currency VARCHAR(10) DEFAULT 'NGN',
  shipping_methods JSONB DEFAULT '[]',
  payment_methods JSONB DEFAULT '["paystack","bank_transfer"]',
  tax_rate DECIMAL(5,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_config_slug ON store_config(store_slug);
CREATE INDEX IF NOT EXISTS idx_store_config_domain ON store_config(custom_domain);
