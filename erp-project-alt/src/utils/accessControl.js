// Centralised, case-insensitive access-control helpers shared across the
// sidebar, dashboard and route guards so the rules never drift apart.

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

export function isAdmin(user) {
  return Number(user?.is_admin) === 1 || normalize(user?.role) === 'admin';
}

export function hasFinanceAccess(user) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  const role = normalize(user.role);
  const dept = normalize(user.department);
  return role === 'finance' || role === 'chairman' || dept === 'finance' || dept === 'finance department';
}

export function hasFilesAccess(user) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  const role = normalize(user.role);
  const dept = normalize(user.department);
  return ['hr', 'chairman', 'finance', 'executive', 'gmd'].includes(role) || dept === 'admin';
}

export function hasUsersAccess(user) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  const role = normalize(user.role);
  const dept = normalize(user.department);
  return ['hr', 'gmd', 'chairman', 'finance'].includes(role) || dept === 'ict';
}
