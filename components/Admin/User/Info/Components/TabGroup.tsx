import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
  id: string;
  label: string;
  icon?: string;
  content: React.ReactNode;
}

interface TabGroupProps {
  tabs: Tab[];
  defaultActiveTab?: string;
  className?: string;
}

const TabGroup: React.FC<TabGroupProps> = ({ 
  tabs, 
  defaultActiveTab,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState(defaultActiveTab || (tabs.length > 0 ? tabs[0].id : ''));

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 30 },
    },
    exit: { opacity: 0, y: 10, transition: { duration: 0.2 } },
  };

  if (tabs.length === 0) return null;
  
  return (
    <div className={className}>
      <div className="flex border-b border-gray-200 mb-4 overflow-x-auto hide-scrollbar">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            className={`px-4 py-2 font-medium flex-shrink-0 ${
              activeTab === tab.id
                ? "text-green-800 border-b-2 border-green-800"
                : "text-gray-600 hover:text-green-700"
            }`}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ y: -1 }}
            whileTap={{ y: 0 }}
          >
            {tab.icon && <i className={`${tab.icon} mr-2`}></i>}
            {tab.label}
          </motion.button>
        ))}
      </div>
      
      <AnimatePresence mode="wait">
        {tabs.map((tab) => 
          activeTab === tab.id && (
            <motion.div
              key={tab.id}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={tabVariants}
            >
              {tab.content}
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};

export default TabGroup;