/**
 * Feedback Page
 * Allows riders to submit feedback, report issues, and suggest improvements
 */

import { useState } from 'react';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRiderAuth } from '../context/RiderAuthContext';
import riderWallet from '../services/riderWallet';
import MESSAGES from '../../../constants/messages';

const Feedback = () => {
  const navigate = useNavigate();
  const { rider } = useRiderAuth();
  const [formData, setFormData] = useState({
    category: 'bug',
    title: '',
    description: '',
    email: rider?.email || '',
    phone: rider?.phone_number || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const categories = [
    { value: 'bug', label: 'Report a Bug' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'payment', label: 'Payment Issue' },
    { value: 'delivery', label: 'Delivery Issue' },
    { value: 'app', label: 'App Performance' },
    { value: 'other', label: 'Other' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      return;
    }

    if (formData.description.trim().length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call API to submit feedback
      await riderWallet.submitFeedback({
        ...formData,
        user_id: user?.id,
      });

      setSuccess(true);
      setFormData({
        category: 'bug',
        title: '',
        description: '',
        email: user?.email || '',
        phone: user?.phone_number || '',
      });

      // Auto-hide success message after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.error || MESSAGES.ERROR.SOMETHING_WRONG);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-dark" />
          </button>
          <div>
            <h1 className="font-bold text-dark text-lg">Send Feedback</h1>
            <p className="text-xs text-muted">Help us improve your experience</p>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6 pb-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-success/10 border border-success/30 text-success px-4 py-4 rounded-lg flex gap-3 animate-pulse">
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Thank you for your feedback!</p>
              <p className="text-xs mt-1">We'll review your message shortly</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex gap-3">
            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {/* Feedback Form */}
        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          {/* Category Selection */}
          <div>
            <label htmlFor="category" className="block text-sm font-bold text-dark mb-2">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white text-dark font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              {categories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-bold text-dark mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Brief subject of your feedback"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-dark placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              maxLength={100}
            />
            <p className="text-xs text-muted mt-1">{formData.title.length}/100</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-bold text-dark mb-2">
              Details <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your feedback in detail..."
              rows={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-dark placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              maxLength={1000}
            />
            <p className="text-xs text-muted mt-1">{formData.description.length}/1000</p>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-dark mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-dark placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-dark mb-2">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Your phone number"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-dark placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>

        {/* FAQ Section */}
        <section className="mt-8 space-y-4">
          <h2 className="text-sm font-bold text-muted uppercase tracking-wide">
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {[
              {
                q: 'How long does it take to hear back?',
                a: 'We review all feedback within 24-48 hours and may reach out for more details.',
              },
              {
                q: 'Can I report a security issue?',
                a: 'For security issues, please email support@example.com with details. Do not share sensitive information publicly.',
              },
              {
                q: 'Will my feedback be kept confidential?',
                a: 'Yes, your feedback is handled confidentially and used only to improve our service.',
              },
              {
                q: 'How can I track my feedback status?',
                a: 'Feedback tracking is coming soon! For now, keep your reference number from the confirmation.',
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border border-gray-100 rounded-lg p-4 space-y-2"
              >
                <p className="font-bold text-dark text-sm">{faq.q}</p>
                <p className="text-xs text-muted leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Support Contact */}
        <section className="mt-8 bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 rounded-2xl p-6 space-y-3">
          <div className="flex items-start gap-3">
            <MessageSquare size={20} className="text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-2 flex-1">
              <p className="font-bold text-dark text-sm">Need Immediate Help?</p>
              <p className="text-xs text-dark leading-relaxed">
                For urgent issues, contact our support team at{' '}
                <a href="mailto:support@example.com" className="font-bold text-primary hover:underline">
                  support@example.com
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Feedback;
