import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock3,
  CreditCard,
  HelpCircle,
  Lock,
  Mail,
  MessageCircle,
  PackageSearch,
  ReceiptText,
  ShieldCheck,
  Truck,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  BuyerCard,
  BuyerPageHeader,
  BuyerPrimaryButton,
  BuyerSecondaryButton,
} from '../components/ui/BuyerPrimitives';

const SUPPORT_ACTIONS = [
  {
    label: 'Order support',
    hint: 'Open active orders and report delivery issues',
    icon: PackageSearch,
    tone: 'bg-accent/10 text-accent',
    action: '/orders',
  },
  {
    label: 'Account support',
    hint: 'Manage profile, address, and account details',
    icon: UserRound,
    tone: 'bg-accent/10 text-accent',
    action: '/profile',
  },
  {
    label: 'Email support',
    hint: 'Send screenshots, receipts, or detailed feedback',
    icon: Mail,
    tone: 'bg-accent/10 text-accent',
    external: 'mailto:support@dleva.com',
  },
];

const HELP_TOPICS = [
  {
    label: 'Track an order',
    hint: 'Live delivery updates and rider status',
    icon: Truck,
    tone: 'bg-accent/10 text-accent',
    action: '/orders',
  },
  {
    label: 'Order history',
    hint: 'Receipts, ratings, and previous deliveries',
    icon: ReceiptText,
    tone: 'bg-accent/10 text-accent',
    action: '/history',
  },
  {
    label: 'Payment help',
    hint: 'Checkout, refunds, and failed payments',
    icon: CreditCard,
    tone: 'bg-accent/10 text-accent',
  },
  {
    label: 'Account settings',
    hint: 'Profile, password, and saved details',
    icon: UserRound,
    tone: 'bg-accent/10 text-accent',
    action: '/profile',
  },
];

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
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <BuyerPageHeader
        title="Help & Support"
        subtitle="Find quick answers, manage order issues, or contact the team."
        showBack
      />

      <BuyerCard className="p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent shadow-sm">
              <HelpCircle size={26} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Support Center</p>
              <h2 className="mt-1 text-xl font-bold text-dark">How can we help?</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Most order issues are easiest to resolve from your active order or order history.
              </p>
            </div>
          </div>
          <div className="grid w-full gap-3 sm:w-64">
            <BuyerPrimaryButton
              icon={<MessageCircle size={18} />}
              onClick={() => navigate('/orders')}
            >
              View Orders
            </BuyerPrimaryButton>
          </div>
        </div>
      </BuyerCard>

      <div className="grid gap-3 sm:grid-cols-3">
        {SUPPORT_ACTIONS.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              if (item.action) navigate(item.action);
              if (item.external) window.location.href = item.external;
            }}
            className="rounded-[20px] border border-gray-200 bg-surface p-4 text-left shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.08)] active:scale-[0.99]"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.tone}`}>
              <item.icon size={19} />
            </div>
            <p className="mt-3 text-sm font-bold text-dark">{item.label}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{item.hint}</p>
          </button>
        ))}
      </div>

      <BuyerCard className="overflow-hidden">
        <div className="border-b border-gray-100 px-5 py-4">
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Common Tasks</p>
          <h2 className="mt-1 text-lg font-bold text-dark">Get to the right place</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {HELP_TOPICS.map((topic) => (
            <button
              key={topic.label}
              type="button"
              onClick={() => topic.action && navigate(topic.action)}
              className="flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-gray-50"
            >
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${topic.tone}`}>
                <topic.icon size={19} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-dark">{topic.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted">{topic.hint}</p>
              </div>
              <ChevronRight size={18} className="shrink-0 text-accent" />
            </button>
          ))}
        </div>
      </BuyerCard>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted">Quick Answers</p>
            <h2 className="mt-1 text-lg font-bold text-dark">Frequently asked questions</h2>
          </div>
          <div className="hidden items-center gap-2 rounded-xl bg-gray-50 px-3 py-2 text-xs font-semibold text-muted sm:flex">
            <Clock3 size={14} className="text-accent" />
            <span>Usually instant</span>
          </div>
        </div>
        {FAQS.map((faq, index) => (
          <BuyerCard key={faq.question} className="overflow-hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-semibold text-dark">{faq.question}</span>
              {openIndex === index ? <ChevronUp size={18} className="text-accent" /> : <ChevronDown size={18} className="text-accent" />}
            </button>
            {openIndex === index ? (
              <div className="border-t border-gray-100 bg-gray-50/70 px-5 py-4 text-sm leading-relaxed text-muted">
                {faq.answer}
              </div>
            ) : null}
          </BuyerCard>
        ))}
      </div>

      <BuyerCard className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <ShieldCheck size={19} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-dark">Need account security help?</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                Update your password or review your profile details from account settings.
              </p>
            </div>
          </div>
          <div className="w-full sm:w-52">
            <BuyerSecondaryButton
              icon={<Lock size={17} className="text-accent" />}
              onClick={() => navigate('/change-password')}
            >
              Password
            </BuyerSecondaryButton>
          </div>
        </div>
      </BuyerCard>
    </div>
  );
};

export default HelpSupportModern;
