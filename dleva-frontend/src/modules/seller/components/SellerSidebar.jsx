import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, History, Settings, LogOut, X, Bell } from 'lucide-react';

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: 'Overview', path: '/seller/dashboard' },
  { icon: ShoppingBag, label: 'Orders', path: '/seller/orders' },
  { icon: UtensilsCrossed, label: 'Menu', path: '/seller/menu' },
  { icon: History, label: 'History & Earnings', path: '/seller/history' },
  { icon: Bell, label: 'Notifications', path: '/seller/notifications' },
  { icon: Settings, label: 'Settings', path: '/seller/settings' },
];

const SellerSidebar = ({ isMobile, closeMobileMenu }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear authentication token from localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    // Close mobile menu if open
    if (isMobile) {
      closeMobileMenu();
    }
    
    // Redirect to login
    navigate('/seller/login');
  };

  return (
    <div className={`
        flex flex-col h-full bg-white border-r border-gray-200
        ${isMobile ? "w-full" : "w-64 fixed inset-y-0 z-20"}
    `}>
      {/* Header */}
      <div className="p-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary tracking-tighter">Dleva<span className="text-dark">Seller</span></h1>
        {isMobile && (
            <button onClick={closeMobileMenu} className="p-1 rounded-full hover:bg-gray-100">
                <X size={24} />
            </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 space-y-2">
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={isMobile ? closeMobileMenu : undefined} // Close drawer on click (mobile only)
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors
              ${isActive ? "bg-primary text-white shadow-md" : "text-gray-500 hover:bg-gray-50 hover:text-dark"}
            `}
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-gray-100">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl w-full font-medium transition-colors active:scale-95"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default SellerSidebar;