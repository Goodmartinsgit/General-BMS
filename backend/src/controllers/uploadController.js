const { Readable } = require('stream');
const { cloudinary, FOLDERS } = require('../config/cloudinary');

/**
 * Upload a Buffer to Cloudinary inside the given folder.
 */
const uploadBufferToCloudinary = (buffer, folder, options = {}) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image', ...options },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        Readable.from(buffer).pipe(stream);
    });
};

/**
 * Factory: returns a handler that uploads req.file to the given Cloudinary folder.
 * Usage: router.post('/branding', upload.single('file'), uploadMedia('branding'))
 */
const uploadMedia = (category) => async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file provided' });
        }

        const folder = FOLDERS[category];
        if (!folder) {
            return res.status(400).json({ message: 'Invalid upload category' });
        }

        const result = await uploadBufferToCloudinary(req.file.buffer, folder);

        res.json({
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
        });
    } catch (err) {
        console.error('Cloudinary upload error:', err);
        res.status(500).json({ message: 'Upload failed', error: err.message });
    }
};

/**
 * Delete a Cloudinary asset by public_id.
 */
const deleteMedia = async (req, res) => {
    try {
        const { public_id } = req.body;
        if (!public_id) {
            return res.status(400).json({ message: 'public_id is required' });
        }
        await cloudinary.uploader.destroy(public_id);
        res.json({ message: 'Deleted successfully' });
    } catch (err) {
        console.error('Cloudinary delete error:', err);
        res.status(500).json({ message: 'Delete failed' });
    }
};

module.exports = { uploadMedia, deleteMedia };
