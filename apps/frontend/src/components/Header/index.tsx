import { Routes } from '../../routes/types';
import LogoButton from './components/LogoButton';
import { NavigationButtons } from './components/NavigationButtons';
import './index.scss';

const Header: React.FC = () => {
  return (
    <div className="header-container">
      <LogoButton route={Routes.Home} />
      <div className="actions">
        <NavigationButtons
          onTeamButtonClick={() => {}}
        />
      </div>
    </div>
  );
};

export default Header;
