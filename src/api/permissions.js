/**
 * Who may do what. The UI uses can() to show/hide things; the api modules enforce the same rules
 * (requireUser / requireAdmin) so the UI is never the only line of defence.
 */
export const ROLES = ['guest', 'customer', 'admin'];

export const PERMISSIONS = [
  { key: 'browse',      label: 'Browse shop, search, view 360° products', roles: ['guest', 'customer', 'admin'] },
  { key: 'cart',        label: 'Add to bag, edit bag, apply coupon preview', roles: ['guest', 'customer', 'admin'] },
  { key: 'content',     label: 'Read policies, FAQ, contact the store',     roles: ['guest', 'customer', 'admin'] },
  { key: 'checkout',    label: 'Check out and pay',                         roles: ['customer', 'admin'] },
  { key: 'wishlist',    label: 'Save a wishlist',                           roles: ['customer', 'admin'] },
  { key: 'orders',      label: 'View own orders, track, cancel, re-order',  roles: ['customer', 'admin'] },
  { key: 'review',      label: 'Write product reviews',                     roles: ['customer', 'admin'] },
  { key: 'account',     label: 'Manage profile, addresses, password',       roles: ['customer', 'admin'] },
  { key: 'admin',       label: 'Open the admin console',                    roles: ['admin'] },
  { key: 'admin.products', label: 'Create / edit / delete products and stock', roles: ['admin'] },
  { key: 'admin.orders',   label: 'Manage every order and its status',      roles: ['admin'] },
  { key: 'admin.customers', label: 'View and disable customers',            roles: ['admin'] },
  { key: 'admin.coupons',  label: 'Manage coupons and store settings',      roles: ['admin'] }
];

export const roleOf = user => user?.role || 'guest';
export const can = (user, key) => !!PERMISSIONS.find(p => p.key === key)?.roles.includes(roleOf(user));
