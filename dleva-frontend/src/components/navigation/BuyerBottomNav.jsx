import { NavLink } from 'react-router-dom';
import { Home, UtensilsCrossed, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../modules/buyer/context/CartContext';
import { useAuth } from '../../modules/auth/context/AuthContext';

const navItems = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Menu', href: '/restaurants', icon: UtensilsCrossed },
  { name: 'Cart', href: '/cart', icon: ShoppingBag }, // We will intercept this one
  { name: 'Profile', href: '/profile', icon: User },
];

const BuyerBottomNav = () => {
  const { toggleCart, cartItems } = useCart();
  const { token } = useAuth(); // Get auth token

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-surface border-t border-gray-200 h-16 flex justify-around items-center z-50 pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {

        // If the item is "Profile" and there's no token, don't render it.
        if (item.name === 'Profile' && !token) return null;
        
        // LOGIC: If the item is "Cart", render a Button. Otherwise, render a NavLink.
        if (item.name === 'Cart') {
          return (
            <button
              key={item.name}
              onClick={toggleCart} // Opens the Drawer
              className="flex flex-col items-center justify-center w-full h-full space-y-1 text-muted hover:text-dark relative"
            >
              <div className="relative">
                <item.icon size={24} strokeWidth={2} />
                {cartItems.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-danger text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cartItems.length}
                  </span>
                )}
              </div>
              <span className="text-[10px] uppercase tracking-wide font-medium">{item.name}</span>
            </button>
          );
        }

        // FOR ALL OTHER ITEMS (Home, Menu, Profile)
        return (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
                isActive ? "text-primary font-bold" : "text-muted hover:text-dark"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] uppercase tracking-wide">{item.name}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BuyerBottomNav;