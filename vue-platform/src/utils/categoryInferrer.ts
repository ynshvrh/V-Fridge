/**
 * Utility to infer product categories from ingredient names (Ukrainian and English).
 * Aligns with backend ProductCategories standard.
 */
export function inferCategory(name: string): string {
  if (!name || !name.trim()) return 'other';
  const lower = name.toLowerCase().trim();

  // 1. Sauces & oils
  if (/(олія|масло рослинне|соус|майонез|кетчуп|гірчиця|оцет|паприка|спеції|приправа|кориця|сіль|перець|oil|sauce|mayo|ketchup|mustard|vinegar|spice|salt|pepper)/i.test(lower)) {
    return 'sauces';
  }

  // 2. Dairy
  if (/(молоко|сир|творог|сметана|вершки|вершкове масло|йогурт|кефір|ряжанка|моцарела|пармезан|бринза|сулугуні|milk|cheese|butter|cream|yogurt|kefir|dairy)/i.test(lower)) {
    return 'dairy';
  }

  // 3. Meat & Fish
  if (/(курка|куряче|куряча|курча|філе|м'ясо|фарш|яловичина|свинина|телятина|риба|лосось|тунець|креветки|бекон|ковбаса|сосиски|індичка|качка|chicken|meat|pork|beef|fish|salmon|tuna|shrimp|bacon|sausage)/i.test(lower)) {
    return 'meat-fish';
  }

  // 4. Vegetables
  if (/(цибуля|часник|морква|картопля|помідор|томат|огірок|капуста|зелень|петрушка|кріп|шпинат|салат|кабачок|баклажан|брокколі|гриби|печериці|onion|garlic|carrot|potato|tomato|cucumber|cabbage|greens|spinach|lettuce|broccoli|mushroom)/i.test(lower)) {
    return 'vegetables';
  }

  // 5. Fruits & berries
  if (/(яблуко|банан|лимон|лайм|апельсин|мандарин|полуниця|малина|ягоди|груша|виноград|авокадо|персик|apple|banana|lemon|lime|orange|strawberry|raspberry|berries|pear|grape|avocado|peach|fruit)/i.test(lower)) {
    return 'fruits';
  }

  // 6. Bakery
  if (/(хліб|батон|булочка|булка|лаваш|піта|багет|круасан|bread|bun|pita|baguette|croissant|bakery)/i.test(lower)) {
    return 'bakery';
  }

  // 7. Pantry
  if (/(борошно|рис|гречка|макарони|паста|спагеті|цукор|вівсянка|крупа|квасоля|горох|сочевиця|дріжджі|крохмаль|flour|rice|buckwheat|pasta|spaghetti|sugar|oats|oatmeal|beans|lentils)/i.test(lower)) {
    return 'pantry';
  }

  // 8. Snacks & nuts
  if (/(горіхи|горіх|мигдаль|фундук|арахіс|кеш'ю|шоколад|печиво|цукерки|чипси|nuts|walnut|almond|peanut|chocolate|cookies|candy|chips|snack)/i.test(lower)) {
    return 'snacks';
  }

  // 9. Drinks
  if (/(вода|сік|чай|кава|морс|компот|water|juice|tea|coffee|drink)/i.test(lower)) {
    return 'drinks';
  }

  // 10. Alcohol
  if (/(вино|пиво|горілка|коньяк|віскі|ром|wine|beer|vodka|whiskey|alcohol)/i.test(lower)) {
    return 'alcohol';
  }

  return 'other';
}
