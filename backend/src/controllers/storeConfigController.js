const { query } = require('../config/db');

// GET /api/store/config/:slug
const getConfigBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    let result = await query(
      `SELECT * FROM store_config WHERE store_slug = $1 AND is_active = true`,
      [slug]
    );

    // Auto-seed a default row if the table is empty, so the storefront works on first run
    if (result.rows.length === 0) {
      const anyRow = await query(`SELECT id FROM store_config LIMIT 1`);
      if (anyRow.rows.length === 0) {
        await query(
          `INSERT INTO store_config (store_slug, store_name, is_active)
           VALUES ($1, 'My Store', true)
           ON CONFLICT DO NOTHING`,
          [slug]
        );
        result = await query(
          `SELECT * FROM store_config WHERE store_slug = $1 AND is_active = true`,
          [slug]
        );
      }
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ code: 'TENANT_NOT_FOUND', message: 'Store not found' });
    }
    res.json(formatConfig(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/store/config  (no slug — returns first active store)
const getDefaultConfig = async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM store_config WHERE is_active = true ORDER BY id LIMIT 1`
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ code: 'TENANT_NOT_FOUND', message: 'No active store found' });
    }
    res.json(formatConfig(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/store/config/domain/:domain
const getConfigByDomain = async (req, res) => {
  try {
    const { domain } = req.params;
    const result = await query(
      `SELECT * FROM store_config WHERE custom_domain = $1 AND is_active = true`,
      [domain]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ code: 'TENANT_NOT_FOUND', message: 'Store not found' });
    }
    res.json(formatConfig(result.rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/store-config (admin)
const getAdminConfig = async (req, res) => {
  try {
    let result = await query(`SELECT * FROM store_config LIMIT 1`);

    // Auto-seed a default config row so the storefront app can load on first run
    if (result.rows.length === 0) {
      await query(
        `INSERT INTO store_config (store_slug, store_name, is_active)
         VALUES ('demo', 'My Store', true)
         ON CONFLICT DO NOTHING`
      );
      result = await query(`SELECT * FROM store_config LIMIT 1`);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Store not configured yet' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/store-config (admin)
const updateConfig = async (req, res) => {
  try {
    const {
      store_slug, store_name, tagline, description,
      logo_primary, logo_icon, logo_dark,
      primary_color, secondary_color, accent_color, background_color, text_color, font_family,
      header_style, product_card_style, grid_columns,
      features, contact_email, contact_phone, contact_whatsapp, contact_address,
      social_links, seo_meta_title, seo_meta_description, seo_og_image,
      hero_banners, featured_category_ids, featured_product_ids,
      show_promo_bar, promo_bar_text,
      is_active, maintenance_mode, maintenance_message, custom_domain,
      currency, shipping_methods, payment_methods, tax_rate,
      // App Builder extended fields
      home_sections, header_config, footer_config,
    } = req.body;

    // Check if config exists
    const existing = await query(`SELECT id FROM store_config LIMIT 1`);

    if (existing.rows.length === 0) {
      // Create new config
      const result = await query(
        `INSERT INTO store_config (
          store_slug, store_name, tagline, description,
          logo_primary, logo_icon, logo_dark,
          primary_color, secondary_color, accent_color, background_color, text_color, font_family,
          header_style, product_card_style, grid_columns,
          features, contact_email, contact_phone, contact_whatsapp, contact_address,
          social_links, seo_meta_title, seo_meta_description, seo_og_image,
          hero_banners, featured_category_ids, featured_product_ids,
          show_promo_bar, promo_bar_text, is_active, maintenance_mode, maintenance_message, custom_domain,
          currency, shipping_methods, payment_methods, tax_rate,
          home_sections, header_config, footer_config
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
          $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,
          $39,$40,$41
        ) RETURNING *`,
        [
          store_slug, store_name, tagline, description,
          logo_primary, logo_icon, logo_dark,
          primary_color, secondary_color, accent_color, background_color, text_color, font_family,
          header_style, product_card_style, grid_columns,
          features ? JSON.stringify(features) : null,
          contact_email, contact_phone, contact_whatsapp, contact_address,
          social_links ? JSON.stringify(social_links) : null,
          seo_meta_title, seo_meta_description, seo_og_image,
          hero_banners ? JSON.stringify(hero_banners) : '[]',
          featured_category_ids ? JSON.stringify(featured_category_ids) : '[]',
          featured_product_ids ? JSON.stringify(featured_product_ids) : '[]',
          show_promo_bar, promo_bar_text, is_active, maintenance_mode, maintenance_message, custom_domain,
          currency, shipping_methods ? JSON.stringify(shipping_methods) : '[]',
          payment_methods ? JSON.stringify(payment_methods) : '["paystack","bank_transfer"]',
          tax_rate,
          home_sections ? JSON.stringify(home_sections) : '{}',
          header_config ? JSON.stringify(header_config) : '{}',
          footer_config ? JSON.stringify(footer_config) : '{}',
        ]
      );
      return res.json(result.rows[0]);
    }

    // Update existing
    const id = existing.rows[0].id;
    const result = await query(
      `UPDATE store_config SET
        store_slug = COALESCE($1, store_slug),
        store_name = COALESCE($2, store_name),
        tagline = $3, description = $4,
        logo_primary = $5, logo_icon = $6, logo_dark = $7,
        primary_color = COALESCE($8, primary_color),
        secondary_color = COALESCE($9, secondary_color),
        accent_color = COALESCE($10, accent_color),
        background_color = COALESCE($11, background_color),
        text_color = COALESCE($12, text_color),
        font_family = COALESCE($13, font_family),
        header_style = COALESCE($14, header_style),
        product_card_style = COALESCE($15, product_card_style),
        grid_columns = COALESCE($16, grid_columns),
        features = COALESCE($17::jsonb, features),
        contact_email = $18, contact_phone = $19, contact_whatsapp = $20, contact_address = $21,
        social_links = COALESCE($22::jsonb, social_links),
        seo_meta_title = $23, seo_meta_description = $24, seo_og_image = $25,
        hero_banners = COALESCE($26::jsonb, hero_banners),
        featured_category_ids = COALESCE($27::jsonb, featured_category_ids),
        featured_product_ids = COALESCE($28::jsonb, featured_product_ids),
        show_promo_bar = COALESCE($29, show_promo_bar),
        promo_bar_text = $30,
        is_active = COALESCE($31, is_active),
        maintenance_mode = COALESCE($32, maintenance_mode),
        maintenance_message = $33, custom_domain = $34,
        currency = COALESCE($35, currency),
        shipping_methods = COALESCE($36::jsonb, shipping_methods),
        payment_methods = COALESCE($37::jsonb, payment_methods),
        tax_rate = COALESCE($38, tax_rate),
        home_sections  = COALESCE($39::jsonb, home_sections),
        header_config  = COALESCE($40::jsonb, header_config),
        footer_config  = COALESCE($41::jsonb, footer_config),
        updated_at = NOW()
      WHERE id = $42 RETURNING *`,
      [
        store_slug, store_name, tagline, description,
        logo_primary, logo_icon, logo_dark,
        primary_color, secondary_color, accent_color, background_color, text_color, font_family,
        header_style, product_card_style, grid_columns,
        features ? JSON.stringify(features) : null,
        contact_email, contact_phone, contact_whatsapp, contact_address,
        social_links ? JSON.stringify(social_links) : null,
        seo_meta_title, seo_meta_description, seo_og_image,
        hero_banners ? JSON.stringify(hero_banners) : null,
        featured_category_ids ? JSON.stringify(featured_category_ids) : null,
        featured_product_ids ? JSON.stringify(featured_product_ids) : null,
        show_promo_bar, promo_bar_text, is_active, maintenance_mode, maintenance_message, custom_domain,
        currency,
        shipping_methods ? JSON.stringify(shipping_methods) : null,
        payment_methods ? JSON.stringify(payment_methods) : null,
        tax_rate,
        home_sections ? JSON.stringify(home_sections) : null,
        header_config ? JSON.stringify(header_config) : null,
        footer_config ? JSON.stringify(footer_config) : null,
        id,
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

function formatConfig(row) {
  return {
    id: row.id,
    tenantId: row.id,
    tenantSlug: row.store_slug,
    storeName: row.store_name,
    tagline: row.tagline,
    description: row.description,
    logo: { primary: row.logo_primary, icon: row.logo_icon, dark: row.logo_dark },
    theme: {
      primaryColor: row.primary_color,
      secondaryColor: row.secondary_color,
      accentColor: row.accent_color,
      backgroundColor: row.background_color,
      textColor: row.text_color,
      fontFamily: row.font_family,
    },
    layout: {
      headerStyle: row.header_style,
      productCardStyle: row.product_card_style,
      gridColumns: row.grid_columns,
    },
    features: row.features,
    contact: {
      email: row.contact_email,
      phone: row.contact_phone,
      whatsapp: row.contact_whatsapp,
      address: row.contact_address,
    },
    social: row.social_links,
    seo: {
      metaTitle: row.seo_meta_title,
      metaDescription: row.seo_meta_description,
      ogImage: row.seo_og_image,
    },
    homepage: {
      heroBanners: row.hero_banners || [],
      featuredCategories: row.featured_category_ids || [],
      featuredProductIds: row.featured_product_ids || [],
      showPromoBar: row.show_promo_bar,
      promoBarText: row.promo_bar_text,
    },
    isActive: row.is_active,
    maintenanceMode: row.maintenance_mode,
    maintenanceMessage: row.maintenance_message,
    customDomain: row.custom_domain,
    currency: row.currency,
    shippingMethods: row.shipping_methods || [],
    paymentMethods: row.payment_methods || ['paystack', 'bank_transfer'],
    taxRate: row.tax_rate,
    // App Builder extended content
    homeSections: row.home_sections || {},
    headerConfig: row.header_config || {},
    footerConfig: row.footer_config || {},
  };
}

module.exports = { getConfigBySlug, getConfigByDomain, getDefaultConfig, getAdminConfig, updateConfig };
