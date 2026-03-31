// import { useCallback, useState } from 'react';
// import { useNavigate } from '../../routes';
import LogoButton from './components/LogoButton';
import { NavigationButtons } from './components/NavigationButtons';
import './index.scss';

const Header: React.FC = () => {
  // const { navigate } = useNavigate();

  // const onTeamSelected = useCallback(
  //   (team: string) => {
  //     navigate('/teams/:team', { team });
  //   },
  //   [navigate]
  // );

  return (
    <div className="header-container">
      <LogoButton route="/home" />
      <div className="actions">
        <NavigationButtons
          onTeamButtonClick={() => {
            // if (teams.length === 1) {
            //   onTeamSelected(teams[0]);
            // } else {
            //   setTeamVisible(true);
            // }
          }}
        />
      </div>
    </div>
  );
};

export default Header;
