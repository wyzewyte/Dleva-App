/**
 * useLocation Hook - Easy access to location context
 * Use this hook in any component to access location functionality
 */

import { useContext } from 'react';
import LocationContext from '../context/LocationContext';

export const useLocation = () => {
  const context = useContext(LocationContext);

  if (!context) {
    throw new Error('useLocation must be used within LocationProvider');
  }

  return context;
};

export default useLocation;
