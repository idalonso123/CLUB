import React from 'react';
import { motion } from 'framer-motion';
import { PointPreset } from '@/types/points';

interface PointsPresetsProps {
  presets: PointPreset[];
  onSelectPreset: (value: number) => void;
  currentAdjustment: number;
}

const PointsPresets: React.FC<PointsPresetsProps> = ({
  presets,
  onSelectPreset,
  currentAdjustment
}) => {
  return (
    <div className="grid grid-cols-6 gap-2 mb-3">
      {presets.map(preset => (
        <motion.button
          key={preset.value}
          type="button"
          onClick={() => onSelectPreset(preset.value)}
          className={`py-1 ${preset.variant === 'danger' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} rounded text-sm font-medium ${
            currentAdjustment === preset.value ? 'ring-2 ring-offset-1 ring-gray-400' : ''
          }`}
          whileHover={{ scale: 1.05, backgroundColor: preset.variant === 'danger' ? "#fee2e2" : "#dcfce7" }}
          whileTap={{ scale: 0.95 }}
        >
          {preset.label}
        </motion.button>
      ))}
    </div>
  );
};

export default PointsPresets;