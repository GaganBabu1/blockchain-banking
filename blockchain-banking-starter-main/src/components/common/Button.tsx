/*
 * Button.tsx
 * A simple reusable button component with different variants.
 */

import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'normal' | 'small';
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'normal',
  disabled = false,
  className = '',
  style = {}
}: ButtonProps) {
  // Build class names based on props
  const classes = [
    'btn',
    `btn-${variant}`,
    size === 'small' ? 'btn-small' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
      style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer', ...style }}
    >
      {children}
    </button>
  );
}

export default Button;
