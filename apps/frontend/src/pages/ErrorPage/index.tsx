import React from 'react';
import HyperLink from '../../components/HyperLink';
import Text from '../../components/Text';
import { Routes } from '../../routes/types';
import './index.scss';

const ErrorPage: React.FC = () => {
  return (
    <div className="error-page">
      <Text tagName="h1" variant="error" className="error-title">
        404 - Page Not Found
      </Text>
      <Text tagName="p" variant="on-light" className="error-message">
        Sorry, the page you are looking for does not exist.
      </Text>
      <HyperLink route={Routes.Home} subtle>
        <Text className="home-link">Go back to Home</Text>
      </HyperLink>
    </div>
  );
};

export default ErrorPage;
