import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, PackageSearch, ShieldCheck } from 'lucide-react';
import {
  BuyerCard,
  BuyerPageHeader,
} from '../components/ui/BuyerPrimitives';

const FAQS = [
  {
    question: 'Where is my order?',
    answer: 'Track active orders from the Orders hub or open Order History to view previous deliveries.',
  },
  {
    question: 'Can I cancel my order?',
    answer: 'Orders can usually be cancelled within the first few minutes. Once preparation begins, cancellation may no longer be available.',
  },
  {
    question: 'My food arrived cold or damaged.',
    answer: 'Please rate the order, leave a comment, and contact support so the issue can be investigated quickly.',
  },
  {
    question: 'How do I change my payment method?',
    answer: 'You can choose your payment method during checkout before completing your order.',
  },
];

const HelpSupportModern = () => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <BuyerPageHeader
        title="Help & Support"
        showBack
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Order Help', icon: PackageSearch, className: 'bg-emerald-50 text-emerald-700', body: 'Track current orders and review delivery status updates.' },
          { label: 'Account Help', icon: ShieldCheck, className: 'bg-sky-50 text-sky-700', body: 'Use profile and password settings to manage your account.' },
          { label: 'Quick Answers', icon: HelpCircle, className: 'bg-amber-50 text-amber-700', body: 'Common buyer questions and next steps are listed below.' },
        ].map((item) => (
          <div key={item.label} className={`rounded-[20px] border border-transparent p-5 ${item.className}`}>
            <item.icon size={24} />
            <p className="mt-4 text-base font-bold">{item.label}</p>
            <p className="mt-1 text-sm opacity-80">{item.body}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-bold text-dark">Frequently Asked Questions</h2>
        {FAQS.map((faq, index) => (
          <BuyerCard key={faq.question} className="overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-dark">{faq.question}</span>
              {openIndex === index ? <ChevronUp size={18} className="text-primary" /> : <ChevronDown size={18} className="text-muted" />}
            </button>
            {openIndex === index ? (
              <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-4 text-sm leading-relaxed text-muted">
                {faq.answer}
              </div>
            ) : null}
          </BuyerCard>
        ))}
      </div>
    </div>
  );
};

export default HelpSupportModern;
