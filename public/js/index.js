const menuImage = document.getElementById('menuImage');
const fileName = document.getElementById('fileName');
const extractButton = document.getElementById('extractButton');
const statusMessage = document.getElementById('statusMessage');
const reviewSection = document.getElementById('reviewSection');
const menuNameInput = document.getElementById('menuName');
const currencyInput = document.getElementById('currency');
const categoryList = document.getElementById('categoryList');
const saveMessage = document.getElementById('saveMessage');

menuImage.addEventListener('change', function () {
	const file = menuImage.files[0];

	fileName.textContent = file ? `Selected: ${file.name}` : '';
	extractButton.disabled = !file;
	statusMessage.textContent = '';
	statusMessage.dataset.state = '';
});

function createField(labelText, value, inputType) {
	const wrapper = document.createElement('div');
	const label = document.createElement('label');
	const input = document.createElement('input');

	wrapper.className = 'field';
	label.textContent = labelText;
	input.type = inputType || 'text';
	input.value = value == null ? '' : value;
	label.append(input);
	wrapper.append(label);

	return { wrapper, input };
}

function createMenuItem(item) {
	const itemElement = document.createElement('article');
	const heading = document.createElement('div');
	const itemLabel = document.createElement('strong');
	const removeButton = document.createElement('button');
	const fields = document.createElement('div');
	const nameField = createField('Item name', item.name, 'text');
	const priceField = createField('Price', item.price, 'number');
	const descriptionField = createField('Description', item.description, 'text');

	itemElement.className = 'menu-item';
	itemElement.dataset.menuItem = 'true';
	heading.className = 'item-heading';
	itemLabel.textContent = 'Menu item';
	removeButton.className = 'remove-button';
	removeButton.type = 'button';
	removeButton.textContent = 'Remove';
	removeButton.addEventListener('click', function () {
		itemElement.remove();
	});

	priceField.input.step = '0.01';
	priceField.input.min = '0';
	descriptionField.input.className = 'description-input';
	descriptionField.wrapper.classList.add('description-field');
	fields.className = 'item-fields';
	fields.append(nameField.wrapper, priceField.wrapper, descriptionField.wrapper);
	heading.append(itemLabel, removeButton);
	itemElement.append(heading, fields);

	return itemElement;
}

function createCategory(category) {
	const categoryElement = document.createElement('section');
	const heading = document.createElement('div');
	const nameField = createField('Category name', category.name, 'text');
	const removeButton = document.createElement('button');
	const items = document.createElement('div');
	const actions = document.createElement('div');
	const addItemButton = document.createElement('button');

	categoryElement.className = 'category';
	categoryElement.dataset.category = 'true';
	heading.className = 'category-heading';
	removeButton.className = 'remove-button';
	removeButton.type = 'button';
	removeButton.textContent = 'Remove Category';
	removeButton.addEventListener('click', function () {
		categoryElement.remove();
	});

	items.className = 'item-list';
	(Array.isArray(category.items) ? category.items : []).forEach(function (item) {
		items.append(createMenuItem(item || {}));
	});

	addItemButton.className = 'secondary';
	addItemButton.type = 'button';
	addItemButton.textContent = 'Add Item';
	addItemButton.addEventListener('click', function () {
		items.append(createMenuItem({ name: '', description: '', price: '' }));
	});
	actions.className = 'category-actions';
	actions.append(addItemButton);
	heading.append(nameField.wrapper, removeButton);
	categoryElement.append(heading, items, actions);

	return categoryElement;
}

function renderMenu(menu) {
	menuNameInput.value = menu.menu_name || '';
	currencyInput.value = menu.currency || '';
	categoryList.replaceChildren();

	(Array.isArray(menu.categories) ? menu.categories : []).forEach(function (category) {
		categoryList.append(createCategory(category || {}));
	});

	saveMessage.hidden = true;
	saveMessage.textContent = '';
	reviewSection.hidden = false;
}

function collectMenu() {
	const categories = Array.from(categoryList.querySelectorAll('[data-category="true"]'));

	return {
		menu_name: menuNameInput.value,
		currency: currencyInput.value,
		categories: categories.map(function (categoryElement) {
			const nameInput = categoryElement.querySelector('.category-heading input');
			const items = Array.from(categoryElement.querySelectorAll('[data-menu-item="true"]'));

			return {
				name: nameInput.value,
				items: items.map(function (itemElement) {
					const inputs = itemElement.querySelectorAll('input');
					const price = inputs[1].value;

					return {
						name: inputs[0].value,
						description: itemElement.querySelector('.description-input').value,
						price: price === '' ? null : Number(price)
					};
				})
			};
		})
	};
}

extractButton.addEventListener('click', async function () {
	const file = menuImage.files[0];

	if (!file) {
		return;
	}

	extractButton.disabled = true;
	extractButton.textContent = 'Uploading...';
	statusMessage.textContent = '';
	statusMessage.dataset.state = '';
	reviewSection.hidden = true;

	const formData = new FormData();
	formData.append('menuImage', file);

	try {
		const response = await fetch('/api/menu/upload', {
			method: 'POST',
			body: formData
		});
		const result = await response.json();

		if (!response.ok || !result.success) {
			throw new Error(result.message || 'Menu extraction failed. Please try again.');
		}

		renderMenu(result.data || {});
		statusMessage.textContent = result.message || 'Menu extracted successfully.';
	} catch (error) {
		console.error(error);
		statusMessage.textContent = error.message || 'Something went wrong while uploading the image.';
		statusMessage.dataset.state = 'error';
	} finally {
		extractButton.disabled = !menuImage.files[0];
		extractButton.textContent = 'Extract Menu';
	}
});

document.getElementById('addCategoryButton').addEventListener('click', function () {
	categoryList.append(createCategory({ name: '', items: [] }));
});

document.getElementById('approveButton').addEventListener('click', async function () {
	const approveButton = document.getElementById('approveButton');
	const menuData = collectMenu();
	const validationErrors = [];

	menuData.menu_name = menuData.menu_name.trim();
	menuData.currency = menuData.currency.trim();

	if (!menuData.menu_name) {
		validationErrors.push('Enter a menu name.');
	}

	if (!menuData.currency) {
		validationErrors.push('Enter a currency.');
	}

	if (menuData.categories.length === 0) {
		validationErrors.push('Add at least one category.');
	}

	menuData.categories.forEach(function (category, categoryIndex) {
		category.name = category.name.trim();

		if (!category.name) {
			validationErrors.push(`Enter a name for category ${categoryIndex + 1}.`);
		}

		if (category.items.length === 0) {
			validationErrors.push(`Add at least one item to category ${categoryIndex + 1}.`);
		}

		category.items.forEach(function (item, itemIndex) {
			item.name = item.name.trim();
			item.description = item.description.trim() || null;

			if (!item.name) {
				validationErrors.push(`Enter a name for item ${itemIndex + 1} in category ${categoryIndex + 1}.`);
			}

			if (item.price === null || !Number.isFinite(item.price) || item.price < 0) {
				validationErrors.push(`Enter a valid price for ${item.name || `item ${itemIndex + 1}`}.`);
			}
		});
	});

	if (validationErrors.length > 0) {
		saveMessage.textContent = `Please fix the following before saving:\n- ${validationErrors.join('\n- ')}`;
		saveMessage.dataset.state = 'error';
		saveMessage.hidden = false;
		return;
	}

	approveButton.disabled = true;
	approveButton.textContent = 'Saving...';
	saveMessage.hidden = true;

	try {
		const response = await fetch('/api/menu/save', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(menuData)
		});
		const result = await response.json();

		if (!response.ok || !result.success) {
			throw new Error(result.message || 'Unable to save menu. Please try again.');
		}

		saveMessage.replaceChildren();
		const successText = document.createElement('span');
		successText.textContent = 'Menu saved successfully.';
		saveMessage.append(successText);

		if (result.menu_id != null) {
			const viewMenuLink = document.createElement('a');
			viewMenuLink.href = `/menu.html?id=${encodeURIComponent(result.menu_id)}`;
			viewMenuLink.target = '_blank';
			viewMenuLink.rel = 'noopener';
			viewMenuLink.className = 'view-menu-button';
			viewMenuLink.textContent = 'View Digital Menu';
			saveMessage.append(viewMenuLink);
		}

		saveMessage.dataset.state = 'success';
		saveMessage.hidden = false;
	} catch (error) {
		saveMessage.textContent = error.message || 'Something went wrong while saving the menu.';
		saveMessage.dataset.state = 'error';
		saveMessage.hidden = false;
	} finally {
		approveButton.disabled = false;
		approveButton.textContent = 'Approve & Save Menu';
	}
});
