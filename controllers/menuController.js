const db = require('../config/db');
const { extractMenuFromImage } = require('../services/claudeService');
const { validateExtractedMenu } = require('../utils/menuValidator');

async function uploadMenu(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Menu image is required'
            });
        }

        console.log('Received file:', req.file.originalname);

        const extractedMenu = await extractMenuFromImage(req.file.buffer, req.file.mimetype);
        if (!validateExtractedMenu(extractedMenu)) {
            return res.status(422).json({
                success: false,
                message: 'The uploaded image does not appear to contain a readable menu.'
            });
        }

        res.json({
            success: true,
            message: 'Menu extracted successfully',
            data: extractedMenu
        });
    } catch (error) {
        console.error('Menu extraction error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to extract menu',
            error: error.message
        });
    }
}

async function saveMenu(req, res) {
    let connection;

    try {
        connection = await db.getConnection();

        const { menu_name, currency, categories } = req.body;

        if (!menu_name || !categories || !Array.isArray(categories)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid menu data'
            });
        }

        await connection.beginTransaction();

        const [menuResult] = await connection.query(
            `INSERT INTO menus (name, currency, status)
             VALUES (?, ?, ?)`,
            [menu_name, currency || 'USD', 'approved']
        );

        const menuId = menuResult.insertId;

        for (let categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
            const category = categories[categoryIndex];

            const [categoryResult] = await connection.query(
                `INSERT INTO categories (menu_id, name, sort_order)
                 VALUES (?, ?, ?)`,
                [menuId, category.name, categoryIndex]
            );

            const categoryId = categoryResult.insertId;

            for (let itemIndex = 0; itemIndex < category.items.length; itemIndex++) {
                const item = category.items[itemIndex];

                await connection.query(
                    `INSERT INTO menu_items
                    (category_id, name, description, price, sort_order)
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        categoryId,
                        item.name,
                        item.description || null,
                        item.price ?? null,
                        itemIndex
                    ]
                );
            }
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Menu saved successfully',
            menu_id: menuId
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error('Menu save error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to save menu',
            error: error.message
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

async function getMenu(req, res) {
    try {
        const menuId = req.params.id;

        const [menus] = await db.query(
            `SELECT id, name, currency, status, created_at, updated_at
             FROM menus
             WHERE id = ?`,
            [menuId]
        );

        if (menus.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Menu not found'
            });
        }

        const menu = menus[0];
        const [categories] = await db.query(
            `SELECT id, name, sort_order
             FROM categories
             WHERE menu_id = ?
             ORDER BY sort_order ASC, id ASC`,
            [menuId]
        );

        for (const category of categories) {
            const [items] = await db.query(
                `SELECT id, name, description, price, sort_order
                 FROM menu_items
                 WHERE category_id = ?
                 ORDER BY sort_order ASC, id ASC`,
                [category.id]
            );

            category.items = items;
        }

        res.json({
            success: true,
            data: {
                id: menu.id,
                name: menu.name,
                currency: menu.currency,
                status: menu.status,
                categories
            }
        });
    } catch (error) {
        console.error('Get menu error:', error);

        res.status(500).json({
            success: false,
            message: 'Failed to retrieve menu',
            error: error.message
        });
    }
}

async function dbTest(req, res) {
    try {
        const [rows] = await db.query('SELECT 1 AS result');

        res.json({
            success: true,
            message: 'MySQL connection successful',
            data: rows
        });
    } catch (error) {
        console.error('Database connection error:', error);

        res.status(500).json({
            success: false,
            message: 'MySQL connection failed',
            error: error.message
        });
    }
}

module.exports = {
    uploadMenu,
    saveMenu,
    getMenu,
    dbTest
};