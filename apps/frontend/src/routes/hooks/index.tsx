import { useCallback } from 'react';
import { toPath } from '@fpl/utils';
import {
  NavigateOptions,
  useNavigate as useNav,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { Route } from '../types';

/**
 * Utility hook for typed navigation.
 */
export const useNavigate = () => {
  const nav = useNav();
  const params = useParams();
  const [searchParams] = useSearchParams();

  /**
   * Navigate function.
   */
  const navigate = useCallback(
    (
      route: Route,
      params: Record<string, string | number> = {},
      options?: NavigateOptions
    ) => {
      nav(toPath(route, params), options);
    },
    [nav]
  );

  const navigateWithSearch = useCallback(
    (
      route: Route,
      params: Record<string, string | number> = {},
      searchParams: URLSearchParams,
      options?: NavigateOptions
    ) => {
      let url = toPath(route, params);
      if (searchParams) {
        url = `${url}?${searchParams.toString()}`;
      }
      nav(url, options);
    },
    [nav]
  );

  const back = useCallback(() => {
    nav(-1);
  }, [nav]);

  /**
   * Variant of toPath but it only accepts our defined routes.
   */
  const toAppPath = toPath as (
    route: Route,
    params: Record<string, string | number>
  ) => string;

  return {
    back,
    navigate,
    navigateWithSearch,
    toAppPath,
    params,
    searchParams,
  };
};
