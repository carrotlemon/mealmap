import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";

interface Recipe {
  id: string;
  name: string;
  macros: { calories: number; protein: number; carbs: number; fat: number };
  ingredients: { name: string; amount: number; unit: string; fridgeLifetime: number }[];
}

const sampleRecipes: Recipe[] = [
  {
    id: "1",
    name: "Grilled Chicken Salad",
    macros: { calories: 350, protein: 30, carbs: 10, fat: 15 },
    ingredients: [
      { name: "Chicken Breast", amount: 150, unit: "g", fridgeLifetime: 3 },
      { name: "Lettuce", amount: 100, unit: "g", fridgeLifetime: 2},
      { name: "Olive Oil", amount: 10, unit: "ml", fridgeLifetime: Infinity },
    ],
  },
  {
    id: "2",
    name: "Spaghetti Bolognese",
    macros: { calories: 450, protein: 25, carbs: 50, fat: 15 },
    ingredients: [
      { name: "Spaghetti", amount: 100, unit: "g", fridgeLifetime: 180 },
      { name: "Ground Beef", amount: 150, unit: "g", fridgeLifetime: 3 },
      { name: "Tomato Sauce", amount: 100, unit: "ml", fridgeLifetime: 7 },
    ],
  },
  {
    id: "3",
    name: "Avocado Toast",
    macros: { calories: 300, protein: 8, carbs: 30, fat: 18 },
    ingredients: [
      { name: "Bread", amount: 50, unit: "g", fridgeLifetime: 7 },
      { name: "Avocado", amount: 100, unit: "g", fridgeLifetime: 2 },
      { name: "Olive Oil", amount: 5, unit: "ml", fridgeLifetime: Infinity },
    ],
  },
];

const Browse = () => {
  const { currentUser } = useAuth();
  const [savedMeals, setSavedMeals] = useState<string[]>([]); // Track saved meals by their IDs
  const navigate = useNavigate();

  // Fetch saved meals from Firestore when the component loads
  useEffect(() => {
    const fetchSavedMeals = async () => {
      if (!currentUser) return;

      try {
        const mealsRef = collection(db, "users", currentUser.uid, "meals");
        const mealsSnapshot = await getDocs(mealsRef);
        const savedMealIds = mealsSnapshot.docs.map((doc) => doc.id);
        setSavedMeals(savedMealIds);
      } catch (error) {
        console.error("Error fetching saved meals:", error);
      }
    };

    fetchSavedMeals();
  }, [currentUser]);

  const saveMeal = async (recipe: Recipe) => {
    if (!currentUser) {
      console.error("User not logged in");
      return;
    }
  
    try {
      const mealsRef = collection(db, "users", currentUser.uid, "meals");
      await setDoc(doc(mealsRef, recipe.id), recipe); // Use recipe.id as the document ID
      console.log(`Meal "${recipe.name}" saved successfully!`);
      setSavedMeals((prev) => [...prev, recipe.id]);
    } catch (error) { 
      console.error("Error saving meal:", error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-4xl font-bold text-green-800 mb-6">Browse Meals</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sampleRecipes.map((recipe) => (
          <div key={recipe.id} className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-2">{recipe.name}</h2>
            <p className="text-sm text-gray-600 mb-2">
              {recipe.macros.calories} kcal, {recipe.macros.protein}g protein,{" "}
              {recipe.macros.carbs}g carbs, {recipe.macros.fat}g fat
            </p>
            <h3 className="text-sm font-medium mb-1">Ingredients:</h3>
            <ul className="text-sm text-gray-600 mb-4">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index}>
                  {ingredient.amount} {ingredient.unit} {ingredient.name}
                </li>
              ))}
            </ul>
            {savedMeals.includes(recipe.id) ? (
              <button
                disabled
                className="px-4 py-2 bg-gray-400 text-white rounded cursor-not-allowed"
              >
                Saved!
              </button>
            ) : (
              <button
                onClick={() => saveMeal(recipe)}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Save Meal
              </button>
            )}
          </div>
        ))}
        <div
          onClick={() => navigate("/create-meal")}
          className="bg-green-600 rounded-lg shadow-md p-4 cursor-pointer hover:bg-green-700 transition"
        >
          <div className="h-full flex flex-col justify-center items-center text-center">
            <h2 className="text-lg font-semibold text-white mb-2">
              + Create New Meal
            </h2>
            <p className="text-sm text-white">
              Design your own recipe from scratch
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Browse;
