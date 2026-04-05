import { useMemo, useState } from 'react';
import { Headphones, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  RiderCard,
  RiderEmptyState,
  RiderPageHeader,
  RiderPageShell,
  RiderPrimaryButton,
  RiderSearchField,
  RiderSecondaryButton,
} from '../components/ui/RiderPrimitives';

const HELP_SECTIONS = [
  {
    title: 'Getting started',
    items: [
      'How to complete rider verification',
      'What blocks going online',
      'How to accept your first order',
    ],
  },
  {
    title: 'Deliveries',
    items: [
      'What each delivery status means',
      'How to handle pickup delays',
      'What to do during delivery issues',
    ],
  },
  {
    title: 'Earnings and payouts',
    items: [
      'How rider earnings are calculated',
      'How payout history works',
      'Why a transaction may still be pending',
    ],
  },
];

const Help = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filteredSections = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return HELP_SECTIONS;
    return HELP_SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter((item) => item.toLowerCase().includes(term)),
    })).filter((section) => section.items.length > 0);
  }, [query]);

  return (
    <RiderPageShell maxWidth="max-w-4xl">
      <RiderPageHeader
        title="Help"
        subtitle="Support content should answer the rider's next question quickly instead of sending them through several disconnected pages."
        sticky
      />

      <div className="space-y-6 py-6">
        <RiderSearchField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery('')}
          placeholder="Search rider help topics"
        />

        {filteredSections.length > 0 ? (
          <div className="space-y-4">
            {filteredSections.map((section) => (
              <RiderCard key={section.title} className="p-5 sm:p-6">
                <h2 className="text-lg font-bold text-dark">{section.title}</h2>
                <div className="mt-4 space-y-3">
                  {section.items.map((item) => (
                    <div key={item} className="rounded-2xl border border-gray-200 p-4 text-sm text-dark">
                      {item}
                    </div>
                  ))}
                </div>
              </RiderCard>
            ))}
          </div>
        ) : (
          <RiderEmptyState
            icon={<Search size={28} />}
            title="No help topics matched that search"
            description="Try a simpler keyword or go back to the main help groups below."
            action={
              <RiderPrimaryButton onClick={() => setQuery('')} className="sm:w-auto sm:px-5">
                Clear search
              </RiderPrimaryButton>
            }
          />
        )}

        <RiderCard className="p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-dark">Still need support?</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Riders should always have a clear next support path without needing to guess which screen contains it.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:w-auto sm:flex-row">
              <RiderSecondaryButton onClick={() => navigate('/rider/faq')} className="sm:w-auto sm:px-5">
                Open FAQ
              </RiderSecondaryButton>
              <RiderPrimaryButton onClick={() => navigate('/rider/contact')} className="sm:w-auto sm:px-5" icon={<Headphones size={16} />}>
                Contact support
              </RiderPrimaryButton>
            </div>
          </div>
        </RiderCard>
      </div>
    </RiderPageShell>
  );
};

export default Help;
