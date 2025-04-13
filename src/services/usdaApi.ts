const API_KEY = import.meta.env.VITE_USDA_API_KEY;
const BASE_URL = 'https://api.nal.usda.gov/fdc/v1';

export interface FoodItem {
  fdcId: string;
  description: string;
  nutrients: {
    name: string;
    amount: number;
    unit: string;
  }[];
}

export const searchFoods = async (query: string): Promise<FoodItem[]> => {
  const response = await fetch(
    `${BASE_URL}/foods/search?api_key=${API_KEY}&query=${encodeURIComponent(query)}`,
    { method: 'GET' }
  );
  const data = await response.json();
  return data.foods.map((food: any) => ({
    fdcId: food.fdcId,
    description: food.description,
    nutrients: food.foodNutrients.map((nutrient: any) => ({
      name: nutrient.nutrientName,
      amount: nutrient.value,
      unit: nutrient.unitName
    }))
  }));
};

export const getFoodDetails = async (fdcId: string): Promise<FoodItem> => {
  const response = await fetch(
    `${BASE_URL}/food/${fdcId}?api_key=${API_KEY}`,
    { method: 'GET' }
  );
  const food = await response.json();
  return {
    fdcId: food.fdcId,
    description: food.description,
    nutrients: food.foodNutrients.map((nutrient: any) => ({
      name: nutrient.nutrient.name,
      amount: nutrient.amount,
      unit: nutrient.nutrient.unitName
    }))
  };
};