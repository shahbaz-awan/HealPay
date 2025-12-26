import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  showText = true,
  size = 'md' 
}) => {
  const sizes = {
    sm: { shield: 'w-8 h-8', text: 'text-xl' },
    md: { shield: 'w-12 h-12', text: 'text-3xl' },
    lg: { shield: 'w-16 h-16', text: 'text-4xl' },
    xl: { shield: 'w-24 h-24', text: 'text-6xl' }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Shield with Medical Cross */}
      <div className={`${sizes[size].shield} relative`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Shield Shape */}
          <path
            d="M50 5 L90 20 L90 45 Q90 75 50 95 Q10 75 10 45 L10 20 Z"
            fill="#2563EB"
            className="drop-shadow-lg"
          />
          {/* Medical Cross */}
          <g transform="translate(50, 50)">
            <rect x="-8" y="-20" width="16" height="40" rx="3" fill="white" />
            <rect x="-20" y="-8" width="40" height="16" rx="3" fill="white" />
          </g>
          {/* Smile Curve */}
          <path
            d="M 35 65 Q 50 75 65 65"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </div>
      
      {/* HealPay Text */}
      {showText && (
        <span className={`${sizes[size].text} font-bold text-blue-600`}>
          HealPay
        </span>
      )}
    </div>
  );
};

