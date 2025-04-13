import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../contexts/AuthContext";
import { addDays, startOfWeek, format } from "date-fns";
import { v4 as uuidv4 } from "uuid";

interface Meal {
  id: string;
  name: string;
  macros: { calories: number; protein: number; carbs: number; fat: number };
  ingredients: {
    name: string;
    amount: number;
    unit: string;
    fridgeLifetime: number;
  }[]; // Added fridgeLifetime
}

interface PlannedMeal extends Meal {
  instanceId: string;
}

const MealPlanner = () => {
  const { currentUser } = useAuth();
  const [currentWeek, setCurrentWeek] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [mealsByDay, setMealsByDay] = useState<{
    [key: string]: PlannedMeal[];
  }>({});
  const [meals, setMeals] = useState<Meal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientAmount, setNewIngredientAmount] = useState<number>(0);
  const [newIngredientUnit, setNewIngredientUnit] = useState("g");
  const [shoppingList, setShoppingList] = useState<
    {
      ingredient: string;
      amount: number;
      unit: string;
      fridgeLifetime: number;
    }[]
  >([]);
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const datesOfWeek = daysOfWeek.map((_, index) =>
    format(addDays(currentWeek, index), "MMM dd")
  );
  const [sortBy, setSortBy] = useState<
    "ingredient" | "amount" | "fridgeLifetime"
  >("ingredient");
  const [sortAsc, setSortAsc] = useState(true);
  const toggleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortAsc((prev) => !prev); // toggle direction
    } else {
      setSortBy(column); // switch column
      setSortAsc(true); // default to ascending
    }
  };

  // Fetch meals from Firestore
  useEffect(() => {
    const fetchMeals = async () => {
      if (!currentUser) return;

      try {
        const mealsRef = collection(db, "users", currentUser.uid, "meals");
        const mealsSnapshot = await getDocs(mealsRef);

        const fetchedMeals: Meal[] = mealsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Meal[];

        setMeals(fetchedMeals);
      } catch (error) {
        console.error("Error fetching meals:", error);
      }
    };

    fetchMeals();
  }, [currentUser]);

  // Fetch meal plan for the current week
  useEffect(() => {
    const fetchMealPlan = async () => {
      if (!currentUser) return;

      try {
        const weekKey = format(currentWeek, "yyyy-MM-dd");
        const mealPlanRef = doc(
          db,
          "users",
          currentUser.uid,
          "mealPlans",
          weekKey
        );
        const mealPlanSnapshot = await getDoc(mealPlanRef);

        if (mealPlanSnapshot.exists()) {
          setMealsByDay(
            mealPlanSnapshot.data() as { [key: string]: PlannedMeal[] }
          );
        } else {
          setMealsByDay({
            Mon: [],
            Tue: [],
            Wed: [],
            Thu: [],
            Fri: [],
            Sat: [],
            Sun: [],
          });
        }
      } catch (error) {
        console.error("Error fetching meal plan:", error);
      }
    };

    fetchMealPlan();
  }, [currentUser, currentWeek]);

  // Update shopping list whenever mealsByDay changes
  useEffect(() => {
    const generateShoppingList = () => {
      const allIngredients: {
        [key: string]: { amount: number; unit: string; fridgeLifetime: number };
      } = {};

      Object.values(mealsByDay).forEach((dayMeals) => {
        dayMeals.forEach((meal) => {
          meal.ingredients.forEach(({ name, amount, unit, fridgeLifetime }) => {
            if (!allIngredients[name]) {
              allIngredients[name] = { amount: 0, unit, fridgeLifetime };
            }
            allIngredients[name].amount += amount;
            allIngredients[name].fridgeLifetime = Math.min(
              allIngredients[name].fridgeLifetime,
              fridgeLifetime
            ); // Take the minimum fridge lifetime
          });
        });
      });

      return Object.entries(allIngredients).map(
        ([ingredient, { amount, unit, fridgeLifetime }]) => ({
          ingredient,
          amount,
          unit,
          fridgeLifetime,
        })
      );
    };

    setShoppingList(generateShoppingList());
  }, [mealsByDay]);

  const toggleItemChecked = (ingredient: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(ingredient)) {
        newSet.delete(ingredient);
      } else {
        newSet.add(ingredient);
      }
      return newSet;
    });
  };

  const saveMealPlan = async (updatedMealsByDay: { [key: string]: Meal[] }) => {
    if (!currentUser) return;

    try {
      const weekKey = format(currentWeek, "yyyy-MM-dd");
      const mealPlanRef = doc(
        db,
        "users",
        currentUser.uid,
        "mealPlans",
        weekKey
      );
      await setDoc(mealPlanRef, updatedMealsByDay);
      console.log("Meal plan auto-saved successfully!");
    } catch (error) {
      console.error("Error saving meal plan:", error);
    }
  };

  const addMealToDay = (meal: Meal) => {
    if (selectedDay) {
      const mealWithInstance: PlannedMeal = {
        ...meal,
        instanceId: uuidv4(),
      };

      setMealsByDay((prev) => {
        const updatedMealsByDay = {
          ...prev,
          [selectedDay]: [...(prev[selectedDay] || []), mealWithInstance],
        };
        saveMealPlan(updatedMealsByDay);
        return updatedMealsByDay;
      });
      setIsModalOpen(false);
    }
  };

  const removeMealFromDay = (day: string, instanceId: string) => {
    setMealsByDay((prev) => {
      const updatedMeals = [...prev[day]];
      const index = updatedMeals.findIndex(
        (meal) => meal.instanceId === instanceId
      );

      if (index !== -1) updatedMeals.splice(index, 1);

      const updatedMealsByDay = {
        ...prev,
        [day]: updatedMeals,
      };

      saveMealPlan(updatedMealsByDay);
      return updatedMealsByDay;
    });
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    setCurrentWeek((prev) =>
      direction === "prev" ? addDays(prev, -7) : addDays(prev, 7)
    );
  };

  const [fridgeIngredients, setFridgeIngredients] = useState<
    { name: string; amount: number; unit: string }[]
  >([]);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Fetch fridge ingredients from Firestore
  useEffect(() => {
    const fetchFridgeIngredients = async () => {
      if (!currentUser) return;

      try {
        const fridgeRef = collection(db, "users", currentUser.uid, "fridge");
        const fridgeSnapshot = await getDocs(fridgeRef);

        const fetchedIngredients = fridgeSnapshot.docs.map((doc) => {
          const data = doc.data() as {
            name: string;
            amount: number;
            unit: string;
          };
          return {
            id: doc.id,
            ...data,
          };
        });

        setFridgeIngredients(fetchedIngredients);
      } catch (error) {
        console.error("Error fetching fridge ingredients:", error);
      }
    };

    fetchFridgeIngredients();
  }, [currentUser]);

  // const addIngredientToFridge = async (ingredient: {
  //   name: string;
  //   amount: number;
  //   unit: string;
  // }) => {
  //   if (!currentUser) return;

  //   try {
  //     const fridgeRef = collection(db, "users", currentUser.uid, "fridge");
  //     await setDoc(doc(fridgeRef, ingredient.name), ingredient);
  //     setFridgeIngredients((prev) => [...prev, ingredient]);
  //   } catch (error) {
  //     console.error("Error adding ingredient to fridge:", error);
  //   }
  // };

  const filteredIngredients = fridgeIngredients.filter((ingredient) =>
    ((ingredient.name??"").toLowerCase()).includes((searchTerm??"").toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => handleWeekChange("prev")}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          <b>&#10229;</b>
        </button>
        <h2 className="text-xl font-semibold">
          Week of {format(currentWeek, "MMM dd, yyyy")}
        </h2>
        <button
          onClick={() => handleWeekChange("next")}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          <b>&#10230;</b>
        </button>
      </div>

      {/*  */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-7 gap-4">
          {daysOfWeek.map((day, index) => {
            const dayMeals = mealsByDay[day] || [];
            const totalMacros = dayMeals.reduce(
              (totals, meal) => {
                totals.calories += meal.macros.calories;
                totals.protein += meal.macros.protein;
                totals.carbs += meal.macros.carbs;
                totals.fat += meal.macros.fat;
                return totals;
              },
              { calories: 0, protein: 0, carbs: 0, fat: 0 }
            );

            return (
              <div key={day} className="border rounded-lg p-4">
                {/* Day of the Week */}
                <h3 className="font-semibold mb-2">
                  {day} - {datesOfWeek[index]}
                </h3>
                {/* Total Macros for the day */}
                <div className="mt-4 text-sm text-gray-700">
                  <p>
                    <strong>Total Macros:</strong>
                  </p>
                  <p>Calories: {totalMacros.calories.toFixed(0)} kcal</p>
                  <p>Protein: {totalMacros.protein.toFixed(0)}g</p>
                  <p>Carbs: {totalMacros.carbs.toFixed(0)}g</p>
                  <p>Fat: {totalMacros.fat.toFixed(0)}g</p>
                </div>
                {/* Add Meal Button */}
                <div
                  className="bg-gray-50 p-2 rounded cursor-pointer hover:bg-gray-100"
                  onClick={() => {
                    setSelectedDay(day);
                    setIsModalOpen(true);
                  }}
                >
                  + Add Meal
                </div>
                {/* List of meals for the day */}
                <div className="space-y-2">
                  {dayMeals.map((meal) => (
                    <div
                      key={meal.instanceId}
                      className="bg-gray-50 p-2 rounded relative group"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-medium">{meal.name}</h4>
                          <p className="text-sm text-gray-600">
                            {meal.macros.calories.toFixed(0)} kcal,{" "}
                            {meal.macros.protein.toFixed(0)}g protein,{" "}
                            {meal.macros.carbs.toFixed(0)}g carbs,{" "}
                            {meal.macros.fat.toFixed(0)}g fat
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            removeMealFromDay(day, meal.instanceId)
                          }
                          className="absolute top-1 right-1 text-red-600 hover:text-red-800 hidden group-hover:block"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Shopping List</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 font-semibold text-sm text-gray-700 mb-2 px-2">
          <button
            onClick={() => toggleSort("ingredient")}
            className="text-left hover:underline"
          >
            Item {sortBy === "ingredient" && (sortAsc ? "↑" : "↓")}
          </button>
          <button
            onClick={() => toggleSort("amount")}
            className="text-left hover:underline"
          >
            Quantity {sortBy === "amount" && (sortAsc ? "↑" : "↓")}
          </button>
          <button
            onClick={() => toggleSort("fridgeLifetime")}
            className="text-left hover:underline hidden sm:block"
          >
            Fridge Life {sortBy === "fridgeLifetime" && (sortAsc ? "↑" : "↓")}
          </button>
        </div>

        <ul className="space-y-2">
          {[...shoppingList]
            .sort((a, b) => {
              const aValue = a[sortBy];
              const bValue = b[sortBy];
              if (typeof aValue === "string") {
                return sortAsc
                  ? aValue.localeCompare(bValue as string)
                  : (bValue as string).localeCompare(aValue);
              } else {
                return sortAsc
                  ? (aValue as number) - (bValue as number)
                  : (bValue as number) - (aValue as number);
              }
            })
            .map(({ ingredient, amount, unit, fridgeLifetime }) => {
              const isChecked = checkedItems.has(ingredient);

              return (
                <li
                  key={ingredient}
                  className={`grid grid-cols-2 sm:grid-cols-3 items-center px-2 py-1 ${
                    isChecked ? "line-through text-gray-400" : ""
                  }`}
                >
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleItemChecked(ingredient)}
                      className="h-4 w-4 text-green-600"
                    />
                    <span
                      className={`${
                        fridgeLifetime < 3 && !isChecked ? "text-red-500" : ""
                      }`}
                    >
                      {ingredient}
                    </span>
                  </label>
                  <span className="text-sm whitespace-nowrap">
                    {amount} {unit}
                  </span>
                  <span
                    className={`text-sm whitespace-nowrap hidden sm:block ${
                      fridgeLifetime < 3 && !isChecked ? "text-red-500" : ""
                    }`}
                  >
                    Lasts {fridgeLifetime} days
                  </span>
                </li>
              );
            })}
        </ul>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">My Fridge</h2>
        <input
          type="text"
          placeholder="Search ingredients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 mb-4 border rounded"
        />
        <ul className="space-y-2">
  {filteredIngredients.map(({ name, amount, unit }) => (
    <li key={name} className="flex justify-between items-center">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium">{amount} {unit}</span>
        <span>{name}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            const delta = prompt(`Enter amount of ${unit} to add/remove (e.g. 50 or -25):`);
            const change = Number(delta);
            if (!isNaN(change) && change !== 0) {
              const newAmount = Math.max(amount + change, 0);
              const updated = fridgeIngredients
                .map((item) =>
                  item.name === name ? { ...item, amount: newAmount } : item
                )
                .filter((item) => item.amount > 0);

              setFridgeIngredients(updated);

              if (currentUser) {
                const fridgeRef = doc(db, "users", currentUser.uid, "fridge", name);
                if (newAmount === 0) {
                  await setDoc(fridgeRef, {}); // or deleteDoc if used
                } else {
                  await setDoc(fridgeRef, { name, amount: newAmount, unit });
                }
              }
            }
          }}
          className="text-blue-500 hover:text-blue-700 font-bold"
        >
          ✏️
        </button>
        <button
          onClick={async () => {
            const remove = prompt(`How much ${unit} of ${name} to remove?`);
            const toRemove = Number(remove);
            if (!isNaN(toRemove) && toRemove > 0) {
              const newAmount = Math.max(amount - toRemove, 0);
              const updated = fridgeIngredients
                .map((item) =>
                  item.name === name ? { ...item, amount: newAmount } : item
                )
                .filter((item) => item.amount > 0);

              setFridgeIngredients(updated);

              if (currentUser) {
                const fridgeRef = doc(db, "users", currentUser.uid, "fridge", name);
                if (newAmount === 0) {
                  await setDoc(fridgeRef, {});
                } else {
                  await setDoc(fridgeRef, { name, amount: newAmount, unit });
                }
              }
            }
          }}
          className="text-red-500 hover:text-red-700 font-bold"
        >
          ✕
        </button>
      </div>
    </li>
  ))}
</ul>
        <div className="mt-4 space-y-2">
  <input
    type="text"
    placeholder="Ingredient name"
    value={newIngredientName}
    onChange={(e) => setNewIngredientName(e.target.value)}
    className="w-full border px-3 py-2 rounded"
  />
  <div className="flex gap-2">
    <input
      type="number"
      placeholder="Quantity"
      min={0}
      value={newIngredientAmount}
      onChange={(e) => setNewIngredientAmount(Number(e.target.value))}
      className="w-1/2 border px-3 py-2 rounded"
    />
    <select
      value={newIngredientUnit}
      onChange={(e) => setNewIngredientUnit(e.target.value)}
      className="w-1/2 border px-3 py-2 rounded"
    >
      <option value="count">count</option>
      <option value="g">g</option>
      <option value="ml">ml</option>
    </select>
  </div>
  <button
    onClick={async () => {
      if (!newIngredientName || newIngredientAmount <= 0) return;

      const inputName = (newIngredientName.trim()??"").toLowerCase();
      const existing = fridgeIngredients.find(
        (item) => (item.name??"").toLowerCase() === inputName
      );

      const mergedAmount = existing
        ? existing.amount + newIngredientAmount
        : newIngredientAmount;

      const mergedIngredient = {
        name: existing?.name || newIngredientName.trim(),
        amount: mergedAmount,
        unit: newIngredientUnit,
      };

      const updatedFridge = existing
        ? fridgeIngredients.map((item) =>
            (item.name??"").toLowerCase() === inputName
              ? { ...item, amount: mergedAmount }
              : item
          )
        : [...fridgeIngredients, mergedIngredient];

      setFridgeIngredients(updatedFridge);

      // Write to Firestore
      if (currentUser) {
        const fridgeRef = doc(db, "users", currentUser.uid, "fridge", mergedIngredient.name);
        await setDoc(fridgeRef, mergedIngredient);
      }

      // Sync with shopping list
      const matched = shoppingList.find(
        (item) => (item.ingredient??"").toLowerCase() === inputName
      );
      if (matched) {
        matched.amount = Math.max(matched.amount - newIngredientAmount, 0);
        setShoppingList((prev) =>
          prev.map((item) =>
            (item.ingredient??"").toLowerCase() === inputName
              ? { ...item, amount: matched.amount }
              : item
          )
        );
      }

      setNewIngredientName("");
      setNewIngredientAmount(0);
      setNewIngredientUnit("g");
    }}
    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
  >
    Add Ingredient
  </button>
</div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-lg p-6 w-96">
            <h2 className="text-xl font-semibold mb-4">Select a Meal</h2>
            <div className="space-y-4">
              {meals.map((meal) => (
                <div
                  key={meal.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => addMealToDay(meal)}
                >
                  <h3 className="font-medium">{meal.name}</h3>
                  <p className="text-sm text-gray-600">
                    {meal.macros.calories.toFixed(0)} kcal,{" "}
                    {meal.macros.protein.toFixed(0)}g protein,{" "}
                    {meal.macros.carbs.toFixed(0)}g carbs,{" "}
                    {meal.macros.fat.toFixed(0)}g fat
                  </p>
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsModalOpen(false)}
              className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MealPlanner;
