import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import SliderContent from "@/components/Admin/MainPage/SliderContent";
import CardsContent from "@/components/Admin/MainPage/CardsContent";
import FeaturedContent from "@/components/Admin/MainPage/FeaturedContent";
import ContentModal from "@/components/Admin/MainPage/ContentModal";
import ConfirmDeleteModal from "@/components/Admin/MainPage/ConfirmDeleteModal";
import {
  SliderItem,
  InfoCard,
  FeaturedItem,
  ContentType,
} from "@/types/mainPage";

const MainPageSection: React.FC = () => {
  const [sliders, setSliders] = useState<SliderItem[]>([]);
  const [cards, setCards] = useState<InfoCard[]>([]);
  const [featuredItems, setFeaturedItems] = useState<FeaturedItem[]>([]);
  const [activeTab, setActiveTab] = useState<"slider" | "cards" | "featured">(
    "slider"
  );
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ContentType | null>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  
  // Estado para el modal de confirmación de eliminación
  const [confirmDeleteModalOpen, setConfirmDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{type: string; id: string; title?: string}>({type: "", id: ""});

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 100 },
    },
  };

  // Cargar datos desde la API
  useEffect(() => {
    setInitialLoading(true);
    fetch("/api/admin/mainpage")
      .then((res) => res.json())
      .then((data) => {
        setSliders(data.sliders || []);
        setCards(data.cards || []);
        setFeaturedItems(data.featured || []);
      })
      .catch((error) => {
        console.error("Error al cargar datos de la página principal:", error);
      })
      .finally(() => setInitialLoading(false));
  }, []);

  // Funciones CRUD
  const createItem = async (type: string, data: any) => {
    setLoading(true);
    await fetch("/api/admin/mainpage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data }),
    });
    reloadData();
  };

  const updateItem = async (type: string, id: any, data: any) => {
    setLoading(true);
    await fetch("/api/admin/mainpage", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, data }),
    });
    reloadData();
  };

  // Función para abrir el modal de confirmación de eliminación
  const confirmDelete = (type: string, id: any, title?: string) => {
    setItemToDelete({type, id, title});
    setConfirmDeleteModalOpen(true);
  };

  // Función para ejecutar la eliminación después de la confirmación
  const deleteItem = async (type: string, id: any) => {
    setLoading(true);
    await fetch("/api/admin/mainpage", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    });
    reloadData();
    setConfirmDeleteModalOpen(false);
  };
  
  // Función para manejar la confirmación de eliminación
  const handleConfirmDelete = async () => {
    const {type, id} = itemToDelete;
    await deleteItem(type, id);
  };

  const reloadData = () => {
    fetch("/api/admin/mainpage")
      .then((res) => res.json())
      .then((data) => {
        setSliders(data.sliders || []);
        setCards(data.cards || []);
        setFeaturedItems(data.featured || []);
      })
      .finally(() => setLoading(false));
  };

  // Mover elementos arriba/abajo
  const moveItem = (
    type: string,
    items: any[],
    index: number,
    direction: "up" | "down"
  ) => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === items.length - 1)
    )
      return;
    const newItems = [...items];
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    [newItems[index], newItems[swapIdx]] = [newItems[swapIdx], newItems[index]];
    newItems.forEach((item, idx) => (item.orden = idx));
    newItems.forEach((item) => updateItem(type, item.id, item));
  };

  // Gestión del modal
  const openModal = (type: ContentType, item?: any) => {
    setModalType(type);
    setEditItem(item || null);
    setModalOpen(true);

    // Inicializar formData según el tipo y si es edición
    if (item) {
      setFormData({ ...item });
    } else if (type === "slider") {
      setFormData({
        title: "",
        description: "",
        imageUrl: "",
        buttonText: "",
        buttonUrl: "",
        active: true,
      });
    } else if (type === "card") {
      setFormData({ title: "", content: "", iconClass: "", contactUrl: "", buttonText: "" });
    } else if (type === "featured") {
      setFormData({ title: "", description: "", imageUrl: "", url: "" });
    }
  };

  const closeModal = () => {
    setModalOpen(false);  
    setEditItem(null);
    setModalType(null);
  };

  const handleSave = async (type: string, data: any) => {
    if (editItem && editItem.id) {
      await updateItem(type, editItem.id, data);
    } else {
      await createItem(type, data);
    }
    closeModal();
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev: any) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleToggleActive = () => {
    setFormData((prev: any) => ({
      ...prev,
      active: !prev.active,
    }));
  };

  const renderContent = () => {
    if (activeTab === "slider") {
      return (
        <SliderContent
          sliders={sliders}
          openModal={openModal}
          updateItem={updateItem}
          deleteItem={confirmDelete}
          moveItem={moveItem}
        />
      );
    } else if (activeTab === "cards") {
      return (
        <CardsContent
          cards={cards}
          openModal={openModal}
          updateItem={updateItem}
          deleteItem={confirmDelete}
          moveItem={moveItem}
        />
      );
    } else {
      return (
        <FeaturedContent
          featuredItems={featuredItems}
          openModal={openModal}
          deleteItem={deleteItem}
        />
      );
    }
  };

  return (
    <div className="space-y-6">
      <motion.h1
        className="text-2xl font-bold text-green-800"
        variants={itemVariants}
      >
        Edición de Página Principal
      </motion.h1>

      <motion.div
        className="bg-white rounded-lg shadow-sm p-4"
        variants={itemVariants}
      >
        {initialLoading ? (
          <div className="text-center text-green-700 mt-4">
            Cargando datos iniciales...
          </div>
        ) : (
          <>
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab("slider")}
                  className={`py-2 px-3 border-b-2 ${
                    activeTab === "slider"
                      ? "border-green-700 text-green-800 font-medium"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <i className="fas fa-images mr-2"></i>
                  Slider Principal
                </button>
                <button
                  onClick={() => setActiveTab("cards")}
                  className={`py-2 px-3 border-b-2 ${
                    activeTab === "cards"
                      ? "border-green-700 text-green-800 font-medium"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <i className="fas fa-th-large mr-2"></i>
                  Tarjetas Informativas
                </button>{" "}
              </nav>
            </div>

            <div className="mt-4">{renderContent()}</div>
          </>
        )}
        {loading && (
          <div className="text-center text-green-700 mt-4">Procesando...</div>
        )}
      </motion.div>

      <ContentModal
        isOpen={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        modalType={modalType}
        editItem={editItem}
        formData={formData}
        onChange={handleFormChange}
        onToggleActive={handleToggleActive}
      />
      
      {/* Modal de confirmación para eliminar */}
      <ConfirmDeleteModal
        isOpen={confirmDeleteModalOpen}
        onClose={() => setConfirmDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemType={itemToDelete.type}
        itemTitle={itemToDelete.title}
      />
    </div>
  );
};

export default MainPageSection;
