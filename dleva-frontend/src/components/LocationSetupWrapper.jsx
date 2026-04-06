/**
 * Global location setup modal host.
 *
 * Keeps the modal mounted once and lets any buyer-facing screen
 * open it through the shared location context.
 */
import LocationContext from '../context/LocationContextObject';
import LocationSetupModal from '../modules/buyer/components/LocationSetupModal';

const LocationSetupWrapper = ({ children }) => {
  return (
    <LocationContext.Consumer>
      {(locationContext) => {
        const { locationSetupOpen, closeLocationSetup } = locationContext || {};

        return (
          <>
            {children}
            {locationSetupOpen ? (
              <LocationSetupModal
                isModal={true}
                onClose={closeLocationSetup}
              />
            ) : null}
          </>
        );
      }}
    </LocationContext.Consumer>
  );
};

export default LocationSetupWrapper;
