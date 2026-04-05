import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

const OptionSelect = ({
  value,
  options,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  error = false,
  emptyText = 'No options available',
  searchable = false,
  searchPlaceholder = 'Search options',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setQuery('');
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useEffect(() => {
    if (open && searchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open, searchable]);

  const selectedOption = options.find((option) => String(option.value) === String(value));
  const filteredOptions = useMemo(() => {
    if (!searchable || !query.trim()) {
      return options;
    }

    const normalizedQuery = query.trim().toLowerCase();
    return options.filter((option) => option.label.toLowerCase().includes(normalizedQuery));
  }, [options, query, searchable]);

  return (
    <div ref={containerRef} className="relative mt-1">
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((current) => {
            const nextOpen = !current;
            if (!nextOpen) {
              setQuery('');
            }
            return nextOpen;
          });
        }}
        className={`flex min-h-[48px] w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-all ${
          error
            ? 'border-red-300 bg-red-50 text-dark'
            : 'border-gray-200 bg-gray-50 text-dark hover:bg-white'
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
      >
        <span className={`truncate ${selectedOption ? 'text-dark' : 'text-muted'}`}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown size={18} className={`shrink-0 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_20px_45px_rgba(15,23,42,0.12)]">
          {searchable ? (
            <div className="border-b border-gray-100 px-3 py-3">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5">
                <Search size={15} className="shrink-0 text-muted" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent text-sm text-dark placeholder:text-muted focus:outline-none"
                />
              </div>
            </div>
          ) : null}

          {filteredOptions.length ? (
            <div className="max-h-64 overflow-y-auto py-2">
              {filteredOptions.map((option) => {
                const selected = String(option.value) === String(value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setQuery('');
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition-colors ${
                      selected ? 'bg-primary/5 text-dark' : 'text-dark hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {selected ? <Check size={16} className="shrink-0 text-primary" /> : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-3 text-sm text-muted">
              {searchable && query.trim() ? 'No matches found' : emptyText}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default OptionSelect;
