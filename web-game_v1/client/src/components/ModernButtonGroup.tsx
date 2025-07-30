import React from 'react';

interface Option {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface ModernButtonGroupProps {
  options: Option[];
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  emptyMessage?: string;
  className?: string;
  columns?: 1 | 2 | 3 | 4;
}

const ModernButtonGroup: React.FC<ModernButtonGroupProps> = ({
  options,
  value,
  onChange,
  label,
  emptyMessage = "選択肢がありません",
  className = "",
  columns = 1
}) => {
  if (options.length === 0) {
    return (
      <div className={`${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-2xl mb-2">📭</div>
          <div className="text-sm">{emptyMessage}</div>
        </div>
      </div>
    );
  }

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-3">
          {label}
        </label>
      )}
      <div className={`grid ${gridCols[columns]} gap-3`}>
        {options.map((option) => {
          const isSelected = value === option.value;
          const isDisabled = option.disabled;
          
          return (
            <button
              key={option.value}
              onClick={() => !isDisabled && onChange(option.value)}
              disabled={isDisabled}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all duration-200 font-medium
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-md transform scale-105' 
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                }
                ${isDisabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'cursor-pointer hover:shadow-lg'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              
              <div className="text-sm font-bold mb-1">
                {option.label}
              </div>
              
              {option.description && (
                <div className="text-xs text-gray-600">
                  {option.description}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModernButtonGroup;