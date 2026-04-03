import React from 'react';

interface InputProps {
  id: string;
  label: string;
  type?: string;
  name: string;
  value: string | number | undefined;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  pattern?: string;
  title?: string;
  className?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({
  id,
  label,
  type = "text",
  name,
  value = "",
  onChange,
  required = false,
  autoComplete = "off",
  placeholder,
  pattern,
  title,
  className = "",
  error
}) => {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <input
        id={id}
        type={type}
        name={name}
        value={value || ""}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        pattern={pattern}
        title={title}
        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-500">
          <i className="fas fa-exclamation-triangle mr-1"></i>
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;