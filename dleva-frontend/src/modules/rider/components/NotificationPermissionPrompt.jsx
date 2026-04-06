import { Bell, BellOff } from 'lucide-react';
import riderPushNotifications from '../services/riderPushNotifications';
import {
  RiderCard,
  RiderPrimaryButton,
  RiderSecondaryButton,
} from './ui/RiderPrimitives';

const NotificationPermissionPrompt = ({
  permissionStatus,
  onPermissionChange,
  className = '',
}) => {
  const isBlocked = permissionStatus === 'denied';

  const handleEnable = async () => {
    const enabled = await riderPushNotifications.enable();
    onPermissionChange?.(enabled ? 'granted' : riderPushNotifications.getPermissionStatus());
  };

  if (permissionStatus === 'granted' || permissionStatus === 'unsupported') {
    return null;
  }

  return (
    <RiderCard className={`border-primary/15 bg-primary/5 p-4 sm:p-5 ${className}`.trim()}>
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-primary">
          {isBlocked ? <BellOff size={18} /> : <Bell size={18} />}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-dark sm:text-base">
            {isBlocked ? 'Turn notifications back on' : 'Allow rider notifications'}
          </h3>
          <p className="mt-1 text-sm leading-6 text-muted">
            {isBlocked
              ? 'Notifications are blocked for this browser. Turn them back on in your browser or app settings so you can receive delivery alerts.'
              : 'Allow notifications so you can get new delivery alerts, payout updates, and important rider messages immediately.'}
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            {!isBlocked ? (
              <RiderPrimaryButton onClick={handleEnable} className="sm:w-auto sm:px-5">
                Turn on notifications
              </RiderPrimaryButton>
            ) : (
              <RiderSecondaryButton
                type="button"
                onClick={() => onPermissionChange?.(riderPushNotifications.getPermissionStatus())}
                className="sm:w-auto sm:px-5"
              >
                I have turned it on
              </RiderSecondaryButton>
            )}
          </div>
        </div>
      </div>
    </RiderCard>
  );
};

export default NotificationPermissionPrompt;
