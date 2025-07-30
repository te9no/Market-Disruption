import React from 'react';

interface ModernButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: string;
  loading?: boolean;
  className?: string;
}

const ModernButton: React.FC<ModernButtonProps> = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  loading = false,
  className = ''
}) => {
  const getVariantStyles = () => {
    const variants = {
      primary: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        border: 'none',
        hoverBackground: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
      },
      secondary: {
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        color: '#374151',
        border: '2px solid #e2e8f0',
        hoverBackground: 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      },
      success: {
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        color: 'white',
        border: 'none',
        hoverBackground: 'linear-gradient(135deg, #047857 0%, #065f46 100%)',
        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
      },
      warning: {
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: 'white',
        border: 'none',
        hoverBackground: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
        boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
      },
      danger: {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: 'white',
        border: 'none',
        hoverBackground: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.3)'
      },
      ghost: {
        background: 'transparent',
        color: '#6b7280',
        border: '2px solid transparent',
        hoverBackground: 'rgba(0,0,0,0.05)',
        boxShadow: 'none'
      }
    };
    return variants[variant];
  };

  const getSizeStyles = () => {
    const sizes = {
      sm: { padding: '8px 16px', fontSize: '12px', minHeight: '36px' },
      md: { padding: '12px 24px', fontSize: '14px', minHeight: '44px' },
      lg: { padding: '16px 32px', fontSize: '16px', minHeight: '52px' }
    };
    return sizes[size];
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontWeight: '600',
    borderRadius: '12px',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    outline: 'none',
    position: 'relative',
    overflow: 'hidden',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.6 : 1,
    ...sizeStyles,
    ...variantStyles
  };

  return (
    <button
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      className={className}
      style={baseStyles}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = variantStyles.hoverBackground;
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `${variantStyles.boxShadow}, 0 8px 25px rgba(0,0,0,0.1)`;
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = variantStyles.background;
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = variantStyles.boxShadow;
        }
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
        }
      }}
    >
      {loading && (
        <div
          style={{
            width: '16px',
            height: '16px',
            border: '2px solid currentColor',
            borderTop: '2px solid transparent',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      )}
      {!loading && icon && (
        <span style={{ fontSize: size === 'sm' ? '14px' : size === 'lg' ? '20px' : '16px' }}>
          {icon}
        </span>
      )}
      {children}
      
      {/* Ripple Effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
          opacity: 0,
          pointerEvents: 'none',
          transition: 'opacity 0.3s ease'
        }}
      />
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </button>
  );
};

export default ModernButton;