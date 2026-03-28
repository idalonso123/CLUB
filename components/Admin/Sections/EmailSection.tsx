'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import WysiwygEditor, { AVAILABLE_VARIABLES } from '../Common/WysiwygEditor';

// Función para sanitizar entrada de fecha y prevenir años de más de 4 dígitos
const sanitizeDateInput = (value: string): string => {
  // Solo permitir dígitos y guiones
  let sanitized = value.replace(/[^\d-]/g, '');
  
  // Si tiene más de 10 caracteres (AAAA-MM-DD = 10), truncar
  if (sanitized.length > 10) {
    sanitized = sanitized.substring(0, 10);
  }
  
  // Asegurar formato AAAA-MM-DD
  // Primero 4 dígitos son el año
  if (sanitized.length >= 4 && !sanitized.includes('-')) {
    sanitized = sanitized.substring(0, 4) + '-' + sanitized.substring(4);
  }
  
  // Limitar mes a 2 dígitos
  if (sanitized.length >= 7 && sanitized.split('-').length <= 2) {
    sanitized = sanitized.substring(0, 4) + '-' + sanitized.substring(4, 6) + '-' + sanitized.substring(6, 8);
  }
  
  return sanitized;
};

interface EmailTemplate {
  id: number;
  name: string;
  type: 'welcome' | 'newsletter' | 'promotion' | 'notification' | 'reminder' | 'birthday' | 'custom';
  subject: string;
  preheader: string | null;
  content: string;
  variables: string | null;
  styles: string | null;
  is_active: boolean;
  description: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
}

interface EmailCampaign {
  id: number;
  name: string;
  subject: string;
  preheader: string | null;
  content: string;
  type: 'newsletter' | 'promotion' | 'notification' | 'reminder' | 'birthday' | 'welcome' | 'segment' | 'automated';
  description: string | null;
  template_id: number;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'completed' | 'cancelled' | 'failed';
  segment_id: number | null;
  scheduled_at: string | null;
  filter_criteria: string | null;
  created_by: number;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
  total_recipients: number;
  total_sent: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_unsubscribed: number;
  open_rate: number;
  click_rate: number;
}

interface EmailSubscriber {
  id: number;
  email: string;
  name: string | null;
  user_id: number | null;
  status: 'active' | 'unsubscribed' | 'bounced';
  subscribed_at: string;
  unsubscribed_at: string | null;
}

interface EmailSegmentFilters {
  // Datos personales
  name_contains?: string;
  email_contains?: string;
  phone_contains?: string;
  cif_contains?: string;
  
  // Fechas de nacimiento
  birth_date_from?: string;
  birth_date_to?: string;
  
  // Fechas de registro
  registration_date_from?: string;
  registration_date_to?: string;
  
  // Puntos
  points_min?: number;
  points_max?: number;
  
  // Ventas y recompensas
  sales_amount_min?: number;
  sales_amount_max?: number;
  sales_days?: number;
  
  // Inactividad
  inactivity_days_min?: number;
  inactivity_days_max?: number;
  
  // Vivienda y animales
  housing_types?: string[];
  animal_types?: string[];
  
  // Rol
  rol?: string[];
  
  // Suscripción de email
  email_subscribed?: 'all' | 'subscribed' | 'unsubscribed';
}

interface EmailSegment {
  id: number;
  name: string;
  description: string | null;
  criteria: string | EmailSegmentFilters;
  is_active: boolean;
  created_by: number | null;
  created_at: string;
  updated_at: string;
}

interface EmailAutomation {
  id: number;
  name: string;
  trigger_type: 'signup' | 'purchase' | 'points_milestone' | 'birthday' | 'inactivity' | 'anniversary' | 'custom_date';
  trigger_config: string | null;
  template_id: number;
  delay_days: number;
  delay_hours: number;
  conditions: string | null;
  is_active: boolean;
  total_triggered: number;
  total_sent: number;
  created_by: number | null;
  created_at: string;
  updated_at: string;
  template_name?: string;
  template_subject?: string;
}

interface EmailStats {
  total_sent: number;
  total_delivered: number;
  total_opened: number;
  total_clicked: number;
  total_bounced: number;
  total_unsubscribed: number;
  open_rate: number;
  click_rate: number;
}

const EmailSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'templates' | 'campaigns' | 'subscribers' | 'segments' | 'automations'>('dashboard');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [segments, setSegments] = useState<EmailSegment[]>([]);
  const [automations, setAutomations] = useState<EmailAutomation[]>([]);
  const [loading, setLoading] = useState(true);

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [editingSegment, setEditingSegment] = useState<EmailSegment | null>(null);
  const [editingAutomation, setEditingAutomation] = useState<EmailAutomation | null>(null);

  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    preheader: '',
    content: '',
    type: 'newsletter' as EmailTemplate['type'],
    description: '',
    is_active: true
  });

  const [campaignForm, setCampaignForm] = useState({
    name: '',
    subject: '',
    preheader: '',
    content: '',
    type: 'newsletter' as EmailCampaign['type'],
    description: '',
    template_id: null as number | null,
    scheduled_at: '',
    segment_id: null as number | null
  });

  const [segmentForm, setSegmentForm] = useState({
    name: '',
    description: '',
    is_active: true,
    // Filtros estructurados para consulta dinámica
    filters: {
      // Datos personales
      name_contains: '',
      email_contains: '',
      phone_contains: '',
      cif_contains: '',
      // Fechas de nacimiento
      birth_date_from: '',
      birth_date_to: '',
      // Fechas de registro
      registration_date_from: '',
      registration_date_to: '',
      // Puntos
      points_min: undefined as number | undefined,
      points_max: undefined as number | undefined,
      // Ventas y recompensas
      sales_amount_min: undefined as number | undefined,
      sales_amount_max: undefined as number | undefined,
      sales_days: undefined as number | undefined,
      // Inactividad
      inactivity_days_min: undefined as number | undefined,
      inactivity_days_max: undefined as number | undefined,
      // Vivienda y animales
      housing_types: [] as string[],
      animal_types: [] as string[],
      // Rol
      rol: [] as string[],
      // Suscripción de email
      email_subscribed: 'all' as 'all' | 'subscribed' | 'unsubscribed',
    }
  });

  // Función para validar formato de fecha AAAA-MM-DD (año de exactamente 4 dígitos)
  const isValidDateFormat = (dateStr: string): boolean => {
    if (!dateStr || dateStr === '') return true; // Vacío es válido (opcional)
    
    // Verificar formato AAAA-MM-DD con año de exactamente 4 dígitos
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(dateStr)) return false;
    
    // Verificar que sea una fecha válida
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    
    // Verificar que el año tenga exactamente 4 dígitos (1000-9999)
    const year = parseInt(dateStr.substring(0, 4), 10);
    if (year < 1000 || year > 9999) return false;
    
    return true;
  };

  const resetSegmentForm = () => {
    setSegmentForm({
      name: '',
      description: '',
      is_active: true,
      filters: {
        name_contains: '',
        email_contains: '',
        phone_contains: '',
        cif_contains: '',
        birth_date_from: '',
        birth_date_to: '',
        registration_date_from: '',
        registration_date_to: '',
        points_min: undefined,
        points_max: undefined,
        sales_amount_min: undefined,
        sales_amount_max: undefined,
        sales_days: undefined,
        inactivity_days_min: undefined,
        inactivity_days_max: undefined,
        housing_types: [],
        animal_types: [],
        rol: [],
        email_subscribed: 'all',
      }
    });
  };

  // Opciones exactas del formulario de registro - Características de la vivienda
  const housingOptions = [
    'terraza',
    'balcón',
    'huerto',
    'césped',
    'jardín',
    'estanque',
    'marquesina',
    'piscina'
  ];

  // Opciones exactas del formulario de registro - Animales
  const animalOptions = [
    'sin animales',
    'perro(s)',
    'gato(s)',
    'pájaro(s)',
    'pez (peces)',
    'roedor(es)',
    'otros',
    'animales de corral'
  ];

  const [automationForm, setAutomationForm] = useState({
    name: '',
    trigger_type: 'signup' as EmailAutomation['trigger_type'],
    trigger_config: '',
    template_id: null as number | null,
    delay_days: 0,
    delay_hours: 0,
    conditions: '',
    is_active: true
  });

  // Estado para previsualización de segmentos dinámicos
  const [segmentPreview, setSegmentPreview] = useState<{
    count: number;
    preview: string;
    loading: boolean;
  }>({
    count: 0,
    preview: 'Todos los usuarios',
    loading: false
  });

  // Estado para almacenar el conteo de usuarios por segmento (para la lista de segmentos)
  const [segmentCounts, setSegmentCounts] = useState<Record<number, { count: number; loading: boolean }>>({});

  // Función para previsualizar el segmento antes de guardarlo
  const previewSegment = async () => {
    setSegmentPreview(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/email/segments/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: segmentForm.filters })
      });
      const data = await res.json();
      if (data.success) {
        setSegmentPreview({
          count: data.count,
          preview: data.preview,
          loading: false
        });
      } else {
        setSegmentPreview(prev => ({ ...prev, loading: false }));
      }
    } catch (error) {
      setSegmentPreview(prev => ({ ...prev, loading: false }));
    }
  };

  // Función para contar usuarios de un segmento específico
  const countSegmentUsers = async (segmentId: number) => {
    setSegmentCounts(prev => ({ ...prev, [segmentId]: { count: 0, loading: true } }));
    try {
      const res = await fetch(`/api/email/segments/${segmentId}/count`);
      const data = await res.json();
      if (data.success) {
        setSegmentCounts(prev => ({ ...prev, [segmentId]: { count: data.count, loading: false } }));
      } else {
        setSegmentCounts(prev => ({ ...prev, [segmentId]: { count: 0, loading: false } }));
      }
    } catch (error) {
      setSegmentCounts(prev => ({ ...prev, [segmentId]: { count: 0, loading: false } }));
    }
  };

  // Función para descargar usuarios de un segmento como CSV
  const downloadSegmentUsers = async (segment: EmailSegment) => {
    try {
      toast.loading('Descargando usuarios...', { id: 'download' });
      const res = await fetch(`/api/email/segments/${segment.id}/users?limit=10000`);
      const data = await res.json();
      
      if (data.success && data.users && data.users.length > 0) {
        // Crear CSV
        const headers = ['Código', 'Nombre', 'Apellidos', 'Email', 'Teléfono', 'Puntos', 'Fecha Registro'];
        const csvContent = [
          headers.join(';'),
          ...data.users.map((user: any) => [
            user.codigo,
            user.nombres || '',
            user.apellidos || '',
            user.mail || '',
            user.telefono || '',
            user.puntos,
            user.creado_en
          ].join(';'))
        ].join('\n');

        // Descargar archivo
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `segmento_${segment.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success(`Descargados ${data.users.length} usuarios`, { id: 'download' });
      } else if (data.success && (!data.users || data.users.length === 0)) {
        toast.error('No hay usuarios en este segmento', { id: 'download' });
      } else {
        toast.error(data.error || 'Error al obtener usuarios del segmento', { id: 'download' });
      }
    } catch (error) {
      console.error('Error al descargar usuarios:', error);
      toast.error('Error al descargar usuarios. Inténtalo de nuevo.', { id: 'download' });
    }
  };

  // Efecto para previsualizar cuando cambian los filtros
  useEffect(() => {
    const timer = setTimeout(() => {
      if (segmentForm.name || Object.values(segmentForm.filters).some(v => 
        v && (typeof v === 'string' ? v : (Array.isArray(v) ? v.length > 0 : true))
      )) {
        previewSegment();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [segmentForm.filters, segmentForm.name]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [templatesRes, campaignsRes, subscribersRes, segmentsRes, automationsRes] = await Promise.all([
        fetch('/api/email/templates'),
        fetch('/api/email/campaigns'),
        fetch('/api/email/subscribers'),
        fetch('/api/email/segments'),
        fetch('/api/email/automations')
      ]);

      const templatesData = await templatesRes.json();
      const campaignsData = await campaignsRes.json();
      const subscribersData = await subscribersRes.json();
      const segmentsData = await segmentsRes.json();
      const automationsData = await automationsRes.json();

      if (templatesData.success) setTemplates(templatesData.data);
      if (campaignsData.success) setCampaigns(campaignsData.data);
      if (subscribersData.success) setSubscribers(subscribersData.data);
      if (segmentsData.success) setSegments(segmentsData.data);
      if (automationsData.success) setAutomations(automationsData.data);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveTemplate = async () => {
    try {
      const url = editingTemplate
        ? `/api/email/templates/${editingTemplate.id}`
        : '/api/email/templates';
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm)
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingTemplate ? 'Plantilla actualizada' : 'Plantilla creada');
        setShowTemplateModal(false);
        setEditingTemplate(null);
        setTemplateForm({ name: '', subject: '', preheader: '', content: '', type: 'newsletter', description: '', is_active: true });
        fetchData();
      } else {
        toast.error(data.error || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error al guardar la plantilla');
    }
  };

  const handleSaveCampaign = async () => {
    try {
      const url = editingCampaign
        ? `/api/email/campaigns/${editingCampaign.id}`
        : '/api/email/campaigns';
      const method = editingCampaign ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignForm)
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingCampaign ? 'Campaña actualizada' : 'Campaña creada');
        setShowCampaignModal(false);
        setEditingCampaign(null);
        setCampaignForm({ name: '', subject: '', preheader: '', content: '', type: 'newsletter', description: '', template_id: null, scheduled_at: '', segment_id: null });
        fetchData();
      } else {
        toast.error(data.error || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error al guardar la campaña');
    }
  };

  const handleSaveSegment = async () => {
    // Validación: el nombre es obligatorio
    if (!segmentForm.name || segmentForm.name.trim() === '') {
      toast.error('⚠️ El nombre del segmento es obligatorio. Por favor, introduce un nombre para guardar el segmento.', {
        duration: 5000,
        style: {
          background: '#FEF2F2',
          color: '#991B1B',
          border: '1px solid #FECACA',
          padding: '16px',
        },
      });
      return;
    }

    // Validación de rangos de fechas y números
    const errors: string[] = [];

    // Validar que ambos campos de fecha de nacimiento estén preenchidos o ninguno
    const birthDateFromFilled = segmentForm.filters.birth_date_from && segmentForm.filters.birth_date_from.trim() !== '';
    const birthDateToFilled = segmentForm.filters.birth_date_to && segmentForm.filters.birth_date_to.trim() !== '';
    if (birthDateFromFilled !== birthDateToFilled) {
      errors.push('• El rango de fechas de nacimiento está incompleto: debe rellenar tanto la fecha "Desde" como la fecha "Hasta", o dejar ambas vacías.');
    }

    // Validar que ambos campos de fecha de registro estén preenchidos o ninguno
    const regDateFromFilled = segmentForm.filters.registration_date_from && segmentForm.filters.registration_date_from.trim() !== '';
    const regDateToFilled = segmentForm.filters.registration_date_to && segmentForm.filters.registration_date_to.trim() !== '';
    if (regDateFromFilled !== regDateToFilled) {
      errors.push('• El rango de fechas de registro está incompleto: debe rellenar tanto la fecha "Desde" como la fecha "Hasta", o dejar ambas vacías.');
    }

    // Validar formato de fechas de nacimiento
    if (segmentForm.filters.birth_date_from && !isValidDateFormat(segmentForm.filters.birth_date_from)) {
      errors.push('• El formato de la fecha de nacimiento "Desde" es incorrecto. Debe ser AAAA-MM-DD con un año de 4 dígitos (ej: 2000-01-15).');
    }
    if (segmentForm.filters.birth_date_to && !isValidDateFormat(segmentForm.filters.birth_date_to)) {
      errors.push('• El formato de la fecha de nacimiento "Hasta" es incorrecto. Debe ser AAAA-MM-DD con un año de 4 dígitos (ej: 2024-12-31).');
    }

    // Validar formato de fechas de registro
    if (segmentForm.filters.registration_date_from && !isValidDateFormat(segmentForm.filters.registration_date_from)) {
      errors.push('• El formato de la fecha de registro "Desde" es incorrecto. Debe ser AAAA-MM-DD con un año de 4 dígitos (ej: 2020-01-01).');
    }
    if (segmentForm.filters.registration_date_to && !isValidDateFormat(segmentForm.filters.registration_date_to)) {
      errors.push('• El formato de la fecha de registro "Hasta" es incorrecto. Debe ser AAAA-MM-DD con un año de 4 dígitos (ej: 2024-12-31).');
    }

    // Rango de fechas de nacimiento
    if (segmentForm.filters.birth_date_from && segmentForm.filters.birth_date_to) {
      if (segmentForm.filters.birth_date_to < segmentForm.filters.birth_date_from) {
        errors.push('• El rango de fechas de nacimiento es incorrecto: la fecha "Hasta" es anterior a la fecha "Desde". Por favor, corrige el rango de fechas de nacimiento.');
      }
    }

    // Rango de fechas de registro
    if (segmentForm.filters.registration_date_from && segmentForm.filters.registration_date_to) {
      if (segmentForm.filters.registration_date_to < segmentForm.filters.registration_date_from) {
        errors.push('• El rango de fechas de registro es incorrecto: la fecha "Hasta" es anterior a la fecha "Desde". Por favor, corrige el rango de fechas de registro.');
      }
    }

    // Rango de puntos
    const pointsMinVal = segmentForm.filters.points_min;
    const pointsMaxVal = segmentForm.filters.points_max;
    const pointsMinNum = typeof pointsMinVal === 'number' && !isNaN(pointsMinVal) ? pointsMinVal : null;
    const pointsMaxNum = typeof pointsMaxVal === 'number' && !isNaN(pointsMaxVal) ? pointsMaxVal : null;
    if (pointsMinNum !== null && pointsMaxNum !== null && pointsMaxNum < pointsMinNum) {
      errors.push('• El rango de puntos es incorrecto: el valor máximo es menor que el valor mínimo. Por favor, corrige el rango de puntos.');
    }

    // Rango de cifra de ventas
    const salesMinVal = segmentForm.filters.sales_amount_min;
    const salesMaxVal = segmentForm.filters.sales_amount_max;
    const salesMinNum = typeof salesMinVal === 'number' && !isNaN(salesMinVal) ? salesMinVal : null;
    const salesMaxNum = typeof salesMaxVal === 'number' && !isNaN(salesMaxVal) ? salesMaxVal : null;
    if (salesMinNum !== null && salesMaxNum !== null && salesMaxNum < salesMinNum) {
      errors.push('• El rango de cifra de ventas es incorrecto: el valor máximo es menor que el valor mínimo. Por favor, corrige el rango de cifra de ventas.');
    }

    // Rango de días de inactividad
    const inactMinVal = segmentForm.filters.inactivity_days_min;
    const inactMaxVal = segmentForm.filters.inactivity_days_max;
    const inactMinNum = typeof inactMinVal === 'number' && !isNaN(inactMinVal) ? inactMinVal : null;
    const inactMaxNum = typeof inactMaxVal === 'number' && !isNaN(inactMaxVal) ? inactMaxVal : null;
    if (inactMinNum !== null && inactMaxNum !== null && inactMaxNum < inactMinNum) {
      errors.push('• El rango de días de inactividad es incorrecto: el valor máximo es menor que el valor mínimo. Por favor, corrige el rango de días de inactividad.');
    }

    if (errors.length > 0) {
      const errorMessage = errors.length === 1
        ? `No se puede crear el segmento. Por favor, corrige el siguiente error:\n\n${errors[0]}`
        : `No se puede crear el segmento. Por favor, corrige los siguientes errores:\n\n${errors.join('\n\n')}`;

      toast.error(errorMessage, {
        duration: 8000,
        style: {
          background: '#FEF2F2',
          color: '#991B1B',
          border: '2px solid #DC2626',
          padding: '20px',
          whiteSpace: 'pre-line',
          fontSize: '14px',
          lineHeight: '1.6',
          maxWidth: '500px',
        },
      });
      return;
    }

    try {
      const url = editingSegment
        ? `/api/email/segments/${editingSegment.id}`
        : '/api/email/segments';
      const method = editingSegment ? 'PUT' : 'POST';

      // Preparar datos con filtros como JSON - usando 'filters' para coincidir con la base de datos
      const segmentData = {
        name: segmentForm.name,
        description: segmentForm.description,
        filters: segmentForm.filters,
        is_active: segmentForm.is_active
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(segmentData)
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingSegment ? 'Segmento actualizado' : 'Segmento creado');
        setShowSegmentModal(false);
        setEditingSegment(null);
        resetSegmentForm();
        fetchData();
      } else {
        toast.error(data.error || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error al guardar el segmento');
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;

    try {
      const res = await fetch(`/api/email/templates/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        toast.success('Plantilla eliminada');
        fetchData();
      } else {
        toast.error(data.error || 'Error al eliminar');
      }
    } catch (error) {
      toast.error('Error al eliminar la plantilla');
    }
  };

  const handleDeleteCampaign = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta campaña?')) return;

    try {
      const res = await fetch(`/api/email/campaigns/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        toast.success('Campaña eliminada');
        fetchData();
      } else {
        toast.error(data.error || 'Error al eliminar');
      }
    } catch (error) {
      toast.error('Error al eliminar la campaña');
    }
  };

  const handleDeleteSegment = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este segmento?')) return;

    try {
      const res = await fetch(`/api/email/segments/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        toast.success('Segmento eliminado');
        fetchData();
      } else {
        toast.error(data.error || 'Error al eliminar');
      }
    } catch (error) {
      toast.error('Error al eliminar el segmento');
    }
  };

  const handleSaveAutomation = async () => {
    try {
      const url = editingAutomation
        ? `/api/email/automations/${editingAutomation.id}`
        : '/api/email/automations';
      const method = editingAutomation ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(automationForm)
      });

      const data = await res.json();

      if (data.success) {
        toast.success(editingAutomation ? 'Automatización actualizada' : 'Automatización creada');
        setShowAutomationModal(false);
        setEditingAutomation(null);
        setAutomationForm({
          name: '',
          trigger_type: 'signup',
          trigger_config: '',
          template_id: null,
          delay_days: 0,
          delay_hours: 0,
          conditions: '',
          is_active: true
        });
        fetchData();
      } else {
        toast.error(data.error || 'Error al guardar');
      }
    } catch (error) {
      toast.error('Error al guardar la automatización');
    }
  };

  const handleDeleteAutomation = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta automatización?')) return;

    try {
      const res = await fetch(`/api/email/automations/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (data.success) {
        toast.success('Automatización eliminada');
        fetchData();
      } else {
        toast.error(data.error || 'Error al eliminar');
      }
    } catch (error) {
      toast.error('Error al eliminar la automatización');
    }
  };

  const openEditAutomation = (automation: EmailAutomation) => {
    setEditingAutomation(automation);
    setAutomationForm({
      name: automation.name,
      trigger_type: automation.trigger_type,
      trigger_config: automation.trigger_config || '',
      template_id: automation.template_id,
      delay_days: automation.delay_days,
      delay_hours: automation.delay_hours,
      conditions: automation.conditions || '',
      is_active: automation.is_active
    });
    setShowAutomationModal(true);
  };

  const handleSendCampaign = async (id: number) => {
    if (!confirm('¿Enviar esta campaña ahora?')) return;

    try {
      const res = await fetch(`/api/email/campaigns/${id}/send`, { method: 'POST' });
      const data = await res.json();

      if (data.success) {
        toast.success(`Campaña enviada. ${data.sent_count} correos enviados.`);
        fetchData();
      } else {
        toast.error(data.error || 'Error al enviar');
      }
    } catch (error) {
      toast.error('Error al enviar la campaña');
    }
  };

  const openEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      subject: template.subject,
      preheader: template.preheader || '',
      content: template.content,
      type: template.type,
      description: template.description || '',
      is_active: template.is_active
    });
    setShowTemplateModal(true);
  };

  const openEditCampaign = (campaign: EmailCampaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      name: campaign.name,
      subject: campaign.subject,
      preheader: campaign.preheader || '',
      content: campaign.content,
      type: campaign.type,
      description: campaign.description || '',
      template_id: campaign.template_id,
      scheduled_at: campaign.scheduled_at || '',
      segment_id: campaign.segment_id
    });
    setShowCampaignModal(true);
  };

  const openEditSegment = (segment: EmailSegment) => {
    setEditingSegment(segment);
    
    // El campo puede llamarse 'filters' o 'criteria' dependiendo de la base de datos
    const criteriaOrFilters = (segment as any).filters || (segment as any).criteria;
    
    // Parsear criterios si vienen como string
    let parsedCriteria: EmailSegmentFilters = {};
    if (criteriaOrFilters) {
      if (typeof criteriaOrFilters === 'string') {
        try {
          parsedCriteria = JSON.parse(criteriaOrFilters);
        } catch {
          // Si no es JSON válido, usar filtros vacíos
          parsedCriteria = {};
        }
      } else {
        parsedCriteria = criteriaOrFilters as EmailSegmentFilters;
      }
    }
    
    // Normalizar los valores para el formulario (convertir undefined/null a strings vacíos)
    const normalizedFilters = {
      name_contains: parsedCriteria.name_contains || '',
      email_contains: parsedCriteria.email_contains || '',
      phone_contains: parsedCriteria.phone_contains || '',
      cif_contains: parsedCriteria.cif_contains || '',
      birth_date_from: parsedCriteria.birth_date_from || '',
      birth_date_to: parsedCriteria.birth_date_to || '',
      registration_date_from: parsedCriteria.registration_date_from || '',
      registration_date_to: parsedCriteria.registration_date_to || '',
      points_min: parsedCriteria.points_min ?? undefined,
      points_max: parsedCriteria.points_max ?? undefined,
      sales_amount_min: parsedCriteria.sales_amount_min ?? undefined,
      sales_amount_max: parsedCriteria.sales_amount_max ?? undefined,
      sales_days: parsedCriteria.sales_days ?? undefined,
      inactivity_days_min: parsedCriteria.inactivity_days_min ?? undefined,
      inactivity_days_max: parsedCriteria.inactivity_days_max ?? undefined,
      housing_types: parsedCriteria.housing_types || [],
      animal_types: parsedCriteria.animal_types || [],
      rol: parsedCriteria.rol || [],
      email_subscribed: (parsedCriteria as any).email_subscribed || 'all',
    };
    
    setSegmentForm({
      name: segment.name,
      description: segment.description || '',
      is_active: segment.is_active,
      filters: normalizedFilters
    });
    setShowSegmentModal(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'sending': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Borrador';
      case 'scheduled': return 'Programada';
      case 'sending': return 'Enviando';
      case 'sent': return 'Enviada';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      case 'failed': return 'Fallida';
      default: return status;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'welcome': return 'bg-green-100 text-green-800';
      case 'newsletter': return 'bg-blue-100 text-blue-800';
      case 'promotion': return 'bg-purple-100 text-purple-800';
      case 'notification': return 'bg-yellow-100 text-yellow-800';
      case 'reminder': return 'bg-orange-100 text-orange-800';
      case 'birthday': return 'bg-pink-100 text-pink-800';
      case 'automated': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'welcome': return 'Bienvenida';
      case 'newsletter': return 'Boletín';
      case 'promotion': return 'Promoción';
      case 'notification': return 'Notificación';
      case 'reminder': return 'Recordatorio';
      case 'birthday': return 'Cumpleaños';
      case 'custom': return 'Personalizado';
      case 'segment': return 'Segmento';
      case 'automated': return 'Automatizado';
      default: return type;
    }
  };

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case 'signup': return 'Cuando alguien se registra';
      case 'purchase': return 'Cuando alguien compra';
      case 'birthday': return 'En su cumpleaños';
      case 'inactivity': return 'Cuando hay inactividad';
      case 'points_milestone': return 'Al alcanzar puntos';
      case 'anniversary': return 'En su aniversario';
      case 'custom_date': return 'Fecha personalizada';
      default: return trigger;
    }
  };

  const stats = {
    totalTemplates: templates.length,
    activeTemplates: templates.filter(t => t.is_active).length,
    totalCampaigns: campaigns.length,
    sentCampaigns: campaigns.filter(c => c.status === 'sent' || c.status === 'completed').length,
    totalSubscribers: subscribers.length,
    activeSubscribers: subscribers.filter(s => s.status === 'active').length,
    totalSegments: segments.length,
    activeSegments: segments.filter(s => s.is_active).length,
    totalAutomations: automations.length,
    activeAutomations: automations.filter(a => a.is_active).length
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Sistema de Correos</h1>
        <p className="text-gray-600 mt-2">Gestiona tus plantillas, campañas, suscriptores y automatizaciones de forma sencilla</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Panel Principal', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          )},
          { id: 'templates', label: 'Plantillas', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )},
          { id: 'campaigns', label: 'Campañas', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          )},
          { id: 'subscribers', label: 'Suscriptores', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          )},
          { id: 'segments', label: 'Segmentos', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          )},
          { id: 'automations', label: 'Automatizaciones', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          )}
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow'
                : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Plantillas Activas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeTemplates}</p>
                <p className="text-xs text-gray-500 mt-1">de {stats.totalTemplates} totales</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-xl">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Campañas Enviadas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.sentCampaigns}</p>
                <p className="text-xs text-gray-500 mt-1">de {stats.totalCampaigns} totales</p>
              </div>
              <div className="bg-green-100 p-4 rounded-xl">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Suscriptores Activos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeSubscribers}</p>
                <p className="text-xs text-gray-500 mt-1">de {stats.totalSubscribers} totales</p>
              </div>
              <div className="bg-purple-100 p-4 rounded-xl">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Segmentos Activos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeSegments}</p>
                <p className="text-xs text-gray-500 mt-1">de {stats.totalSegments} totales</p>
              </div>
              <div className="bg-orange-100 p-4 rounded-xl">
                <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Automatizaciones Activas</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeAutomations}</p>
                <p className="text-xs text-gray-500 mt-1">de {stats.totalAutomations} totales</p>
              </div>
              <div className="bg-yellow-100 p-4 rounded-xl">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Templates */}
      {activeTab === 'templates' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Plantillas de Correo</h2>
              <p className="text-sm text-gray-500 mt-1">Crea y gestiona las plantillas que usarás en tus campañas</p>
            </div>
            <button
              onClick={() => {
                setEditingTemplate(null);
                setTemplateForm({ name: '', subject: '', preheader: '', content: '', type: 'newsletter', description: '', is_active: true });
                setShowTemplateModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nueva Plantilla
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-gray-500 text-center py-8">Cargando...</p>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 mb-4">No hay plantillas creadas todavía</p>
                <button
                  onClick={() => {
                    setEditingTemplate(null);
                    setTemplateForm({ name: '', subject: '', preheader: '', content: '', type: 'newsletter', description: '', is_active: true });
                    setShowTemplateModal(true);
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear tu primera plantilla
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(template => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900">{template.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(template.type)}`}>
                        {getTypeLabel(template.type)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{template.subject}</p>
                    {template.description && (
                      <p className="text-xs text-gray-500 mb-3">{template.description}</p>
                    )}
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {template.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                      <div className="flex space-x-3">
                        <button onClick={() => openEditTemplate(template)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
                        <button onClick={() => handleDeleteTemplate(template.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Eliminar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Campañas de Correo</h2>
              <p className="text-sm text-gray-500 mt-1">Crea y envía campañas a tus suscriptores</p>
            </div>
            <button
              onClick={() => {
                setEditingCampaign(null);
                setCampaignForm({ name: '', subject: '', preheader: '', content: '', type: 'newsletter', description: '', template_id: null, scheduled_at: '', segment_id: null });
                setShowCampaignModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nueva Campaña
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-gray-500 text-center py-8">Cargando...</p>
            ) : campaigns.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-gray-500 mb-4">No hay campañas creadas todavía</p>
                <button
                  onClick={() => {
                    setEditingCampaign(null);
                    setCampaignForm({ name: '', subject: '', preheader: '', content: '', type: 'newsletter', description: '', template_id: null, scheduled_at: '', segment_id: null });
                    setShowCampaignModal(true);
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear tu primera campaña
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {campaigns.map(campaign => (
                  <div key={campaign.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{campaign.name}</h3>
                        <p className="text-sm text-gray-600">{campaign.subject}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {getStatusLabel(campaign.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Enviados</p>
                        <p className="font-bold text-gray-900">{campaign.total_sent}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Abiertos</p>
                        <p className="font-bold text-gray-900">{campaign.total_opened}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Clics</p>
                        <p className="font-bold text-gray-900">{campaign.total_clicked}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs text-gray-500">Tasa Apertura</p>
                        <p className="font-bold text-gray-900">{campaign.open_rate.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        Creada: {new Date(campaign.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-2">
                        {campaign.status === 'draft' || campaign.status === 'scheduled' ? (
                          <button onClick={() => handleSendCampaign(campaign.id)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 font-medium">
                            Enviar Ahora
                          </button>
                        ) : null}
                        <button onClick={() => openEditCampaign(campaign)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
                        <button onClick={() => handleDeleteCampaign(campaign.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Eliminar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Subscribers */}
      {activeTab === 'subscribers' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Suscriptores</h2>
            <p className="text-sm text-gray-500 mt-1">Personas que han aceptado recibir tus correos</p>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-gray-500 text-center py-8">Cargando...</p>
            ) : subscribers.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-gray-500">No hay suscriptores todavía</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo electrónico</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de suscripción</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {subscribers.map(subscriber => (
                      <tr key={subscriber.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{subscriber.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{subscriber.name || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            subscriber.status === 'active' ? 'bg-green-100 text-green-800' :
                            subscriber.status === 'unsubscribed' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {subscriber.status === 'active' ? 'Activo' : subscriber.status === 'unsubscribed' ? 'Dado de baja' : 'Rebotado'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(subscriber.subscribed_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Segments */}
      {activeTab === 'segments' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Segmentos</h2>
              <p className="text-sm text-gray-500 mt-1">Grupos de suscriptores basados en criterios específicos</p>
            </div>
            <button
              onClick={() => {
                setEditingSegment(null);
                resetSegmentForm();
                setShowSegmentModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nuevo Segmento
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-gray-500 text-center py-8">Cargando...</p>
            ) : segments.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                <p className="text-gray-500 mb-4">No hay segmentos creados todavía</p>
                <button
                  onClick={() => {
                    setEditingSegment(null);
                    resetSegmentForm();
                    setShowSegmentModal(true);
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear tu primer segmento
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {segments.map(segment => (
                  <div key={segment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900">{segment.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${segment.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {segment.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    {segment.description && (
                      <p className="text-sm text-gray-600 mb-3">{segment.description}</p>
                    )}
                    
                    {/* Contador de usuarios */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 mb-3 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Usuarios:</span>
                          {segmentCounts[segment.id]?.loading ? (
                            <span className="text-sm text-blue-600 animate-pulse">Calculando...</span>
                          ) : segmentCounts[segment.id]?.count !== undefined ? (
                            <span className="text-lg font-bold text-blue-600">
                              {segmentCounts[segment.id].count.toLocaleString('es-ES')}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">No calculado</span>
                          )}
                        </div>
                        <button
                          onClick={() => countSegmentUsers(segment.id)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                          title="Contar número de usuarios"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Contar
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <span className="inline-flex items-center justify-center w-4 h-4 bg-blue-500 text-white rounded-full text-[10px] font-bold cursor-help" title="Este botón realiza una consulta en tiempo real a la base de datos para contar el número exacto de usuarios que coinciden con los filtros del segmento. El número se actualiza cada vez que lo pulses.">
                          i
                        </span>
                        Consulta en tiempo real
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        Segmento dinámico
                      </span>
                      <div className="flex space-x-3 items-center">
                        <button
                          onClick={() => downloadSegmentUsers(segment)}
                          className="flex items-center gap-1 text-green-600 hover:text-green-800 text-sm font-medium"
                          title="Descargar lista de usuarios"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Descargar
                        </button>
                        <button onClick={() => openEditSegment(segment)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
                        <button onClick={() => handleDeleteSegment(segment.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Eliminar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Automations */}
      {activeTab === 'automations' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Automatizaciones</h2>
              <p className="text-sm text-gray-500 mt-1">Emails que se envían automáticamente según eventos</p>
            </div>
            <button
              onClick={() => {
                setEditingAutomation(null);
                setAutomationForm({
                  name: '',
                  trigger_type: 'signup',
                  trigger_config: '',
                  template_id: null,
                  delay_days: 0,
                  delay_hours: 0,
                  conditions: '',
                  is_active: true
                });
                setShowAutomationModal(true);
              }}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nueva Automatización
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <p className="text-gray-500 text-center py-8">Cargando...</p>
            ) : automations.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <p className="text-gray-500 mb-4">No hay automatizaciones creadas todavía</p>
                <button
                  onClick={() => {
                    setEditingAutomation(null);
                    setAutomationForm({
                      name: '',
                      trigger_type: 'signup',
                      trigger_config: '',
                      template_id: null,
                      delay_days: 0,
                      delay_hours: 0,
                      conditions: '',
                      is_active: true
                    });
                    setShowAutomationModal(true);
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Crear tu primera automatización
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {automations.map(automation => (
                  <div key={automation.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-gray-900">{automation.name}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${automation.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {automation.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    
                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-blue-800 font-medium">
                        <span className="text-blue-600">Evento:</span> {getTriggerLabel(automation.trigger_type)}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {(automation.delay_days > 0 || automation.delay_hours > 0) && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                          Esperar: {automation.delay_days > 0 ? `${automation.delay_days} días` : ''} {automation.delay_hours > 0 ? `${automation.delay_hours} horas` : ''}
                        </span>
                      )}
                    </div>
                    
                    {automation.template_name && (
                      <p className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">Plantilla:</span> {automation.template_name}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        Creada: {new Date(automation.created_at).toLocaleDateString()}
                      </span>
                      <div className="flex space-x-3">
                        <button onClick={() => openEditAutomation(automation)} className="text-blue-600 hover:text-blue-800 text-sm font-medium">Editar</button>
                        <button onClick={() => handleDeleteAutomation(automation.id)} className="text-red-600 hover:text-red-800 text-sm font-medium">Eliminar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Template Modal */}
      <AnimatePresence>
        {showTemplateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowTemplateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la plantilla</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Bienvenida a nuevos miembros"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de email</label>
                    <select
                      value={templateForm.type}
                      onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value as EmailTemplate['type'] })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="welcome">Bienvenida</option>
                      <option value="newsletter">Boletín</option>
                      <option value="promotion">Promoción</option>
                      <option value="notification">Notificación</option>
                      <option value="reminder">Recordatorio</option>
                      <option value="birthday">Cumpleaños</option>
                      <option value="custom">Personalizado</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                    <div className="flex items-center h-[50px] px-4 border border-gray-300 rounded-lg bg-gray-50">
                      <input
                        type="checkbox"
                        id="template_active"
                        checked={templateForm.is_active}
                        onChange={(e) => setTemplateForm({ ...templateForm, is_active: e.target.checked })}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="template_active" className="ml-3 text-sm text-gray-700">
                        Plantilla activa (disponible para usar)
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Asunto del correo</label>
                  <input
                    type="text"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: ¡Bienvenido/a a Club ViveVerde!"
                  />
                  <p className="text-xs text-gray-500 mt-1">Este es el asunto que verán tus clientes en su bandeja de entrada</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Texto que aparece bajo el asunto</label>
                  <input
                    type="text"
                    value={templateForm.preheader}
                    onChange={(e) => setTemplateForm({ ...templateForm, preheader: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: No te pierdas nuestras ofertas de esta semana"
                  />
                  <p className="text-xs text-gray-500 mt-1">Este texto corto aparece justo después del asunto del email en la bandeja de entrada</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Notas internas (opcional)</label>
                  <textarea
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Ej: Usar para newsletters semanales del club"
                  />
                  <p className="text-xs text-gray-500 mt-1">Estas notas solo las verás tú, no se envían con el email</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Cuerpo del mensaje</label>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Usa el editor de abajo o haz clic en las variables
                    </span>
                  </div>
                  <WysiwygEditor
                    value={templateForm.content}
                    onChange={(value) => setTemplateForm({ ...templateForm, content: value })}
                    placeholder="Escribe el contenido de tu email aquí..."
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Puedes usar variables como {'{{nombre}}'}, {'{{puntos}}'}, etc. que se reemplazarán automáticamente con los datos del cliente.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingTemplate ? 'Actualizar Plantilla' : 'Crear Plantilla'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Campaign Modal */}
      <AnimatePresence>
        {showCampaignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCampaignModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingCampaign ? 'Editar Campaña' : 'Nueva Campaña'}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la campaña</label>
                  <input
                    type="text"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Newsletter Marzo 2024"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de campaña</label>
                    <select
                      value={campaignForm.type}
                      onChange={(e) => setCampaignForm({ ...campaignForm, type: e.target.value as EmailCampaign['type'] })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="newsletter">Boletín</option>
                      <option value="promotion">Promoción</option>
                      <option value="notification">Notificación</option>
                      <option value="reminder">Recordatorio</option>
                      <option value="birthday">Cumpleaños</option>
                      <option value="welcome">Bienvenida</option>
                      <option value="segment">Segmento específico</option>
                      <option value="automated">Automatizada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Usar plantilla (opcional)</label>
                    <select
                      value={campaignForm.template_id || ''}
                      onChange={(e) => setCampaignForm({ ...campaignForm, template_id: e.target.value ? Number(e.target.value) : null })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Sin plantilla (escribir manualmente)</option>
                      {templates.filter(t => t.is_active).map(template => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Asunto del correo</label>
                  <input
                    type="text"
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: ¡Nuevas ofertas solo para ti!"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Texto que aparece bajo el asunto</label>
                  <input
                    type="text"
                    value={campaignForm.preheader}
                    onChange={(e) => setCampaignForm({ ...campaignForm, preheader: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Descubre las novedades de este mes"
                  />
                  <p className="text-xs text-gray-500 mt-1">Este texto complementario aparece tras el asunto en la bandeja de entrada</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Destinatarios</label>
                  <select
                    value={campaignForm.segment_id || ''}
                    onChange={(e) => setCampaignForm({ ...campaignForm, segment_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todos los suscriptores</option>
                    {segments.filter(s => s.is_active).map(segment => {
                      const count = segmentCounts[segment.id]?.count;
                      const countDisplay = count !== undefined ? ` (${count.toLocaleString('es-ES')} usuarios)` : ' (consultando...)';
                      return (
                        <option key={segment.id} value={segment.id}>
                          {segment.name}{countDisplay}
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Selecciona un segmento específico o envía a todos</p>
                  <button
                    type="button"
                    onClick={() => {
                      // Contar usuarios de todos los segmentos activos
                      segments.filter(s => s.is_active).forEach(s => {
                        if (segmentCounts[s.id] === undefined) {
                          countSegmentUsers(s.id);
                        }
                      });
                    }}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Actualizar conteo de todos los segmentos
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">Cuerpo del mensaje</label>
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Usa el editor de abajo
                    </span>
                  </div>
                  <WysiwygEditor
                    value={campaignForm.content}
                    onChange={(value) => setCampaignForm({ ...campaignForm, content: value })}
                    placeholder="Escribe el contenido de tu email aquí..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Programar envío (opcional)</label>
                  <input
                    type="datetime-local"
                    value={campaignForm.scheduled_at}
                    onChange={(e) => setCampaignForm({ ...campaignForm, scheduled_at: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Deja vacío para enviar inmediatamente</p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowCampaignModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCampaign}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingCampaign ? 'Actualizar Campaña' : 'Crear Campaña'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Segment Modal */}
      <AnimatePresence>
        {showSegmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSegmentModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingSegment ? 'Editar Segmento' : 'Nuevo Segmento'}
                </h2>
                <button
                  onClick={() => setShowSegmentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-8">
                {/* Información básica */}
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Información del segmento
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Nombre del segmento <span className="text-red-500">*</span> <span className="text-red-500 text-xs">(Campo obligatorio)</span>
                      </label>
                      <input
                        type="text"
                        value={segmentForm.name}
                        onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ej: Clientes VIP con muchas compras"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción (opcional)</label>
                      <input
                        type="text"
                        value={segmentForm.description}
                        onChange={(e) => setSegmentForm({ ...segmentForm, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Breve descripción para recordar para qué sirve"
                      />
                    </div>
                  </div>
                  <div className="flex items-center mt-4 px-4 py-3 border border-gray-300 rounded-lg bg-white">
                    <input
                      type="checkbox"
                      id="segment_active_new"
                      checked={segmentForm.is_active}
                      onChange={(e) => setSegmentForm({ ...segmentForm, is_active: e.target.checked })}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="segment_active_new" className="ml-3 text-sm text-gray-700">
                      Segmento activo (disponible para campañas)
                    </label>
                  </div>
                </div>

                {/* Panel de previsualización dinámica */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-200">
                  <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Previsualización del segmento
                  </h3>
                  <div className="bg-white rounded-lg p-4 border border-green-100">
                    {segmentPreview.loading ? (
                      <div className="flex items-center text-green-600">
                        <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm">Calculando usuarios...</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Usuarios coincidentes:</span>
                          <span className="text-2xl font-bold text-green-600">{segmentPreview.count.toLocaleString('es-ES')}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">
                          <span className="font-medium text-gray-700">Filtros aplicados:</span> {segmentPreview.preview}
                        </p>
                        <p className="text-xs text-gray-400 mt-2 italic">
                          Este número se actualiza automáticamente según los filtros seleccionados
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Filtros de datos personales */}
                <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
                  <h3 className="text-lg font-bold text-purple-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Datos Personales
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Nombre contiene</label>
                      <input
                        type="text"
                        value={segmentForm.filters.name_contains}
                        onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, name_contains: e.target.value } })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Parte del nombre..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Email contiene</label>
                      <input
                        type="text"
                        value={segmentForm.filters.email_contains}
                        onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, email_contains: e.target.value } })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Parte del email..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Teléfono contiene</label>
                      <input
                        type="text"
                        value={segmentForm.filters.phone_contains}
                        onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, phone_contains: e.target.value } })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="Parte del teléfono..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">CIF/DNI contiene</label>
                      <input
                        type="text"
                        value={segmentForm.filters.cif_contains}
                        onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, cif_contains: e.target.value } })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        placeholder="CIF o DNI..."
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-600 mb-2">Rango de fechas de nacimiento</label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-xs text-gray-500">Desde</span>
                        <input
                          type="date"
                          value={segmentForm.filters.birth_date_from}
                          onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, birth_date_from: sanitizeDateInput(e.target.value) } })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                            segmentForm.filters.birth_date_from && segmentForm.filters.birth_date_to &&
                            segmentForm.filters.birth_date_from > segmentForm.filters.birth_date_to
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300'
                          }`}
                        />
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Hasta</span>
                        <input
                          type="date"
                          value={segmentForm.filters.birth_date_to}
                          onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, birth_date_to: sanitizeDateInput(e.target.value) } })}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                            segmentForm.filters.birth_date_from && segmentForm.filters.birth_date_to &&
                            segmentForm.filters.birth_date_from > segmentForm.filters.birth_date_to
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filtros de puntos y estado */}
                <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                  <h3 className="text-lg font-bold text-green-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Puntos y Estado
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Puntos mínimos</label>
                      <input
                        type="number"
                        min="0"
                        value={segmentForm.filters.points_min ?? ''}
                        onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, points_min: e.target.value ? parseInt(e.target.value) : undefined } })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          segmentForm.filters.points_min !== undefined && segmentForm.filters.points_max !== undefined &&
                          segmentForm.filters.points_min > segmentForm.filters.points_max
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300'
                        }`}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Puntos máximos</label>
                      <input
                        type="number"
                        min="0"
                        value={segmentForm.filters.points_max ?? ''}
                        onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, points_max: e.target.value ? parseInt(e.target.value) : undefined } })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                          segmentForm.filters.points_min !== undefined && segmentForm.filters.points_max !== undefined &&
                          segmentForm.filters.points_min > segmentForm.filters.points_max
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300'
                        }`}
                        placeholder="Sin límite"
                      />
                    </div>
                  </div>
                </div>

                {/* Filtros de ventas y actividad */}
                <div className="bg-orange-50 rounded-xl p-5 border border-orange-100">
                  <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Ventas y Actividad
                  </h3>
                  
                  {/* Rango de cifra de ventas */}
                  <div className="mb-4 p-4 bg-white rounded-lg border border-orange-200">
                    <label className="block text-sm font-bold text-orange-700 mb-3">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Rango de cifra de ventas (en puntos canjeados)
                      </span>
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <span className="text-xs text-gray-500">Mínimo (puntos)</span>
                        <input
                          type="number"
                          min="0"
                          value={segmentForm.filters.sales_amount_min ?? ''}
                          onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, sales_amount_min: e.target.value ? parseInt(e.target.value) : undefined } })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                            segmentForm.filters.sales_amount_min !== undefined && segmentForm.filters.sales_amount_max !== undefined &&
                            segmentForm.filters.sales_amount_min > segmentForm.filters.sales_amount_max
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300'
                          }`}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Máximo (puntos)</span>
                        <input
                          type="number"
                          min="0"
                          value={segmentForm.filters.sales_amount_max ?? ''}
                          onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, sales_amount_max: e.target.value ? parseInt(e.target.value) : undefined } })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                            segmentForm.filters.sales_amount_min !== undefined && segmentForm.filters.sales_amount_max !== undefined &&
                            segmentForm.filters.sales_amount_min > segmentForm.filters.sales_amount_max
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300'
                          }`}
                          placeholder="Sin límite"
                        />
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs text-gray-500">En los últimos (días)</span>
                        <select
                          value={segmentForm.filters.sales_days ?? 30}
                          onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, sales_days: parseInt(e.target.value) } })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                          <option value="7">7 días</option>
                          <option value="30">30 días</option>
                          <option value="60">60 días</option>
                          <option value="90">90 días</option>
                          <option value="180">6 meses</option>
                          <option value="365">1 año</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Tiempo sin actividad */}
                  <div className="p-4 bg-white rounded-lg border border-orange-200">
                    <label className="block text-sm font-bold text-orange-700 mb-3">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Tiempo sin acumular puntos (inactividad)
                      </span>
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-gray-500">Días mínimo de inactividad</span>
                        <input
                          type="number"
                          min="0"
                          value={segmentForm.filters.inactivity_days_min ?? ''}
                          onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, inactivity_days_min: e.target.value ? parseInt(e.target.value) : undefined } })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                            segmentForm.filters.inactivity_days_min !== undefined && segmentForm.filters.inactivity_days_max !== undefined &&
                            segmentForm.filters.inactivity_days_min > segmentForm.filters.inactivity_days_max
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300'
                          }`}
                          placeholder="Ej: 30"
                        />
                        <span className="text-xs text-gray-500">días sin acumular puntos</span>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500">Días máximo de inactividad</span>
                        <input
                          type="number"
                          min="0"
                          value={segmentForm.filters.inactivity_days_max ?? ''}
                          onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, inactivity_days_max: e.target.value ? parseInt(e.target.value) : undefined } })}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                            segmentForm.filters.inactivity_days_min !== undefined && segmentForm.filters.inactivity_days_max !== undefined &&
                            segmentForm.filters.inactivity_days_min > segmentForm.filters.inactivity_days_max
                              ? 'border-red-500 bg-red-50'
                              : 'border-gray-300'
                          }`}
                          placeholder="Ej: 90"
                        />
                        <span className="text-xs text-gray-500">días sin acumular puntos</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filtros de membresía */}
                <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100">
                  <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Fecha de Registro
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Registrado desde</label>
                      <input
                        type="date"
                        value={segmentForm.filters.registration_date_from}
                        onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, registration_date_from: sanitizeDateInput(e.target.value) } })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          segmentForm.filters.registration_date_from && segmentForm.filters.registration_date_to &&
                          segmentForm.filters.registration_date_from > segmentForm.filters.registration_date_to
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Registrado hasta</label>
                      <input
                        type="date"
                        value={segmentForm.filters.registration_date_to}
                        onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, registration_date_to: sanitizeDateInput(e.target.value) } })}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                          segmentForm.filters.registration_date_from && segmentForm.filters.registration_date_to &&
                          segmentForm.filters.registration_date_from > segmentForm.filters.registration_date_to
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Filtros de vivienda y animales */}
                <div className="bg-teal-50 rounded-xl p-5 border border-teal-100">
                  <h3 className="text-lg font-bold text-teal-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Vivienda y Animales
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Características de la vivienda */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Características de la vivienda</label>
                      <div className="flex flex-wrap gap-2">
                        {housingOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              const newTypes = segmentForm.filters.housing_types.includes(option)
                                ? segmentForm.filters.housing_types.filter(t => t !== option)
                                : [...segmentForm.filters.housing_types, option];
                              setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, housing_types: newTypes } });
                            }}
                            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                              segmentForm.filters.housing_types.includes(option)
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Selecciona una o más características (vacío = todos)</p>
                    </div>

                    {/* Animales */}
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">Animales</label>
                      <div className="flex flex-wrap gap-2">
                        {animalOptions.map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => {
                              const newTypes = segmentForm.filters.animal_types.includes(option)
                                ? segmentForm.filters.animal_types.filter(t => t !== option)
                                : [...segmentForm.filters.animal_types, option];
                              setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, animal_types: newTypes } });
                            }}
                            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                              segmentForm.filters.animal_types.includes(option)
                                ? 'bg-teal-600 text-white border-teal-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Selecciona uno o más tipos (vacío = todos)</p>
                    </div>
                  </div>
                </div>

                {/* Filtros de suscripción de email */}
                <div className="bg-pink-50 rounded-xl p-5 border border-pink-100">
                  <h3 className="text-lg font-bold text-pink-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Suscripción de Email
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Estado de suscripción</label>
                    <select
                      value={segmentForm.filters.email_subscribed}
                      onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, email_subscribed: e.target.value as any } })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    >
                      <option value="all">Todos los usuarios</option>
                      <option value="subscribed">Solo suscritos a emails</option>
                      <option value="unsubscribed">Solo NO suscritos</option>
                    </select>
                  </div>
                </div>

                {/* Resumen de filtros activos */}
                <div className="bg-gray-100 rounded-xl p-5">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">Resumen de filtros aplicados</h3>
                  <div className="flex flex-wrap gap-2 text-sm">
                    {segmentForm.filters.name_contains && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">Nombre: {segmentForm.filters.name_contains}</span>
                    )}
                    {segmentForm.filters.email_contains && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">Email: {segmentForm.filters.email_contains}</span>
                    )}
                    {segmentForm.filters.phone_contains && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">Teléfono: {segmentForm.filters.phone_contains}</span>
                    )}
                    {segmentForm.filters.cif_contains && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">CIF/DNI: {segmentForm.filters.cif_contains}</span>
                    )}
                    {(segmentForm.filters.birth_date_from || segmentForm.filters.birth_date_to) && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full">
                        Nacido: {segmentForm.filters.birth_date_from || '...'} a {segmentForm.filters.birth_date_to || '...'}
                      </span>
                    )}
                    {(segmentForm.filters.registration_date_from || segmentForm.filters.registration_date_to) && (
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                        Registrado: {segmentForm.filters.registration_date_from || '...'} a {segmentForm.filters.registration_date_to || '...'}
                      </span>
                    )}
                    {(segmentForm.filters.points_min !== undefined || segmentForm.filters.points_max !== undefined) && (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                        Puntos: {segmentForm.filters.points_min ?? 0} - {segmentForm.filters.points_max ?? '∞'}
                      </span>
                    )}
                    {segmentForm.filters.sales_days && (segmentForm.filters.sales_amount_min !== undefined || segmentForm.filters.sales_amount_max !== undefined) && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                        Ventas ({segmentForm.filters.sales_days}d): {segmentForm.filters.sales_amount_min ?? 0} - {segmentForm.filters.sales_amount_max ?? '∞'} pts
                      </span>
                    )}
                    {(segmentForm.filters.inactivity_days_min !== undefined || segmentForm.filters.inactivity_days_max !== undefined) && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full">
                        Inactivo: {segmentForm.filters.inactivity_days_min ?? 0} - {segmentForm.filters.inactivity_days_max ?? '∞'} días
                      </span>
                    )}
                    {segmentForm.filters.housing_types.length > 0 && (
                      <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full">Vivienda: {segmentForm.filters.housing_types.length} tipos</span>
                    )}
                    {segmentForm.filters.animal_types.length > 0 && (
                      <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full">Animales: {segmentForm.filters.animal_types.length} tipos</span>
                    )}
                    {segmentForm.filters.rol.length > 0 && (
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">Rol: {segmentForm.filters.rol.join(', ')}</span>
                    )}
                    {segmentForm.filters.email_subscribed !== 'all' && (
                      <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full">Email: {segmentForm.filters.email_subscribed}</span>
                    )}
                    {!segmentForm.name && (
                      <span className="text-gray-500 italic">Define un nombre para el segmento</span>
                    )}
                    {Object.values(segmentForm.filters).every(v => !v || (Array.isArray(v) && v.length === 0)) && segmentForm.name && (
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">Sin filtros (todos los usuarios)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={resetSegmentForm}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Limpiar filtros
                </button>
                <button
                  onClick={() => setShowSegmentModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSegment}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingSegment ? 'Actualizar Segmento' : 'Crear Segmento'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Automation Modal */}
      <AnimatePresence>
        {showAutomationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAutomationModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingAutomation ? 'Editar Automatización' : 'Nueva Automatización'}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre de la automatización</label>
                  <input
                    type="text"
                    value={automationForm.name}
                    onChange={(e) => setAutomationForm({ ...automationForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Bienvenida a nuevos miembros"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">¿Cuándo se envía este email?</label>
                  <select
                    value={automationForm.trigger_type}
                    onChange={(e) => setAutomationForm({ ...automationForm, trigger_type: e.target.value as EmailAutomation['trigger_type'] })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="signup">Cuando alguien se registra</option>
                    <option value="purchase">Cuando alguien realiza una compra</option>
                    <option value="birthday">En el cumpleaños del cliente</option>
                    <option value="inactivity">Cuando un cliente lleva tiempo sin comprar</option>
                    <option value="points_milestone">Cuando alcanza cierta cantidad de puntos</option>
                    <option value="anniversary">En el aniversario de membership</option>
                    <option value="custom_date">En una fecha específica</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Esperar (días)</label>
                    <input
                      type="number"
                      min="0"
                      value={automationForm.delay_days}
                      onChange={(e) => setAutomationForm({ ...automationForm, delay_days: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Días de espera después del evento</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Esperar (horas)</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={automationForm.delay_hours}
                      onChange={(e) => setAutomationForm({ ...automationForm, delay_hours: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Horas adicionales de espera</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">¿Qué plantilla usar?</label>
                  <select
                    value={automationForm.template_id || ''}
                    onChange={(e) => setAutomationForm({ ...automationForm, template_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecciona una plantilla</option>
                    {templates.filter(t => t.is_active).map(template => (
                      <option key={template.id} value={template.id}>{template.name} - {template.subject}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">La plantilla define el contenido del email que se envía</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Condiciones adicionales (opcional)</label>
                  <textarea
                    value={automationForm.conditions}
                    onChange={(e) => setAutomationForm({ ...automationForm, conditions: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Ej: Solo enviar si el cliente tiene más de 50 puntos"
                  />
                  <p className="text-xs text-gray-500 mt-1">Condiciones extra que debe cumplir el cliente para recibir el email (opcional)</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Configuración avanzada (opcional)</label>
                  <textarea
                    value={automationForm.trigger_config}
                    onChange={(e) => setAutomationForm({ ...automationForm, trigger_config: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Ej: Puntos mínimos: 100, Categoría: Premium"
                  />
                  <p className="text-xs text-gray-500 mt-1">Parámetros adicionales para personalizar el comportamiento (opcional)</p>
                </div>

                <div className="flex items-center px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                  <input
                    type="checkbox"
                    id="automation_active"
                    checked={automationForm.is_active}
                    onChange={(e) => setAutomationForm({ ...automationForm, is_active: e.target.checked })}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="automation_active" className="ml-3 text-sm text-gray-700">
                    Automatización activa (enviar emails automáticamente)
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAutomationModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveAutomation}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingAutomation ? 'Actualizar Automatización' : 'Crear Automatización'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmailSection;
