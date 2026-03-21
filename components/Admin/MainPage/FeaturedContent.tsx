import React from "react";
import { FeaturedItem } from "@/types/mainPage";

interface FeaturedContentProps {
  featuredItems: FeaturedItem[];
  openModal: (type: 'featured', item?: any) => void;
  deleteItem: (type: string, id: string) => void;
}

const FeaturedContent: React.FC<FeaturedContentProps> = ({
  featuredItems,
  openModal,
  deleteItem
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Productos Destacados</h2>
        <button 
          className="px-3 py-1 bg-green-700 text-white rounded-md hover:bg-green-800 flex items-center"
          onClick={() => openModal('featured')}
        >
          <i className="fas fa-plus mr-1"></i> Añadir Destacado
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {featuredItems.map((item) => (
          <div 
            key={item.id} 
            className="border border-gray-200 rounded-lg overflow-hidden hover:bg-gray-50 flex"
          >
            <div className="w-1/3">
              {item.imageUrl ? (
                <div className="h-full">
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg' }}
                  />
                </div>
              ) : (
                <div className="h-full bg-gray-200 flex items-center justify-center">
                  <i className="fas fa-image text-gray-400 text-3xl"></i>
                </div>
              )}
            </div>
            
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-medium text-lg">{item.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                <div className="text-xs">
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <i className="fas fa-link mr-1"></i>
                    <span>{item.url}</span>
                  </a>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-3">
                <button className="p-1 text-blue-600 hover:text-blue-800" onClick={() => openModal('featured', item)}>
                  <i className="fas fa-edit"></i>
                </button>
                <button className="p-1 text-red-600 hover:text-red-800" onClick={() => deleteItem('featured', item.id)}>
                  <i className="fas fa-trash-alt"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedContent;
