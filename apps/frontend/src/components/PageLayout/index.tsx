import React from 'react';
import Footer from '../Footer';
import Header from '../Header';
import './index.scss';

export type PageLayoutProps = {
  children: React.ReactNode | React.ReactNode[];
};

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => (
  <div className="page-layout-container">
    <Header />
    <main className="main-content">{children}</main>
    <Footer />
  </div>
);

export default PageLayout;
