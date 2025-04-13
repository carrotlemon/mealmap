import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sprout, Menu, X, Search, Calendar, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex items-center"
              >
                <Sprout className="h-8 w-8 text-green-600" />
                <span className="ml-2 text-xl font-bold text-gray-800">MealMap</span>
              </motion.div>
            </Link>
          </div>

          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            {currentUser ? (
              <>
                <Link to="/dashboard" className="text-gray-600 hover:text-green-600 transition-colors font-light">
                  Dashboard
                </Link>
                <Link 
                  to="/meal-planner" 
                  className="flex items-center text-gray-600 hover:text-green-600 transition-colors font-light"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Meal Plan
                </Link>
                <Link 
                  to="/create-meal" 
                  className="flex items-center text-gray-600 hover:text-green-600 transition-colors font-light"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create Meal
                </Link>
                <Link 
                  to="/browse" 
                  className="flex items-center text-gray-600 hover:text-green-600 transition-colors font-light"
                >
                  <Search className="h-4 w-4 mr-1" />
                  Browse Meals
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-green-600 transition-colors font-light">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 hover:text-green-600 transition-colors"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="sm:hidden overflow-hidden"
      >
        <div className="px-2 pt-2 pb-3 space-y-1">
          {currentUser ? (
            <>
              <Link
                to="/dashboard"
                className="block px-3 py-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors font-light"
              >
                Dashboard
              </Link>
              <Link
                to="/meal-planner"
                className="flex items-center px-3 py-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors font-light"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Meal Plan
              </Link>
              <Link
                to="/create-meal"
                className="flex items-center px-3 py-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors font-light"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Meal
              </Link>
              <Link
                to="/browse"
                className="flex items-center px-3 py-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors font-light"
              >
                <Search className="h-4 w-4 mr-2" />
                Browse Meals
              </Link>
              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors font-light"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors font-light"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="block px-3 py-2 rounded-md text-gray-600 hover:text-green-600 hover:bg-green-50 transition-colors font-light"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </motion.div>
    </nav>
  );
};

export default Navbar;