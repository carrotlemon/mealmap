import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';

interface Meal {
  id: string;
  name: string;
  macros: { calories: number; protein: number; carbs: number; fat: number };
  ingredients: { name: string; amount: number; unit: string }[];
}

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [totalCalories, setTotalCalories] = useState(0);
  const [totalProtein, setTotalProtein] = useState(0);
  const [totalCarbs, setTotalCarbs] = useState(0);
  const [totalFat, setTotalFat] = useState(0);
  const [mealCount, setMealCount] = useState(0);

  useEffect(() => {
    const fetchUserStatistics = async () => {
      if (!currentUser) return;

      try {
        const mealsRef = collection(db, 'users', currentUser.uid, 'meals');
        const mealsSnapshot = await getDocs(mealsRef);

        let calories = 0;
        let protein = 0;
        let carbs = 0;
        let fat = 0;

        mealsSnapshot.docs.forEach((doc) => {
          const meal = doc.data() as Meal;
          calories += meal.macros.calories;
          protein += meal.macros.protein;
          carbs += meal.macros.carbs;
          fat += meal.macros.fat;
        });

        setTotalCalories(calories);
        setTotalProtein(protein);
        setTotalCarbs(carbs);
        setTotalFat(fat);
        setMealCount(mealsSnapshot.size);
      } catch (error) {
        console.error('Error fetching user statistics:', error);
      }
    };

    fetchUserStatistics();
  }, [currentUser]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-4xl font-bold text-green-800 mb-6">Dashboard</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">Your Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gray-100 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-700">Total Meals Created</h3>
            <p className="text-2xl font-bold text-green-800">{mealCount.toFixed(0)}</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-700">Total Calories</h3>
            <p className="text-2xl font-bold text-green-800">{totalCalories.toFixed(0)} kcal</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-700">Total Protein</h3>
            <p className="text-2xl font-bold text-green-800">{totalProtein.toFixed(0)} g</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-700">Total Carbs</h3>
            <p className="text-2xl font-bold text-green-800">{totalCarbs.toFixed(0)} g</p>
          </div>
          <div className="bg-gray-100 p-4 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-700">Total Fat</h3>
            <p className="text-2xl font-bold text-green-800">{totalFat.toFixed(0)} g</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;