/**
 * Help Page
 * Comprehensive help and support documentation
 */

import { useState } from 'react';
import { ArrowLeft, Search, ChevronDown, AlertCircle, FileText, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Help = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState({});

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: '🚀',
      articles: [
        {
          title: 'How to create your rider account',
          content: 'Step-by-step guide to create and verify your rider account.',
        },
        {
          title: 'Setting up your delivery profile',
          content: 'Complete your profile with vehicle info, documents, and availability.',
        },
        {
          title: 'Getting your first delivery',
          content: 'Tips for accepting and completing your first delivery successfully.',
        },
      ],
    },
    {
      id: 'deliveries',
      title: 'Deliveries & Orders',
      icon: '📦',
      articles: [
        {
          title: 'How delivery assignments work',
          content: 'Understand how orders are assigned and optimized for efficiency.',
        },
        {
          title: 'Accepting and declining orders',
          content: 'Learn about acceptance rates and how to manage your workload.',
        },
        {
          title: 'What to do if you encounter issues',
          content: 'Troubleshooting common delivery problems and how to get help.',
        },
        {
          title: 'Safe delivery practices',
          content: 'Best practices for ensuring customer satisfaction and safety.',
        },
      ],
    },
    {
      id: 'payments',
      title: 'Payments & Earnings',
      icon: '💰',
      articles: [
        {
          title: 'How earnings are calculated',
          content: 'Breakdown of base pay, bonuses, incentives, and deductions.',
        },
        {
          title: 'Wallet and withdrawal methods',
          content: 'Managing your wallet and withdrawing earnings to your bank.',
        },
        {
          title: 'Understanding deductions',
          content: 'What are cancellation fees and other deductions from earnings.',
        },
        {
          title: 'Invoice and tax information',
          content: 'Access your monthly invoices and tax documentation.',
        },
      ],
    },
    {
      id: 'ratings',
      title: 'Ratings & Performance',
      icon: '⭐',
      articles: [
        {
          title: 'How ratings work',
          content: 'Understanding customer ratings and how they affect your status.',
        },
        {
          title: 'Improving your rating',
          content: 'Tips and strategies to maintain and improve your rating.',
        },
        {
          title: 'Handling bad ratings',
          content: 'What to do if you receive low ratings or negative feedback.',
        },
        {
          title: 'Deactivation policy',
          content: 'Understanding our deactivation policies and appeal process.',
        },
      ],
    },
    {
      id: 'technical',
      title: 'Tech & App',
      icon: '📱',
      articles: [
        {
          title: 'App not working',
          content: 'Troubleshooting common app issues and crashes.',
        },
        {
          title: 'GPS and location issues',
          content: 'Fixing location tracking and navigation problems.',
        },
        {
          title: 'Payment method issues',
          content: 'Resolving problems with linked bank accounts or payment methods.',
        },
        {
          title: 'System requirements',
          content: 'Minimum device requirements and supported operating systems.',
        },
      ],
    },
    {
      id: 'disputes',
      title: 'Disputes & Chargebacks',
      icon: '⚖️',
      articles: [
        {
          title: 'What is a dispute',
          content: 'Understanding disputes from customers and how they are resolved.',
        },
        {
          title: 'Disputing a payment',
          content: 'How to raise a dispute and provide evidence.',
        },
        {
          title: 'Appeal process',
          content: 'Steps to appeal a dispute decision.',
        },
      ],
    },
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const filteredCategories = helpCategories.map((category) => ({
    ...category,
    articles: category.articles.filter(
      (article) =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.content.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  }));

  const hasResults = filteredCategories.some((c) => c.articles.length > 0);

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
            <h1 className="font-bold text-dark text-lg">Help & Support</h1>
            <p className="text-xs text-muted">Find answers to common questions</p>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6 pb-8">
        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search help articles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg text-dark placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        {/* No Results */}
        {!hasResults && searchTerm && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 flex gap-4">
            <AlertCircle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-dark mb-1">No results found</p>
              <p className="text-xs text-muted">
                Try different keywords or contact our support team for assistance.
              </p>
            </div>
          </div>
        )}

        {/* Help Categories */}
        {hasResults && (
          <div className="space-y-3">
            {filteredCategories.map((category) => (
              category.articles.length > 0 && (
                <div key={category.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleSection(category.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors border-b border-gray-100"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{category.icon}</span>
                      <div className="text-left">
                        <p className="font-bold text-dark">{category.title}</p>
                        <p className="text-xs text-muted">{category.articles.length} articles</p>
                      </div>
                    </div>

                    <ChevronDown
                      size={20}
                      className={`text-muted transition-transform ${
                        expandedSections[category.id] ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Articles */}
                  {expandedSections[category.id] && (
                    <div className="divide-y divide-gray-100">
                      {category.articles.map((article, idx) => (
                        <div key={idx} className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors">
                          <p className="font-bold text-dark text-sm mb-1">{article.title}</p>
                          <p className="text-xs text-muted leading-relaxed">{article.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            ))}
          </div>
        )}

        {/* Contact Support CTA */}
        {!searchTerm && (
          <>
            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 rounded-2xl p-6 space-y-4">
              <h2 className="font-bold text-dark text-sm uppercase tracking-wide">
                Still need help?
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => navigate('/rider/contact')}
                  className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg font-bold text-dark text-sm transition-colors"
                >
                  <MessageCircle size={16} />
                  Contact Support
                </button>

                <button
                  onClick={() => navigate('/rider/faq')}
                  className="flex items-center gap-2 px-4 py-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg font-bold text-dark text-sm transition-colors"
                >
                  <FileText size={16} />
                  View FAQ
                </button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Help;
