import React from 'react';

// Definimos la interfaz para el contexto
export interface MainPageContextType {
  openAddSliderModal: () => void;
  openAddCardModal: () => void;
}

// Creamos el contexto con valores por defecto
export const MainPageContext = React.createContext<MainPageContextType>({
  openAddSliderModal: () => {},
  openAddCardModal: () => {}
});
