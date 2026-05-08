import { Outlet } from 'react-router-dom';
import SellerAppChrome from '../modules/seller/components/SellerAppChrome';
import { useSellerPushNotifications } from '../modules/seller/hooks/useSellerPushNotifications';
import { SellerPageShell } from '../modules/seller/components/ui/SellerPrimitives';

const SellerLayout = () => {
  useSellerPushNotifications();

  return (
    <div className="min-h-screen bg-white">
      <SellerAppChrome />
      <main className="pt-[72px]">
        <SellerPageShell maxWidth="max-w-7xl" contentClassName="pt-4 sm:pt-5 md:pt-6">
          <Outlet />
        </SellerPageShell>
      </main>
    </div>
  );
};

export default SellerLayout;
