
export const getUserStorageKey = (baseKey, userId) => {
  const id = userId || 'guest';
  return `${baseKey}_${id}`;
};


export const STORAGE_KEYS = {
  FAVORITES: 'favorites',
  FAVORITES_DETAIL: 'favoritesDetail',
  CART_DATA: 'cartData',
  USER_TOKEN: 'userToken',
  USER_INFO: 'userInfo',
};
