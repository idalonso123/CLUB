import React from 'react';

interface PointsSliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}

const PointsSlider: React.FC<PointsSliderProps> = ({
  value,
  min,
  max,
  step,
  onChange
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value));
  };

  return (
    <div className="mt-3">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
        <span>{min}</span>
        <span>-50</span>
        <span className="font-medium">0</span>
        <span>+50</span>
        <span>{max}</span>
      </div>
    </div>
  );
};

export default PointsSlider;