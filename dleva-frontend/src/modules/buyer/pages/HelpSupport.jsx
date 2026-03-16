import { useState } from 'react';
import { ArrowLeft, Phone, Mail, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FAQS = [
  {
    question: "Where is my order?",
    answer: "You can track your order in real-time by going to the 'Order History' page and tapping on your active order."
  },
  {
    question: "Can I cancel my order?",
    answer: "You can cancel your order within 2 minutes of placing it. After the restaurant starts preparing, cancellations are not guaranteed."
  },
  {
    question: "My food arrived cold/damaged.",
    answer: "We are sorry about that! Please rate the order 1 star and leave a comment, or contact our support team immediately below."
  },
  {
    question: "How do I change my payment method?",
    answer: "Currently, you can select your payment method at checkout. We support Cards and Bank Transfers via Paystack."
  }
];

const HelpSupport = () => {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-bg min-h-screen pb-10">
      
      {/* Header */}
      <div className="bg-surface p-4 shadow-sm border-b border-gray-100 sticky top-0 z-10 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-50 rounded-full">
            <ArrowLeft size={20} />
        </button>
        <h1 className="font-bold text-lg text-dark">Help & Support</h1>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">

        {/* 1. CONTACT CHANNELS */}
        <section className="bg-surface p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-dark mb-4">Contact Us</h2>
            <div className="grid grid-cols-2 gap-3">
                <a href="tel:+234800000000" className="flex flex-col items-center justify-center gap-2 p-4 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors">
                    <Phone size={24} />
                    <span className="text-sm font-bold">Call Us</span>
                </a>
                <a href="mailto:support@dleva.com" className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors">
                    <Mail size={24} />
                    <span className="text-sm font-bold">Email Us</span>
                </a>
            </div>
            <button className="w-full mt-3 flex items-center justify-center gap-2 p-4 bg-gray-50 text-dark rounded-xl hover:bg-gray-100 transition-colors">
                <MessageCircle size={20} />
                <span className="text-sm font-bold">Chat with Support</span>
            </button>
        </section>

        {/* 2. FAQS */}
        <section>
            <h2 className="font-bold text-dark mb-3 px-1">Frequently Asked Questions</h2>
            <div className="space-y-3">
                {FAQS.map((faq, index) => (
                    <div 
                        key={index} 
                        className="bg-surface rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                        <button 
                            onClick={() => toggleFaq(index)}
                            className="w-full flex justify-between items-center p-4 text-left font-medium text-dark hover:bg-gray-50"
                        >
                            {faq.question}
                            {openIndex === index ? <ChevronUp size={18} className="text-primary"/> : <ChevronDown size={18} className="text-muted"/>}
                        </button>
                        
                        {/* Animated Answer Box */}
                        {openIndex === index && (
                            <div className="px-4 pb-4 text-sm text-muted bg-gray-50/50 leading-relaxed border-t border-gray-100 pt-3">
                                {faq.answer}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>

      </div>
    </div>
  );
};

export default HelpSupport;