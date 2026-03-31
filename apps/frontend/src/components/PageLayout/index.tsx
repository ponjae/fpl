import Header from '../Header';
import './index.scss';

export type PageLayoutProps = {
  children: React.ReactElement | React.ReactElement[];
};

const PageLayout: React.FC<PageLayoutProps> = ({ children }) => (
  <>
    <Header />
    <div className="page-layout">{children}</div>
  </>
);

export default PageLayout;
