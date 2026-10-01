const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY
});

async function extractMenuFromImage(buffer, mimeType) {
	const base64Image = buffer.toString('base64');

	const message = await anthropic.messages.create({
		model: 'claude-sonnet-5',
		max_tokens: 4096,
		messages: [
			{
				role: 'user',
				content: [
					{
						type: 'image',
						source: {
							type: 'base64',
							media_type: mimeType,
							data: base64Image
						}
					},
					{
						type: 'text',
						text: `
Analyze this restaurant menu image.

Extract the menu into structured JSON.
Return ONLY valid JSON.

Use this structure:
{
	"menu_name": "",
	"currency": "",
	"categories": [
		{
			"name": "",
			"items": [
				{
					"name": "",
					"description": "",
					"price": null
				}
			]
		}
	]
}

Rules:
1. Extract all visible categories.
2. Extract all visible menu items.
3. Preserve the item names from the image.
4. Preserve descriptions when available.
5. Extract numeric prices only.
6. Do not invent missing prices.
7. If a value cannot be determined, use an empty string or null.
8. Return JSON only.
							`
					}
				]
			}
		]
	});

	console.log('Claude response received');

	const textBlock = message.content.find(block => block.type === 'text');

	if (!textBlock) {
		throw new Error('Claude did not return text');
	}

	const jsonText = textBlock.text
		.trim()
		.replace(/^```(?:json)?\s*/i, '')
		.replace(/\s*```$/, '')
		.trim();

	return JSON.parse(jsonText);
}

module.exports = {
	extractMenuFromImage
};
