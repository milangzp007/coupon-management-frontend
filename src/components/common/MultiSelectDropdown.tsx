import { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';

interface MultiSelectDropdownProps {
  options: readonly string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
}

export function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = 'Select options',
  label,
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<'bottom' | 'top'>('bottom');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && dropdownRef.current && menuRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const menuHeight = 240; // max-h-60 = 240px
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
        setPosition('top');
      } else {
        setPosition('bottom');
      }
    }
  }, [isOpen]);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const removeOption = (option: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((item) => item !== option));
  };

  const formatLabel = (option: string) => {
    return option.charAt(0).toUpperCase() + option.slice(1);
  };

  return (
    <div className="relative overflow-visible" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-300 mb-2">{label}</label>
      )}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white cursor-pointer focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all hover:border-slate-600"
      >
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2 flex-1 min-h-[24px]">
            {selected.length === 0 ? (
              <span className="text-slate-400">{placeholder}</span>
            ) : (
              selected.map((option) => (
                <span
                  key={option}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-sm rounded-md"
                >
                  {formatLabel(option)}
                  <button
                    type="button"
                    onClick={(e) => removeOption(option, e)}
                    className="hover:bg-blue-700 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
          />
        </div>
      </div>

      {isOpen && (
        <div
          ref={menuRef}
          className={`absolute z-[9999] w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl ${
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
          style={{
            maxHeight: '240px',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <div className="p-2 space-y-1">
            {options.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <div
                  key={option}
                  onClick={(e) => {
                    // Only toggle if click is not on the checkbox
                    if ((e.target as HTMLElement).tagName !== 'INPUT') {
                      toggleOption(option);
                    }
                  }}
                  className={`px-3 py-2 rounded-md cursor-pointer transition-colors flex-shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOption(option)}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-2 focus:ring-blue-500 flex-shrink-0 pointer-events-auto"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <span className="whitespace-nowrap">{formatLabel(option)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

