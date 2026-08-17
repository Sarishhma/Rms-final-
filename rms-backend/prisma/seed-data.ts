// ── Seed Data Definitions ──
// Extracted for readability; imported by seed.ts

export const ROLES = [
  { role: "ADMIN", email: "admin@demo.com", name: "Demo Admin", phone: "9841000001" },
  { role: "CASHIER", email: "cashier@demo.com", name: "Demo Cashier", phone: "9841000002" },
  { role: "WAITER", email: "waiter@demo.com", name: "Demo Waiter", phone: "9841000003" },
  { role: "CASHIER_WAITER", email: "cashier_waiter@demo.com", name: "Demo CW", phone: "9841000004" },
  { role: "KITCHEN", email: "kitchen@demo.com", name: "Demo Kitchen", phone: "9841000005" },
  // Extra staff for staff-performance report diversity
  { role: "WAITER", email: "waiter2@demo.com", name: "Hari Waiter", phone: "9841000006" },
  { role: "WAITER", email: "waiter3@demo.com", name: "Sita Waiter", phone: "9841000007" },
  { role: "CASHIER", email: "cashier2@demo.com", name: "Ram Cashier", phone: "9841000008" },
];

// Multiple floors for floor-filter testing
export const TABLES = [
  // Ground Floor (6 tables, mixed capacity)
  { name: "G1", capacity: 2, floor: "Ground Floor" },
  { name: "G2", capacity: 4, floor: "Ground Floor" },
  { name: "G3", capacity: 4, floor: "Ground Floor" },
  { name: "G4", capacity: 6, floor: "Ground Floor" },
  { name: "G5", capacity: 8, floor: "Ground Floor" },
  { name: "G6", capacity: 2, floor: "Ground Floor" },
  // First Floor (5 tables)
  { name: "1F-1", capacity: 4, floor: "First Floor" },
  { name: "1F-2", capacity: 4, floor: "First Floor" },
  { name: "1F-3", capacity: 6, floor: "First Floor" },
  { name: "1F-4", capacity: 8, floor: "First Floor" },
  { name: "1F-5", capacity: 2, floor: "First Floor" },
  // Rooftop (4 tables)
  { name: "RT-1", capacity: 4, floor: "Rooftop" },
  { name: "RT-2", capacity: 6, floor: "Rooftop" },
  { name: "RT-3", capacity: 4, floor: "Rooftop" },
  { name: "RT-4", capacity: 2, floor: "Rooftop" },
  // Private Dining (2 tables)
  { name: "PD-1", capacity: 10, floor: "Private Dining" },
  { name: "PD-2", capacity: 12, floor: "Private Dining" },
  // Outdoor (3 tables)
  { name: "OD-1", capacity: 4, floor: "Outdoor" },
  { name: "OD-2", capacity: 4, floor: "Outdoor" },
  { name: "OD-3", capacity: 6, floor: "Outdoor" },
  // null floor for edge case
  { name: "BAR-1", capacity: 1, floor: null },
  { name: "BAR-2", capacity: 1, floor: null },
];

export const CATEGORIES = [
  { name: "Starters", sortOrder: 1 },
  { name: "Mains", sortOrder: 2 },
  { name: "Beverages", sortOrder: 3 },
  { name: "Desserts", sortOrder: 4 },
  { name: "Sides", sortOrder: 5 },
  { name: "Specials", sortOrder: 6 },
];

export const SUBCATEGORIES = [
  { catName: "Starters", name: "Fried", sortOrder: 1 },
  { catName: "Starters", name: "Steamed", sortOrder: 2 },
  { catName: "Starters", name: "Grilled", sortOrder: 3 },
  { catName: "Mains", name: "Nepali", sortOrder: 1 },
  { catName: "Mains", name: "Indian", sortOrder: 2 },
  { catName: "Mains", name: "Chinese", sortOrder: 3 },
  { catName: "Mains", name: "Continental", sortOrder: 4 },
  { catName: "Beverages", name: "Hot Drinks", sortOrder: 1 },
  { catName: "Beverages", name: "Cold Drinks", sortOrder: 2 },
  { catName: "Beverages", name: "Juices", sortOrder: 3 },
  { catName: "Desserts", name: "Cakes", sortOrder: 1 },
  { catName: "Desserts", name: "Ice Cream", sortOrder: 2 },
];

export const MENU_ITEMS: {
  name: string; cat: string; sub?: string; price: number; cost: number;
  type: string; sku: string; trackStock?: boolean;
  variants?: { name: string; price: number; cost: number; sku: string }[];
  addons?: { name: string; price: number }[];
}[] = [
  // Starters
  { name: "Chicken Momo", cat: "Starters", sub: "Steamed", price: 250, cost: 120, type: "FOOD", sku: "MOMO-CHK",
    variants: [
      { name: "Steam", price: 250, cost: 120, sku: "MOMO-CHK-STM" },
      { name: "Fried", price: 280, cost: 130, sku: "MOMO-CHK-FRD" },
      { name: "Jhol", price: 300, cost: 140, sku: "MOMO-CHK-JHL" },
    ],
    addons: [{ name: "Extra Sauce", price: 30 }, { name: "Extra Chutney", price: 20 }]
  },
  { name: "Veg Momo", cat: "Starters", sub: "Steamed", price: 200, cost: 90, type: "FOOD", sku: "MOMO-VEG",
    variants: [
      { name: "Steam", price: 200, cost: 90, sku: "MOMO-VEG-STM" },
      { name: "Fried", price: 230, cost: 100, sku: "MOMO-VEG-FRD" },
    ]
  },
  { name: "Chicken Wings", cat: "Starters", sub: "Fried", price: 350, cost: 180, type: "FOOD", sku: "WING-CHK" },
  { name: "Paneer Tikka", cat: "Starters", sub: "Grilled", price: 320, cost: 150, type: "FOOD", sku: "TIK-PNR",
    addons: [{ name: "Mint Chutney", price: 25 }]
  },
  { name: "Spring Rolls", cat: "Starters", sub: "Fried", price: 180, cost: 70, type: "FOOD", sku: "SPR-ROLL" },
  // Mains
  { name: "Chicken Chowmein", cat: "Mains", sub: "Chinese", price: 300, cost: 140, type: "FOOD", sku: "CHOW-CHK",
    addons: [{ name: "Extra Egg", price: 30 }, { name: "Extra Chicken", price: 80 }]
  },
  { name: "Mutton Curry", cat: "Mains", sub: "Nepali", price: 500, cost: 260, type: "FOOD", sku: "CUR-MUT" },
  { name: "Dal Bhat Set", cat: "Mains", sub: "Nepali", price: 350, cost: 120, type: "FOOD", sku: "DAL-BHAT",
    variants: [
      { name: "Veg", price: 350, cost: 120, sku: "DAL-BHAT-VEG" },
      { name: "Chicken", price: 450, cost: 180, sku: "DAL-BHAT-CHK" },
      { name: "Mutton", price: 550, cost: 280, sku: "DAL-BHAT-MUT" },
    ]
  },
  { name: "Butter Chicken", cat: "Mains", sub: "Indian", price: 480, cost: 220, type: "FOOD", sku: "BUT-CHK" },
  { name: "Pasta Alfredo", cat: "Mains", sub: "Continental", price: 400, cost: 160, type: "FOOD", sku: "PAS-ALF" },
  { name: "Fried Rice", cat: "Mains", sub: "Chinese", price: 280, cost: 100, type: "FOOD", sku: "FRD-RICE" },
  // Beverages
  { name: "Milk Tea", cat: "Beverages", sub: "Hot Drinks", price: 50, cost: 20, type: "BEVERAGE", sku: "TEA-MILK", trackStock: false },
  { name: "Black Coffee", cat: "Beverages", sub: "Hot Drinks", price: 120, cost: 40, type: "BEVERAGE", sku: "COF-BLK", trackStock: false },
  { name: "Coca Cola", cat: "Beverages", sub: "Cold Drinks", price: 100, cost: 40, type: "BEVERAGE", sku: "BEV-COKE" },
  { name: "Fresh Orange Juice", cat: "Beverages", sub: "Juices", price: 180, cost: 60, type: "BEVERAGE", sku: "JUC-ORG" },
  { name: "Lemon Soda", cat: "Beverages", sub: "Cold Drinks", price: 80, cost: 25, type: "BEVERAGE", sku: "SOD-LEM" },
  { name: "Mango Lassi", cat: "Beverages", sub: "Cold Drinks", price: 150, cost: 50, type: "BEVERAGE", sku: "LAS-MNG" },
  // Desserts
  { name: "Brownie", cat: "Desserts", sub: "Cakes", price: 150, cost: 50, type: "FOOD", sku: "DES-BROW" },
  { name: "Gulab Jamun", cat: "Desserts", price: 120, cost: 40, type: "FOOD", sku: "DES-GJAM" },
  { name: "Vanilla Ice Cream", cat: "Desserts", sub: "Ice Cream", price: 100, cost: 30, type: "FOOD", sku: "ICE-VAN" },
  // Sides
  { name: "Plain Naan", cat: "Sides", price: 60, cost: 15, type: "FOOD", sku: "NAAN-PLN" },
  { name: "Garlic Naan", cat: "Sides", price: 80, cost: 20, type: "FOOD", sku: "NAAN-GAR" },
  { name: "Raita", cat: "Sides", price: 50, cost: 15, type: "FOOD", sku: "SIDE-RAI", trackStock: false },
  // Specials (some unavailable for availability-filter testing)
  { name: "Chef Special Thali", cat: "Specials", price: 650, cost: 300, type: "FOOD", sku: "SPL-THALI" },
  { name: "Weekend Biryani", cat: "Specials", price: 550, cost: 250, type: "FOOD", sku: "SPL-BIRY" },
];

// Customers for search testing (name, phone, email patterns)
export const CUSTOMERS = [
  { name: "Aarav Sharma", phone: "9841100001", email: "aarav@gmail.com", notes: "Regular customer" },
  { name: "Priya Thapa", phone: "9841100002", email: "priya.thapa@mail.com", notes: "VIP" },
  { name: "Rajesh Karki", phone: "9841100003", email: null, notes: "Allergic to peanuts" },
  { name: "Suman Gurung", phone: "9841100004", email: "suman.g@outlook.com", notes: null },
  { name: "Anita Basnet", phone: "9841100005", email: "anita.b@yahoo.com", notes: "Prefers window seat" },
  { name: "Bikash Rai", phone: "9841100006", email: null, notes: null },
  { name: "Deepa Maharjan", phone: "9841100007", email: "deepa.m@corp.np", notes: "Corporate account" },
  { name: "Gopal Shrestha", phone: "9841100008", email: null, notes: "Weekend regular" },
  { name: "Kamala Poudel", phone: "9841100009", email: "kamala@test.com", notes: null },
  { name: "Nabin Tamang", phone: "9841100010", email: null, notes: "Large party bookings" },
  // Inactive customer for filter testing
  { name: "Deleted Customer", phone: "9841100099", email: null, notes: "Inactive test" },
];

export const AUDIT_REASONS = [
  "Customer changed mind", "Wrong item ordered", "Kitchen mistake",
  "Quality issue", "Customer complaint", "Manager override",
  "Price adjustment", "Duplicate order", "Test order cleanup",
];

export const CASH_DRAWER_REASONS = [
  { type: "PAY_IN" as const, reasons: ["Change from bank", "Petty cash top-up", "Owner deposit"] },
  { type: "PAY_OUT" as const, reasons: ["Vendor payment", "Staff advance", "Utility bill", "Supplies purchase"] },
];
