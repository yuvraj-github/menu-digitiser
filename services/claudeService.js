const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
	apiKey: process.env.ANTHROPIC_API_KEY
});

async function extractMenuFromImages(files) {
	const imageContent = files.map(file => ({
		type: 'image',
		source: {
			type: 'base64',
			media_type: file.mimetype,
			data: file.buffer.toString('base64')
		}
	}));

	const message = await anthropic.messages.create({
		model: 'claude-sonnet-5',
    max_tokens: 16384,
		messages: [
			{
				role: 'user',
				content: [
					...imageContent,
					{
						type: 'text',
						text: `
Treat all uploaded images as pages or notes belonging to ONE restaurant menu. Extract the complete menu across all images together.

Return ONLY valid JSON using this exact structure:
{
  "menu_name": "",
  "currency": "",
  "notes": [
    {
      "text": "",
      "confidence": null,
      "needs_review": false
    }
  ],
  "categories": [
    {
      "name": "",
      "items": [
        {
          "name": "",
          "description": "",
          "item_type": "standard",
          "price": null,
          "is_available": true,
          "confidence": null,
          "needs_review": false,
          "variants": [
            {
              "name": "",
              "price": null,
              "is_available": true,
              "confidence": null,
              "needs_review": false
            }
          ],
          "modifier_groups": [
            {
              "name": "",
              "min_select": 0,
              "max_select": 1,
              "modifiers": [
                {
                  "name": "",
                  "price_delta": 0,
                  "is_available": true,
                  "confidence": null,
                  "needs_review": false
                }
              ]
            }
          ],
          "combo_components": [
            {
              "component_name": "",
              "quantity": 1,
              "variant_name": null,
              "confidence": null,
              "needs_review": false
            }
          ]
        }
      ]
    }
  ]
}

Extraction rules:
1. Treat all uploaded images as pages/notes belonging to ONE menu.
2. Set menu_name to the restaurant/business name or logo text, preferably from the first page. Do not use page/section headings such as "MAINS" or "BREADS · SIDES · MORE" as the restaurant name. If no restaurant name is visible on any page, use an empty string.
3. Extract all visible categories, menu items, descriptions and prices. Read currency statements anywhere in the menu, including page footers such as "all prices in AED".
4. Preserve the wording from the menu. Do not invent missing content.
5. Extract numeric prices only. If a price cannot be determined, use null.
6. VARIANTS: If an item has sizes or variants such as Half/Full or Small/Medium/Large, put them in "variants". Do not create separate menu items for each size. When variants contain the prices, the item's base "price" may be null.
7. MODIFIERS: Represent selectable options/add-ons in "modifier_groups". Examples include spice level (Mild/Medium/Hot), Extra Raita +6, and Boiled Egg +4. Store modifier extra cost as "price_delta". A no-charge modifier must use price_delta: 0.
8. SECTION NOTES AND CALLOUTS: Apply notes that clearly govern a whole category or section to every applicable item in that section. For example, a Curries note saying "available Half / Full" means each applicable curry has Half and Full variants; a section note for spice level applies as a modifier group to those items. Put standalone informational or promotional callouts, such as "Ask about weekend brunch!", in the top-level "notes" array with text, confidence, and needs_review. Never create a sellable menu item from a callout unless the source clearly presents it as food or drink for sale. Do not apply a section note outside its evident scope; mark needs_review=true if its scope is ambiguous.
9. ITEM LABELS: A label such as "(V)" is a vegetarian marker, not description text. Preserve it at the end of the item name, for example "Palak Paneer (V)". Do not create dietary information that is not shown.
10. SOUP-OF-THE-DAY LABELS: For wording like "Soup of the day: Tomato Shorba", use "Tomato Shorba" as the item name and preserve "Soup of the day" as its description/context. Do not combine the label and dish name.
11. COMBOS: For combo meals, set "item_type": "combo" and put included components in "combo_components". Preserve quantities such as "2 naan" as quantity: 2. Preserve referenced variants such as "Paneer Butter Masala (half)" as variant_name: "Half".
12. AVAILABILITY: If the menu explicitly says an item/variant/modifier is unavailable, set is_available to false. Otherwise use true. Do not infer unavailability without evidence.
13. HANDWRITING: Attempt to read handwritten daily-special notes. Do not silently guess unclear handwriting.
14. CONFIDENCE: confidence must be a number between 0 and 1 when the model can meaningfully assess extraction certainty. It represents confidence in correctly reading/transcribing the source text, not confidence in its interpretation or whether the food item exists. Do not reduce confidence merely because text is handwritten; clear handwriting may have high transcription confidence.
15. NEEDS REVIEW: Treat needs_review as independent from confidence. Set it to true if confidence is below 0.80, important text is uncertain/ambiguous/partially unreadable (including handwriting), the relationship between an item and its price is unclear, or a structural interpretation (category scope, variant, modifier, or combo composition) needs human confirmation. A clearly transcribed item can have high confidence and still need review if its interpretation is uncertain; do not lower transcription confidence to express interpretation uncertainty. Set needs_review=false only when both transcription and interpretation are clear. Do not flag a clearly readable combo component solely because it is a combo component.
16. Do not fabricate text to make the output complete. Use empty string or null when appropriate and mark needs_review=true when the missing/uncertain value matters.
17. Always return "notes" as an array, using [] when there are no standalone callouts. Categories/items with no variants, modifier groups, or combo components must return empty arrays for those properties.
18. Standard items must use "item_type": "standard".
19. Return JSON only. No markdown, no explanation, and no code fences.
`
					}
				]
			}
		]
	});

	console.log('Claude response received');
  if (message.stop_reason === 'max_tokens') {
    throw new Error('Claude response was truncated after reaching the output token limit.');
  }

	const textBlock = message.content.find(block => block.type === 'text');
	if (!textBlock) {
		throw new Error('Claude did not return text');
	}

	const jsonText = textBlock.text
		.trim()
		.replace(/^```(?:json)?\s*/i, '')
		.replace(/\s*```$/, '')
		.trim();

  try {
    const extractedMenu = JSON.parse(jsonText);
    const soupOfDayPattern = /^soup of the day\s*:\s*(.+)$/i;
    const vegetarianMarkerPattern = /\(V\)/i;

    if (Array.isArray(extractedMenu.categories)) {
      for (const category of extractedMenu.categories) {
        if (!Array.isArray(category.items)) {
          continue;
        }

        for (const item of category.items) {
          const soupMatch = typeof item.name === 'string'
            ? item.name.match(soupOfDayPattern)
            : null;

          if (soupMatch) {
            item.name = soupMatch[1].trim();
            item.description = item.description
              ? `Soup of the day. ${item.description}`
              : 'Soup of the day';
          }

          if (typeof item.description === 'string' && vegetarianMarkerPattern.test(item.description)) {
            if (!vegetarianMarkerPattern.test(item.name)) {
              item.name = `${item.name.trim()} (V)`;
            }
            item.description = item.description.replace(/\s*\(V\)\s*/ig, ' ').trim();
          }
        }
      }
    }

    return extractedMenu;
	} catch (error) {
    throw new Error(`Claude returned invalid JSON (${message.stop_reason || 'unknown stop reason'}): ${error.message}`);
	}
}

module.exports = {
	extractMenuFromImages
};