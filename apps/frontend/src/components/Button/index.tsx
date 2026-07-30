import React from 'react';
import classNames from 'classnames';
import './index.scss';

export type ButtonProps = {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md';
};

const Button: React.FC<ButtonProps> = ({
  children,
  className = '',
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
}) => {
  const isButtonDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={classNames(
        'button',
        `button--${variant}`,
        `button--${size}`,
        {
          'button--loading': loading,
        },
        className
      )}
      onClick={isButtonDisabled ? undefined : onClick}
      disabled={isButtonDisabled}
    >
      {loading && <span className="button__spinner" aria-hidden="true" />}
      <span className="button__content">{children}</span>
    </button>
  );
};

export default Button;