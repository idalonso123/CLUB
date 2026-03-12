import React from 'react';
import { TypeOption, AdjustmentType } from '@/types/points';

interface TypeSelectorProps {
  value: AdjustmentType;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: TypeOption[];
}

const TypeSelector: React.FC<TypeSelectorProps> = ({
  value,
  onChange,
  options
}) => {
  const selectedOption = options.find(opt => opt.value === value) || options[0];
  
  return (
    <div>
      <label
        htmlFor="points-type"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Tipo de Ajuste
      </label>
      <div className="relative">
        <i className={`${selectedOption.icon} absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500`}></i>
        <select
          id="points-type"
          name="type"
          value={value}
          onChange={onChange}
          className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
          required
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TypeSelector;