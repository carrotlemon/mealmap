import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../config/firebase'; // Import Firestore instance
import { collection, addDoc } from 'firebase/firestore'; // Firestore methods
import { useAuth } from '../contexts/AuthContext'; // Import AuthContext

interface Ingredient {
  id: string;
  name: string;
  macros: { calories: number; protein: number; carbs: number; fat: number };
  amount?: number; // New property for amount
  unit?: string; // New property for unit
  fridgeLifetime?: number;
}

const CreateMeal = () => {
  const { currentUser } = useAuth();
  const [mealName, setMealName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Ingredient[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);

  const units = ['count', 'serving', 'g', 'ml', 'oz', 'cup', 'tbsp', 'tsp']; // Units for ingredients

  const fetchIngredients = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.nal.usda.gov/fdc/v1/foods/search?query=${searchQuery}&api_key=Oz8MJLagEXujCa6thhyjW3pewq0Klr4V8fxanrG4`
      );
      const data = await response.json();
      const ingredients = data.foods.map((food: any) => ({
        id: food.fdcId,
        name: food.description,
        macros: {
          calories: food.foodNutrients.find((n: any) => n.nutrientName === 'Energy')?.value || 0,
          protein: food.foodNutrients.find((n: any) => n.nutrientName === 'Protein')?.value || 0,
          carbs: food.foodNutrients.find((n: any) => n.nutrientName === 'Carbohydrate, by difference')?.value || 0,
          fat: food.foodNutrients.find((n: any) => n.nutrientName === 'Total lipid (fat)')?.value || 0,
        },
      }));
      setSearchResults(ingredients);
    } catch (error) {
      console.error('Error fetching ingredients:', error);
    }
    setLoading(false);
  };

  const addIngredient = (ingredient: Ingredient) => {
    setSelectedIngredients((prev) => [
      ...prev,
      { ...ingredient, amount: 1, unit: 'count', fridgeLifetime: 3 }, // Default fridgeLifetime to 5
    ]);
  };
  
  const updateIngredient = (
    id: string,
    field: 'amount' | 'unit' | 'fridgeLifetime',
    value: any
  ) => {
    setSelectedIngredients((prev) =>
      prev.map((ingredient) =>
        ingredient.id === id ? { ...ingredient, [field]: value } : ingredient
      )
    );
  };

  const removeIngredient = (id: string) => {
    setSelectedIngredients((prev) => prev.filter((ingredient) => ingredient.id !== id));
  };

  const unitConversionFactors: { [key: string]: number } = {
    g: 1, // Base unit
    ml: 1, // Assume 1 ml = 1 g for water-like density
    oz: 28.35, // 1 oz = 28.35 g
    cup: 240, // 1 cup = 240 g (approx for liquids)
    tbsp: 15, // 1 tbsp = 15 g
    tsp: 5, // 1 tsp = 5 g
    serving: 1, // Assume 1 serving = 1 g (can be adjusted based on API data)
  };
  
  const calculateMacros = () => {
    return selectedIngredients.reduce(
      (totals, ingredient) => {
        const amount = ingredient.amount || 1;
        const unit = ingredient.unit || 'g';
        const conversionFactor = unitConversionFactors[unit] || 1; // Default to 1 if unit is unknown
  
        const scaledAmount = amount * conversionFactor; // Convert to base unit (grams)
  
        totals.calories += ingredient.macros.calories * scaledAmount;
        totals.protein += ingredient.macros.protein * scaledAmount;
        totals.carbs += ingredient.macros.carbs * scaledAmount;
        totals.fat += ingredient.macros.fat * scaledAmount;
  
        return totals;
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const totalMacros = calculateMacros();

  const saveMeal = async () => {
    if (!currentUser) {
      console.error('User not logged in');
      return;
    }
  
    const newMeal = {
      name: mealName,
      ingredients: selectedIngredients, // Includes fridgeLifetime
      macros: totalMacros,
      createdAt: new Date().toISOString(),
    };
  
    try {
      const userMealsRef = collection(db, 'users', currentUser.uid, 'meals');
      await addDoc(userMealsRef, newMeal);
      console.log('Meal saved to Firestore:', newMeal);
  
      setMealName('');
      setSelectedIngredients([]);
    } catch (error) {
      console.error('Error saving meal to Firestore:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-4xl font-bold text-green-800 mb-6">Create Meal</h1>
      <div className="bg-white rounded-lg shadow-md p-6 grid grid-cols-2 gap-6">
        <div>
          <div className="mb-6">
            <label htmlFor="mealName" className="block text-sm font-medium text-gray-700">
              Meal Name
            </label>
            <input
              type="text"
              id="mealName"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              placeholder="Enter meal name"
            />
          </div>

          {selectedIngredients.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Selected Ingredients</h2>
              <ul className="space-y-2">
                {selectedIngredients.map((ingredient) => (
                  <li key={ingredient.id} className="p-2 border rounded-lg">
                    <div className="flex justify-between items-center">
                      <span>{ingredient.name}</span>
                      <button
                        onClick={() => removeIngredient(ingredient.id)}
                        className="text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="mt-2 flex space-x-2">
                      <input
                        type="number"
                        value={ingredient.amount || 1}
                        onChange={(e) => updateIngredient(ingredient.id, 'amount', parseFloat(e.target.value))}
                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        placeholder="Amount"
                      />
                      <select
                        value={ingredient.unit || 'g'}
                        onChange={(e) => updateIngredient(ingredient.id, 'unit', e.target.value)}
                        className="rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      >
                        {units.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={ingredient.fridgeLifetime || 3}
                        onChange={(e) =>
                          updateIngredient(ingredient.id, 'fridgeLifetime', parseInt(e.target.value, 10))
                        }
                        className="w-28 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                        placeholder="Fridge Lifetime (days)"
                      />
                      days in fridge/freezer
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h2 className="text-lg font-semibold mb-2">Total Macros</h2>
            <p className="text-gray-600">
              {totalMacros.calories.toFixed(0)} kcal, {totalMacros.protein.toFixed(0)}g protein, {totalMacros.carbs.toFixed(0)}g carbs, {totalMacros.fat.toFixed(0)}g fat
            </p>
          </div>

          <button
            onClick={saveMeal}
            className="mt-6 w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            disabled={!mealName || selectedIngredients.length === 0}
          >
            Save Meal
          </button>
        </div>

        <div>
          <div className="mb-6">
            <label htmlFor="ingredientSearch" className="block text-sm font-medium text-gray-700">
              Search Ingredients
            </label>
            <div className="flex space-x-2 mt-1">
              <input
                type="text"
                id="ingredientSearch"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    fetchIngredients(); // Trigger search when Enter is pressed
                  }
                }}
                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                placeholder="Search for ingredients"
              />
              <button
                onClick={fetchIngredients}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-2">Search Results</h2>
              <ul className="space-y-2">
                {searchResults.map((ingredient) => (
                  <li
                    key={ingredient.id}
                    className="flex justify-between items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => addIngredient(ingredient)}
                  >
                    <span>{ingredient.name}</span>
                    <span className="text-sm text-gray-600">
                      {ingredient.macros.calories} kcal, {ingredient.macros.protein}g protein, {ingredient.macros.carbs}g carbs, {ingredient.macros.fat}g fat
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CreateMeal;