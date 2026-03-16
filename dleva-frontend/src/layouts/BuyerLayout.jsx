import { Outlet, Link, NavLink } from 'react-router-dom';
import { ShoppingBag, User } from 'lucide-react';
import BuyerBottomNav from '../components/navigation/BuyerBottomNav';
import LocationSelector from '../components/LocationSelector';
import { useCart } from '../modules/buyer/context/CartContext';
import { useAuth } from '../modules/auth/context/AuthContext'; // Corrected Auth Context path

const BuyerLayout = () => {
  const { toggleCart, cartItems } = useCart();
  const { user, token } = useAuth(); // Get user and token from Auth Context

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* --- DESKTOP HEADER (Top Nav) --- */}
      {/* Hidden on Mobile, Visible on Desktop (md and up) */}
      <header className="hidden md:flex h-14 lg:h-16 bg-surface border-b border-gray-200 sticky top-0 z-50 px-4 sm:px-6 md:px-8 items-center justify-between shadow-sm">
        
        {/* Logo */}
        <Link to="/home" className="text-xl md:text-2xl font-bold text-primary tracking-tighter hover:opacity-80 transition-opacity">
          Dleva
        </Link>

        {/* Location Selector (Phase 3) */}
        <div className="hidden lg:block">
          <LocationSelector />
        </div>
        
        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-8">
          <NavLink 
            to="/home" 
            className={({isActive}) => `text-sm lg:text-base font-medium transition-colors ${isActive ? "text-primary font-bold" : "text-muted hover:text-dark"}`}
          >
            Home
          </NavLink>
          <NavLink 
            to="/restaurants" 
            className={({isActive}) => `text-sm lg:text-base font-medium transition-colors ${isActive ? "text-primary font-bold" : "text-muted hover:text-dark"}`}
          >
            Restaurants
          </NavLink>
          {/* Conditionally render Profile link in the main nav */}
          {token && (
            <NavLink 
              to="/profile" 
              className={({isActive}) => `text-sm lg:text-base font-medium transition-colors ${isActive ? "text-primary font-bold" : "text-muted hover:text-dark"}`}
            >
              Profile
            </NavLink>
          )}
        </nav>

        {/* Desktop Right Actions (Cart & Profile) */}
        <div className="flex items-center gap-3 lg:gap-4">
            
            {/* 3. CART BUTTON (Triggers the Drawer) */}
            <button 
                onClick={toggleCart} 
                className="p-2 hover:bg-gray-100 rounded-full relative transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
                <ShoppingBag size={20} />
                {cartItems.length > 0 && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-danger rounded-full ring-2 ring-white"></span>
                )}
            </button>

            {/* Profile Link */}
            {/* ✅ Conditionally render profile link only if user is logged in */}
            {token && user ? (
                <Link to="/profile" className="hidden sm:flex items-center gap-2 text-xs lg:text-sm font-medium hover:text-primary transition-colors min-h-[44px]">
                    {user.image ? (
                        <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                            <User size={16} />
                        </div>
                    )}
                    <span className="hidden lg:inline">{user.name?.split(' ')[0]}</span>
                </Link>
            ) : (
                <Link to="/login" className="text-sm font-medium text-primary hover:underline">Login</Link>
            )}
        </div>
      </header>

      {/* --- MOBILE HEADER (Location Selector) --- */}
      {/* Visible on Mobile, Hidden on Desktop (md and up) */}
      <header className="md:hidden h-14 bg-surface border-b border-gray-200 sticky top-0 z-40 px-4 flex items-center justify-between shadow-sm">
        {/* Logo */}
        <Link to="/home" className="text-xl font-bold text-primary tracking-tighter">
          Dleva
        </Link>

        {/* Location Selector - Mobile Version */}
        <LocationSelector />
      </header>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 pb-24 md:pb-6">
        {/* This renders the child pages (Home, Menu, etc.) */}
        <Outlet />
      </main>

      {/* --- MOBILE NAV (Bottom Nav) --- */}
      {/* This component now handles the Mobile Cart Drawer logic internally */}
      <BuyerBottomNav />
      
    </div>
  );
};

export default BuyerLayout;