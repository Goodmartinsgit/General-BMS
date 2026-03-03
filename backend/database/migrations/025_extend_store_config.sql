-- 025_extend_store_config.sql
-- Add three JSONB columns to store_config so the App Builder can manage
-- all storefront content that was previously hardcoded in the storefront.

ALTER TABLE store_config
  ADD COLUMN IF NOT EXISTS home_sections  JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS header_config  JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS footer_config  JSONB NOT NULL DEFAULT '{}';

-- Populate sensible defaults for any existing rows
UPDATE store_config
SET
  home_sections = COALESCE(NULLIF(home_sections, '{}'), '{
    "stats_visible": true,
    "stats": [
      {"value": "18K+", "label": "Products successfully delivered to happy customers"},
      {"value": "700+", "label": "Products available in our catalogue right now"},
      {"value": "95%",  "label": "Customer satisfaction rate based on reviews"}
    ],
    "products_visible": true,
    "products_heading": "Our Best Quality Products",
    "why_visible": true,
    "why_heading": "Why Choose Us",
    "why_image": "",
    "why_items": [
      {"title": "Sustainability",        "body": "We source materials responsibly, ensuring every piece supports a greener future for generations to come."},
      {"title": "Unrivaled quality",     "body": "Each product is crafted with precision and care, meeting the highest standards of durability and design."},
      {"title": "Unmatched variety",     "body": "From classic to contemporary, our collection covers every taste and interior style imaginable."},
      {"title": "Legacy of excellence",  "body": "Decades of expertise and thousands of satisfied customers speak to our enduring commitment to quality."}
    ],
    "cta_visible": true,
    "cta_eyebrow": "Our Vision",
    "cta_heading": "When We Create Furniture,",
    "cta_heading_alt": "We Strive For The Finest Quality.",
    "cta_bullets": ["Sustainable materials", "Handcrafted with care"],
    "cta_text": "See Products",
    "cta_url": "/products",
    "newsletter_visible": true,
    "newsletter_heading": "Subscribe to our newsletter",
    "newsletter_subheading": "and grab 30% OFF your first order",
    "newsletter_placeholder": "Enter your email address",
    "newsletter_button_text": "Subscribe",
    "hero_visible": true,
    "mobile_promo_visible": true,
    "mobile_discount_label": "Discount",
    "mobile_discount_value": "50%",
    "mobile_cta_text": "Shop Now",
    "mobile_section_heading": "Special For You"
  }'::jsonb),

  header_config = COALESCE(NULLIF(header_config, '{}'), '{
    "show_search": true,
    "show_cart": true,
    "show_delivery_link": true,
    "nav_items": [
      {"label": "Products",    "url": "/products",    "is_active": true},
      {"label": "Categories",  "url": "/categories",  "is_active": true},
      {"label": "Track Order", "url": "/track-order", "is_active": true}
    ]
  }'::jsonb),

  footer_config = COALESCE(NULLIF(footer_config, '{}'), '{
    "newsletter_heading": "Newsletter",
    "newsletter_text": "Subscribe for exclusive deals and new arrivals.",
    "newsletter_placeholder": "Email address",
    "newsletter_button_text": "Subscribe",
    "service_links": [
      {"label": "Track Order",       "url": "/track-order"},
      {"label": "All Products",      "url": "/products"},
      {"label": "Categories",        "url": "/categories"},
      {"label": "Returns & Refunds", "url": "/returns"},
      {"label": "Privacy Policy",    "url": "/privacy"},
      {"label": "Terms of Service",  "url": "/terms"}
    ]
  }'::jsonb)
WHERE id IS NOT NULL;
