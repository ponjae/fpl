import { toPath } from '@fpl/utils';
import classNames from 'classnames';
import { useNavigate } from '../../routes';
import { Route } from '../../routes/types';
import './index.scss';

export type HyperlinkProps = {
  route: Route;
  params?: Record<string, string | number>;
  searchParam?: string;
  searchParams?: Record<string, string | number | undefined>;
  children: React.ReactNode;
  subtle?: boolean;
  onClick?: () => void;
};

const Hyperlink: React.FC<HyperlinkProps> = ({
  route,
  params,
  searchParam,
  searchParams,
  children,
  subtle = false,
  onClick,
}) => {
  const { navigate, navigateWithSearch } = useNavigate();

  const baseUrl = params ? toPath(route, params) : route;

  const queryParams = new URLSearchParams();
  if (searchParam) {
    queryParams.set('search', searchParam);
  }
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, val]) => {
      if (val !== undefined) {
        queryParams.set(key, String(val));
      }
    });
  }

  const queryString = queryParams.toString();
  const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (onClick) {
      onClick();
    } else {
      if (queryString) {
        navigateWithSearch(route, params, queryParams);
      } else {
        navigate(route, params);
      }
    }
  };

  return (
    <a
      href={url}
      className={classNames('hyperlink', {
        'no-decoration': subtle,
      })}
      role="button"
      onClick={handleClick}
    >
      {children}
    </a>
  );
};

export default Hyperlink;