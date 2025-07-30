import React, { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
  icon?: string;
  description?: string;
  disabled?: boolean;
}

interface ModernSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  label?: string;
  className?: string;
  emptyMessage?: string;
}

const ModernSelect: React.FC<ModernSelectProps> = ({
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
  const inputRef = useRef<HTMLInputElement>(null);

  // Debug: Check options received
  console.log('🎛️ ModernSelect received options:', options);
  console.log('🎛️ ModernSelect options count:', options.length);
  console.log('🎛️ ModernSelect current value:', value);

  const selectedOption = options.find(opt => opt.value === value);
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (opt.description && opt.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  console.log('🎛️ ModernSelect filtered options:', filteredOptions);

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

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option: Option) => {
    if (!option.disabled) {
      onChange(option.value);
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div ref={selectRef} className={`relative ${className}`}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '8px'
        }}>
          {label}
        </label>
      )}
      
      {/* Select Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '2px solid #e2e8f0',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          fontSize: '14px',
          textAlign: 'left'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#3b82f6';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.15)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)';
          }
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selectedOption?.icon && (
            <span style={{ fontSize: '16px' }}>{selectedOption.icon}</span>
          )}
          <span style={{ color: selectedOption ? '#1f2937' : '#9ca3af' }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <span style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
          color: '#6b7280'
        }}>
          ▼
        </span>
      </button>

      {/* Floating Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 50,
          marginTop: '4px',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
          border: '1px solid #e2e8f0',
          backdropFilter: 'blur(10px)',
          maxHeight: '300px',
          overflow: 'hidden'
        }}>
          {/* Search Input */}
          {options.length > 5 && (
            <div style={{ padding: '12px' }}>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="検索..."
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  background: '#f8fafc'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.background = 'white';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.background = '#f8fafc';
                }}
              />
            </div>
          )}

          {/* Options List */}
          <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
            {filteredOptions.length === 0 ? (
              <div style={{
                padding: '16px',
                textAlign: 'center',
                color: '#9ca3af',
                fontSize: '14px'
              }}>
                {searchTerm ? '該当する項目がありません' : emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  disabled={option.disabled}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: 'none',
                    background: 'transparent',
                    cursor: option.disabled ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    opacity: option.disabled ? 0.5 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (!option.disabled) {
                      e.currentTarget.style.background = '#f1f5f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {option.icon && (
                    <span style={{ fontSize: '16px', minWidth: '20px' }}>
                      {option.icon}
                    </span>
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>
                      {option.label}
                    </div>
                    {option.description && (
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginTop: '2px'
                      }}>
                        {option.description}
                      </div>
                    )}
                  </div>
                  {option.value === value && (
                    <span style={{ color: '#3b82f6', fontSize: '14px' }}>✓</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernSelect;