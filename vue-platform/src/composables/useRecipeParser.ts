export interface ParsedRecipe {
  name: string;
  description: string;
  ingredients: string[];
  steps: string[];
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  portions: number;
}

export interface ParsedShoppingItem {
  name: string;
  quantity?: number | string;
  unit?: string;
  category: string;
}

export interface ParsedChefResponse {
  dialogueText: string;
  recipe: ParsedRecipe | null;
  shoppingItems: ParsedShoppingItem[];
}

export function useRecipeParser() {
  const parseChefMessage = (content: string): ParsedChefResponse => {
    const trimmed = content.trim();

    // 1. Strict or embedded JSON check
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmed);
        const recipeData = parsed.recipe;
        const ingredients = Array.isArray(recipeData?.ingredients) ? recipeData.ingredients : [];
        const steps = Array.isArray(recipeData?.steps) ? recipeData.steps : [];

        const hasValidRecipe = recipeData && (ingredients.length > 0 || steps.length > 0);

        return {
          dialogueText: parsed.message || (hasValidRecipe ? '' : trimmed),
          recipe: hasValidRecipe ? {
            name: recipeData.name || recipeData.title || 'Запропонований рецепт',
            description: recipeData.description || '',
            ingredients,
            steps,
            calories: Number(recipeData.calories) || 0,
            protein: Number(recipeData.protein) || 0,
            fat: Number(recipeData.fat) || 0,
            carbs: Number(recipeData.carbs) || 0,
            portions: Number(recipeData.portions) || 2
          } : null,
          shoppingItems: Array.isArray(parsed.suggestedShoppingItems) ? parsed.suggestedShoppingItems : []
        };
      } catch {
        // Fall through to markdown parser
      }
    }

    let textWithoutBlocks = content;
    let parsedRecipe: ParsedRecipe | null = null;
    const shoppingItems: ParsedShoppingItem[] = [];

    // 2. Extract ```recipe codeblock
    const recipeMatch = content.match(/```(?:recipe)?\s*([\s\S]*?)```/i);
    if (recipeMatch) {
      const rawRecipe = recipeMatch[1];
      textWithoutBlocks = textWithoutBlocks.replace(recipeMatch[0], '').trim();

      let name = '';
      let description = '';
      let calories = 0, protein = 0, fat = 0, carbs = 0, portions = 2;
      const ingredients: string[] = [];
      const steps: string[] = [];

      const lines = rawRecipe.split('\n').map((l) => l.trim()).filter(Boolean);
      let section: 'none' | 'ingredients' | 'steps' = 'none';

      for (const line of lines) {
        if (/^(?:Title|Name|Назва|Рецепт):/i.test(line)) {
          name = line.replace(/^(?:Title|Name|Назва|Рецепт):\s*/i, '').replace(/[*#]/g, '').trim();
        } else if (/^(?:Description|Опис):/i.test(line)) {
          description = line.replace(/^(?:Description|Опис):\s*/i, '').trim();
        } else if (/^(?:Calories|Калорії|кКал):/i.test(line)) {
          const num = line.match(/\d+/);
          if (num) calories = parseInt(num[0], 10);
        } else if (/^(?:Protein|Білки|Б):/i.test(line)) {
          const num = line.match(/\d+(?:[\.,]\d+)?/);
          if (num) protein = parseFloat(num[0].replace(',', '.'));
        } else if (/^(?:Fat|Жири|Ж):/i.test(line)) {
          const num = line.match(/\d+(?:[\.,]\d+)?/);
          if (num) fat = parseFloat(num[0].replace(',', '.'));
        } else if (/^(?:Carbs|Вуглеводи|В):/i.test(line)) {
          const num = line.match(/\d+(?:[\.,]\d+)?/);
          if (num) carbs = parseFloat(num[0].replace(',', '.'));
        } else if (/^(?:Portions|Порції):/i.test(line)) {
          const num = line.match(/\d+/);
          if (num) portions = parseInt(num[0], 10);
        } else if (/^(?:Ingredients|Інгредієнти):/i.test(line)) {
          section = 'ingredients';
        } else if (/^(?:Steps|Кроки|Приготування):/i.test(line)) {
          section = 'steps';
        } else if (line.startsWith('-') || line.startsWith('*')) {
          const item = line.replace(/^[-*]\s*/, '').trim();
          if (section === 'steps') steps.push(item);
          else ingredients.push(item);
        } else if (/^\d+\./.test(line)) {
          steps.push(line.replace(/^\d+\.\s*/, '').trim());
        } else {
          if (section === 'ingredients') ingredients.push(line);
          else if (section === 'steps') steps.push(line);
          else if (!description) description = line;
        }
      }

      if (ingredients.length > 0 || steps.length > 0) {
        parsedRecipe = {
          name: name || 'Запропонований рецепт',
          description,
          ingredients,
          steps,
          calories,
          protein,
          fat,
          carbs,
          portions
        };
      }
    }

    // 3. Extract ```shopping codeblock
    const shoppingMatch = content.match(/```(?:shopping)?\s*([\s\S]*?)```/i);
    if (shoppingMatch && shoppingMatch[0] !== recipeMatch?.[0]) {
      const rawShopping = shoppingMatch[1];
      textWithoutBlocks = textWithoutBlocks.replace(shoppingMatch[0], '').trim();

      const lines = rawShopping.split('\n').map((l) => l.trim()).filter(Boolean);
      for (const line of lines) {
        if (line.startsWith('-') || line.startsWith('*')) {
          let clean = line.replace(/^[-*]\s*/, '').trim();
          let cat = 'other';
          const catMatch = clean.match(/\[([a-zA-Z\-]+)\]$/);
          if (catMatch) {
            cat = catMatch[1];
            clean = clean.replace(/\[[a-zA-Z\-]+\]$/, '').trim();
          }
          shoppingItems.push({ name: clean, category: cat });
        }
      }
    }

    return {
      dialogueText: textWithoutBlocks,
      recipe: parsedRecipe,
      shoppingItems
    };
  };

  return {
    parseChefMessage
  };
}
