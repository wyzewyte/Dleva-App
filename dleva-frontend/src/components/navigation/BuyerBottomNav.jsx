import { NavLink, useNavigate } from 'react-router-dom';
import { Home, UtensilsCrossed, Package, User } from 'lucide-react';
import { useState } from 'react';
import { useCart } from '../../modules/buyer/context/CartContext';
import { useAuth } from '../../modules/auth/context/AuthContext';
import LoginPromptModal from '../../modules/buyer/components/LoginPromptModal';

const navItems = [
  { name: 'Home', href: '/home', icon: Home },
  { name: 'Menu', href: '/restaurants', icon: UtensilsCrossed },
  { name: 'Orders', href: '/orders', icon: Package },
];

const BuyerBottomNav = () => {
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { token } = useAuth();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const handleProfileClick = () => {
    // If guest, show login prompt instead
    if (!token) {
      setShowLoginPrompt(true);
      return;
    }
    // If authenticated, go directly to profile page
    navigate('/profile');
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-gray-200 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex items-stretch h-16">

          {/* Nav Items */}
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center justify-center gap-1 transition-colors duration-200 relative min-w-0 ${
                  isActive ? 'text-primary' : 'text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {/* Active indicator bar at top */}
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
                  )}
                  <div className="relative">
                    <item.icon
                      size={22}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    {item.name === 'Orders' && cartItems.length > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-danger text-white text-[9px] min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center font-bold leading-none">
                        {cartItems.length > 9 ? '9+' : cartItems.length}
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] tracking-wide font-medium truncate ${isActive ? 'font-bold' : ''}`}>
                    {item.name}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* Profile Tab */}
          <div className="flex-1 relative flex flex-col items-center justify-center min-w-0">
            <button
              onClick={handleProfileClick}
              className="flex flex-col items-center justify-center gap-1 w-full h-full transition-colors text-muted hover:text-primary"
            >
              <User size={22} strokeWidth={2} />
              <span className="text-[10px] tracking-wide font-medium">
                Profile
              </span>
            </button>
          </div>

        </div>
      </nav>

      {/* Login Prompt Modal (for guests clicking profile) */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        title="View Your Profile"
        message="Login or create an account to view your profile, order history, and manage your preferences."
      />
    </>
  );
};

export default BuyerBottomNav;