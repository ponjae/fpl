import React from 'react';
import { Routes, Route } from '../../routes/types';
import HyperLink from '../HyperLink';
import Text from '../Text';
import './index.scss';

export type FooterLink = {
  label: string;
  route: Route;
};

export const FOOTER_LINKS: FooterLink[] = [
  { label: 'Home', route: Routes.Home },
  { label: 'Ranking', route: Routes.Ranking },
  { label: 'Best Team', route: Routes.BestTeam },
  { label: 'About', route: Routes.About },
];

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="brand-section">
          <HyperLink route={Routes.Home} subtle>
            <Text className="footer-logo" variant="primary">
              Real FPL
            </Text>
          </HyperLink>
        </div>
        
        <div className="links-section">
          {FOOTER_LINKS.map((link) => (
            <HyperLink key={link.route} route={link.route} subtle>
              <Text className="footer-link" variant="secondary">
                {link.label}
              </Text>
            </HyperLink>
          ))}
        </div>
      </div>
      
      <div className="footer-bottom">
        <hr className="footer-divider" />
        <Text className="copyright" variant="tertiary">
          © {currentYear} Real FPL. All rights reserved.
        </Text>
      </div>
    </footer>
  );
};

export default Footer;