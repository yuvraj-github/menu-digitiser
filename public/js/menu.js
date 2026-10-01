const menuName = document.getElementById('menuName');
const currencyNote = document.getElementById('currencyNote');
const menuStatus = document.getElementById('menuStatus');
const pageMessage = document.getElementById('pageMessage');
const categoryList = document.getElementById('categoryList');

const currencySymbols = {
	USD: '$',
	EUR: '\u20ac',
	GBP: '\u00a3',
	INR: '\u20b9',
	AED: '\u062f.\u0625'
};

function setMessage(message, isError) {
	pageMessage.textContent = message;
	pageMessage.hidden = false;
	pageMessage.setAttribute('role', isError ? 'alert' : 'status');
}

function formatPrice(price, currency) {
	const amount = Number(price);
	const formattedAmount = Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
	const currencyCode = String(currency || '').trim();
	const symbol = currencySymbols[currencyCode.toUpperCase()];

	if (symbol) {
		return `${symbol}${formattedAmount}`;
	}

	return currencyCode ? `${currencyCode} ${formattedAmount}` : formattedAmount;
}

function createMenuItem(item, currency) {
	const article = document.createElement('article');
	const name = document.createElement('h3');
	const price = document.createElement('span');
	const description = document.createElement('p');

	article.className = 'menu-item';
	name.className = 'item-name';
	name.textContent = item.name || 'Untitled item';
	price.className = 'item-price';
	price.textContent = formatPrice(item.price, currency);
	description.className = 'item-description';
	description.textContent = item.description || '';
	article.append(name, price);

	if (description.textContent) {
		article.append(description);
	}

	return article;
}

function renderMenu(menu) {
	menuName.textContent = menu.name || 'Restaurant menu';
	document.title = `${menu.name || 'Restaurant'} | Menu`;
	currencyNote.textContent = menu.currency ? `Prices in ${menu.currency}` : 'Prices shown below';
	menuStatus.textContent = 'Menu';
	categoryList.replaceChildren();

	const categories = Array.isArray(menu.categories) ? menu.categories.slice() : [];
	categories.sort(function (first, second) {
		return (Number(first.sort_order) || 0) - (Number(second.sort_order) || 0);
	});

	if (categories.length === 0) {
		setMessage('This menu is being prepared. Please check back soon.', false);
		return;
	}

	categories.forEach(function (category) {
		const section = document.createElement('section');
		const heading = document.createElement('h2');
		const items = Array.isArray(category.items) ? category.items.slice() : [];

		section.className = 'menu-category';
		heading.className = 'category-heading';
		heading.textContent = category.name || 'Menu';
		section.append(heading);
		items.sort(function (first, second) {
			return (Number(first.sort_order) || 0) - (Number(second.sort_order) || 0);
		});

		if (items.length === 0) {
			const emptyItems = document.createElement('p');
			emptyItems.className = 'item-description';
			emptyItems.textContent = 'No items are available in this category yet.';
			section.append(emptyItems);
		} else {
			items.forEach(function (item) {
				section.append(createMenuItem(item, menu.currency));
			});
		}

		categoryList.append(section);
	});

	pageMessage.hidden = true;
}

async function loadMenu() {
	const menuId = new URLSearchParams(window.location.search).get('id');

	if (!menuId || !/^\d+$/.test(menuId)) {
		menuStatus.textContent = 'Menu unavailable';
		menuName.textContent = 'Menu unavailable';
		setMessage('We could not find that menu. Please check the link and try again.', true);
		return;
	}

	try {
		const response = await fetch(`/api/menu/${encodeURIComponent(menuId)}`);
		const result = await response.json();

		if (!response.ok || !result.success || !result.data) {
			throw new Error(result.message || 'We could not find that menu. Please check the link and try again.');
		}

		renderMenu(result.data);
	} catch (error) {
		menuStatus.textContent = 'Menu unavailable';
		menuName.textContent = 'Menu unavailable';
		setMessage(error.message || 'The menu could not be loaded. Please try again later.', true);
	}
}

loadMenu();
