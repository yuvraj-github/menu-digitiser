const multer = require('multer');

const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 10 * 1024 * 1024
	},
	fileFilter: (req, file, cb) => {
		const allowedTypes = [
			'image/jpeg',
			'image/png',
			'image/jpg'
		];

		if (allowedTypes.includes(file.mimetype)) {
			cb(null, true);
		} else {
			cb(new Error('Only JPG and PNG images are allowed'));
		}
	}
});

module.exports = upload.single('menuImage');
