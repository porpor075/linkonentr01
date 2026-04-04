import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  footer?: React.ReactNode;
}

export function Card({ children, title, className = '', footer }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {title && (
        <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px', color: 'var(--zoho-primary)' }}>
          {title}
        </h3>
      )}
      <div className="card-content">
        {children}
      </div>
      {footer && (
        <div className="card-footer" style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
          {footer}
        </div>
      )}
    </div>
  );
}

export function CardGrid({ children, cols = 2, gap = '1.5rem' }: { children: React.ReactNode, cols?: number, gap?: string }) {
  return (
    <div className={`grid grid-${cols}`} style={{ gap }}>
      {children}
    </div>
  );
}
