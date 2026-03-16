/**
 * Contact Page
 * Direct contact form for support and inquiries
 */

import { useState } from 'react';
import { ArrowLeft, Loader2, AlertCircle, CheckCircle, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useRiderAuth } from '../context/RiderAuthContext';
import riderWallet from '../services/riderWallet';
import MESSAGES from '../../../constants/messages';

const Contact = () => {
  const navigate = useNavigate();
  const { rider } = useRiderAuth();
  const [formData, setFormData] = useState({
    name: rider?.full_name || '',
    email: rider?.email || '',
    phone: rider?.phone_number || '',
    subject: '',
    message: '',
    attachmentUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

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
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!formData.subject.trim()) {
      setError('Subject is required');
      return;
    }

    if (!formData.message.trim() || formData.message.trim().length < 10) {
      setError('Message must be at least 10 characters');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call API to submit contact form
      // await riderWallet.submitContactForm({
      //   ...formData,
      //   user_id: rider?.id,
      // });

      setSuccess(true);
      setFormData({
        name: rider?.full_name || '',
        email: rider?.email || '',
        phone: rider?.phone_number || '',
        subject: '',
        message: '',
        attachmentUrl: '',
      });

      // Auto-hide success message and redirect
      setTimeout(() => {
        setSuccess(false);
        navigate('/rider/home');
      }, 3000);
    } catch (err) {
      setError(err.error || MESSAGES.ERROR.SOMETHING_WRONG);
    } finally {
      setLoading(false);
    }
  };

  const contactInfo = [
    {
      icon: <Mail size={20} className="text-primary" />,
      title: 'Email',
      value: 'support@example.com',
      subtitle: 'We reply within 24 hours',
    },
    {
      icon: <Phone size={20} className="text-secondary" />,
      title: 'Phone',
      value: '+1 (555) 123-4567',
      subtitle: 'Mon-Fri 9 AM - 6 PM EST',
    },
    {
      icon: <MapPin size={20} className="text-success" />,
      title: 'Office',
      value: '123 Business Ave, Suite 100',
      subtitle: 'New York, NY 10001',
    },
    {
      icon: <Clock size={20} className="text-orange-500" />,
      title: 'Support Hours',
      value: '24/7 Chat Support',
      subtitle: 'Always available for urgent issues',
    },
  ];

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
            <h1 className="font-bold text-dark text-lg">Contact US</h1>
            <p className="text-xs text-muted">We're here to help</p>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8 pb-8">
        {/* Success Message */}
        {success && (
          <div className="bg-success/10 border border-success/30 text-success px-4 py-4 rounded-lg flex gap-3 animate-pulse">
            <CheckCircle size={20} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">Message sent successfully!</p>
              <p className="text-xs mt-1">We will get back to you shortly.</p>
            </div>
          </div>
        )}

        {/* Contact Information Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contactInfo.map((info, idx) => (
            <div
              key={idx}
              className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2"
            >
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gray-50 rounded-lg">{info.icon}</div>
                <p className="font-bold text-dark text-sm">{info.title}</p>
              </div>

              <p className="font-bold text-dark">{info.value}</p>
              <p className="text-xs text-muted">{info.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Contact Form */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="font-bold text-dark text-lg mb-2">Send us a message</h2>
            <p className="text-xs text-muted">
              Fill out the form below and our support team will get back to you soon.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex gap-3">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-bold text-dark mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-dark placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-bold text-dark mb-2">
                Email <span className="text-red-500">*</span>
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

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-bold text-dark mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-dark placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {/* Subject */}
            <div>
              <label htmlFor="subject" className="block text-sm font-bold text-dark mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="What is this about?"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-dark placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {/* Message */}
            <div>
              <label htmlFor="message" className="block text-sm font-bold text-dark mb-2">
                Message <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us more about your inquiry..."
                rows={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-dark placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
              />
              <p className="text-xs text-muted mt-1">{formData.message.length}/2000</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
            >
              {loading && <Loader2 size={18} className="animate-spin" />}
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>

        {/* Response Time Info */}
        <div className="bg-gradient-to-br from-primary/5 to-secondary/5 border border-primary/10 rounded-2xl p-6 space-y-3">
          <h3 className="font-bold text-dark text-sm uppercase tracking-wide">
            What to expect
          </h3>

          <div className="space-y-3">
            {[
              {
                step: '1',
                title: 'Confirmation',
                desc: 'You will receive an email confirmation immediately',
              },
              {
                step: '2',
                title: 'Review',
                desc: 'Our team reviews your message within 24 hours',
              },
              {
                step: '3',
                title: 'Response',
                desc: 'We will respond with a solution or next steps',
              },
              {
                step: '4',
                title: 'Follow-up',
                desc: 'We ensure your issue is fully resolved',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">{item.step}</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-dark">{item.title}</p>
                  <p className="text-xs text-dark">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
