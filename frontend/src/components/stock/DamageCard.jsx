import React from 'react';
import { AlertTriangle, Package, Calendar, User, Warehouse, Eye } from 'lucide-react';

const REASON_COLORS = {
  'Water Damage': 'text-blue-500',
  'Physical Damage': 'text-orange-500',
  'Manufacturing Defect': 'text-purple-500',
  'Expired Product': 'text-yellow-500',
  'Theft/Vandalism': 'text-red-500',
  'Handling Error': 'text-pink-500',
  'Storage Issue': 'text-teal-500',
};

const DamageCard = ({ damageData, onView }) => {
  const {
    product_name,
    product_code,
    branch_name,
    damage_reason,
    damage_type,
    notes,
    quantity_damaged,
    estimated_loss,
    created_at,
    reported_by_name,
  } = damageData;

  const reason = damage_reason || damage_type || 'Other';
  const reasonColor = REASON_COLORS[reason] || 'text-theme-muted';

  return (
    <div
      onClick={() => onView(damageData)}
      className="bg-theme-secondary border border-theme rounded-xl shadow-theme-sm hover:shadow-theme-md transition-shadow cursor-pointer p-4 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-theme-primary text-sm leading-tight line-clamp-1">{product_name}</p>
            <p className={`text-xs font-medium mt-0.5 ${reasonColor}`}>{reason}</p>
          </div>
        </div>
        <span className="flex-shrink-0 px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded border border-red-500/20 uppercase">
          Damage
        </span>
      </div>

      {/* Product code */}
      {product_code && (
        <span className="self-start text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-accent-gold/10 text-accent-gold border border-accent-gold/20">
          {product_code}
        </span>
      )}

      {/* Branch */}
      <div className="flex items-center gap-2 p-2.5 bg-theme-tertiary rounded-lg">
        <Warehouse className="w-4 h-4 text-theme-muted flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[10px] text-theme-muted">Branch</p>
          <p className="text-sm font-medium text-theme-primary truncate">{branch_name}</p>
        </div>
      </div>

      {/* Quantity & Loss */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-[10px] text-theme-muted mb-0.5">Damaged Units</p>
          <p className="text-xl font-bold text-red-500">{quantity_damaged ?? 0}</p>
        </div>
        {estimated_loss > 0 && (
          <div className="p-2.5 bg-theme-tertiary rounded-lg">
            <p className="text-[10px] text-theme-muted mb-0.5">Est. Loss</p>
            <p className="text-sm font-bold text-red-500">${parseFloat(estimated_loss).toFixed(2)}</p>
          </div>
        )}
      </div>

      {/* Notes preview */}
      {notes && (
        <p className="text-xs text-theme-muted bg-theme-tertiary p-2 rounded line-clamp-2">{notes}</p>
      )}

      {/* Footer meta */}
      <div className="flex items-center justify-between pt-2 border-t border-theme text-xs text-theme-muted">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(created_at).toLocaleDateString()}</span>
        </div>
        {reported_by_name && (
          <div className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            <span className="truncate max-w-[100px]">{reported_by_name}</span>
          </div>
        )}
      </div>

      {/* View button */}
      <button
        onClick={e => { e.stopPropagation(); onView(damageData); }}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-theme-secondary bg-theme-tertiary border border-theme rounded-lg hover:bg-theme-secondary hover:text-theme-primary transition-colors"
      >
        <Eye className="w-3.5 h-3.5" />
        View Details
      </button>
    </div>
  );
};

export default DamageCard;
