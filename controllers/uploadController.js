const { extractMenuFromImages } = require('../services/claudeService');
const { validateExtractedMenu } = require('../utils/menuValidator');

async function uploadMenu(req, res) {
	try {
		if (!req.files || req.files.length === 0) {
			return res.status(400).json({
				success: false,
				message: 'Menu image is required'
			});
		}

		const extractedMenu = await extractMenuFromImages(req.files);
		if (!validateExtractedMenu(extractedMenu)) {
			return res.status(422).json({
				success: false,
				message: 'The uploaded image does not appear to contain a readable menu.'
			});
		}

		return res.json({
			success: true,
			message: 'Menu extracted successfully',
			data: extractedMenu
		});
	} catch (error) {
		console.error('Menu extraction error:', error);

		return res.status(500).json({
			success: false,
			message: 'Failed to extract menu',
			error: error.message
		});
	}
}

module.exports = {
	uploadMenu
};
