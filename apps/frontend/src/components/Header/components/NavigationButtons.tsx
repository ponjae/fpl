// import { useNavigate } from '../../../routes';
// import { Routes, Route } from '../../../routes/types';
import Button from '../../Button';
import Text from '../../Text';

type NavigationButtonsProps = {
  onTeamButtonClick: () => void;
};

export const NAVIGATION_BUTTONS = [] as const;

export const NavigationButtons = ({
  onTeamButtonClick,
}: NavigationButtonsProps) => {
  // const { navigate } = useNavigate();
  //
  // const handleNavigation = (route: Route) => {
  //   return (event: React.MouseEvent) => {
  //     event.preventDefault();
  //     navigate(route);
  //   };
  // };

  return (
    <div>
      {NAVIGATION_BUTTONS.map(() => (
        <Button>
          <Text>Hej</Text>
        </Button>
      ))}
    </div>
  );
};

export default NavigationButtons;
