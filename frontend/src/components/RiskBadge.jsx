import React from 'react';
import { getRiskColor } from '../utils/permissions';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

export const RiskBadge = ({ score = 0, showScore = true }) => {
  const risk = getRiskColor(score);

  const getIcon = () => {
    if (score <= 30) return <ShieldCheck className="w-3.5 h-3.5" />;
    if (score <= 70) return <AlertTriangle className="w-3.5 h-3.5" />;
    return <ShieldAlert className="w-3.5 h-3.5" />;
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-xs font-semibold border ${risk.bg} ${risk.text} ${risk.border}`}
    >
      {getIcon()}
      <span>{risk.label}</span>
      {showScore && <span className="opacity-80">({score}/100)</span>}
    </div>
  );
};

export default RiskBadge;
