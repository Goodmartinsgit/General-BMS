const { query, pool } = require('../config/db');

// GET /api/store/config/:slug
const getConfigBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    // First try active store, then fall back to any store with this slug
    // (so maintenance / inactive stores still return config instead of 404)
    let result = await query(
      `SELECT * FROM store_config WHERE store_slug = $1 AND is_active = true`,
      [slug]
    );

    if (result.rows.length === 0) {
      // Check for inactive/maintenance store
      result = await query(
        `SELECT * FROM store_config WHERE store_slug = $1`,
        [slug]
      );
    }

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
          `SELECT * FROM store_config WHERE store_slug = $1`,
          [slug]
        );
      }
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ code: 'TENANT_NOT_FOUND', message: 'Store not found' });
    }
    const formatted = await resolveCompanyOverrides(formatConfig(result.rows[0]), result.rows[0]);
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/store/config  (no slug — returns first active store, or maintenance store)
const getDefaultConfig = async (req, res) => {
  try {
    // Prefer active store; fall back to any store (maintenance/inactive)
    let result = await query(
      `SELECT * FROM store_config WHERE is_active = true ORDER BY id LIMIT 1`
    );
    if (result.rows.length === 0) {
      result = await query(
        `SELECT * FROM store_config ORDER BY id LIMIT 1`
      );
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ code: 'TENANT_NOT_FOUND', message: 'No active store found' });
    }
    const formatted = await resolveCompanyOverrides(formatConfig(result.rows[0]), result.rows[0]);
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/store/config/domain/:domain
const getConfigByDomain = async (req, res) => {
  try {
    const { domain } = req.params;
    let result = await query(
      `SELECT * FROM store_config WHERE custom_domain = $1 AND is_active = true`,
      [domain]
    );
    if (result.rows.length === 0) {
      // Fall back to inactive/maintenance store with this domain
      result = await query(
        `SELECT * FROM store_config WHERE custom_domain = $1`,
        [domain]
      );
    }
    if (result.rows.length === 0) {
      return res.status(404).json({ code: 'TENANT_NOT_FOUND', message: 'Store not found' });
    }
    const formatted = await resolveCompanyOverrides(formatConfig(result.rows[0]), result.rows[0]);
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/store-config (admin)
const getAdminConfig = async (req, res) => {
  try {
    let result = await query(`SELECT * FROM store_config ORDER BY id LIMIT 1`);

    // Auto-seed a default config row so the storefront app can load on first run
    if (result.rows.length === 0) {
      await query(
        `INSERT INTO store_config (store_slug, store_name, is_active)
         VALUES ('demo', 'My Store', true)
         ON CONFLICT DO NOTHING`
      );
      result = await query(`SELECT * FROM store_config ORDER BY id LIMIT 1`);
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Store not configured yet' });
    }
    const row = result.rows[0];
    // Parse JSONB fields that might come as strings
    if (typeof row.use_company_settings === 'string') row.use_company_settings = JSON.parse(row.use_company_settings);
    if (typeof row.store_settings === 'string') row.store_settings = JSON.parse(row.store_settings);
    res.json(row);
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
      // Delivery page
      delivery_config,
      // Company settings integration
      use_company_settings, store_settings,
    } = req.body;

    // Check if config exists
    const existing = await query(`SELECT id FROM store_config ORDER BY id LIMIT 1`);

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
          home_sections, header_config, footer_config,
          delivery_config,
          use_company_settings, store_settings
        ) VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
          $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$33,$34,$35,$36,$37,$38,
          $39,$40,$41,$42,$43,$44
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
          delivery_config ? JSON.stringify(delivery_config) : '{}',
          use_company_settings ? JSON.stringify(use_company_settings) : '{"general":true,"branding":true,"tax":true,"receipt":true,"payment":true,"notifications":true,"security":true,"display":true}',
          store_settings ? JSON.stringify(store_settings) : '{}',
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
        delivery_config = COALESCE($42::jsonb, delivery_config),
        use_company_settings = COALESCE($43::jsonb, use_company_settings),
        store_settings = COALESCE($44::jsonb, store_settings),
        updated_at = NOW()
      WHERE id = $45 RETURNING *`,
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
        delivery_config ? JSON.stringify(delivery_config) : null,
        use_company_settings ? JSON.stringify(use_company_settings) : null,
        store_settings ? JSON.stringify(store_settings) : null,
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
      hoverColor: row.hover_color,
      activeTextColor: row.active_text_color,
      sidebarBgColor: row.sidebar_bg_color,
      navbarBgColor: row.navbar_bg_color,
      buttonColor: row.button_color,
    },
    logoType: row.logo_type,
    sidebarNameSize: row.sidebar_name_size,
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
    paymentMethods: row.payment_methods || { paystack: true, manual: false },
    taxRate: row.tax_rate,
    // App Builder extended content
    homeSections: row.home_sections || {},
    headerConfig: row.header_config || {},
    footerConfig: row.footer_config || {},
    deliveryConfig: row.delivery_config || {},
  };
}

// ─── Company Settings Resolution ─────────────────────────────────────────────
// For each section where use_company_settings[section] === true, fetch company
// values and merge them into the formatted config before sending to the store.
async function resolveCompanyOverrides(formatted, row) {
  let ucs = row.use_company_settings;
  if (!ucs) return formatted; // nothing to resolve
  if (typeof ucs === 'string') {
    try { ucs = JSON.parse(ucs); } catch { return formatted; }
  }

  // If every section is false, skip the DB calls entirely
  const anyOn = Object.values(ucs).some(Boolean);
  if (!anyOn) return formatted;

  const result = { ...formatted };

  try {
    // Fetch org info (used by general + branding)
    const orgRes = await pool.query('SELECT * FROM organizations LIMIT 1');
    const org = orgRes.rows[0] || {};
    const orgId = org.id || 1;

    // ── General ────────────────────────────────────────────────────────────
    if (ucs.general) {
      // Fetch general settings from settings table if available
      let genSettings = {};
      try {
        const gr = await pool.query(
          "SELECT settings FROM settings WHERE category = 'general' AND organization_id = $1",
          [orgId]
        );
        if (gr.rows.length > 0) genSettings = gr.rows[0].settings || {};
      } catch {}

      if (org.organization_name) result.storeName = org.organization_name;
      if (genSettings.currency) result.currency = genSettings.currency;
    }

    // ── Branding ─────────────────────────────────────────────────────────
    if (ucs.branding) {
      try {
        const br = await pool.query(
          'SELECT * FROM branding_config WHERE organization_id = $1',
          [orgId]
        );
        if (br.rows.length > 0) {
          const b = br.rows[0];
          result.theme = {
            ...result.theme,
            primaryColor:   b.primary_color   || result.theme?.primaryColor,
            secondaryColor: b.secondary_color || result.theme?.secondaryColor,
            accentColor:    b.accent_color    || result.theme?.accentColor,
            backgroundColor:b.background_color|| result.theme?.backgroundColor,
            fontFamily:     b.font_family     || result.theme?.fontFamily,
          };
          // Use company logo if set
          if (b.logo_url) {
            result.logo = { ...result.logo, primary: b.logo_url };
          }
        }
      } catch {}
    }

    // ── Tax ──────────────────────────────────────────────────────────────
    if (ucs.tax) {
      try {
        const tx = await pool.query('SELECT * FROM tax_settings LIMIT 1');
        if (tx.rows.length > 0 && tx.rows[0].standard_rate != null) {
          result.taxRate = tx.rows[0].standard_rate;
        }
      } catch {}
    }

    // ── Payment ──────────────────────────────────────────────────────────
    if (ucs.payment) {
      try {
        const py = await pool.query(
          "SELECT settings FROM settings WHERE category = 'payment' AND organization_id = $1",
          [orgId]
        );
        if (py.rows.length > 0) {
          const ps = py.rows[0].settings || {};
          // Map company payment toggles to the store paymentMethods array format
          const methods = [];
          if (ps.cash_enabled)           methods.push('cash');
          if (ps.card_enabled)           methods.push('card');
          if (ps.bank_transfer_enabled)  methods.push('bank_transfer');
          if (ps.mobile_money_enabled)   methods.push('mobile_money');
          if (methods.length > 0) result.paymentMethods = methods;
        }
      } catch {}
    }
  } catch (err) {
    // Non-fatal — return whatever we've resolved so far
    console.error('resolveCompanyOverrides error:', err.message);
  }

  return result;
}

// GET /api/store-config/company-settings — returns company settings for store fallback
const getCompanySettingsForStore = async (req, res) => {
  try {
    const orgRes = await pool.query('SELECT * FROM organizations LIMIT 1');
    const org = orgRes.rows[0] || {};
    const orgId = org.id || null;

    let settingsMap = {};
    if (orgId) {
      const settingsRes = await pool.query(
        'SELECT category, settings FROM settings WHERE organization_id = $1',
        [orgId]
      );
      for (const row of settingsRes.rows) {
        settingsMap[row.category] = row.settings;
      }
    }

    // Also fetch branding and tax from their own tables
    let brandingData = {};
    try {
      const brandingRes = await pool.query('SELECT * FROM branding_config WHERE organization_id = $1', [orgId || 1]);
      if (brandingRes.rows.length > 0) brandingData = brandingRes.rows[0];
    } catch {}

    let taxData = {};
    try {
      const taxRes = await pool.query('SELECT * FROM tax_settings LIMIT 1');
      if (taxRes.rows.length > 0) taxData = taxRes.rows[0];
    } catch {}

    let receiptData = {};
    try {
      const receiptRes = await pool.query("SELECT settings FROM settings WHERE category = 'receipt' AND organization_id = $1", [orgId || 1]);
      if (receiptRes.rows.length > 0) receiptData = receiptRes.rows[0].settings;
    } catch {}

    const general = {
      company_name: org.organization_name || '',
      company_email: org.email || '',
      company_phone: org.phone || '',
      company_address: org.address || '',
      ...(settingsMap.general || {})
    };

    res.json({
      general,
      branding: brandingData,
      tax: taxData,
      receipt: receiptData,
      payment: settingsMap.payment || { cash_enabled: true, card_enabled: true, bank_transfer_enabled: true, mobile_money_enabled: false, default_payment_method: 'cash' },
      notifications: settingsMap.notifications || { email_notifications: true, low_stock_alerts: true, low_stock_threshold: 10, daily_summary: false, order_notifications: true },
      security: settingsMap.security || { session_timeout: 30, require_password_change: false, password_expiry_days: 90, two_factor_enabled: false },
      display: settingsMap.display || { items_per_page: 20, default_view_mode: 'grid', show_product_images: true, compact_mode: false, theme: 'midnight' },
    });
  } catch (err) {
    console.error('Error fetching company settings for store:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getConfigBySlug, getConfigByDomain, getDefaultConfig, getAdminConfig, updateConfig, getCompanySettingsForStore };
