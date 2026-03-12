import React from "react";
import { InfoCard } from "@/types/mainPage";

interface CardsContentProps {
  cards: InfoCard[];
  openModal: (type: 'card', item?: any) => void;
  updateItem: (type: string, id: string, data: any) => void;
  deleteItem: (type: string, id: string, title?: string) => void;
  moveItem: (type: string, items: any[], index: number, direction: 'up' | 'down') => void;
}

const CardsContent: React.FC<CardsContentProps> = ({
  cards,
  openModal,
  updateItem,
  deleteItem,
  moveItem
}) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">Tarjetas Informativas</h2>
        <button 
          className="px-3 py-1 bg-green-700 text-white rounded-md hover:bg-green-800 flex items-center"
          onClick={() => openModal('card')}
        >
          <i className="fas fa-plus mr-1"></i> Añadir Tarjeta
        </button>
      </div>
      
      <div className="space-y-4">
        {cards.map((card, idx) => (
          <div 
            key={card.id} 
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 flex flex-col md:flex-row gap-4"
          >
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <i className={`fas ${card.iconClass} text-green-600 text-xl`}></i>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <h3 className="font-medium text-lg">{card.title}</h3>
                <div className="flex items-center">
                  <span className={`mr-2 text-sm ${card.active ? 'text-green-600' : 'text-red-600'}`}>
                    {card.active ? 'Activo' : 'Inactivo'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={card.active}
                      onChange={() => updateItem('card', card.id, { ...card, active: !card.active })}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              </div>
              <p className="text-sm text-gray-600">{card.content}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {card.contactUrl && card.contactUrl.trim() ? (
                  <a 
                    href={card.contactUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <i className="fas fa-link mr-1"></i>
                    <span>{card.contactUrl}</span>
                  </a>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-800 rounded-full">
                    <i className="fas fa-link-slash mr-1"></i>
                    <span>Sin URL</span>
                  </span>
                )}
                {card.buttonText && card.buttonText.trim() ? (
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    <i className="fas fa-tag mr-1"></i>
                    <span>{card.buttonText}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-800 rounded-full">
                    <i className="fas fa-font mr-1"></i>
                    <span>Sin texto</span>
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex flex-row md:flex-col justify-end space-y-0 md:space-y-2 space-x-2 md:space-x-0">
              <button className="p-2 text-blue-600 hover:text-blue-800" onClick={() => openModal('card', card)}>
                <i className="fas fa-edit"></i>
              </button>
              <button className="p-2 text-red-600 hover:text-red-800" onClick={() => deleteItem('card', card.id, card.title)}>
                <i className="fas fa-trash-alt"></i>
              </button>
              <div className="flex flex-col md:flex-row space-y-1 md:space-y-0 md:space-x-1">
                <button 
                  className={`p-2 ${idx === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-800'}`} 
                  onClick={() => idx !== 0 && moveItem('card', cards, idx, 'up')}
                  disabled={idx === 0}
                  aria-label="Mover hacia arriba"
                >
                  <i className="fas fa-arrow-up"></i>
                </button>
                <button 
                  className={`p-2 ${idx === cards.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-800'}`} 
                  onClick={() => idx !== cards.length - 1 && moveItem('card', cards, idx, 'down')}
                  disabled={idx === cards.length - 1}
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

export default CardsContent;
