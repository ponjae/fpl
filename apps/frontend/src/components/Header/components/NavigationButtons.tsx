import { useLocation } from 'react-router-dom';
import { Routes, Route } from '../../../routes/types';
import Button from '../../Button';
import HyperLink from '../../HyperLink';
import Text from '../../Text';

type NavigationButtonsProps = {
  onTeamButtonClick: () => void;
};

export type NavigationItem = {
  label: string;
  route: Route;
};

export const NAVIGATION_BUTTONS: NavigationItem[] = [
  { label: 'Ranking', route: Routes.Ranking },
  { label: 'Best Team', route: Routes.BestTeam },
  { label: 'About', route: Routes.About },
];

export const NavigationButtons = ({
  onTeamButtonClick,
}: NavigationButtonsProps) => {
  const location = useLocation();

  return (
    <div className="navigation-buttons">
      {NAVIGATION_BUTTONS.map((item) => {
        const isActive = location.pathname === item.route;
        return (
          <HyperLink key={item.route} route={item.route} subtle>
            <Button className={isActive ? 'active' : ''}>
              <Text className="nav-text">{item.label}</Text>
            </Button>
          </HyperLink>
        );
      })}
    </div>
  );
};

export default NavigationButtons;
