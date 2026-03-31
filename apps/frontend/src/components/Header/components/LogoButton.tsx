// import Logo from '../../../assets/logo/logo.png';
import { Route } from '../../../routes/types';
import HyperLink from '../../HyperLink';
import Text from '../../Text';

export type BrandButtonProps = {
  route: Route;
};

export const BrandButton: React.FC<BrandButtonProps> = ({ route }) => {
  return (
    <HyperLink route={route} subtle>
      <div className="header">
        {/* <img src={Logo} height="32" alt="fpl-logo" /> */}
        <div className="application-name">
          <Text>Real FPL</Text>
        </div>
      </div>
    </HyperLink>
  );
};

export default BrandButton;
