import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Sprout, Utensils, Calendar, Heart } from 'lucide-react';

const Home = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-8">
          Plan Your Meals,<br />Track Your Nutrition
        </h1>
        <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Create personalized meal plans with detailed nutrition information from the USDA database.
          Save your favorite meals and track your nutritional goals.
        </p>
        <Link
          to="/signup"
          className="inline-block bg-green-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Get Started Free
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24"
      >
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <Utensils className="h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-xl font-semibold mb-4">Meal Planning</h3>
          <p className="text-gray-600">
            Create and save your favorite meal plans with detailed nutritional information.
          </p>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <Calendar className="h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-xl font-semibold mb-4">Weekly Schedule</h3>
          <p className="text-gray-600">
            Plan your meals for the entire week and stay organized with your meal prep.
          </p>
        </div>
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <Heart className="h-12 w-12 text-green-600 mb-4" />
          <h3 className="text-xl font-semibold mb-4">Nutrition Tracking</h3>
          <p className="text-gray-600">
            Monitor your daily intake of calories, protein, carbs, fats, vitamins, and minerals.
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-24 text-center"
      >
        <img
          src="https://images.unsplash.com/photo-1547592180-85f173990554?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80"
          alt="Healthy meal prep"
          className="rounded-xl shadow-2xl mx-auto"
        />
      </motion.div>
    </div>
  );
};

export default Home;