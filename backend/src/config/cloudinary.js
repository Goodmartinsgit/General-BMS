const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Organised folder paths by media category
const FOLDERS = {
    branding:   'bms/branding',    // Company logos, favicons
    products:   'bms/products',    // Product images
    receipts:   'bms/receipts',    // Receipt / invoice logos
    staff:      'bms/staff',       // Staff / user avatars
    suppliers:  'bms/suppliers',   // Supplier logos
    categories: 'bms/categories',  // Product category images
    promotions: 'bms/promotions',  // Promotional banners
};

module.exports = { cloudinary, FOLDERS };
