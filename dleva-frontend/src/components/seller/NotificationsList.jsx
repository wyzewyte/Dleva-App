import SellerNotificationPanel from '../../modules/seller/components/SellerNotificationPanel';

function NotificationsList({ limit = 20 }) {
  return <SellerNotificationPanel limit={limit} />;
}

export default NotificationsList;
