import { SellerCard, SellerPageHeader } from './SellerPrimitives';

const SkeletonBar = ({ className = '' }) => (
  <div className={`animate-pulse rounded-lg bg-gray-100 ${className}`} />
);

const HeaderLoading = ({ eyebrowWidth = 'w-32', titleWidth = 'w-40', action = false }) => (
  <div className="flex items-start justify-between gap-3 border-b border-white/60 py-5">
    <div className="min-w-0 space-y-2">
      <SkeletonBar className={`h-3 ${eyebrowWidth}`} />
      <SkeletonBar className={`h-9 ${titleWidth}`} />
    </div>
    {action ? <SkeletonBar className="hidden h-11 w-32 rounded-xl sm:block" /> : null}
  </div>
);

const MetricGridLoading = ({ count = 4 }) => (
  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="rounded-2xl border border-gray-100 bg-[#fbfbfa] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <SkeletonBar className="h-3 w-24" />
            <SkeletonBar className="h-7 w-20" />
          </div>
          <SkeletonBar className="h-10 w-10 rounded-2xl" />
        </div>
      </div>
    ))}
  </div>
);

const DashboardLoading = () => (
  <>
    <HeaderLoading eyebrowWidth="w-36" titleWidth="w-44" action />

    <SellerCard className="p-5 sm:p-6">
      <div className="space-y-3">
        <SkeletonBar className="h-3 w-32" />
        <div className="flex items-end justify-between gap-4">
          <SkeletonBar className="h-8 w-52" />
          <SkeletonBar className="h-7 w-24 rounded-full" />
        </div>
      </div>
      <div className="mt-6">
        <MetricGridLoading />
      </div>
    </SellerCard>

    <SellerCard className="p-5 sm:p-6">
      <div className="space-y-4">
        <SkeletonBar className="h-3 w-36" />
        <SkeletonBar className="h-10 w-40" />
        <SkeletonBar className="h-4 w-24" />
        <div className="border-t border-gray-100 pt-4">
          <SkeletonBar className="h-8 w-16" />
          <SkeletonBar className="mt-2 h-4 w-28" />
        </div>
      </div>
    </SellerCard>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <SellerCard key={index} className="p-5">
          <div className="space-y-4">
            <SkeletonBar className="h-11 w-11 rounded-2xl" />
            <SkeletonBar className="h-5 w-32" />
            <SkeletonBar className="h-4 w-20" />
          </div>
        </SellerCard>
      ))}
    </div>
  </>
);

const OrdersLoading = () => (
  <>
    <HeaderLoading eyebrowWidth="w-36" titleWidth="w-32" action />

    <SellerCard className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <SkeletonBar className="h-3 w-32" />
            <SkeletonBar className="h-6 w-12 rounded-full" />
          </div>
          <SkeletonBar className="h-8 w-44" />
          <SkeletonBar className="h-4 w-28" />
        </div>
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBar key={index} className="h-11 w-24 shrink-0 rounded-2xl" />
          ))}
        </div>
      </div>
    </SellerCard>

    <div className="hidden gap-4 xl:grid xl:grid-cols-5">
      {Array.from({ length: 5 }).map((_, columnIndex) => (
        <SellerCard key={columnIndex} className="overflow-hidden">
          <div className="border-b border-gray-100 px-4 py-4">
            <div className="flex items-center gap-2">
              <SkeletonBar className="h-9 w-9 rounded-2xl" />
              <SkeletonBar className="h-5 w-24" />
            </div>
          </div>
          <div className="space-y-3 p-3">
            {Array.from({ length: 3 }).map((_, cardIndex) => (
              <div key={cardIndex} className="rounded-2xl bg-gray-50 p-4">
                <SkeletonBar className="h-5 w-28" />
                <SkeletonBar className="mt-3 h-4 w-full" />
                <SkeletonBar className="mt-2 h-4 w-2/3" />
                <SkeletonBar className="mt-4 h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </SellerCard>
      ))}
    </div>

    <SellerCard className="overflow-hidden xl:hidden">
      <div className="border-b border-gray-100 px-4 py-4">
        <SkeletonBar className="h-5 w-36" />
        <SkeletonBar className="mt-2 h-3 w-52" />
      </div>
      <div className="space-y-3 p-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl bg-gray-50 p-4">
            <SkeletonBar className="h-5 w-32" />
            <SkeletonBar className="mt-3 h-4 w-full" />
            <SkeletonBar className="mt-2 h-4 w-3/4" />
          </div>
        ))}
      </div>
    </SellerCard>
  </>
);

const MenuLoading = () => (
  <>
    <HeaderLoading eyebrowWidth="w-32" titleWidth="w-28" action />

    <SellerCard className="p-5 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="space-y-3">
          <SkeletonBar className="h-6 w-48" />
          <SkeletonBar className="h-4 w-72 max-w-full" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[18rem]">
          <SkeletonBar className="h-[76px] rounded-2xl" />
          <SkeletonBar className="h-[76px] rounded-2xl" />
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <SkeletonBar className="h-[54px] flex-1 rounded-[20px]" />
        <SkeletonBar className="h-[54px] w-full rounded-xl sm:w-36" />
      </div>
    </SellerCard>

    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <SellerCard key={index} className="overflow-hidden">
          <SkeletonBar className="h-44 rounded-none" />
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-3">
                <SkeletonBar className="h-5 w-36" />
                <SkeletonBar className="h-4 w-20" />
              </div>
              <SkeletonBar className="h-6 w-14 rounded-full" />
            </div>
            <SkeletonBar className="mt-4 h-4 w-full" />
            <SkeletonBar className="mt-2 h-4 w-4/5" />
            <div className="mt-5 flex items-center gap-2">
              <SkeletonBar className="h-11 flex-1 rounded-xl" />
              <SkeletonBar className="h-11 w-24 rounded-xl" />
            </div>
          </div>
        </SellerCard>
      ))}
    </div>
  </>
);

const HistoryLoading = () => (
  <>
    <HeaderLoading eyebrowWidth="w-32" titleWidth="w-36" action />

    <SellerCard className="p-5 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
        <div className="space-y-3">
          <SkeletonBar className="h-6 w-44" />
          <SkeletonBar className="h-4 w-80 max-w-full" />
          <SkeletonBar className="h-4 w-60 max-w-full" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <SkeletonBar className="h-[76px] rounded-2xl" />
          <SkeletonBar className="h-[76px] rounded-2xl" />
        </div>
      </div>
      <div className="mt-5 space-y-3">
        <SkeletonBar className="h-[54px] rounded-2xl" />
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_14rem]">
          <SkeletonBar className="h-[54px] rounded-[20px]" />
          <SkeletonBar className="h-[54px] rounded-[20px]" />
        </div>
      </div>
    </SellerCard>

    <SellerCard className="hidden overflow-hidden md:block">
      <div className="grid grid-cols-[0.8fr_1fr_1.3fr_0.8fr_0.8fr_0.5fr] gap-4 bg-[#fbfbfa] px-5 py-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <SkeletonBar key={index} className="h-3 w-full" />
        ))}
      </div>
      {Array.from({ length: 6 }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-[0.8fr_1fr_1.3fr_0.8fr_0.8fr_0.5fr] gap-4 border-t border-gray-100 px-5 py-4">
          {Array.from({ length: 6 }).map((__, cellIndex) => (
            <SkeletonBar key={cellIndex} className="h-5 w-full" />
          ))}
        </div>
      ))}
    </SellerCard>

    <div className="space-y-3 md:hidden">
      {Array.from({ length: 4 }).map((_, index) => (
        <SellerCard key={index} className="p-4">
          <SkeletonBar className="h-5 w-24" />
          <SkeletonBar className="mt-2 h-3 w-36" />
          <SkeletonBar className="mt-4 h-5 w-40" />
          <SkeletonBar className="mt-3 h-4 w-full" />
        </SellerCard>
      ))}
    </div>
  </>
);

const SettingsLoading = () => (
  <>
    <SellerPageHeader eyebrow="Seller account" title="Settings" />

    <SellerCard className="p-5 sm:p-6">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-center">
        <div className="space-y-3">
          <SkeletonBar className="h-6 w-48" />
          <SkeletonBar className="h-4 w-72 max-w-full" />
        </div>
        <SkeletonBar className="h-[94px] rounded-[24px]" />
      </div>
      <SkeletonBar className="mt-5 h-[54px] rounded-2xl" />
    </SellerCard>

    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <SellerCard className="p-5 sm:p-6">
        <SkeletonBar className="h-6 w-32" />
        <SkeletonBar className="mt-2 h-4 w-64 max-w-full" />
        <SkeletonBar className="mt-5 h-44 rounded-[24px]" />
        <SkeletonBar className="mt-4 h-14 rounded-2xl" />
      </SellerCard>

      <SellerCard className="p-5 sm:p-6">
        <SkeletonBar className="h-6 w-36" />
        <SkeletonBar className="mt-2 h-4 w-64 max-w-full" />
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <SkeletonBar className="h-[74px] rounded-xl md:col-span-2" />
          <SkeletonBar className="h-[74px] rounded-xl" />
          <SkeletonBar className="h-[74px] rounded-xl" />
          <SkeletonBar className="h-[74px] rounded-xl md:col-span-2" />
          <SkeletonBar className="h-36 rounded-xl md:col-span-2" />
        </div>
      </SellerCard>
    </div>
  </>
);

const variantMap = {
  dashboard: DashboardLoading,
  history: HistoryLoading,
  menu: MenuLoading,
  orders: OrdersLoading,
  settings: SettingsLoading,
};

const SellerPageLoading = ({ variant = 'dashboard' }) => {
  const Component = variantMap[variant] || DashboardLoading;

  return (
    <div className="min-h-[calc(100vh-10rem)] space-y-6" aria-busy="true" aria-live="polite">
      <Component />
    </div>
  );
};

export default SellerPageLoading;
