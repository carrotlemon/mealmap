import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout } from 'lucide-react';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import MealPlanner from './pages/MealPlanner';
import CreateMeal from './pages/CreateMeal';
import Browse from './pages/Browse'

function App() {
  return (
    <Router>
      <AuthProvider>
          <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
            <Navbar />
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/meal-planner" element={<MealPlanner />} />
                <Route path="/create-meal" element={<CreateMeal />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
              </Routes>
            </AnimatePresence>
          </div>
      </AuthProvider>
    </Router>
  );
}

export default App;