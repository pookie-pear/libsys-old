import React from 'react';

const Skeleton = ({ width, height, borderRadius = '12px', className = '' }) => {
  return (
    <div 
      className={`skeleton-loading ${className}`}
      style={{
        width: width || '100%',
        height: height || '20px',
        borderRadius,
        background: 'linear-gradient(90deg, var(--bg-card) 25%, var(--glass-border) 50%, var(--bg-card) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-pulse 1.5s infinite ease-in-out'
      }}
    />
  );
};

export const MediaCardSkeleton = () => {
  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid var(--glass-border)',
      marginBottom: '24px',
      breakInside: 'avoid'
    }}>
      <Skeleton height="350px" borderRadius="0" />
      <div style={{ padding: '16px' }}>
        <Skeleton width="80%" height="24px" className="mb-8" />
        <Skeleton width="60%" height="16px" className="mb-12" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <Skeleton width="40px" height="24px" borderRadius="12px" />
          <Skeleton width="40px" height="24px" borderRadius="12px" />
        </div>
      </div>
    </div>
  );
};

export default Skeleton;
