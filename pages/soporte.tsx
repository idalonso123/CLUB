'use client';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Head from 'next/head';
import { COMPANY_CONFIG } from '@/lib/config';

const SoportePage = () => {
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
    <>
      <Head>
        <title>Centro de Ayuda - {COMPANY_CONFIG.name}</title>
        <meta
          name="description"
          content="Contacta con nuestro equipo de soporte. Estamos aquí para ayudarte con cualquier consulta sobre tu cuenta, recompensas o carnets de mascota."
        />
      </Head>

      <motion.div
        className="max-w-4xl mx-auto p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.h1
          className="text-3xl font-bold text-green-800 mb-2 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Centro de Ayuda
        </motion.h1>
        
        <motion.p
          className="text-gray-600 text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          ¿Tienes alguna pregunta? Estamos aquí para ayudarte. Contáctanos a través de cualquiera de los métodos disponibles.
        </motion.p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna izquierda: Información de contacto */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="bg-green-50 p-6 rounded-lg shadow-sm h-full">
              <h2 className="text-xl font-semibold text-green-800 mb-4">
                <i className="fas fa-address-card mr-2"></i>
                Información de Contacto
              </h2>
              
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-start">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <i className="fas fa-envelope text-green-700"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Correo Electrónico:</p>
                      <p className="text-green-700 font-medium">{COMPANY_CONFIG.email.primary}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-start">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <i className="fas fa-phone text-green-700"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Teléfono:</p>
                      <p className="text-green-700 font-medium">{COMPANY_CONFIG.phone.prefix} {COMPANY_CONFIG.phone.main}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex items-start">
                    <div className="bg-green-100 p-2 rounded-full mr-3">
                      <i className="fas fa-clock text-green-700"></i>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Horario de Atención:</p>
                      <p className="text-green-700 font-medium">Lunes a Viernes: 9:00 - 18:00</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-green-100 rounded-lg">
                <p className="text-sm text-green-800">
                  <i className="fas fa-info-circle mr-2"></i>
                  <strong>Nota:</strong> Para una atención más rápida, incluye tu número de cliente en el mensaje si eres usuario registrado.
                </p>
              </div>
            </div>
          </motion.div>
          
          {/* Columna derecha: Formulario completo */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="bg-white p-6 rounded-lg shadow-md h-full">
              <h2 className="text-xl font-semibold text-green-800 mb-4">
                <i className="fas fa-paper-plane mr-2"></i>
                Formulario de Contacto
              </h2>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre Completo *
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      required
                      placeholder="Ej: María García"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Correo Electrónico *
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      required
                      placeholder="Ej: maria@ejemplo.com"
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
                        const value = e.target.value;
                        const regex = /^[0-9+\-() ]*$/;
                        if (regex.test(value) || value === '') {
                          setPhone(value);
                        }
                      }}
                      pattern="[0-9+\-() ]*"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                      placeholder="+34 XXX XXX XXX"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Mensaje *
                    </label>
                    <textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                      rows={5}
                      required
                      placeholder="Describe tu consulta o problema en detalle..."
                    />
                  </div>
                </div>
                
                {submitStatus === 'success' && (
                  <motion.div 
                    className="p-4 bg-green-50 text-green-700 rounded-lg text-sm mt-4 border border-green-200"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <i className="fas fa-check-circle mr-2"></i>
                    Mensaje enviado correctamente. Nos pondremos en contacto contigo pronto.
                  </motion.div>
                )}
                  
                {submitStatus === 'error' && (
                  <motion.div 
                    className="p-4 bg-red-50 text-red-700 rounded-lg text-sm mt-4 border border-red-200"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <i className="fas fa-exclamation-circle mr-2"></i>
                    Error al enviar el mensaje. Por favor, inténtalo de nuevo o contacta directamente por correo.
                  </motion.div>
                )}
                
                <motion.button
                  type="submit"
                  className="w-full p-3 bg-green-800 text-white rounded-lg hover:bg-green-900 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-70 mt-4 font-medium"
                  disabled={isSubmitting}
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando mensaje...
                    </span>
                  ) : (
                    <span>
                      <i className="fas fa-paper-plane mr-2"></i>
                      Enviar Mensaje
                    </span>
                  )}
                </motion.button>
              </form>
            </div>
          </motion.div>
        </div>

        {/* Sección de preguntas frecuentes */}
        <motion.div
          className="mt-12 bg-white p-6 rounded-lg shadow-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            <i className="fas fa-question-circle mr-2"></i>
            Preguntas Frecuentes
          </h2>
          
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-green-700 mb-2">¿Cómo puedo consultar mis puntos de fidelidad?</h3>
              <p className="text-gray-600 text-sm">Inicia sesión en tu cuenta y accede a la sección "Puntos Fidelidad" desde el menú principal. Allí podrás ver tu saldo actual y el historial de puntos.</p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-green-700 mb-2">¿Cómo registro el carné de mi mascota?</h3>
              <p className="text-gray-600 text-sm">Ve a la sección "Carnés Mascotas" desde tu cuenta. Allí encontrarás la opción de registrar una nueva mascota y obtener su carné digital.</p>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-green-700 mb-2">¿Cuánto tardan en responder a mi consulta?</h3>
              <p className="text-gray-600 text-sm">Normalmente respondemos en un plazo de 24-48 horas hábiles. Para consultas urgentes, te recomendamos llamar directamente a nuestro teléfono de atención al cliente.</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
};

export default SoportePage;
