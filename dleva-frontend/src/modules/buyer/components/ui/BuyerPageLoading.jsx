import { BuyerCard, BuyerSearchField } from './BuyerPrimitives';

const SkeletonBar = ({ className = '' }) => (
  <div className={`animate-pulse rounded bg-gray-100 ${className}`} />
);

const SkeletonCard = ({ className = '', children }) => (
  <BuyerCard className={className}>{children}</BuyerCard>
);

const HeaderSkeleton = ({ titleWidth = 'w-40', subtitleWidth = 'w-28', showSearch = false, searchPlaceholder = 'Search...' }) => (
  <section className="space-y-4 border-b border-gray-100 py-5">
    <div className="space-y-2">
      <SkeletonBar className={`h-8 ${titleWidth}`} />
      <SkeletonBar className={`h-4 ${subtitleWidth}`} />
    </div>

    {showSearch ? (
      <BuyerSearchField
        placeholder={searchPlaceholder}
        readOnly
        className="pointer-events-none"
      />
    ) : null}
  </section>
);

const HomeLoading = () => (
  <div className="mx-auto max-w-6xl space-y-6 pb-8">
    <HeaderSkeleton
      titleWidth="w-52"
      subtitleWidth="w-40"
      showSearch
      searchPlaceholder="Search jollof, chicken, drinks..."
    />

    <section className="space-y-4">
      <SkeletonBar className="h-6 w-36" />
      <div className="flex gap-3 overflow-x-auto pb-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="flex min-w-[92px] flex-col items-center gap-2">
            <SkeletonBar className="h-[84px] w-[92px] rounded-[18px]" />
            <SkeletonBar className="h-3 w-16" />
          </div>
        ))}
      </div>
    </section>

    <section className="space-y-4">
      <SkeletonBar className="h-6 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <SkeletonCard key={item} className="overflow-hidden">
            <SkeletonBar className="h-48 rounded-none" />
            <div className="space-y-3 p-4">
              <SkeletonBar className="h-5 w-2/3" />
              <SkeletonBar className="h-4 w-3/4" />
            </div>
          </SkeletonCard>
        ))}
      </div>
    </section>
  </div>
);

const DetailLoading = ({ showTopImage = false, showSearch = false, titleWidth = 'w-48' }) => (
  <div className="mx-auto max-w-5xl space-y-5 pb-8">
    <div className="flex items-center justify-between gap-4">
      <SkeletonBar className="h-10 w-36 rounded-xl" />
      <SkeletonBar className="h-10 w-10 rounded-xl" />
    </div>

    {showTopImage ? <SkeletonBar className="h-60 w-full rounded-[24px]" /> : null}

    <SkeletonCard className="p-4">
      <div className="space-y-3">
        <SkeletonBar className={`h-6 ${titleWidth}`} />
        <div className="flex flex-wrap gap-2">
          <SkeletonBar className="h-4 w-16" />
          <SkeletonBar className="h-4 w-20" />
          <SkeletonBar className="h-4 w-24" />
        </div>
      </div>
    </SkeletonCard>

    {showSearch ? (
      <BuyerSearchField
        placeholder="Search..."
        readOnly
        className="pointer-events-none"
      />
    ) : null}

    <div className="flex gap-3 overflow-x-auto pb-1">
      {[1, 2, 3, 4].map((item) => (
        <SkeletonBar key={item} className="h-11 w-24 flex-shrink-0 rounded-2xl" />
      ))}
    </div>

    <div className="space-y-6">
      {[1, 2, 3].map((group) => (
        <div key={group} className="space-y-3">
          <SkeletonBar className="h-5 w-36" />
          <SkeletonCard className="divide-y divide-gray-100">
            {[1, 2, 3].map((row) => (
              <div key={row} className="space-y-3 p-4">
                <SkeletonBar className="h-4 w-40" />
                <SkeletonBar className="h-3 w-56" />
              </div>
            ))}
          </SkeletonCard>
        </div>
      ))}
    </div>
  </div>
);

const ListLoading = ({ titleWidth = 'w-36', showSearch = true, showMetaCard = true }) => (
  <div className="mx-auto max-w-5xl space-y-5 pb-6">
    <div className="flex items-center gap-4">
      <SkeletonBar className="h-10 w-36 rounded-xl" />
    </div>

    {showMetaCard ? (
      <SkeletonCard className="px-4 py-3">
        <div className="flex items-center gap-2">
          <SkeletonBar className="h-4 w-4 rounded-full" />
          <SkeletonBar className="h-4 w-48" />
        </div>
      </SkeletonCard>
    ) : null}

    {showSearch ? (
      <BuyerSearchField
        placeholder="Search..."
        readOnly
        className="pointer-events-none"
      />
    ) : null}

    <SkeletonBar className={`h-4 ${titleWidth}`} />

    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4].map((item) => (
        <SkeletonCard key={item} className="overflow-hidden">
          <SkeletonBar className="h-44 rounded-none" />
          <div className="space-y-3 p-4">
            <SkeletonBar className="h-5 w-2/3" />
            <SkeletonBar className="h-4 w-1/2" />
            <SkeletonBar className="h-4 w-3/4" />
          </div>
        </SkeletonCard>
      ))}
    </div>
  </div>
);

const OrdersLoading = () => (
  <div className="mx-auto max-w-4xl space-y-5 pb-6">
    <div className="flex items-center gap-4">
      <SkeletonBar className="h-10 w-32 rounded-xl" />
    </div>

    <div className="flex gap-3">
      {[1, 2, 3].map((item) => (
        <SkeletonBar key={item} className="h-11 flex-1 rounded-2xl" />
      ))}
    </div>

    <SkeletonCard className="px-4 py-3 shadow-none">
      <div className="space-y-2">
        <SkeletonBar className="h-3 w-20" />
        <SkeletonBar className="h-4 w-44" />
      </div>
    </SkeletonCard>

    <div className="space-y-4">
      {[1, 2, 3].map((item) => (
        <SkeletonCard key={item} className="p-5">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <SkeletonBar className="h-5 w-40" />
                <SkeletonBar className="h-4 w-28" />
              </div>
              <SkeletonBar className="h-8 w-24 rounded-full" />
            </div>
            <SkeletonBar className="h-16 w-full" />
            <div className="flex gap-3">
              <SkeletonBar className="h-11 flex-1 rounded-xl" />
              <SkeletonBar className="h-11 flex-1 rounded-xl" />
            </div>
          </div>
        </SkeletonCard>
      ))}
    </div>
  </div>
);

const TrackingLoading = () => (
  <div className="mx-auto max-w-4xl space-y-5 pb-8">
    <div className="flex items-center justify-between gap-4">
      <SkeletonBar className="h-10 w-36 rounded-xl" />
      <SkeletonBar className="h-10 w-10 rounded-xl" />
    </div>

    {[1, 2].map((item) => (
      <SkeletonCard key={item} className="p-5">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2">
              <SkeletonBar className="h-4 w-24" />
              <SkeletonBar className="h-6 w-40" />
            </div>
            <SkeletonBar className="h-8 w-24 rounded-full" />
          </div>
          <SkeletonBar className="h-4 w-3/4" />
        </div>
      </SkeletonCard>
    ))}

    <SkeletonCard className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <SkeletonBar className="h-5 w-5 rounded-full" />
        <SkeletonBar className="h-5 w-32" />
      </div>
      <div className="space-y-5">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="flex gap-4">
            <div className="flex flex-col items-center">
              <SkeletonBar className="h-8 w-8 rounded-full" />
              {item !== 4 ? <SkeletonBar className="mt-2 h-12 w-px rounded-none" /> : null}
            </div>
            <div className="flex-1 space-y-2 pt-1">
              <SkeletonBar className="h-4 w-32" />
              <SkeletonBar className="h-3 w-56" />
            </div>
          </div>
        ))}
      </div>
    </SkeletonCard>

    <div className="grid gap-5 lg:grid-cols-2">
      {[1, 2].map((item) => (
        <SkeletonCard key={item} className="p-5">
          <div className="space-y-3">
            <SkeletonBar className="h-5 w-32" />
            <SkeletonBar className="h-4 w-full" />
            <SkeletonBar className="h-4 w-3/4" />
          </div>
        </SkeletonCard>
      ))}
    </div>

    <SkeletonCard className="p-5">
      <div className="mb-4 flex items-center gap-2">
        <SkeletonBar className="h-5 w-5 rounded-full" />
        <SkeletonBar className="h-5 w-32" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="flex items-start justify-between gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
            <div className="space-y-2">
              <SkeletonBar className="h-4 w-32" />
              <SkeletonBar className="h-3 w-16" />
            </div>
            <SkeletonBar className="h-4 w-20" />
          </div>
        ))}
      </div>
    </SkeletonCard>
  </div>
);

const ProfileLoading = () => (
  <div className="mx-auto max-w-4xl space-y-4 pb-6">
    <div className="flex items-center gap-4">
      <SkeletonBar className="h-10 w-28 rounded-xl" />
    </div>

    <SkeletonCard className="p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <SkeletonBar className="h-24 w-24 rounded-[20px]" />
        <div className="flex-1 space-y-2">
          <SkeletonBar className="h-4 w-24" />
          <SkeletonBar className="h-7 w-44" />
          <SkeletonBar className="h-4 w-52" />
        </div>
        <SkeletonBar className="h-11 w-32 rounded-xl" />
      </div>
    </SkeletonCard>

    <SkeletonCard className="p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="space-y-2">
            <SkeletonBar className="h-4 w-20" />
            <SkeletonBar className="h-12 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </SkeletonCard>

    <SkeletonCard className="overflow-hidden">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 last:border-0">
          <SkeletonBar className="h-10 w-10 rounded-xl" />
          <div className="flex-1 space-y-2">
            <SkeletonBar className="h-4 w-32" />
            <SkeletonBar className="h-3 w-40" />
          </div>
        </div>
      ))}
    </SkeletonCard>
  </div>
);

const SearchLoading = () => (
  <div className="mx-auto max-w-5xl space-y-5 pb-6">
    <div className="flex items-center gap-4">
      <SkeletonBar className="h-10 w-28 rounded-xl" />
    </div>

    <BuyerSearchField
      placeholder="Search for meals and restaurants"
      readOnly
      className="pointer-events-none"
    />

    <div className="flex gap-3 overflow-x-auto pb-1">
      {[1, 2, 3, 4].map((item) => (
        <SkeletonBar key={item} className="h-11 w-24 flex-shrink-0 rounded-2xl" />
      ))}
    </div>

    <div className="space-y-5">
      <SkeletonCard className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <SkeletonBar className="h-5 w-36" />
          <SkeletonBar className="h-4 w-20" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center gap-4">
              <SkeletonBar className="h-20 w-20 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <SkeletonBar className="h-4 w-1/2" />
                <SkeletonBar className="h-3 w-2/3" />
                <SkeletonBar className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </SkeletonCard>

      <SkeletonCard className="p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <SkeletonBar className="h-5 w-40" />
          <SkeletonBar className="h-4 w-28" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
              <SkeletonBar className="h-20 w-20 rounded-2xl" />
              <div className="flex-1 space-y-2">
                <SkeletonBar className="h-4 w-2/3" />
                <SkeletonBar className="h-3 w-1/2" />
                <SkeletonBar className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </SkeletonCard>
    </div>
  </div>
);

const CenteredLoading = () => (
  <div className="mx-auto flex min-h-[60vh] max-w-md items-center justify-center px-4">
    <SkeletonCard className="w-full p-6">
      <div className="space-y-4 text-center">
        <SkeletonBar className="mx-auto h-14 w-14 rounded-2xl" />
        <SkeletonBar className="mx-auto h-6 w-40" />
        <SkeletonBar className="mx-auto h-4 w-56" />
        <SkeletonBar className="mx-auto h-11 w-full rounded-xl" />
      </div>
    </SkeletonCard>
  </div>
);

const variantMap = {
  centered: CenteredLoading,
  detail: DetailLoading,
  home: HomeLoading,
  list: ListLoading,
  menu: () => <DetailLoading showTopImage showSearch titleWidth="w-52" />,
  orders: OrdersLoading,
  profile: ProfileLoading,
  restaurants: () => <ListLoading titleWidth="w-44" showSearch showMetaCard />,
  search: SearchLoading,
  tracking: TrackingLoading,
};

const BuyerPageLoading = ({ variant = 'home' }) => {
  const Component = variantMap[variant] || HomeLoading;
  return <Component />;
};

export default BuyerPageLoading;
