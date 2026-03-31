import React from 'react';
import cx from 'classnames';
import './index.scss';

export type TextProps = {
  variant?:
    | 'primary'
    | 'secondary'
    | 'tertiary'
    | 'on-light'
    | 'error'
    | 'success';
  children?: React.ReactNode;
  className?: string;
  tagName?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div';
};

export type TextAttributes = Omit<
  React.HTMLAttributes<
    HTMLHeadingElement | HTMLSpanElement | HTMLParagraphElement | HTMLDivElement
  >,
  keyof TextProps
>;

const Text: React.FC<TextProps & TextAttributes> = (props) => {
  const {
    variant = 'primary',
    className,
    tagName = 'div',
    children,
    ...other
  } = props;

  const classes = cx('text', variant, className);

  const Tag = tagName;
  return (
    <Tag {...other} className={classes}>
      {children}
    </Tag>
  );
};

export default Text;
