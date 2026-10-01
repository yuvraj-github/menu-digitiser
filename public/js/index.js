const menuImage = document.getElementById('menuImage');
const fileName = document.getElementById('fileName');
const extractButton = document.getElementById('extractButton');
const statusMessage = document.getElementById('statusMessage');
const reviewSection = document.getElementById('reviewSection');
const menuNameInput = document.getElementById('menuName');
const currencyInput = document.getElementById('currency');
const menuNotesList = document.getElementById('menuNotesList');
const categoryList = document.getElementById('categoryList');
const exportMessage = document.getElementById('exportMessage');

menuImage.addEventListener('change', function () {
	const files = Array.from(menuImage.files);
	const exceedsLimit = files.length > 10;

	fileName.textContent = files.length
		? `${files.length} image${files.length === 1 ? '' : 's'} selected: ${files.map(function (file) { return file.name; }).join(', ')}`
		: '';
	extractButton.disabled = files.length === 0 || exceedsLimit;
	statusMessage.textContent = exceedsLimit ? 'Please select no more than 10 images.' : '';
	statusMessage.dataset.state = exceedsLimit ? 'error' : '';
});

function createField(labelText, value, inputType, fieldName) {
	const wrapper = document.createElement('div');
	const label = document.createElement('label');
	const input = document.createElement('input');

	wrapper.className = 'field';
	label.textContent = labelText;
	input.type = inputType || 'text';
	input.value = value == null ? '' : value;
	input.dataset.field = fieldName;
	label.append(input);
	wrapper.append(label);

	return { wrapper, input };
}

function createCheckboxField(labelText, checked, fieldName) {
	const wrapper = document.createElement('div');
	const label = document.createElement('label');
	const input = document.createElement('input');
	const text = document.createElement('span');

	wrapper.className = 'field checkbox-field';
	input.type = 'checkbox';
	input.checked = checked === true;
	input.dataset.field = fieldName;
	text.textContent = labelText;
	label.append(input, text);
	wrapper.append(label);

	return { wrapper, input };
}

function createReviewBadge(needsReview) {
	const badge = document.createElement('span');
	badge.className = 'review-badge';
	badge.textContent = 'Needs Review';
	badge.hidden = !needsReview;
	return badge;
}

function updateReviewAppearance(element, badge, checkbox) {
	const needsReview = checkbox.checked;
	element.classList.toggle('needs-review', needsReview);
	badge.hidden = !needsReview;
	updateReviewSummary();
}

function createRemoveButton(label, element) {
	const button = document.createElement('button');
	button.className = 'remove-button';
	button.type = 'button';
	button.textContent = label;
	button.addEventListener('click', function () {
		const parentItem = element.dataset.variant === 'true'
			? element.closest('[data-menu-item="true"]')
			: null;
		element.remove();

		if (parentItem) {
			const itemType = parentItem.querySelector('[data-field="item_type"]');
			const itemPrice = parentItem.querySelector('.item-fields [data-field="price"]');
			const variantList = parentItem.querySelector('[data-variants-section]');

			if (itemType.value === 'standard' && itemPrice.value === '' && variantList.querySelectorAll('[data-variant="true"]').length === 0) {
				const reviewCheckbox = parentItem.querySelector('.item-fields [data-field="needs_review"]');
				reviewCheckbox.checked = true;
				updateReviewAppearance(parentItem, parentItem.querySelector('.item-heading .review-badge'), reviewCheckbox);
			}
		}

		updateReviewSummary();
	});
	return button;
}

function createCheckboxReview(label, needsReview, element, badge) {
	const field = createCheckboxField('Needs review', needsReview, 'needs_review');
	field.input.dataset.needsReview = 'true';
	field.input.addEventListener('change', function () {
		updateReviewAppearance(element, badge, field.input);
	});
	return field;
}

function flagItemNeedsReview(itemElement) {
	const reviewCheckbox = itemElement.querySelector('.item-fields [data-field="needs_review"]');
	reviewCheckbox.checked = true;
	updateReviewAppearance(itemElement, itemElement.querySelector('.item-heading .review-badge'), reviewCheckbox);
}


function createVariant(variant) {
	const entry = document.createElement('article');
	const heading = document.createElement('div');
	const title = document.createElement('strong');
	const badge = createReviewBadge(variant.needs_review === true);
	const fields = document.createElement('div');
	const nameField = createField('Variant name', variant.name, 'text', 'name');
	const priceField = createField('Price', variant.price, 'number', 'price');
	const availabilityField = createCheckboxField('Available', variant.is_available !== false, 'is_available');
	const confidenceField = createField('Confidence', variant.confidence, 'number', 'confidence');
	const reviewField = createCheckboxReview('Needs review', variant.needs_review === true, entry, badge);
	const removeButton = createRemoveButton('Remove Variant', entry);

	entry.className = 'editor-entry variant-entry';
	entry.dataset.variant = 'true';
	heading.className = 'nested-heading';
	title.textContent = 'Variant';
	confidenceField.input.readOnly = true;
	confidenceField.input.step = 'any';
	priceField.input.step = '0.01';
	fields.className = 'item-fields nested-fields';
	fields.append(nameField.wrapper, priceField.wrapper, availabilityField.wrapper, confidenceField.wrapper, reviewField.wrapper);
	heading.append(title, badge, removeButton);
	entry.append(heading, fields);
	updateReviewAppearance(entry, badge, reviewField.input);
	return entry;
}

function createModifier(modifier) {
	const entry = document.createElement('article');
	const heading = document.createElement('div');
	const title = document.createElement('strong');
	const badge = createReviewBadge(modifier.needs_review === true);
	const fields = document.createElement('div');
	const nameField = createField('Modifier name', modifier.name, 'text', 'name');
	const priceDeltaField = createField('Price adjustment', modifier.price_delta ?? 0, 'number', 'price_delta');
	const availabilityField = createCheckboxField('Available', modifier.is_available !== false, 'is_available');
	const confidenceField = createField('Confidence', modifier.confidence, 'number', 'confidence');
	const reviewField = createCheckboxReview('Needs review', modifier.needs_review === true, entry, badge);
	const removeButton = createRemoveButton('Remove Modifier', entry);

	entry.className = 'editor-entry modifier-entry';
	entry.dataset.modifier = 'true';
	heading.className = 'nested-heading';
	title.textContent = 'Modifier';
	confidenceField.input.readOnly = true;
	confidenceField.input.step = 'any';
	priceDeltaField.input.step = '0.01';
	fields.className = 'item-fields nested-fields';
	fields.append(nameField.wrapper, priceDeltaField.wrapper, availabilityField.wrapper, confidenceField.wrapper, reviewField.wrapper);
	heading.append(title, badge, removeButton);
	entry.append(heading, fields);
	updateReviewAppearance(entry, badge, reviewField.input);
	return entry;
}

function createModifierGroup(group) {
	const groupElement = document.createElement('section');
	const heading = document.createElement('div');
	const title = document.createElement('strong');
	const removeButton = createRemoveButton('Remove Group', groupElement);
	const fields = document.createElement('div');
	const nameField = createField('Group name', group.name, 'text', 'name');
	const minSelectField = createField('Minimum selections', group.min_select ?? 0, 'number', 'min_select');
	const maxSelectField = createField('Maximum selections', group.max_select ?? 1, 'number', 'max_select');
	const modifierList = document.createElement('div');
	const addModifierButton = document.createElement('button');

	groupElement.className = 'nested-group modifier-group';
	groupElement.dataset.modifierGroup = 'true';
	heading.className = 'nested-heading';
	title.textContent = 'Modifier group';
	fields.className = 'item-fields nested-fields';
	minSelectField.input.min = '0';
	maxSelectField.input.min = '0';
	fields.append(nameField.wrapper, minSelectField.wrapper, maxSelectField.wrapper);
	modifierList.className = 'nested-list modifier-list';
	(Array.isArray(group.modifiers) ? group.modifiers : []).forEach(function (modifier) {
		modifierList.append(createModifier(modifier || {}));
	});
	addModifierButton.className = 'secondary nested-add-button';
	addModifierButton.type = 'button';
	addModifierButton.textContent = 'Add Modifier';
	addModifierButton.addEventListener('click', function () {
		modifierList.append(createModifier({ name: '', price_delta: 0, is_available: true, confidence: null, needs_review: false }));
		updateReviewSummary();
	});
	heading.append(title, removeButton);
	groupElement.append(heading, fields, modifierList, addModifierButton);
	return groupElement;
}

function createComboComponent(component) {
	const entry = document.createElement('article');
	const heading = document.createElement('div');
	const title = document.createElement('strong');
	const badge = createReviewBadge(component.needs_review === true);
	const fields = document.createElement('div');
	const nameField = createField('Component name', component.component_name, 'text', 'component_name');
	const quantityField = createField('Quantity', component.quantity ?? 1, 'number', 'quantity');
	const variantField = createField('Variant name', component.variant_name, 'text', 'variant_name');
	const confidenceField = createField('Confidence', component.confidence, 'number', 'confidence');
	const reviewField = createCheckboxReview('Needs review', component.needs_review === true, entry, badge);
	const removeButton = createRemoveButton('Remove Component', entry);

	entry.className = 'editor-entry combo-component';
	entry.dataset.comboComponent = 'true';
	heading.className = 'nested-heading';
	title.textContent = 'Combo component';
	confidenceField.input.readOnly = true;
	confidenceField.input.step = 'any';
	quantityField.input.min = '1';
	quantityField.input.step = '1';
	fields.className = 'item-fields nested-fields';
	fields.append(nameField.wrapper, quantityField.wrapper, variantField.wrapper, confidenceField.wrapper, reviewField.wrapper);
	heading.append(title, badge, removeButton);
	entry.append(heading, fields);
	updateReviewAppearance(entry, badge, reviewField.input);
	return entry;
}

function createMenuNote(note) {
	const noteElement = document.createElement('article');
	const heading = document.createElement('div');
	const title = document.createElement('strong');
	const badge = createReviewBadge(note.needs_review === true);
	const fields = document.createElement('div');
	const textWrapper = document.createElement('div');
	const textLabel = document.createElement('label');
	const textInput = document.createElement('textarea');
	const confidenceField = createField('Confidence', note.confidence, 'number', 'confidence');
	const reviewField = createCheckboxReview('Needs review', note.needs_review === true, noteElement, badge);
	const removeButton = createRemoveButton('Remove note', noteElement);

	noteElement.className = 'editor-entry menu-note';
	noteElement.dataset.menuNote = 'true';
	heading.className = 'nested-heading';
	title.textContent = 'Menu note';
	textWrapper.className = 'field description-field';
	textLabel.textContent = 'Note text';
	textInput.value = note.text || '';
	textInput.dataset.field = 'text';
	textLabel.append(textInput);
	textWrapper.append(textLabel);
	confidenceField.input.readOnly = true;
	confidenceField.input.step = 'any';
	fields.className = 'item-fields nested-fields';
	fields.append(textWrapper, confidenceField.wrapper, reviewField.wrapper);
	heading.append(title, badge, removeButton);
	noteElement.append(heading, fields);
	updateReviewAppearance(noteElement, badge, reviewField.input);
	return noteElement;
}

function createMenuItem(item) {
	const itemElement = document.createElement('article');
	const heading = document.createElement('div');
	const itemLabel = document.createElement('strong');
	const variants = Array.isArray(item.variants) ? item.variants : [];
	const itemType = item.item_type === 'combo' ? 'combo' : 'standard';
	const requiresPriceReview = itemType === 'standard' && item.price == null && variants.length === 0;
	const badge = createReviewBadge(item.needs_review === true || requiresPriceReview);
	const fields = document.createElement('div');
	const nameField = createField('Item name', item.name, 'text', 'name');
	const priceField = createField('Price', item.price, 'number', 'price');
	const descriptionField = createField('Description', item.description, 'text', 'description');
	const itemTypeField = document.createElement('div');
	const itemTypeLabel = document.createElement('label');
	const itemTypeSelect = document.createElement('select');
	const standardOption = document.createElement('option');
	const comboOption = document.createElement('option');
	const availabilityField = createCheckboxField('Available', item.is_available !== false, 'is_available');
	const confidenceField = createField('Confidence', item.confidence, 'number', 'confidence');
	const reviewField = createCheckboxReview('Needs review', item.needs_review === true || requiresPriceReview, itemElement, badge);
	const removeButton = createRemoveButton('Remove', itemElement);
	const variantsSection = document.createElement('section');
	const variantList = document.createElement('div');
	const addVariantButton = document.createElement('button');
	const modifierGroupsSection = document.createElement('section');
	const modifierGroupList = document.createElement('div');
	const addModifierGroupButton = document.createElement('button');
	const comboSection = document.createElement('section');
	const comboComponentList = document.createElement('div');
	const addComboComponentButton = document.createElement('button');

	itemElement.className = 'menu-item';
	itemElement.dataset.menuItem = 'true';
	heading.className = 'item-heading';
	itemLabel.textContent = 'Menu item';
	priceField.input.step = '0.01';
	confidenceField.input.readOnly = true;
	confidenceField.input.step = 'any';
	descriptionField.wrapper.classList.add('description-field');
	itemTypeField.className = 'field';
	itemTypeLabel.textContent = 'Item type';
	standardOption.value = 'standard';
	standardOption.textContent = 'Standard';
	comboOption.value = 'combo';
	comboOption.textContent = 'Combo';
	itemTypeSelect.dataset.field = 'item_type';
	itemTypeSelect.append(standardOption, comboOption);
	itemTypeSelect.value = itemType;
	itemTypeLabel.append(itemTypeSelect);
	itemTypeField.append(itemTypeLabel);
	fields.className = 'item-fields';
	fields.append(nameField.wrapper, priceField.wrapper, descriptionField.wrapper, itemTypeField, availabilityField.wrapper, confidenceField.wrapper, reviewField.wrapper);
	heading.append(itemLabel, badge, removeButton);

	variantsSection.className = 'nested-section';
	variantsSection.dataset.variantsSection = 'true';
	variantList.className = 'nested-list variant-list';
	variants.forEach(function (variant) {
		variantList.append(createVariant(variant || {}));
	});
	addVariantButton.className = 'secondary nested-add-button';
	addVariantButton.type = 'button';
	addVariantButton.textContent = 'Add Variant';
	addVariantButton.addEventListener('click', function () {
		variantList.append(createVariant({ name: '', price: null, is_available: true, confidence: null, needs_review: false }));
		updateReviewSummary();
	});
	variantsSection.append(createSectionHeading('Variants'), variantList, addVariantButton);

	modifierGroupsSection.className = 'nested-section';
	modifierGroupList.className = 'nested-list modifier-group-list';
	(Array.isArray(item.modifier_groups) ? item.modifier_groups : []).forEach(function (group) {
		modifierGroupList.append(createModifierGroup(group || {}));
	});
	addModifierGroupButton.className = 'secondary nested-add-button';
	addModifierGroupButton.type = 'button';
	addModifierGroupButton.textContent = 'Add Modifier Group';
	addModifierGroupButton.addEventListener('click', function () {
		modifierGroupList.append(createModifierGroup({ name: '', min_select: 0, max_select: 1, modifiers: [] }));
		updateReviewSummary();
	});
	modifierGroupsSection.append(createSectionHeading('Modifier groups'), modifierGroupList, addModifierGroupButton);

	comboSection.className = 'nested-section';
	comboSection.dataset.comboSection = 'true';
	comboComponentList.className = 'nested-list combo-component-list';
	(Array.isArray(item.combo_components) ? item.combo_components : []).forEach(function (component) {
		comboComponentList.append(createComboComponent(component || {}));
	});
	addComboComponentButton.className = 'secondary nested-add-button';
	addComboComponentButton.type = 'button';
	addComboComponentButton.textContent = 'Add Component';
	addComboComponentButton.addEventListener('click', function () {
		comboComponentList.append(createComboComponent({ component_name: '', quantity: 1, variant_name: null, confidence: null, needs_review: false }));
		updateReviewSummary();
	});
	comboSection.append(createSectionHeading('Combo components'), comboComponentList, addComboComponentButton);
	comboSection.hidden = itemType !== 'combo';
	itemTypeSelect.addEventListener('change', function () {
		comboSection.hidden = itemTypeSelect.value !== 'combo';
		if (itemTypeSelect.value === 'standard' && priceField.input.value === '' && variantList.querySelectorAll('[data-variant="true"]').length === 0) {
			flagItemNeedsReview(itemElement);
		}
	});
	priceField.input.addEventListener('change', function () {
		if (itemTypeSelect.value === 'standard' && priceField.input.value === '' && variantList.querySelectorAll('[data-variant="true"]').length === 0) {
			flagItemNeedsReview(itemElement);
		}
	});

	itemElement.append(heading, fields, variantsSection, modifierGroupsSection, comboSection);
	updateReviewAppearance(itemElement, badge, reviewField.input);
	return itemElement;
}

function createSectionHeading(text) {
	const heading = document.createElement('h4');
	heading.className = 'nested-section-title';
	heading.textContent = text;
	return heading;
}

function createCategory(category) {
	const categoryElement = document.createElement('section');
	const heading = document.createElement('div');
	const nameField = createField('Category name', category.name, 'text', 'name');
	const removeButton = createRemoveButton('Remove Category', categoryElement);
	const items = document.createElement('div');
	const actions = document.createElement('div');
	const addItemButton = document.createElement('button');

	categoryElement.className = 'category';
	categoryElement.dataset.category = 'true';
	heading.className = 'category-heading';
	items.className = 'item-list';
	(Array.isArray(category.items) ? category.items : []).forEach(function (item) {
		items.append(createMenuItem(item || {}));
	});

	addItemButton.className = 'secondary';
	addItemButton.type = 'button';
	addItemButton.textContent = 'Add Item';
	addItemButton.addEventListener('click', function () {
		items.append(createMenuItem({ name: '', description: '', item_type: 'standard', price: null, is_available: true, confidence: null, needs_review: true, variants: [], modifier_groups: [], combo_components: [] }));
		updateReviewSummary();
	});
	actions.className = 'category-actions';
	actions.append(addItemButton);
	heading.append(nameField.wrapper, removeButton);
	categoryElement.append(heading, items, actions);

	return categoryElement;
}

function updateReviewSummary() {
	const reviewSummary = document.getElementById('reviewSummary');
	const reviewCount = document.querySelectorAll('[data-needs-review]:checked').length;

	if (reviewCount === 0) {
		reviewSummary.textContent = 'No items or notes require review.';
	} else {
		reviewSummary.textContent = reviewCount === 1
			? '1 item or note needs review.'
			: `${reviewCount} items/fields/notes need review.`;
	}
}

function readNumber(input) {
	return input.value === '' ? null : Number(input.value);
}

function collectMenu() {
	const categories = Array.from(categoryList.querySelectorAll('[data-category="true"]'));

	return {
		menu_name: menuNameInput.value,
		currency: currencyInput.value,
		notes: Array.from(menuNotesList.querySelectorAll('[data-menu-note="true"]')).map(function (noteElement) {
			return {
				text: noteElement.querySelector('[data-field="text"]').value,
				confidence: readNumber(noteElement.querySelector('[data-field="confidence"]')),
				needs_review: noteElement.querySelector('[data-field="needs_review"]').checked
			};
		}),
		categories: categories.map(function (categoryElement) {
			return {
				name: categoryElement.querySelector('[data-field="name"]').value,
				items: Array.from(categoryElement.querySelectorAll('[data-menu-item="true"]')).map(function (itemElement) {
					const getField = function (fieldName) {
						return itemElement.querySelector(`[data-field="${fieldName}"]`);
					};
					const priceInput = getField('price');
					const price = readNumber(priceInput);

					return {
						name: getField('name').value,
						description: getField('description').value,
						item_type: getField('item_type').value,
						price,
						is_available: getField('is_available').checked,
						confidence: readNumber(getField('confidence')),
						needs_review: getField('needs_review').checked,
						variants: Array.from(itemElement.querySelectorAll('[data-variant="true"]')).map(function (variantElement) {
							return {
								name: variantElement.querySelector('[data-field="name"]').value,
								price: readNumber(variantElement.querySelector('[data-field="price"]')),
								is_available: variantElement.querySelector('[data-field="is_available"]').checked,
								confidence: readNumber(variantElement.querySelector('[data-field="confidence"]')),
								needs_review: variantElement.querySelector('[data-field="needs_review"]').checked
							};
						}),
						modifier_groups: Array.from(itemElement.querySelectorAll('[data-modifier-group="true"]')).map(function (groupElement) {
							return {
								name: groupElement.querySelector('[data-field="name"]').value,
								min_select: readNumber(groupElement.querySelector('[data-field="min_select"]')) ?? 0,
								max_select: readNumber(groupElement.querySelector('[data-field="max_select"]')) ?? 1,
								modifiers: Array.from(groupElement.querySelectorAll('[data-modifier="true"]')).map(function (modifierElement) {
									return {
										name: modifierElement.querySelector('[data-field="name"]').value,
										price_delta: readNumber(modifierElement.querySelector('[data-field="price_delta"]')) ?? 0,
										is_available: modifierElement.querySelector('[data-field="is_available"]').checked,
										confidence: readNumber(modifierElement.querySelector('[data-field="confidence"]')),
										needs_review: modifierElement.querySelector('[data-field="needs_review"]').checked
									};
								})
							};
						}),
						combo_components: Array.from(itemElement.querySelectorAll('[data-combo-component="true"]')).map(function (componentElement) {
							const quantity = readNumber(componentElement.querySelector('[data-field="quantity"]'));

							return {
								component_name: componentElement.querySelector('[data-field="component_name"]').value,
								quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
								variant_name: componentElement.querySelector('[data-field="variant_name"]').value || null,
								confidence: readNumber(componentElement.querySelector('[data-field="confidence"]')),
								needs_review: componentElement.querySelector('[data-field="needs_review"]').checked
							};
						})
					};
				})
			};
		})
	};
}

function renderMenu(menu) {
	menuNameInput.value = menu.menu_name || menu.name || '';
	currencyInput.value = menu.currency || '';
	menuNotesList.replaceChildren();
	categoryList.replaceChildren();

	(Array.isArray(menu.notes) ? menu.notes : []).forEach(function (note) {
		menuNotesList.append(createMenuNote(note || {}));
	});
	(Array.isArray(menu.categories) ? menu.categories : []).forEach(function (category) {
		categoryList.append(createCategory(category || {}));
	});

	updateReviewSummary();
	exportMessage.hidden = true;
	exportMessage.textContent = '';
	reviewSection.hidden = false;
}

extractButton.addEventListener('click', async function () {
	const files = Array.from(menuImage.files);

	if (files.length === 0) {
		return;
	}

	if (files.length > 10) {
		statusMessage.textContent = 'Please select no more than 10 images.';
		statusMessage.dataset.state = 'error';
		return;
	}

	extractButton.disabled = true;
	extractButton.textContent = 'Uploading...';
	statusMessage.textContent = '';
	statusMessage.dataset.state = '';
	reviewSection.hidden = true;

	const formData = new FormData();
	for (const file of files) {
		formData.append('menuImages', file);
	}

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
		extractButton.disabled = menuImage.files.length === 0 || menuImage.files.length > 10;
		extractButton.textContent = 'Extract Menu';
	}
});

document.getElementById('addCategoryButton').addEventListener('click', function () {
	categoryList.append(createCategory({ name: '', items: [] }));
});

document.getElementById('addNoteButton').addEventListener('click', function () {
	menuNotesList.append(createMenuNote({ text: '', confidence: null, needs_review: true }));
	updateReviewSummary();
});

document.getElementById('exportButton').addEventListener('click', function () {
	const menuData = collectMenu();
	const hasUnresolvedReview = document.querySelector('[data-needs-review]:checked') !== null;
	const validationErrors = [];

	menuData.menu_name = menuData.menu_name.trim();
	menuData.currency = menuData.currency.trim();

	if (!menuData.menu_name) {
		validationErrors.push('Enter a menu name.');
	}

	if (!menuData.currency) {
		validationErrors.push('Enter a currency.');
	}

	menuData.notes.forEach(function (note, noteIndex) {
		note.text = note.text.trim();
		if (!note.text) {
			validationErrors.push(`Enter text for menu note ${noteIndex + 1}.`);
		}
	});

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

			if (item.price !== null && (!Number.isFinite(item.price) || item.price < 0)) {
				validationErrors.push(`Enter a valid price for ${item.name || `item ${itemIndex + 1}`}.`);
			}

			item.variants.forEach(function (variant, variantIndex) {
				if (variant.price !== null && (!Number.isFinite(variant.price) || variant.price < 0)) {
					validationErrors.push(`Enter a valid price for variant ${variantIndex + 1} of ${item.name || `item ${itemIndex + 1}`}.`);
				}
			});

			item.modifier_groups.forEach(function (group) {
				group.modifiers.forEach(function (modifier, modifierIndex) {
					if (!Number.isFinite(modifier.price_delta)) {
						validationErrors.push(`Enter a valid price adjustment for modifier ${modifierIndex + 1}.`);
					}
				});
			});
		});
	});

	if (validationErrors.length > 0) {
		exportMessage.textContent = `Please fix the following before exporting:\n- ${validationErrors.join('\n- ')}`;
		exportMessage.dataset.state = 'error';
		exportMessage.hidden = false;
		return;
	}

	const exportCatalog = {
		restaurant: {
			name: menuData.menu_name,
			currency: menuData.currency
		},
		notes: menuData.notes,
		categories: menuData.categories
	};
	const jsonBlob = new Blob([JSON.stringify(exportCatalog, null, 2)], { type: 'application/json' });
	const downloadUrl = URL.createObjectURL(jsonBlob);
	const downloadLink = document.createElement('a');
	const fileBaseName = menuData.menu_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'menu-catalog';

	downloadLink.href = downloadUrl;
	downloadLink.download = `${fileBaseName}.json`;
	document.body.append(downloadLink);
	downloadLink.click();
	downloadLink.remove();
	window.setTimeout(function () {
		URL.revokeObjectURL(downloadUrl);
	}, 1000);

	const reviewCount = document.querySelectorAll('[data-needs-review]:checked').length;
	exportMessage.textContent = hasUnresolvedReview
		? `JSON catalog downloaded. ${reviewCount} field${reviewCount === 1 ? '' : 's'} remain flagged for human review.`
		: 'JSON catalog downloaded with no unresolved review flags.';
	exportMessage.dataset.state = 'success';
	exportMessage.hidden = false;
});
