import { useNavigate } from 'react-router-dom';
import { Clock, Star, ThumbsUp } from 'lucide-react';

const UserDashboard = ({ user, lastOrder, onReorder }) => {
  const navigate = useNavigate();
  const firstName = user?.username || "Friend"; // Fallback

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. Personal Greeting */}
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-2xl font-bold text-dark">
            Hello, {firstName} 👋
            </h1>
            <p className="text-gray-500 text-sm">
            Ready to order your favorites?
            </p>
        </div>
        <div className="text-right">
            <p className="text-xs font-bold text-gray-400 uppercase">Points</p>
            <p className="text-primary font-bold">1,250 💎</p>
        </div>
      </div>

      {/* 2. Retention Loop: "Buy it Again" */}
      {lastOrder && (
        <section>
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                    <Clock size={12} /> Recent Order
                </h3>
                <button onClick={() => navigate('/history')} className="text-xs text-primary font-bold">View History</button>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex gap-4 items-center relative overflow-hidden">
                {/* Image */}
                <div className="w-16 h-16 bg-gray-100 rounded-xl bg-cover bg-center" 
                     style={{backgroundImage: `url(${lastOrder.items[0].image})`}}>
                </div>
                
                {/* Info */}
                <div className="flex-1 z-10">
                    <h4 className="font-bold text-dark text-sm">{lastOrder.vendorName}</h4>
                    <p className="text-xs text-gray-500 line-clamp-1">{lastOrder.items[0].name}</p>
                    <div className="flex gap-1 mt-1">
                        {[1,2,3,4,5].map(star => (
                            <Star key={star} size={10} className="text-yellow-400 fill-current" />
                        ))}
                    </div>
                </div>

                {/* Reorder Button */}
                <button 
                    onClick={onReorder}
                    className="z-10 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                    <ThumbsUp size={12} /> Reorder
                </button>
            </div>
        </section>
      )}

    </div>
  );
};

export default UserDashboard;