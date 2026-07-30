import React from 'react';
import './index.scss';

export type PageSectionProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export const PageSection: React.FC<PageSectionProps> = ({
  title,
  subtitle,
  actions,
  children,
}) => {
  return (
    <section className="page-section">
      <div className="page-section__header">
        <div className="page-section__titles">
          <h2 className="page-section__title">{title}</h2>
          {subtitle && <p className="page-section__subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="page-section__actions">{actions}</div>}
      </div>
      <div className="page-section__content">{children}</div>
    </section>
  );
};

export default PageSection;