import React from 'react';
import { motion } from 'framer-motion';

interface TabItem {
  id: string;
  label: string;
  icon?: string;
}

interface TabNavProps {
  tabs: TabItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const TabNav: React.FC<TabNavProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = ""
}) => {
  return (
    <div className={`flex border-b border-gray-200 mb-4 overflow-x-auto hide-scrollbar ${className}`}>
      {tabs.map(tab => (
        <motion.button
          key={tab.id}
          className={`px-4 py-2 font-medium flex-shrink-0 ${
            activeTab === tab.id
              ? "text-green-800 border-b-2 border-green-800"
              : "text-gray-600 hover:text-green-700"
          }`}
          onClick={() => onTabChange(tab.id)}
          whileHover={{ y: -1 }}
          whileTap={{ y: 0 }}
          type="button"
        >
          {tab.icon && <i className={`${tab.icon} mr-2`}></i>}
          {tab.label}
        </motion.button>
      ))}
    </div>
  );
};

export default TabNav;