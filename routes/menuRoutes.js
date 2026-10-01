const express = require('express');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const { uploadMenu } = require('../controllers/uploadController');

const router = express.Router();

function handleMenuImagesUpload(req, res, next) {
    uploadMiddleware(req, res, function (error) {
        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        next();
    });
}

router.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Menu Digitiser API is running'
    });
});

router.post('/api/menu/upload', handleMenuImagesUpload, uploadMenu);

module.exports = router;