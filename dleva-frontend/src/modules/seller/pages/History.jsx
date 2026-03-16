import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Download, Search, Eye, EyeOff, Filter, ArrowUpRight, CheckCircle2, Clock } from 'lucide-react';
import OrderModal from '../components/OrderModal';
import sellerHistory from '../../../services/sellerHistory';
import { logError } from '../../../utils/errorHandler';
import { formatCurrency } from '../../../utils/formatters';

const SellerHistory = () => {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'payouts'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Data State
  const [orders, setOrders] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Date Picker State
  const [isDateMenuOpen, setIsDateMenuOpen] = useState(false);
  const [dateRangeLabel, setDateRangeLabel] = useState('Last 30 Days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const dateMenuRef = useRef(null);

  // Privacy State
  const [showEarnings, setShowEarnings] = useState(true);
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [ordersData, payoutsData] = await Promise.all([
        sellerHistory.getOrderHistory(),
        sellerHistory.getPayouts(),
      ]);
      
      setOrders(ordersData);
      setPayouts(payoutsData);
    } catch (err) {
      logError(err, { context: 'History.fetchData' });
      setError(err.error || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS ---

  // Close date menu if clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dateMenuRef.current && !dateMenuRef.current.contains(event.target)) {
        setIsDateMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDateSelect = (label) => {
    setDateRangeLabel(label);
    setIsDateMenuOpen(false);
  };

  const handleCustomDateApply = () => {
    if(customStartDate && customEndDate) {
        setDateRangeLabel(`${customStartDate} - ${customEndDate}`);
        setIsDateMenuOpen(false);
    }
  };

  // Format order data from API
  const formatOrdersForDisplay = (ordersData) => {
    return ordersData.map(order => ({
      id: order.id,
      date: new Date(order.created_at).toLocaleDateString('en-NG', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      customer_name: order.customer_name || 'Unknown Customer',  // ✅ Use API's customer_name directly
      customer_phone: order.customer_phone || 'N/A',  // ✅ Use API's customer_phone
      customer_address: order.customer_address || 'N/A',  // ✅ Use API's customer_address
      items_summary: order.items?.map(i => `${i.quantity}x ${i.menu_item}`).join(', ') || 'N/A',  // ✅ Fixed menu_item access
      total_price: parseFloat(order.total_price) - parseFloat(order.delivery_fee || 0),  // ✅ Remove delivery fee from total - only show food price
      status: order.status,
    }));
  };

  const formattedOrders = formatOrdersForDisplay(orders);

  // Filter Data (Orders)
  const filteredData = formattedOrders.filter(order => {
    const matchesSearch = order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) || order.id.toString().includes(searchTerm);
    const matchesStatus = filterStatus === 'All' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Calculate Totals (Orders)
  const totalEarnings = filteredData
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total_price, 0);

  // Status label mapping
  const getStatusLabel = (status) => {
    const statusMap = {
      delivered: { label: 'Delivered', bgColor: 'bg-green-100', color: 'text-green-700' },
      cancelled: { label: 'Cancelled', bgColor: 'bg-red-100', color: 'text-red-700' },
      on_way: { label: 'On Way', bgColor: 'bg-blue-100', color: 'text-blue-700' },
      picked_up: { label: 'Picked Up', bgColor: 'bg-yellow-100', color: 'text-yellow-700' },
      pending: { label: 'Pending', bgColor: 'bg-gray-100', color: 'text-gray-700' },
      confirming: { label: 'Confirming', bgColor: 'bg-purple-100', color: 'text-purple-700' },
      preparing: { label: 'Preparing', bgColor: 'bg-orange-100', color: 'text-orange-700' },
    };
    return statusMap[status] || { label: status, bgColor: 'bg-gray-100', color: 'text-gray-700' };
  };

  const handleExportCSV = () => {
    let headers, rows, filename;

    if (activeTab === 'orders') {
        headers = ["Order ID,Date,Customer,Items,Total,Status"];
        rows = filteredData.map(order => 
          `${order.id},"${order.date}","${order.customer_name}","${order.items_summary}",${order.total_price},${order.status}`
        );
        filename = "dleva_sales_report.csv";
    } else {
        headers = ["Payout ID,Date,Bank,Amount,Status"];
        rows = payouts.map(payout => 
            `${payout.id},"${payout.date}","${payout.bank}",${payout.amount},${payout.status}`
        );
        filename = "dleva_payouts_report.csv";
    }

    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status) => {
    const statusInfo = getStatusLabel(status);
    return <span className={`px-2 py-1 rounded-md text-xs font-bold border ${statusInfo.bgColor} ${statusInfo.color} border-current`}>{statusInfo.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-400">Loading history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      
      {/* --- HEADER & ACTIONS --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold text-dark">Finance & History</h1>
            <p className="text-sm text-muted">Track sales, payouts and reports.</p>
        </div>
        
        <div className="flex gap-2">
            
            {/* DATE FILTER DROPDOWN */}
            <div className="relative" ref={dateMenuRef}>
                <button 
                    onClick={() => setIsDateMenuOpen(!isDateMenuOpen)}
                    className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 text-gray-700 active:scale-95 transition-all shadow-sm"
                >
                    <Calendar size={18} className="text-gray-500" /> 
                    <span>{dateRangeLabel}</span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform ${isDateMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDateMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-2 space-y-1 border-b border-gray-100">
                            <p className="text-xs font-bold text-gray-400 px-2 py-1 uppercase">Quick Select</p>
                            <button onClick={() => handleDateSelect('Last 7 Days')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Last 7 Days</button>
                            <button onClick={() => handleDateSelect('Last 30 Days')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Last 30 Days</button>
                            <button onClick={() => handleDateSelect('Last 3 Months')} className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg">Last 3 Months</button>
                        </div>
                        
                        <div className="p-3 bg-gray-50">
                            <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Custom Range</p>
                            <div className="grid grid-cols-2 gap-2 mb-2">
                                <div>
                                    <label className="text-[10px] text-gray-500 font-bold">Start</label>
                                    <input 
                                        type="date" 
                                        className="w-full text-xs p-1.5 border border-gray-200 rounded-lg bg-white" 
                                        value={customStartDate}
                                        onChange={(e) => setCustomStartDate(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] text-gray-500 font-bold">End</label>
                                    <input 
                                        type="date" 
                                        className="w-full text-xs p-1.5 border border-gray-200 rounded-lg bg-white"
                                        value={customEndDate}
                                        onChange={(e) => setCustomEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                            <button 
                                onClick={handleCustomDateApply}
                                className="w-full bg-primary text-white text-xs font-bold py-2 rounded-lg hover:bg-primary-hover shadow-sm"
                            >
                                Apply Custom Date
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* EXPORT BUTTON */}
            <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-hover shadow-sm active:scale-95 transition-transform"
            >
                <Download size={18} /> 
                <span className="hidden sm:inline">Export {activeTab === 'orders' ? 'Sales' : 'Payouts'}</span>
            </button>
        </div>
      </div>

      {/* --- EARNINGS CARD (With Privacy Toggle) --- */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
         {/* Background Decoration */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl pointer-events-none"></div>

         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
             <div>
                <div className="flex items-center gap-2 mb-1">
                    <p className="text-gray-400 text-sm font-medium">
                        {activeTab === 'orders' ? 'Total Sales Revenue' : 'Available Balance'}
                    </p>
                    <button 
                        onClick={() => setShowEarnings(!showEarnings)}
                        className="text-gray-500 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                    >
                        {showEarnings ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                </div>
                
                <h2 className="text-4xl font-bold tracking-tight">
                    {showEarnings ? formatCurrency(totalEarnings) : '₦ ****'}
                </h2>
                <p className="text-xs text-gray-400 mt-2 font-medium bg-white/10 inline-block px-2 py-1 rounded-md">
                    {dateRangeLabel}
                </p>
             </div>

             <div className="flex gap-8 text-left sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-4 sm:pt-0 sm:pl-8 w-full sm:w-auto">
                <div>
                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Delivered</p>
                    <p className="text-2xl font-bold">{filteredData.filter(o => o.status === 'delivered').length}</p>
                </div>
                <div>
                    <p className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-1">Cancelled</p>
                    <p className="text-2xl font-bold text-red-400">{filteredData.filter(o => o.status === 'cancelled').length}</p>
                </div>
             </div>
         </div>
      </div>

      {/* --- TABS SWITCHER --- */}
      <div className="flex border-b border-gray-200">
        <button 
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'orders' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-dark'}`}
        >
            Order History
        </button>
        <button 
            onClick={() => setActiveTab('payouts')}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'payouts' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-dark'}`}
        >
            Payouts & Transfers
        </button>
      </div>

      {/* ======================= */}
      {/* 1. ORDER HISTORY VIEW   */}
      {/* ======================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* SEARCH & FILTERS */}
          <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-sm flex flex-col sm:flex-row gap-2">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search orders..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-transparent text-sm font-medium focus:outline-none placeholder:text-gray-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
             </div>
             <div className="h-px sm:h-auto sm:w-px bg-gray-200 mx-2"></div>
             <div className="relative sm:min-w-[180px]">
                <Filter className="absolute left-3 top-3 text-gray-400" size={16} />
                <select 
                    className="w-full appearance-none bg-transparent pl-9 pr-8 py-2.5 text-sm font-bold text-gray-600 focus:outline-none cursor-pointer"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="All">All Status</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="on_way">On Way</option>
                    <option value="picked_up">Picked Up</option>
                </select>
                <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={14} />
             </div>
          </div>

          {/* DATA TABLE (Desktop) */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hidden md:block">
            <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Order ID</th>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date & Time</th>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</th>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Total</th>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">View</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredData.length === 0 ? (
                        <tr>
                            <td colSpan="6" className="p-10 text-center text-gray-400 text-sm">No records found matching your filters.</td>
                        </tr>
                    ) : filteredData.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/80 transition-colors group">
                            <td className="p-4 font-bold text-dark">#{order.id}</td>
                            <td className="p-4 text-sm text-gray-500 font-medium">{order.date}</td>
                            <td className="p-4 text-sm font-bold text-gray-700">{order.customer_name}</td>
                            <td className="p-4 text-sm font-bold text-dark">{formatCurrency(order.total_price)}</td>
                            <td className="p-4">{getStatusBadge(order.status)}</td>
                            <td className="p-4 text-center">
                                <button 
                                    onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                                    className="text-gray-300 hover:text-primary hover:bg-primary/5 p-2 rounded-lg transition-all"
                                >
                                    <Eye size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>

          {/* CARD LIST (Mobile) */}
          <div className="md:hidden space-y-3">
            {filteredData.length === 0 ? (
                 <div className="text-center py-10 text-gray-400 text-sm">No records found.</div>
            ) : filteredData.map((order) => (
                <div 
                    key={order.id} 
                    onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }}
                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm active:scale-[0.98] transition-transform"
                >
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <span className="font-bold text-dark text-lg">#{order.id}</span>
                            <p className="text-xs text-muted mt-0.5">{order.date}</p>
                        </div>
                        {getStatusBadge(order.status)}
                    </div>
                    
                    <div className="flex justify-between items-end border-t border-gray-50 pt-3">
                        <div>
                            <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Customer</p>
                            <p className="text-sm font-bold text-gray-700">{order.customer_name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 font-bold uppercase mb-0.5">Total</p>
                                <p className="text-lg font-bold text-dark">{formatCurrency(order.total_price)}</p>
                        </div>
                    </div>
                </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================= */}
      {/* 2. PAYOUTS VIEW         */}
      {/* ======================= */}
      {activeTab === 'payouts' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
             
             {/* Info Banner */}
             <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 items-start">
                <Clock className="text-blue-600 shrink-0 mt-0.5" size={18} />
                <div>
                    <h4 className="font-bold text-blue-900 text-sm">Payout Schedule</h4>
                    <p className="text-xs text-blue-700 mt-1">
                        Transfers are processed automatically every Tuesday. Funds typically arrive within 24 hours depending on your bank (GTBank, Access, etc).
                    </p>
                </div>
             </div>

             {/* Payouts Table */}
             <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Payout ID</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date Initiated</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Bank Account</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Amount</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                            <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Receipt</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {payouts.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="p-10 text-center text-gray-400 text-sm">No payouts yet.</td>
                          </tr>
                        ) : payouts.map((payout) => (
                            <tr key={payout.id} className="hover:bg-gray-50/80 transition-colors">
                                <td className="p-4 font-mono text-xs font-bold text-gray-500">{payout.id}</td>
                                <td className="p-4 text-sm font-medium text-dark">{new Date(payout.date).toLocaleDateString('en-NG')}</td>
                                <td className="p-4 text-sm text-gray-500">{payout.bank}</td>
                                <td className="p-4 text-sm font-bold text-dark">{formatCurrency(parseFloat(payout.amount))}</td>
                                <td className="p-4">{getStatusBadge(payout.status)}</td>
                                <td className="p-4 text-center">
                                    <button className="text-gray-300 hover:text-primary transition-colors">
                                        <ArrowUpRight size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
          </div>
      )}

      {/* --- REUSED MODAL --- */}
      <OrderModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
        onStatusChange={() => alert("History is read-only.")} 
      />

    </div>
  );
};

export default SellerHistory;