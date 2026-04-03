import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  id: string;
  label: string;
  name: string;
  value: string | number | boolean | undefined;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  required?: boolean;
  className?: string;
  helpText?: string;
  error?: string;
}

const Select: React.FC<SelectProps> = ({
  id,
  label,
  name,
  value,
  onChange,
  options,
  required = false,
  className = "",
  helpText,
  error
}) => {
  // Convertir el valor a string para comparación en el select
  const stringValue = typeof value === 'boolean' 
    ? (value ? "1" : "0") 
    : String(value || "");

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <select
        id={id}
        name={name}
        value={stringValue}
        onChange={onChange}
        required={required}
        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helpText}</p>
      )}
      
      {error && (
        <p className="mt-1 text-sm text-red-500">
          <i className="fas fa-exclamation-triangle mr-1"></i>
          {error}
        </p>
      )}
    </div>
  );
};

export default Select;