import { MenuItem } from "@/types/order";

export const menuItems: MenuItem[] = [
  // Value Burgers - New Category
  { id: '36', name: 'Cheese Burger', price: 7.00, category: 'value', requiresSauce: true },
  { id: '37', name: 'Chicken Burger', price: 6.00, category: 'value', requiresSauce: true },

  // Main Burgers and Wraps - Updated Prices
  { id: '1', name: 'Chicken Burger', price: 9.00, category: 'mains', requiresSauce: true },
  { id: '2', name: 'Chicken Burger (Combo)', price: 15.00, category: 'mains', requiresSauce: true, isCombo: true },
  { id: '3', name: 'Double Chicken Burger', price: 12.00, category: 'mains', requiresSauce: true },
  { id: '4', name: 'Double Chicken Burger (Combo)', price: 18.00, category: 'mains', requiresSauce: true, isCombo: true },
  { id: '5', name: 'Beef Burger', price: 12.00, category: 'mains', requiresSauce: true },
  { id: '6', name: 'Beef Burger (Combo)', price: 18.00, category: 'mains', requiresSauce: true, isCombo: true },
  { id: '7', name: 'Double Beef Burger', price: 16.00, category: 'mains', requiresSauce: true },
  { id: '8', name: 'Double Beef Burger (Combo)', price: 22.00, category: 'mains', requiresSauce: true, isCombo: true },
  { id: '9', name: 'Chicken Wrap', price: 9.00, category: 'mains', requiresSauce: true },
  { id: '10', name: 'Chicken Wrap (Combo)', price: 15.00, category: 'mains', requiresSauce: true, isCombo: true },
  { id: '11', name: 'Double Chicken Wrap', price: 12.00, category: 'mains', requiresSauce: true },
  { id: '12', name: 'Double Chicken Wrap (Combo)', price: 18.00, category: 'mains', requiresSauce: true, isCombo: true },
  { id: '13', name: 'Beef Wrap', price: 12.00, category: 'mains', requiresSauce: true },
  { id: '14', name: 'Beef Wrap (Combo)', price: 18.00, category: 'mains', requiresSauce: true, isCombo: true },
  { id: '15', name: 'Double Beef Wrap', price: 16.00, category: 'mains', requiresSauce: true },
  { id: '16', name: 'Double Beef Wrap (Combo)', price: 22.00, category: 'mains', requiresSauce: true, isCombo: true },

  // Bites and Sides
  { id: '17', name: 'Chicken Strips (6 Pieces)', price: 10.00, category: 'sides' },
  { id: '18', name: 'Onion Rings (6 Pieces)', price: 4.00, category: 'sides' },
  { id: '19', name: 'Fries Garlic Wrap', price: 6.00, category: 'sides' },
  { id: '20', name: 'Fries', price: 5.00, category: 'sides' },
  { id: '21', name: 'Chicken Strips Meal (6 Pieces)', price: 16.00, category: 'sides', isCombo: true },

  // Sauces
  { id: '22', name: 'Special Sauce', price: 2.00, category: 'sauces' },
  { id: '23', name: 'BBQ Sauce', price: 2.00, category: 'sauces' },
  { id: '24', name: 'Garlic Sauce', price: 2.00, category: 'sauces' },
  { id: '25', name: 'Hot Chili Sauce', price: 2.00, category: 'sauces' },
  { id: '26', name: 'Jalapeno Cup', price: 2.00, category: 'sauces' },
  { id: '27', name: 'Cheese Cup', price: 2.00, category: 'sauces' },

  // Drinks
  { id: '28', name: 'Coca Cola', price: 2.00, category: 'drinks' },
  { id: '29', name: 'Fanta', price: 2.00, category: 'drinks' },
  { id: '30', name: 'Sprite', price: 2.00, category: 'drinks' },
  { id: '31', name: 'Cappy', price: 3.00, category: 'drinks' },
  { id: '32', name: 'Ice Tea', price: 3.00, category: 'drinks' },
  { id: '33', name: 'Water', price: 1.00, category: 'drinks' },

  // Add-ons
  { id: '34', name: 'Add Jalapeno', price: 1.00, category: 'addons' },
  { id: '35', name: 'Add Cheese Slice', price: 2.00, category: 'addons' }
];

export const sauceOptions = [
  'Special Sauce',
  'Hot Chili',
  'BBQ',
  'Garlic'
];

export const drinkOptions = [
  'Coca-Cola',
  'Fanta',
  'Sprite'
];

export const addOnOptions = [
  { name: 'Add Cheese Slice', price: 2.00 },
  { name: 'Add Jalapeno', price: 1.00 }
];
