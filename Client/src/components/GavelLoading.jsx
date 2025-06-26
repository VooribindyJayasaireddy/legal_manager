import React from 'react';

const GavelLoading = ({ size = 'md', className = '' }) => {
  // Size mapping
  const sizeMap = {
    xs: { container: 'w-8 h-10', head: 'w-6 h-3', handle: 'w-2 h-8', base: 'w-10 h-2' },
    sm: { container: 'w-12 h-14', head: 'w-8 h-4', handle: 'w-3 h-10', base: 'w-14 h-3' },
    md: { container: 'w-16 h-20', head: 'w-12 h-5', handle: 'w-4 h-14', base: 'w-20 h-4' },
    lg: { container: 'w-20 h-24', head: 'w-16 h-6', handle: 'w-5 h-16', base: 'w-24 h-5' },
    xl: { container: 'w-24 h-28', head: 'w-20 h-7', handle: 'w-6 h-20', base: 'w-28 h-6' },
  };

  const sizes = sizeMap[size] || sizeMap['md'];

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`relative ${sizes.container}`}>
        {/* Gavel Head */}
        <div 
          className={`absolute bg-indigo-600 rounded ${sizes.head} left-1/2 -translate-x-1/2 origin-center animate-gavelHit`}
          style={{
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
        
        {/* Gavel Handle */}
        <div 
          className={`absolute bg-indigo-700 rounded-sm ${sizes.handle} left-1/2 -translate-x-1/2 top-1/4`}
          style={{
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
        
        {/* Base */}
        <div 
          className={`absolute bg-indigo-900 rounded ${sizes.base} left-1/2 -translate-x-1/2 bottom-0`}
          style={{
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        />
      </div>
      
      <style jsx global>{`
        @keyframes gavelHit {
          0%, 100% {
            transform: translateX(-50%) rotate(45deg);
          }
          50% {
            transform: translateX(-50%) rotate(35deg);
          }
        }
        .animate-gavelHit {
          animation: gavelHit 1s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default GavelLoading;
