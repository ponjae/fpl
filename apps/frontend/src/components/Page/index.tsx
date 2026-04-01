import classNames from 'classnames';
import { ButtonProps } from '../Button';
import Text from '../Text';
import './index.scss';

export type PageHeaderProps = {
  title: string;
  caption?: string;
  actions?: React.ReactElement<ButtonProps>[];
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  caption,
  actions,
}) => {
  return (
    <div className="page-header-container">
      <div>
        <Text tagName="h1">{title}</Text>
        {caption && (
          <Text tagName="p" className="caption">
            {caption}
          </Text>
        )}
      </div>
      <div className="header">{actions}</div>
    </div>
  );
};

export type PageProps = {
  children: React.ReactNode[] | React.ReactNode;
  header?: React.ReactElement<PageHeaderProps>;
  padded?: boolean;
  singleColumn?: boolean;
  noScroll?: boolean;
};

const Page: React.FC<PageProps> = ({
  children,
  header,
  padded,
  singleColumn = false,
  noScroll = false,
}) => (
  <div
    className={classNames('page-container', {
      padded,
      'single-column': singleColumn,
      'no-scroll': noScroll,
    })}
  >
    {header}
    {children}
  </div>
);

export default Page;
