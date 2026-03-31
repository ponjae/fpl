import { toPath } from '@fpl/utils';
import classNames from 'classnames';
import { useNavigate } from '../../routes';
import { Route } from '../../routes/types';
import './index.scss';

export type HyperlinkProps = {
  route: Route;
  params?: Record<string, string | number>;
  searchParam?: string;
  children: React.ReactNode;
  subtle?: boolean;
  onClick?: () => void;
};

const Hyperlink: React.FC<HyperlinkProps> = ({
  route,
  params,
  searchParam,
  children,
  subtle = false,
  onClick,
}) => {
  const { navigate, navigateWithSearch } = useNavigate();

  const baseUrl = params ? toPath(route, params) : route;
  const url = searchParam ? `${baseUrl}?search=${searchParam}` : baseUrl;

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    if (onClick) {
      onClick();
    } else {
      searchParam
        ? navigateWithSearch(
            route,
            params,
            new URLSearchParams({ search: searchParam })
          )
        : navigate(route, params);
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
