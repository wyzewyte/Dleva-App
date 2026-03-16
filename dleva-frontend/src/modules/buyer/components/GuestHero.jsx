import { useNavigate } from 'react-router-dom';
import { Tag } from 'lucide-react';

const GuestHero = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-700">
      
      {/* 1. Welcoming Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-dark tracking-tight">
          Are you hungry? 😋
        </h1>
        <p className="text-gray-500 mt-1">
          Don't stress. We have the best student meals nearby.
        </p>
      </div>

      {/* 2. The "Lure" Banner (Promo) */}
      <div 
        onClick={() => navigate('/signup')}
        className="relative w-full h-48 bg-gradient-to-r from-primary to-blue-600 rounded-3xl flex items-center px-8 text-white shadow-xl cursor-pointer group overflow-hidden"
      >
        <div className="relative z-10 space-y-1">
          <div className="bg-white/20 backdrop-blur-md inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold mb-2 border border-white/10">
             <Tag size={12} /> First Order Deal
          </div>
          <h2 className="text-3xl font-bold group-hover:scale-105 transition-transform">50% OFF</h2>
          <p className="font-medium text-blue-100 max-w-[200px]">
            Get half price on your first Jollof order when you sign up today!
          </p>
          <button className="mt-4 bg-white text-primary px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors">
            Claim Offer
          </button>
        </div>

        {/* Decorative Circles */}
        <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all"></div>
        <div className="absolute top-10 right-10 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl"></div>
      </div>

    </div>
  );
};

export default GuestHero;