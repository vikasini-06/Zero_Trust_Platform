import React from 'react';
import { getStatusBadgeStyle } from '../utils/permissions';

export const SecurityBadge = ({ status, size = 'md' }) => {
  const style = getStatusBadgeStyle(status);

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-mono font-medium border ${style.bg} ${style.text} ${style.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`} />
      {status}
    </span>
  );
};

export default SecurityBadge;
