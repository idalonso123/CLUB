import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: number;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onClose: (id: number) => void;
}

const NotificationSystem: React.FC<NotificationSystemProps> = ({ notifications, onClose }) => {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col space-y-2">
      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            className={`px-4 py-3 rounded-lg shadow-md ${
              notification.type === 'success' ? 'bg-green-800 text-white' :
              notification.type === 'error' ? 'bg-red-500 text-white' :
              'bg-blue-500 text-white'
            }`}
          >
            <div className="flex items-center">
              <span className="mr-2">
                {notification.type === 'success' && <i className="fas fa-check-circle"></i>}
                {notification.type === 'error' && <i className="fas fa-exclamation-circle"></i>}
                {notification.type === 'info' && <i className="fas fa-info-circle"></i>}
              </span>
              <p>{notification.message}</p>
              <button 
                onClick={() => onClose(notification.id)}
                className="ml-3 text-white opacity-70 hover:opacity-100"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationSystem;
