import React from "react";
import { motion } from "framer-motion";
import Link from 'next/link';
import { getTermsUrl } from '@/lib/utils/pageUtils';

interface TermsAndConditionsProps {
  formData: {
    terms: boolean;
  };
  errors: {
    terms?: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputVariants: any;
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ formData, errors, handleChange, inputVariants }) => {
  return (
    <>
      <motion.div className="flex items-center" variants={inputVariants}>
        <input
          id="terms"
          type="checkbox"
          name="terms"
          checked={formData.terms}
          onChange={handleChange}
          className={`h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded ${errors.terms ? 'border-green-500' : ''}`}
        />
        <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
          Acepto los{" "}
          <Link href={getTermsUrl()} target="_blank" rel="noopener noreferrer">
            <motion.span className="text-green-800 hover:text-green-700 font-medium cursor-pointer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              términos y condiciones
            </motion.span>
          </Link>
        </label>
      </motion.div>
      {errors.terms && <p className="text-green-500 text-xs italic -mt-2">{errors.terms}</p>}
    </>
  );
};

export default TermsAndConditions;