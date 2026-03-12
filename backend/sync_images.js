require('dotenv').config();
const { query } = require('./src/config/db');

async function syncImages() {
  try {
    const sql = `
      UPDATE products p
      SET product_images = (
        SELECT COALESCE(
          json_agg(
            json_build_object(
              'image_url', pi.image_url,
              'color_id', pi.color_id,
              'is_primary', pi.is_primary,
              'display_order', pi.display_order,
              'alt_text', pi.alt_text
            ) ORDER BY pi.is_primary DESC, pi.display_order ASC
          ),
          '[]'::json
        )
        FROM product_images_v2 pi
        WHERE pi.product_id = p.id
      )
      WHERE EXISTS (SELECT 1 FROM product_images_v2 pi WHERE pi.product_id = p.id);
    `;
    const res = await query(sql);
    console.log(`Successfully synced images for ${res.rowCount} products.`);
    
    // Also try to set the earliest image to image_url for legacy clients
    const legacySql = `
      UPDATE products p
      SET image_url = (
        SELECT pi.image_url 
        FROM product_images_v2 pi 
        WHERE pi.product_id = p.id 
        ORDER BY pi.is_primary DESC, pi.display_order ASC 
        LIMIT 1
      )
      WHERE EXISTS (SELECT 1 FROM product_images_v2 WHERE product_id = p.id);
    `;
    // const res2 = await query(legacySql); // The image_url column doesn't exist anymore! So skip it.
    
  } catch (error) {
    console.error('Error syncing images:', error);
  } finally {
    process.exit(0);
  }
}

syncImages();
