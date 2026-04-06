import OptionSelect from '../../../../components/ui/OptionSelect';

const RiderRangeFilter = ({
  label,
  value,
  options,
  onChange,
  showCustomInputs = false,
  startDate = '',
  endDate = '',
  onStartDateChange,
  onEndDateChange,
  className = '',
}) => {
  return (
    <div className={`relative z-20 w-full max-w-[180px] overflow-visible ${className}`.trim()}>
      <div className="space-y-3">
        {label ? <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">{label}</label> : null}
        <OptionSelect
          value={value}
          options={options}
          onChange={onChange}
          placeholder="Choose a filter"
        />

        {showCustomInputs ? (
          <div className="grid gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(event) => onStartDateChange?.(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-dark focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-gray-500">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(event) => onEndDateChange?.(event.target.value)}
                className="mt-1 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-dark focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default RiderRangeFilter;
