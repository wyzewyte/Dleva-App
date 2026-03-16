import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import SellerSidebar from '../modules/seller/components/SellerSidebar';
import NotificationBell from '../components/seller/NotificationBell';

const SellerLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
      <div className="hidden md:block">
        <SellerSidebar />
      </div>

      {/* --- MAIN CONTENT WRAPPER --- */}
      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        
        {/* --- DESKTOP HEADER (Visible only on desktop) --- */}
        <header className="hidden md:flex h-16 bg-white border-b border-gray-200 items-center justify-end px-8 sticky top-0 z-30 shadow-sm">
            <NotificationBell />
        </header>
        
        {/* --- MOBILE HEADER --- */}
        <header className="md:hidden h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
            <span className="font-bold text-primary text-xl tracking-tighter">Dleva<span className="text-dark">Seller</span></span>
            <div className="flex items-center gap-3">
                <NotificationBell />
                <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="p-2 hover:bg-gray-100 rounded-md text-dark"
                >
                    <Menu size={24} />
                </button>
            </div>
        </header>

        {/* --- MOBILE DRAWER OVERLAY --- */}
        {isMobileMenuOpen && (
             <div className="fixed inset-0 z-50 md:hidden">
                {/* Backdrop */}
                <div 
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in"
                    onClick={() => setIsMobileMenuOpen(false)}
                ></div>
                
                {/* Drawer Panel */}
                <div className="absolute left-0 top-0 bottom-0 w-64 bg-white shadow-xl animate-in slide-in-from-left duration-300">
                    {/* Reuse the Sidebar Component with mobile props! */}
                    <SellerSidebar isMobile={true} closeMobileMenu={() => setIsMobileMenuOpen(false)} />
                </div>
             </div>
        )}

        {/* --- PAGE CONTENT --- */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;