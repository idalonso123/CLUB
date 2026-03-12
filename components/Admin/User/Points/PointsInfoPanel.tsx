import React from 'react';

interface PointsInfoPanelProps {
  currentPoints: number;
  adjustment: number;
  newTotal: number;
}

const PointsInfoPanel: React.FC<PointsInfoPanelProps> = ({
  currentPoints,
  adjustment,
  newTotal
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-500">Puntos Actuales</p>
          <p className="text-xl font-bold">{currentPoints}</p>
        </div>
        <div className="h-8 border-r border-gray-300 mx-2"></div>
        <div>
          <p className="text-sm text-gray-500">Ajuste</p>
          <p className={`text-xl font-bold ${adjustment > 0 ? 'text-green-600' : adjustment < 0 ? 'text-red-600' : 'text-gray-500'}`}>
            {adjustment > 0 ? `+${adjustment}` : adjustment}
          </p>
        </div>
        <div className="h-8 border-r border-gray-300 mx-2"></div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Nuevos Puntos</p>
          <p className={`text-xl font-bold ${adjustment > 0 ? 'text-green-600' : adjustment < 0 ? 'text-red-600' : 'text-gray-700'}`}>
            {newTotal}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PointsInfoPanel;