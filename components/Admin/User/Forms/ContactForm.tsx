import React from 'react';
import { motion } from 'framer-motion';
import Input from '@/components/Common/Forms/Input';
import { User } from '@/types/user';

interface ContactFormProps {
  formData: User;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
}

const ContactForm: React.FC<ContactFormProps> = ({
  formData,
  onChange
}) => {
  const formVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 30 }
    },
    exit: { opacity: 0, y: 10, transition: { duration: 0.2 } }
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={formVariants}
      className="grid grid-cols-1 gap-4 mb-6"
    >
      <Input
        id="edit-phone"
        label="Teléfono"
        type="tel"
        name="phone"
        value={formData.phone}
        onChange={onChange}
      />
      
      <Input
        id="edit-address"
        label="Dirección"
        name="address"
        value={formData.address}
        onChange={onChange}
      />
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          id="edit-city"
          label="Ciudad"
          name="city"
          value={formData.city}
          onChange={onChange}
        />
        
        <Input
          id="edit-postalCode"
          label="Código Postal"
          name="postalCode"
          value={formData.postalCode}
          onChange={onChange}
          pattern="[0-9]{5}"
          title="Código postal de 5 dígitos"
        />
      </div>
      
      <Input
        id="edit-country"
        label="País"
        name="country"
        value={formData.country}
        onChange={onChange}
      />
    </motion.div>
  );
};

export default ContactForm;