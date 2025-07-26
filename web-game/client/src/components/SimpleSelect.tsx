import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
  icon?: string;
  description?: string;
  disabled?: boolean;
}

interface SimpleSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  className?: string;
  emptyMessage?: string;
}

const SimpleSelect: React.FC<SimpleSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "選択してください",
  label,
  className = "",
  emptyMessage = "選択肢がありません"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef<HTMLDivElement>(null);

  // デバッグログ
  console.log('🎛️ SimpleSelect props:', { value, options: options.length, placeholder });

  const selectedOption = options.find(opt => opt.value === value);
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: Option) => {
    if (!option.disabled) {
      console.log('🎛️ Option selected:', option);
      onChange(option.value);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      {/* Select Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-left focus:outline-none focus:border-blue-500 hover:border-gray-400 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <span className={`transform transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
            ▼
          </span>
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="検索..."
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Options */}
          <div>
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchTerm ? '該当する項目がありません' : emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  disabled={option.disabled}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors ${
                    option.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                  } ${value === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}`}
                >
                  <div className="flex items-center">
                    {option.icon && (
                      <span className="mr-3 text-lg">{option.icon}</span>
                    )}
                    <div>
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-sm text-gray-500">{option.description}</div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleSelect;