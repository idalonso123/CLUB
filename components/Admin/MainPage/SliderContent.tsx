import React from "react";
import { SliderItem } from "@/types/mainPage";

interface SliderContentProps {
  sliders: SliderItem[];
  openModal: (type: 'slider', item?: any) => void;
  updateItem: (type: string, id: string, data: any) => void;
  deleteItem: (type: string, id: string, title?: string) => void;
  moveItem: (type: string, items: any[], index: number, direction: 'up' | 'down') => void;
}

const SliderContent: React.FC<SliderContentProps> = ({
  sliders,
  openModal,
  updateItem,
  deleteItem,
  moveItem
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Slides del Carrusel</h2>
        <button 
          className="px-3 py-1 bg-green-700 text-white rounded-md hover:bg-green-800 flex items-center"
          onClick={() => openModal('slider')}
        >
          <i className="fas fa-plus mr-1"></i> Añadir Slide
        </button>
      </div>
      
      <div className="space-y-4">
        {sliders.map((slide, idx) => (
          <div 
            key={slide.id} 
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 flex flex-col md:flex-row gap-4"
          >
            <div className="w-full md:w-1/4">
              {slide.imageUrl ? (
                <div className="relative h-32 rounded-md overflow-hidden">
                  <img 
                    src={slide.imageUrl} 
                    alt={slide.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.jpg' }}
                  />
                </div>
              ) : (
                <div className="h-32 bg-gray-200 rounded-md flex items-center justify-center">
                  <i className="fas fa-image text-gray-400 text-3xl"></i>
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <h3 className="font-medium text-lg">{slide.title}</h3>
                <div className="flex items-center">
                  <span className={`mr-2 text-sm ${slide.active ? 'text-green-600' : 'text-red-600'}`}>
                    {slide.active ? 'Activo' : 'Inactivo'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={slide.active}
                      onChange={() => updateItem('slider', slide.id, { ...slide, active: !slide.active })}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>
              <p className="text-sm text-gray-600">{slide.description}</p>
              <div className="text-xs space-x-2">
                {slide.buttonText && slide.buttonText.trim() ? (
                  <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                    <i className="fas fa-link mr-1"></i>
                    <span>{slide.buttonText}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                    <i className="fas fa-font mr-1"></i>
                    <span>Sin texto</span>
                  </span>
                )}
                {slide.buttonUrl && slide.buttonUrl.trim() ? (
                  <a 
                    href={slide.buttonUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <i className="fas fa-external-link-alt mr-1"></i>
                    <span>{slide.buttonUrl}</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                    <i className="fas fa-link-slash mr-1"></i>
                    <span>Sin URL</span>
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex flex-row md:flex-col justify-end space-y-0 md:space-y-2 space-x-2 md:space-x-0">
              <button className="p-2 text-blue-600 hover:text-blue-800" onClick={() => openModal('slider', slide)}>
                <i className="fas fa-edit"></i>
              </button>
              <button className="p-2 text-red-600 hover:text-red-800" onClick={() => deleteItem('slider', slide.id, slide.title)}>
                <i className="fas fa-trash-alt"></i>
              </button>
              <div className="flex flex-col md:flex-row space-y-1 md:space-y-0 md:space-x-1">
                <button 
                  className={`p-2 ${idx === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-800'}`} 
                  onClick={() => idx !== 0 && moveItem('slider', sliders, idx, 'up')}
                  disabled={idx === 0}
                  aria-label="Mover hacia arriba"
                >
                  <i className="fas fa-arrow-up"></i>
                </button>
                <button 
                  className={`p-2 ${idx === sliders.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-800'}`} 
                  onClick={() => idx !== sliders.length - 1 && moveItem('slider', sliders, idx, 'down')}
                  disabled={idx === sliders.length - 1}
                  aria-label="Mover hacia abajo"
                >
                  <i className="fas fa-arrow-down"></i>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SliderContent;
