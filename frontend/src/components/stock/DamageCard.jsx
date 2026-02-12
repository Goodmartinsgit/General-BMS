import React from 'react';
import { AlertTriangle, Package, Calendar, User, Warehouse, Eye } from 'lucide-react';
import { Card, Badge, Button } from '../ui';

/**
 * DamageCard Component
 * Display stock damage record in card format
 */
const DamageCard = ({
  damageData,
  onView,
  showActions = true,
  className = '',
}) => {
  const {
    damage_number,
    branch_name,
    damage_reason,
    notes,
    total_items,
    total_quantity,
    created_at,
    created_by_name,
  } = damageData;

  const damageReasonColors = {
    'Water Damage': 'text-blue-600',
    'Physical Damage': 'text-orange-600',
    'Manufacturing Defect': 'text-purple-600',
    'Expired Product': 'text-yellow-600',
    'Theft/Vandalism': 'text-red-600',
    'Handling Error': 'text-pink-600',
    'Storage Issue': 'text-teal-600',
    Other: 'text-gray-600',
  };

  const reasonColor = damageReasonColors[damage_reason] || 'text-gray-600';

  return (
    <Card
      hoverable
      onClick={() => onView(damageData)}
      className={className}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{damage_number}</h3>
            <p className="text-sm text-gray-600">{damage_reason}</p>
          </div>
        </div>

        <Badge variant="danger">Damage</Badge>
      </div>

      {/* Branch Info */}
      <div className="flex items-center gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
        <Warehouse className="w-5 h-5 text-gray-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-gray-500">Branch</p>
          <p className="font-medium text-gray-900">{branch_name}</p>
        </div>
      </div>

      {/* Damage Summary */}
      <div className="p-3 bg-red-50 rounded-lg mb-4 border border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">Damaged Units</p>
            <p className="text-2xl font-bold text-red-600">{total_quantity}</p>
            <p className="text-xs text-gray-600">{total_items} product(s)</p>
          </div>
          <Package className="w-10 h-10 text-red-600 opacity-50" />
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {/* Created */}
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-gray-600">
            Recorded: {new Date(created_at).toLocaleDateString()}
          </span>
        </div>

        {/* Created By */}
        {created_by_name && (
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600">Recorded by: {created_by_name}</span>
          </div>
        )}

        {/* Notes Preview */}
        {notes && (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
            <p className="line-clamp-2">{notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          <Button
            size="sm"
            variant="outline"
            icon={Eye}
            onClick={(e) => {
              e.stopPropagation();
              onView(damageData);
            }}
            className="flex-1"
          >
            View Details
          </Button>
        </div>
      )}
    </Card>
  );
};

export default DamageCard;
