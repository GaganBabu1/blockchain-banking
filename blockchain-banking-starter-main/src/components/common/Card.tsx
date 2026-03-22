/*
 * Card.tsx
 * A simple reusable card component for displaying content in a box.
 */

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

function Card({ children, title, className = '' }: CardProps) {
  return (
    <div className={`card ${className}`}>
      {title && <div className="card-header">{title}</div>}
      {children}
    </div>
  );
}

export default Card;
