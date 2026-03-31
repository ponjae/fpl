import React from 'react';
import './index.scss';

export type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  onClick,
}) => {
  const baseClassName = `button ${className}`.trim();

  return (
    <div className={baseClassName} onClick={onClick}>
      {children}
    </div>
  );
};

export default Button;
