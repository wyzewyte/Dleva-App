/**
 * FAQ Page
 * Frequently asked questions about the rider platform
 */

import { useState } from 'react';
import { ArrowLeft, ChevronDown, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FAQ = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState(null);

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I become a rider?',
          a: 'To become a rider, download the app, create an account with your email and phone number, complete KYC verification with a government ID, and upload vehicle documents. Once approved, you can start accepting deliveries.',
        },
        {
          q: 'What documents do I need?',
          a: 'You will need: Government-issued ID (passport/license), vehicle registration, vehicle insurance, and a bank account for payouts. We may ask for additional documents depending on local regulations.',
        },
        {
          q: 'How long does verification take?',
          a: 'Basic verification usually takes 24-48 hours. However, during peak times it may take 3-5 business days. You can check your verification status in the app.',
        },
      ],
    },
    {
      category: 'Deliveries',
      questions: [
        {
          q: 'How are delivery orders assigned?',
          a: 'Orders are assigned based on your location, availability, rating, acceptance rate, and the delivery preferences you set. Our algorithm optimizes assignments to minimize delivery time and maximize your earnings.',
        },
        {
          q: 'Can I choose which orders to accept?',
          a: 'Yes, you can accept or decline delivery offers. However, repeatedly declining orders may affect your acceptance rate, which can impact future order assignments.',
        },
        {
          q: 'What if I encounter issues during delivery?',
          a: 'Use the in-app support feature to report issues immediately. You can contact the customer, view pickup/delivery instructions, and our support team can assist you in real-time.',
        },
        {
          q: 'How much time do I get for a delivery?',
          a: 'Estimated delivery times are calculated based on distance, traffic, and traffic patterns. You get feedback during the delivery if you are running behind schedule.',
        },
      ],
    },
    {
      category: 'Payments & Earnings',
      questions: [
        {
          q: 'How is my pay calculated?',
          a: 'Your earnings consist of: Base fare (per delivery), Distance bonus, Time bonus, Surge pricing (peak hours), Incentives/promotions, minus any cancellation fees or deductions.',
        },
        {
          q: 'When do I get paid?',
          a: 'Earnings are credited to your wallet immediately upon delivery completion. You can withdraw to your bank account daily, weekly, or monthly depending on your preference.',
        },
        {
          q: 'What are cancellation fees?',
          a: 'If you cancel after accepting a delivery, a cancellation fee applies. This varies based on how late you cancel (before pickup, or after pickup). Repeated cancellations may also affect your rating.',
        },
        {
          q: 'Is there a minimum payout amount?',
          a: 'Most withdrawals have a minimum of $10-50 (varies by country). We may have maximum daily/weekly withdrawal limits as well.',
        },
      ],
    },
    {
      category: 'Ratings & Performance',
      questions: [
        {
          q: 'How are riders rated?',
          a: 'Customers rate you on a 5-star scale based on: Delivery speed, professionalism, communication, and order accuracy. You can see detailed feedback in your performance section.',
        },
        {
          q: 'What happens if my rating drops?',
          a: 'A low rating may reduce your access to premium delivery zones and bonuses. If your rating falls below our minimum threshold (usually 4.0), you may be subject to account review or deactivation.',
        },
        {
          q: 'Can I dispute a bad rating?',
          a: 'Yes, you can appeal ratings you believe are unfair. Provide context and evidence through the dispute form in the app. Our team will review and take appropriate action.',
        },
      ],
    },
    {
      category: 'Account & Security',
      questions: [
        {
          q: 'How is my data protected?',
          a: 'We use industry-standard encryption (SSL/TLS) to protect all data. Your personal information is never shared with third parties without your consent. See our Privacy Policy for details.',
        },
        {
          q: 'What if I forget my password?',
          a: 'Use the "Forgot Password" option on the login page. You will receive a password reset link via email. If you do not receive it, check your spam folder or contact support.',
        },
        {
          q: 'Can I have multiple accounts?',
          a: 'No, each person should have only one account. Multiple accounts violate our terms and may result in account suspension.',
        },
        {
          q: 'How do I delete my account?',
          a: 'You can request account deletion from the Settings page. Your data will be deleted within 30 days in accordance with privacy regulations. Note: Outstanding balances must be cleared.',
        },
      ],
    },
    {
      category: 'Technical Issues',
      questions: [
        {
          q: 'The app keeps crashing, what should I do?',
          a: 'Try: Clearing app cache, updating to the latest version, checking your internet connection, or reinstalling the app. If problems persist, contact support with your device details.',
        },
        {
          q: 'My location is not updating',
          a: 'Ensure location permission is enabled in your device settings. Try turning it off and on again, or restarting the app. GPS accuracy depends on signal strength.',
        },
        {
          q: 'I am not receiving notifications',
          a: 'Check your phone notification settings to ensure delivery app notifications are enabled. Try disabling and re-enabling notifications in the app settings.',
        },
      ],
    },
    {
      category: 'Policies',
      questions: [
        {
          q: 'What is your cancellation policy?',
          a: 'You can cancel orders before pickup without penalty. Cancelling after pickup incurs a fee. Excessive cancellations may affect your rating and account status.',
        },
        {
          q: 'What happens if there is a dispute?',
          a: 'Disputes are handled through our resolution system. We review evidence from both parties and make fair decisions. Most disputes are resolved within 48 hours.',
        },
        {
          q: 'Can I work for competitors?',
          a: 'This depends on your contract. Most delivery platforms allow multi-apping, but check your specific agreement. Priority orders may have exclusivity requirements during certain hours.',
        },
      ],
    },
  ];

  const toggleFAQ = (id) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const filteredFAQs = faqs.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (item) =>
        item.q.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.a.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  }));

  const hasResults = filteredFAQs.some((c) => c.questions.length > 0);

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-dark" />
          </button>
          <div>
            <h1 className="font-bold text-dark text-lg">FAQ</h1>
            <p className="text-xs text-muted">Frequently asked questions</p>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-8">
        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg text-dark placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* FAQ Sections */}
        {hasResults && (
          <div className="space-y-6">
            {filteredFAQs.map((category) =>
              category.questions.length > 0 ? (
                <section key={category.category}>
                  <h2 className="text-sm font-bold text-muted uppercase tracking-wide mb-4">
                    {category.category}
                  </h2>

                  <div className="space-y-2">
                    {category.questions.map((faq, idx) => {
                      const faqId = `${category.category}-${idx}`;

                      return (
                        <button
                          key={faqId}
                          onClick={() => toggleFAQ(faqId)}
                          className="w-full bg-white border border-gray-100 hover:border-gray-200 rounded-lg p-4 text-left transition-all hover:shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-bold text-dark text-sm flex-1">{faq.q}</p>
                            <ChevronDown
                              size={18}
                              className={`text-muted flex-shrink-0 transition-transform ${
                                expandedFAQ === faqId ? 'rotate-180' : ''
                              }`}
                            />
                          </div>

                          {expandedFAQ === faqId && (
                            <div className="mt-3 pt-3 border-t border-gray-100">
                              <p className="text-xs text-dark leading-relaxed">{faq.a}</p>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : null
            )}
          </div>
        )}

        {!hasResults && searchTerm && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
            <p className="font-bold text-dark mb-1">No results found</p>
            <p className="text-xs text-muted">
              Try different keywords or contact support for assistance.
            </p>
          </div>
        )}

        {/* Still Need Help */}
        {!searchTerm && (
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 rounded-2xl p-6 text-center space-y-4">
            <h3 className="font-bold text-dark">Still have questions?</h3>
            <p className="text-xs text-muted">
              Our support team is here to help. Contact us for immediate assistance.
            </p>

            <button
              onClick={() => navigate('/rider/contact')}
              className="w-full px-4 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-lg transition-colors text-sm"
            >
              Contact Us
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default FAQ;
