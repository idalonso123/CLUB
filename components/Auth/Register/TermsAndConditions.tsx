import React from "react";
import { motion } from "framer-motion";
import Link from 'next/link';
import { getTermsUrl } from '@/lib/utils/pageUtils';
import { SITE_CONFIG } from "@/lib/config";

interface TermsAndConditionsProps {
  formData: {
    terms: boolean;
    privacyPolicy: boolean;
  };
  errors: {
    terms?: string;
    privacyPolicy?: string;
  };
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inputVariants: any;
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ formData, errors, handleChange, inputVariants }) => {
  const termsUrl = getTermsUrl();
  const privacyPolicyUrl = SITE_CONFIG.external.privacyPolicy || '/politica-privacidad';

  return (
    <div className="space-y-3">
      {/* Checkbox de Términos y Condiciones */}
      <motion.div className="flex items-start" variants={inputVariants}>
        <div className="flex items-center h-5">
          <input
            id="terms"
            type="checkbox"
            name="terms"
            checked={formData.terms}
            onChange={handleChange}
            className={`h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer ${
              errors.terms ? 'border-green-500 ring-green-500' : ''
            }`}
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="terms" className="font-medium text-gray-700">
            Aceptación de Términos y Condiciones
          </label>
          <p className="text-gray-500">
            He leído y acepto los{" "}
            <Link href={termsUrl} target="_blank" rel="noopener noreferrer">
              <motion.span 
                className="text-green-700 hover:text-green-600 font-medium cursor-pointer underline"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                términos y condiciones
              </motion.span>
            </Link>{" "}
            del Club ViveVerde. Versión {SITE_CONFIG.legalVersions?.termsAndConditions || '1.0.0'}
          </p>
        </div>
      </motion.div>
      {errors.terms && (
        <p className="text-red-500 text-xs italic ml-9">
          {errors.terms}
        </p>
      )}

      {/* Checkbox de Política de Privacidad */}
      <motion.div className="flex items-start" variants={inputVariants}>
        <div className="flex items-center h-5">
          <input
            id="privacyPolicy"
            type="checkbox"
            name="privacyPolicy"
            checked={formData.privacyPolicy}
            onChange={handleChange}
            className={`h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded cursor-pointer ${
              errors.privacyPolicy ? 'border-red-500 ring-red-500' : ''
            }`}
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor="privacyPolicy" className="font-medium text-gray-700">
            Aceptación de Política de Privacidad
          </label>
          <p className="text-gray-500">
            He leído y acepto la{" "}
            <Link href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer">
              <motion.span 
                className="text-green-700 hover:text-green-600 font-medium cursor-pointer underline"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                política de privacidad
              </motion.span>
            </Link>{" "}
            y el tratamiento de mis datos personales conforme al RGPD. Versión {SITE_CONFIG.legalVersions?.privacyPolicy || '1.0.0'}
          </p>
        </div>
      </motion.div>
      {errors.privacyPolicy && (
        <p className="text-red-500 text-xs italic ml-9">
          {errors.privacyPolicy}
        </p>
      )}

      {/* Información adicional sobre GDPR */}
      <motion.div 
        className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4"
        variants={inputVariants}
      >
        <p className="text-xs text-gray-600">
          <strong className="text-gray-700">Información sobre protección de datos:</strong> Al marcar ambas casillas, consientes expresamente que Club ViveVerde trate tus datos personales para gestionar tu cuenta de socio y enviarte comunicaciones comerciales. Puedes ejercer tus derechos de acceso, rectificación, supresión y portabilidad contactando con nosotros. Más información en nuestra{" "}
          <Link href={privacyPolicyUrl} target="_blank" rel="noopener noreferrer">
            <span className="text-green-700 hover:text-green-600 underline cursor-pointer">
              política de privacidad
            </span>
          </Link>.
        </p>
      </motion.div>
    </div>
  );
};

export default TermsAndConditions;
