function validateExtractedMenu(menu) {
	const hasCategories =
		menu !== null &&
		menu !== undefined &&
		Array.isArray(menu.categories) &&
		menu.categories.length > 0;

	const hasMenuItems =
		hasCategories &&
		menu.categories.some(
			category =>
				category !== null &&
				category !== undefined &&
				Array.isArray(category.items) &&
				category.items.length > 0
		);

	return hasCategories && hasMenuItems;
}

module.exports = {
	validateExtractedMenu
};
