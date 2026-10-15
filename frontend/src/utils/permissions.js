export const hasRole = (user, ...allowedRoles) => {
  if (!user || !user.role) return false;
  const userRole = typeof user.role === 'string' ? user.role : user.role.name || user.roleName;
  if (userRole === 'Super Admin') return true;
  return allowedRoles.includes(userRole);
};

export const hasPermission = (user, requiredPermission) => {
  if (!user) return false;
  const userRole = typeof user.role === 'string' ? user.role : user.role?.name || user.roleName;
  if (userRole === 'Super Admin') return true;

  const permissions = user.permissions || user.role?.permissions || [];
  return permissions.includes(requiredPermission);
};

export const getRiskColor = (score) => {
  if (score <= 30) return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'LOW RISK' };
  if (score <= 70) return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: 'MEDIUM RISK' };
  return { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30', label: 'HIGH RISK' };
};

export const getStatusBadgeStyle = (status) => {
  switch (status?.toUpperCase()) {
    case 'TRUSTED':
    case 'ACTIVE':
    case 'APPROVED':
    case 'SUCCESS':
    case 'RESOLVED':
      return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' };
    case 'PENDING':
    case 'INVESTIGATING':
    case 'WARNING':
    case 'MEDIUM':
      return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', dot: 'bg-amber-400' };
    case 'BLOCKED':
    case 'REVOKED':
    case 'REJECTED':
    case 'FAILURE':
    case 'CRITICAL':
    case 'HIGH':
      return { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30', dot: 'bg-rose-400' };
    case 'SUSPICIOUS':
      return { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', dot: 'bg-orange-400' };
    default:
      return { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30', dot: 'bg-slate-400' };
  }
};
