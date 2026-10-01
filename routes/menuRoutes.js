const express = require('express');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const {
    uploadMenu,
    saveMenu,
    getMenu,
    dbTest
} = require('../controllers/menuController');

const router = express.Router();

router.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Menu Digitiser API is running'
    });
});

router.post('/api/menu/upload', uploadMiddleware, uploadMenu);
router.post('/api/menu/save', saveMenu);
router.get('/api/menu/:id', getMenu);
router.get('/api/db-test', dbTest);

module.exports = router;