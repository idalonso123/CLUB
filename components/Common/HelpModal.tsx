import React, { useState } from 'react';
import Modal from './Modal/Modal';
import { COMPANY_CONFIG } from '@/lib/config';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Enviar correo electrónico usando la API de Email
      const response = await fetch('/api/send-help-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          phone,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar el mensaje');
      }

      // Limpiar el formulario después de enviar
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setSubmitStatus('success');
      
    } catch (error) {
      console.error('Error al enviar el formulario de ayuda:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Centro de Ayuda" maxWidth="max-w-4xl">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna izquierda: Información de contacto */}
          <div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="text-lg font-semibold text-green-800 mb-3">Información de Contacto</h4>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-600">Correo Electrónico:</p>
                  <p className="text-green-700">{COMPANY_CONFIG.email.primary}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-600">Teléfono:</p>
                  <p className="text-green-700">{COMPANY_CONFIG.phone.prefix} {COMPANY_CONFIG.phone.main}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Columna derecha: Formulario completo */}
          <div>
            <h4 className="text-lg font-semibold text-green-800 mb-3">Formulario de Ayuda</h4>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Teléfono
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    // Solo permitir números y algunos caracteres especiales como + - ()
                    const value = e.target.value;
                    const regex = /^[0-9+\-() ]*$/;
                    if (regex.test(value) || value === '') {
                      setPhone(value);
                    }
                  }}
                  pattern="[0-9+\-() ]*"
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
                  required
                  placeholder="+34 XXX XXX XXX"
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:outline-none"
                  rows={2}
                  required
                  placeholder="Escribe tu consulta aquí..."
                />
              </div>
            </div>
            
            {submitStatus === 'success' && (
              <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm mt-4 success-message transition-opacity duration-300 opacity-100">
                Mensaje enviado correctamente. Nos pondremos en contacto contigo pronto.
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm mt-4">
                Error al enviar el mensaje. Por favor, inténtalo de nuevo o contacta directamente por correo.
              </div>
            )}
            
            <button
              type="submit"
              className="w-full p-2.5 bg-green-800 text-white rounded-md hover:bg-green-900 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:opacity-70 mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Enviando...
                </span>
              ) : (
                "Enviar Mensaje"
              )}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default HelpModal;
