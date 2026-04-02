const CART_SUMMARY_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const MENU_ROUTE_PREFIX = '/restaurant/';

export const shouldShowCartSummaryBar = (pathname, cartItems, lastAddedAt) => {
  if (!pathname || !Array.isArray(cartItems) || cartItems.length === 0) {
    return false;
  }

  if (!pathname.startsWith(MENU_ROUTE_PREFIX)) {
    return false;
  }

  if (!lastAddedAt) {
    return false;
  }

  const addedAtMs = new Date(lastAddedAt).getTime();
  if (Number.isNaN(addedAtMs)) {
    return false;
  }

  return Date.now() - addedAtMs < CART_SUMMARY_MAX_AGE_MS;
};
