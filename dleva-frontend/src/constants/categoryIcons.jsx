import { 
  Soup, Salad, UtensilsCrossed, Drumstick, 
  CupSoda, Cake, Flame, Wheat, 
  Star, Plus, Cookie, Coffee
} from 'lucide-react';

export const categoryIconMap = {
  'appetizers':   { icon: UtensilsCrossed, bg: 'bg-rose-50',    color: 'text-rose-500' },
  'soups':        { icon: Soup,            bg: 'bg-orange-50',  color: 'text-orange-500' },
  'salads':       { icon: Salad,           bg: 'bg-emerald-50', color: 'text-emerald-500' },
  'main-courses': { icon: UtensilsCrossed, bg: 'bg-amber-50',   color: 'text-amber-500' },
  'proteins':     { icon: Drumstick,       bg: 'bg-red-50',     color: 'text-red-500' },
  'sides':        { icon: Cookie,          bg: 'bg-yellow-50',  color: 'text-yellow-500' },
  'beverages':    { icon: CupSoda,         bg: 'bg-sky-50',     color: 'text-sky-500' },
  'desserts':     { icon: Cake,            bg: 'bg-pink-50',    color: 'text-pink-500' },
  'spices':       { icon: Flame,           bg: 'bg-red-50',     color: 'text-red-400' },
  'breads':       { icon: Wheat,           bg: 'bg-amber-50',   color: 'text-amber-600' },
  'rice':         { icon: UtensilsCrossed, bg: 'bg-lime-50',    color: 'text-lime-600' },
  'noodles':      { icon: UtensilsCrossed, bg: 'bg-violet-50',  color: 'text-violet-500' },
  'swallow':      { icon: UtensilsCrossed, bg: 'bg-teal-50',    color: 'text-teal-500' },
  'special':      { icon: Star,            bg: 'bg-yellow-50',  color: 'text-yellow-500' },
  'extras':       { icon: Plus,            bg: 'bg-gray-50',    color: 'text-gray-500' },
};

export const getCategoryIcon = (slug) =>
  categoryIconMap[slug] || { icon: UtensilsCrossed, bg: 'bg-gray-50', color: 'text-gray-400' };