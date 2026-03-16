import { Link } from 'react-router-dom';
import { Store, MapPin, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../../../modules/auth/context/AuthContext';
import useLocation from '../../../hooks/useLocation';
import CartItem from '../components/CartItem';
import buyerRestaurants from '../../../services/buyerRestaurants';
import { estimateDeliveryFee } from '../../../services/deliveryService';
import { formatCurrency, formatDistance } from '../../../utils/formatters';
import { getMessage } from '../../../constants/messages';
import { useEffect, useState } from 'react';
import { logError } from '../../../utils/errorHandler';

const Cart = () => {
  const { cartItems } = useCart(); // Get real items
  const { currentLocation, setLocationSelectorOpen } = useLocation(); // Get current location from context
  const [restaurants, setRestaurants] = useState({});
  const [deliveryFees, setDeliveryFees] = useState({}); // Maps vendorId -> fee
  const [loadingFees, setLoadingFees] = useState(new Set()); // Track which vendors are loading

  // Fetch restaurant details to get their locations
  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const data = await buyerRestaurants.listRestaurants();
        const restaurantMap = {};
        data.forEach(r => {
          restaurantMap[r.id] = r;
        });
        setRestaurants(restaurantMap);
      } catch (err) {
        logError(err, { context: 'Cart.fetchRestaurants' });
      }
    };
    fetchRestaurants();
  }, []);

  // Calculate delivery fees by calling backend API
  useEffect(() => {
    if (!currentLocation?.latitude || !currentLocation?.longitude) return;

    // Get unique vendor IDs from cart
    const vendorIds = [...new Set(cartItems.map(item => item.vendorId))];
    
    // Fetch delivery fee for each vendor
    vendorIds.forEach(vendorId => {
      const restaurant = restaurants[vendorId];
      
      if (restaurant?.latitude && restaurant?.longitude && !deliveryFees[vendorId]) {
        // Mark as loading
        setLoadingFees(prev => new Set([...prev, vendorId]));
        
        // Call backend API to calculate delivery fee
        estimateDeliveryFee(vendorId, currentLocation.latitude, currentLocation.longitude).then(result => {
          if (result.success) {
            setDeliveryFees(prev => ({
              ...prev,
              [vendorId]: result.deliveryFee
            }));
          } else {
            logError(new Error(result.error), { context: 'Cart.fetchDeliveryFees', vendorId });
            // Optionally set a default fee or error state
          }
          
          // Mark as done loading
          setLoadingFees(prev => {
            const newSet = new Set(prev);
            newSet.delete(vendorId);
            return newSet;
          });
        });
      }
    });
  }, [currentLocation, restaurants, cartItems, deliveryFees]);

  // HELPER: Group items by Vendor (The Split Logic)
  const groupedItems = cartItems.reduce((acc, item) => {
    if (!acc[item.vendorId]) {
      acc[item.vendorId] = {
        vendorId: item.vendorId,
        vendorName: item.vendorName,
        items: [],
        subtotal: 0
      };
    }
    acc[item.vendorId].items.push(item);
    acc[item.vendorId].subtotal += item.price * item.quantity;
    return acc;
  }, {});

  const vendorGroups = Object.values(groupedItems);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-dark">My Cart</h1>

      {!currentLocation ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-100">
          <MapPin size={48} className="mx-auto text-orange-500 mb-3" />
          <h3 className="text-lg font-bold text-dark mb-2">Delivery Location Required</h3>
          <p className="text-muted mb-6">Select your delivery location to see available restaurants and calculate delivery fees.</p>
          <button 
            onClick={() => setLocationSelectorOpen(true)}
            className="bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-hover transition-colors"
          >
            Set Delivery Location
          </button>
        </div>
      ) : vendorGroups.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl">
              <p className="text-muted mb-4">Your cart is empty.</p>
              <Link to="/home" className="text-primary font-bold hover:underline">Start Shopping</Link>
          </div>
      ) : (
          /* LOOP THROUGH REAL VENDOR GROUPS */
          vendorGroups.map((group) => (
            <div key={group.vendorId} className="bg-surface rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
                
                {/* Vendor Header */}
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                    <div className="p-2 bg-primary/10 text-primary rounded-full">
                        <Store size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg">{group.vendorName}</h3>
                        <div className="flex items-center gap-1 text-xs text-muted">
                            <MapPin size={12} />
                            <span>Delivering to <b>Home</b></span>
                        </div>
                    </div>
                </div>

                {/* Items List */}
                <div className="space-y-1 mb-4">
                    {group.items.map((item) => (
                        <CartItem key={item.id} {...item} />
                    ))}
                </div>

                {/* Totals Area */}
                <div className="bg-bg rounded-xl p-3 space-y-2 text-sm mb-4">
                    <div className="flex justify-between text-muted">
                        <span>Subtotal</span>
                        <span>{formatCurrency(group.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-muted">
                        <span>Est. Delivery</span>
                        <span className="font-semibold text-orange-600">
                          {loadingFees.has(group.vendorId) 
                            ? getMessage('INFO.CALCULATING')
                            : deliveryFees[group.vendorId] 
                              ? formatCurrency(deliveryFees[group.vendorId])
                              : getMessage('ERROR.FEE_CALCULATION_FAILED')
                          }
                        </span>
                    </div>
                    <div className="flex justify-between font-bold text-dark pt-2 border-t border-gray-200">
                        <span>Total (Excl. delivery)</span>
                        <span>{formatCurrency(group.subtotal)}</span>
                    </div>
                </div>

                {/* CHECKOUT BUTTON */}
                <Link 
                    to={`/checkout/${group.vendorId}`} 
                    className="flex items-center justify-center gap-2 w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-hover transition-colors"
                >
                    Checkout {group.vendorName}
                    <ArrowRight size={18} />
                </Link>

            </div>
          ))
      )}
    </div>
  );
};

export default Cart;