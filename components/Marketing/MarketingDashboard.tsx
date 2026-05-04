'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/router';
import WysiwygEditor, { AVAILABLE_VARIABLES } from '../Marketing/Common/WysiwygEditor';

// Tipo para las secciones del menú
type MenuSection = 'home' | 'dashboard' | 'templates' | 'campaigns' | 'subscribers' | 'segments' | 'automations';

// Función para sanitizar entrada de fecha y prevenir años de más de 4 dígitos
const sanitizeDateInput = (value: string): string => {
  let sanitized = value.replace(/[^\d-]/g, '');
  if (sanitized.length > 10) {
    sanitized = sanitized.substring(0, 10);
  }
  if (sanitized.length >= 4 && !sanitized.includes('-')) {
    sanitized = sanitized.substring(0, 4) + '-' + sanitized.substring(4);
  }
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
  name_contains?: string;
  email_contains?: string;
  phone_contains?: string;
  cif_contains?: string;
  birth_date_from?: string;
  birth_date_to?: string;
  registration_date_from?: string;
  registration_date_to?: string;
  points_min?: number;
  points_max?: number;
  sales_amount_min?: number;
  sales_amount_max?: number;
  sales_days?: number;
  inactivity_days_min?: number;
  inactivity_days_max?: number;
  housing_types?: string[];
  animal_types?: string[];
  rol?: string[];
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

interface MarketingDashboardProps {
  userRole?: string | null;
}

// Tipo para las secciones del menú

const MarketingDashboard: React.FC<MarketingDashboardProps> = ({ userRole }) => {
  const router = useRouter();
  // Leer la sección inicial de la URL
const getInitialSection = (): MenuSection => {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const section = params.get('section');
    if (section && ['home', 'dashboard', 'templates', 'campaigns', 'subscribers', 'segments', 'automations'].includes(section)) {
      return section as MenuSection;
    }
  }
  return 'dashboard';
};

const [activeMenuItem, setActiveMenuItem] = useState<MenuSection>(getInitialSection);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Estados para los datos
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [subscribers, setSubscribers] = useState<EmailSubscriber[]>([]);
  const [segments, setSegments] = useState<EmailSegment[]>([]);
  const [automations, setAutomations] = useState<EmailAutomation[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para los modales
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showSegmentModal, setShowSegmentModal] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);
  const [editingSegment, setEditingSegment] = useState<EmailSegment | null>(null);
  const [editingAutomation, setEditingAutomation] = useState<EmailAutomation | null>(null);

  // Estados para los formularios
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
    filters: {
      name_contains: '',
      email_contains: '',
      phone_contains: '',
      cif_contains: '',
      birth_date_from: '',
      birth_date_to: '',
      registration_date_from: '',
      registration_date_to: '',
      points_min: undefined as number | undefined,
      points_max: undefined as number | undefined,
      sales_amount_min: undefined as number | undefined,
      sales_amount_max: undefined as number | undefined,
      sales_days: undefined as number | undefined,
      inactivity_days_min: undefined as number | undefined,
      inactivity_days_max: undefined as number | undefined,
      housing_types: [] as string[],
      animal_types: [] as string[],
      rol: [] as string[],
      email_subscribed: 'all' as 'all' | 'subscribed' | 'unsubscribed',
    }
  });

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

  const [segmentPreview, setSegmentPreview] = useState<{
    count: number;
    preview: string;
    loading: boolean;
  }>({
    count: 0,
    preview: 'Todos los usuarios',
    loading: false
  });

  const [segmentCounts, setSegmentCounts] = useState<Record<number, { count: number; loading: boolean }>>({});

  // Detectar si es móvil
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsMobileOpen(false);
      }
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // Escuchar cambios en la URL para actualizar el menú
  useEffect(() => {
    const handleRouteChange = () => {
      const params = new URLSearchParams(window.location.search);
      const section = params.get('section');
      if (section && ['home', 'dashboard', 'templates', 'campaigns', 'subscribers', 'segments', 'automations'].includes(section)) {
        setActiveMenuItem(section as MenuSection);
      } else {
        setActiveMenuItem('dashboard');
      }
    };

    // Escuchar eventos de popstate (cuando se usa el botón atrás del navegador)
    window.addEventListener('popstate', handleRouteChange);
    
    // Verificar la URL actual al cargar
    handleRouteChange();

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Función para cambiar de sección y actualizar la URL
  const handleMenuItemClick = (itemId: MenuSection) => {
    if (itemId === 'home') {
      router.push('/');
      return;
    }
    setActiveMenuItem(itemId);
    if (isMobile) {
      setIsMobileOpen(false);
    }
    // Actualizar la URL sin recargar la página
    const url = new URL(window.location.href);
    if (itemId === 'dashboard') {
      url.searchParams.delete('section');
    } else {
      url.searchParams.set('section', itemId);
    }
    window.history.pushState({}, '', url.toString());
  };

  // Definición del menú lateral
  const menuItems = [
    { id: 'home' as MenuSection, name: 'Pantalla de inicio', icon: 'fa-home', route: '/' },
    { id: 'dashboard' as MenuSection, name: 'Panel Principal', icon: 'fa-tachometer-alt' },
    { id: 'templates' as MenuSection, name: 'Plantillas', icon: 'fa-file-alt' },
    { id: 'campaigns' as MenuSection, name: 'Campañas', icon: 'fa-envelope' },
    { id: 'subscribers' as MenuSection, name: 'Suscriptores', icon: 'fa-users' },
    { id: 'segments' as MenuSection, name: 'Segmentos', icon: 'fa-layer-group' },
    { id: 'automations' as MenuSection, name: 'Automatizaciones', icon: 'fa-cogs' },
  ];

  // Funciones de utilidad
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

  const downloadSegmentUsers = async (segment: EmailSegment) => {
    try {
      toast.loading('Descargando usuarios...', { id: 'download' });
      const res = await fetch(`/api/email/segments/${segment.id}/users?limit=10000`);
      const data = await res.json();
      
      if (data.success && data.users && data.users.length > 0) {
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
      toast.error('Error al descargar usuarios. Inténtalo de nuevo.', { id: 'download' });
    }
  };

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
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Manejadores de acciones CRUD
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
    if (!segmentForm.name || segmentForm.name.trim() === '') {
      toast.error('El nombre del segmento es obligatorio');
      return;
    }

    try {
      const url = editingSegment
        ? `/api/email/segments/${editingSegment.id}`
        : '/api/email/segments';
      const method = editingSegment ? 'PUT' : 'POST';

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

  const openEditSegment = (segment: EmailSegment) => {
    setEditingSegment(segment);
    const criteriaOrFilters = (segment as any).filters || (segment as any).criteria;
    let parsedCriteria: EmailSegmentFilters = {};
    if (criteriaOrFilters) {
      if (typeof criteriaOrFilters === 'string') {
        try {
          parsedCriteria = JSON.parse(criteriaOrFilters);
        } catch {
          parsedCriteria = {};
        }
      } else {
        parsedCriteria = criteriaOrFilters as EmailSegmentFilters;
      }
    }
    
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

  // Funciones de utilidad para estados
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

  // Opciones para filtros
  const housingOptions = [
    'terraza', 'balcón', 'huerto', 'césped', 'jardín', 'estanque', 'marquesina', 'piscina'
  ];

  const animalOptions = [
    'sin animales', 'perro(s)', 'gato(s)', 'pájaro(s)', 'pez (peces)', 'roedor(es)', 'otros', 'animales de corral'
  ];

  // Estadísticas
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

  // Overlay para móvil
  const renderOverlay = () => {
    if (!isMobile || !isMobileOpen) return null;
    
    return (
      <div 
        className="fixed inset-0 bg-opacity-50 z-30"
        onClick={() => setIsMobileOpen(false)}
      />
    );
  };

  // Renderizar contenido según la sección activa
  const renderContent = () => {
    switch (activeMenuItem) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-4">Resumen de Marketing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Plantillas Activas</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.activeTemplates}</p>
                      <p className="text-xs text-gray-500 mt-1">de {stats.totalTemplates} totales</p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-xl">
                      <i className="fas fa-file-alt text-2xl text-blue-600"></i>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Campañas Enviadas</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.sentCampaigns}</p>
                      <p className="text-xs text-gray-500 mt-1">de {stats.totalCampaigns} totales</p>
                    </div>
                    <div className="bg-green-100 p-3 rounded-xl">
                      <i className="fas fa-envelope text-2xl text-green-600"></i>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Suscriptores Activos</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.activeSubscribers}</p>
                      <p className="text-xs text-gray-500 mt-1">de {stats.totalSubscribers} totales</p>
                    </div>
                    <div className="bg-purple-100 p-3 rounded-xl">
                      <i className="fas fa-users text-2xl text-purple-600"></i>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Segmentos Activos</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.activeSegments}</p>
                      <p className="text-xs text-gray-500 mt-1">de {stats.totalSegments} totales</p>
                    </div>
                    <div className="bg-orange-100 p-3 rounded-xl">
                      <i className="fas fa-layer-group text-2xl text-orange-600"></i>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Automatizaciones Activas</p>
                      <p className="text-3xl font-bold text-gray-900">{stats.activeAutomations}</p>
                      <p className="text-xs text-gray-500 mt-1">de {stats.totalAutomations} totales</p>
                    </div>
                    <div className="bg-yellow-100 p-3 rounded-xl">
                      <i className="fas fa-cogs text-2xl text-yellow-600"></i>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        );

      case 'templates':
        return (
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
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Nueva Plantilla
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <p className="text-gray-500 text-center py-8">Cargando...</p>
              ) : templates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No hay plantillas creadas todavía</p>
                  <button
                    onClick={() => {
                      setEditingTemplate(null);
                      setTemplateForm({ name: '', subject: '', preheader: '', content: '', type: 'newsletter', description: '', is_active: true });
                      setShowTemplateModal(true);
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
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
                      <div className="flex items-center justify-between mt-4">
                        <span className={`text-xs px-2 py-1 rounded ${template.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {template.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                        <div className="flex space-x-2">
                          <button onClick={() => openEditTemplate(template)} className="text-blue-600 hover:text-blue-800 text-sm">
                            Editar
                          </button>
                          <button onClick={() => handleDeleteTemplate(template.id)} className="text-red-600 hover:text-red-800 text-sm">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'campaigns':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Campañas de Email</h2>
                <p className="text-sm text-gray-500 mt-1">Crea y envía campañas a tus suscriptores</p>
              </div>
              <button
                onClick={() => {
                  setEditingCampaign(null);
                  setCampaignForm({ name: '', subject: '', preheader: '', content: '', type: 'newsletter', description: '', template_id: null, scheduled_at: '', segment_id: null });
                  setShowCampaignModal(true);
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Nueva Campaña
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <p className="text-gray-500 text-center py-8">Cargando...</p>
              ) : campaigns.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No hay campañas creadas todavía</p>
                  <button
                    onClick={() => {
                      setEditingCampaign(null);
                      setCampaignForm({ name: '', subject: '', preheader: '', content: '', type: 'newsletter', description: '', template_id: null, scheduled_at: '', segment_id: null });
                      setShowCampaignModal(true);
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Crear tu primera campaña
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Destinatarios</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {campaigns.map(campaign => (
                        <tr key={campaign.id}>
                          <td className="px-4 py-4">
                            <div className="font-medium text-gray-900">{campaign.name}</div>
                            <div className="text-sm text-gray-500">{campaign.subject}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(campaign.type)}`}>
                              {getTypeLabel(campaign.type)}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(campaign.status)}`}>
                              {getStatusLabel(campaign.status)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {campaign.total_sent || 0}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex space-x-2">
                              <button onClick={() => openEditCampaign(campaign)} className="text-blue-600 hover:text-blue-800 text-sm">
                                Editar
                              </button>
                              {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                                <button onClick={() => handleSendCampaign(campaign.id)} className="text-green-600 hover:text-green-800 text-sm">
                                  Enviar
                                </button>
                              )}
                              <button onClick={() => handleDeleteCampaign(campaign.id)} className="text-red-600 hover:text-red-800 text-sm">
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case 'subscribers':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Suscriptores</h2>
              <p className="text-sm text-gray-500 mt-1">Lista de usuarios suscritos a los emails</p>
            </div>

            <div className="p-6">
              {loading ? (
                <p className="text-gray-500 text-center py-8">Cargando...</p>
              ) : subscribers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No hay suscriptores registrados</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha de suscripción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {subscribers.map(subscriber => (
                        <tr key={subscriber.id}>
                          <td className="px-4 py-4 text-sm text-gray-900">{subscriber.email}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{subscriber.name || '-'}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              subscriber.status === 'active' ? 'bg-green-100 text-green-700' :
                              subscriber.status === 'unsubscribed' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {subscriber.status === 'active' ? 'Activo' : subscriber.status === 'unsubscribed' ? 'Dado de baja' : 'Bounced'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">{new Date(subscriber.subscribed_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      case 'segments':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Segmentos</h2>
                <p className="text-sm text-gray-500 mt-1">Crea segmentos dinámicos basados en criterios</p>
              </div>
              <button
                onClick={() => {
                  setEditingSegment(null);
                  resetSegmentForm();
                  setShowSegmentModal(true);
                }}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Nuevo Segmento
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <p className="text-gray-500 text-center py-8">Cargando...</p>
              ) : segments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No hay segmentos creados todavía</p>
                  <button
                    onClick={() => {
                      setEditingSegment(null);
                      resetSegmentForm();
                      setShowSegmentModal(true);
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
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
                        <span className={`px-2 py-1 rounded text-xs font-medium ${segment.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {segment.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      {segment.description && (
                        <p className="text-sm text-gray-600 mb-3">{segment.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <button
                          onClick={() => countSegmentUsers(segment.id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          {segmentCounts[segment.id]?.loading ? 'Contando...' : `${segmentCounts[segment.id]?.count || 0} usuarios`}
                        </button>
                        <div className="flex space-x-2">
                          <button onClick={() => downloadSegmentUsers(segment)} className="text-green-600 hover:text-green-800 text-sm">
                            Descargar
                          </button>
                          <button onClick={() => openEditSegment(segment)} className="text-blue-600 hover:text-blue-800 text-sm">
                            Editar
                          </button>
                          <button onClick={() => handleDeleteSegment(segment.id)} className="text-red-600 hover:text-red-800 text-sm">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'automations':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Automatizaciones</h2>
                <p className="text-sm text-gray-500 mt-1">Configura emails automáticos basados en eventos</p>
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
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Nueva Automatización
              </button>
            </div>

            <div className="p-6">
              {loading ? (
                <p className="text-gray-500 text-center py-8">Cargando...</p>
              ) : automations.length === 0 ? (
                <div className="text-center py-12">
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
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
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
                        <span className={`px-2 py-1 rounded text-xs font-medium ${automation.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {automation.is_active ? 'Activa' : 'Inactiva'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{getTriggerLabel(automation.trigger_type)}</p>
                      {automation.template_name && (
                        <p className="text-xs text-gray-500 mb-3">Plantilla: {automation.template_name}</p>
                      )}
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-xs text-gray-500">
                          Enviados: {automation.total_sent || 0}
                        </span>
                        <div className="flex space-x-2">
                          <button onClick={() => openEditAutomation(automation)} className="text-blue-600 hover:text-blue-800 text-sm">
                            Editar
                          </button>
                          <button onClick={() => handleDeleteAutomation(automation.id)} className="text-red-600 hover:text-red-800 text-sm">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {renderOverlay()}
      
      <AnimatePresence>
        {(!isMobile || isMobileOpen) && (
          <motion.div 
            className={`bg-green-900 text-white shadow-lg h-screen z-40 overflow-y-auto
              ${isMobile ? 'fixed top-0 left-0 w-64' : 'w-64 sticky top-0'}`}
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3, type: 'spring', stiffness: 100 }}
          >
            {/* Titulo del panel - diferente para móvil y web */}
            <div className="p-4 text-center border-b border-green-700">
              <h1 className="text-xl font-bold">{isMobile ? 'Menu de Marketing' : 'Menu de Marketing'}</h1>
              <div className="text-gray-400 text-sm mt-1">
                Club ViveVerde
              </div>
            </div>
            
            {/* Menu de navegacion */}
            <nav className="mt-2">
              <ul>
                {menuItems.map((item) => (
                  <li key={item.id} className="mb-1">
                    <button
                      onClick={() => handleMenuItemClick(item.id)}
                      className={`w-full text-left py-3 px-4 flex items-center transition-colors duration-200
                        ${activeMenuItem === item.id 
                          ? 'bg-green-700 border-l-4 border-white font-medium' 
                          : 'hover:bg-green-800'
                        }`}
                    >
                      <i className={`fas ${item.icon} mr-3 w-5 text-center`}></i>
                      <span>{item.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            
            {/* Footer con información del usuario */}
            {/* Eliminado el enlace "Mi perfil" del sidebar - se mantiene solo en header */}
            {/* El botón "Cerrar sesión" se ha movido a Mi perfil */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contenido principal */}
      <motion.div
        className="flex-1 overflow-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Contenido segun la seccion seleccionada */}
        {renderContent()}
      </motion.div>

      {/* Modales */}
      {/* Modal de Plantilla */}
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
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Bienvenida a nuevos miembros"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
                  <select
                    value={templateForm.type}
                    onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value as EmailTemplate['type'] })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Asunto</label>
                  <input
                    type="text"
                    value={templateForm.subject}
                    onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Asunto del email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Preheader</label>
                  <input
                    type="text"
                    value={templateForm.preheader}
                    onChange={(e) => setTemplateForm({ ...templateForm, preheader: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Texto preview del email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contenido</label>
                  <WysiwygEditor
                    value={templateForm.content}
                    onChange={(value) => setTemplateForm({ ...templateForm, content: value })}
                    placeholder="Escribe el contenido de tu email aquí..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                  <textarea
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Breve descripción (opcional)"
                  />
                </div>

                <div className="flex items-center px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                  <input
                    type="checkbox"
                    id="template_active"
                    checked={templateForm.is_active}
                    onChange={(e) => setTemplateForm({ ...templateForm, is_active: e.target.checked })}
                    className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="template_active" className="ml-3 text-sm text-gray-700">
                    Plantilla activa
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveTemplate}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTemplate ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Campaña */}
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
              className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingCampaign ? 'Editar Campaña' : 'Nueva Campaña'}
              </h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={campaignForm.name}
                    onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Newsletter Abril 2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo</label>
                  <select
                    value={campaignForm.type}
                    onChange={(e) => setCampaignForm({ ...campaignForm, type: e.target.value as EmailCampaign['type'] })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="newsletter">Boletín</option>
                    <option value="promotion">Promoción</option>
                    <option value="notification">Notificación</option>
                    <option value="reminder">Recordatorio</option>
                    <option value="birthday">Cumpleaños</option>
                    <option value="welcome">Bienvenida</option>
                    <option value="segment">Segmento</option>
                    <option value="automated">Automatizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Asunto</label>
                  <input
                    type="text"
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Asunto del email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Segmento</label>
                  <select
                    value={campaignForm.segment_id || ''}
                    onChange={(e) => setCampaignForm({ ...campaignForm, segment_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todos los usuarios</option>
                    {segments.filter(s => s.is_active).map(segment => (
                      <option key={segment.id} value={segment.id}>{segment.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Contenido</label>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowCampaignModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveCampaign}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingCampaign ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Segmento */}
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {editingSegment ? 'Editar Segmento' : 'Nuevo Segmento'}
              </h2>

              <div className="space-y-8">
                <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
                  <h3 className="text-lg font-bold text-blue-800 mb-4">Información del segmento</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre *</label>
                      <input
                        type="text"
                        value={segmentForm.name}
                        onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Ej: Clientes VIP"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción</label>
                      <input
                        type="text"
                        value={segmentForm.description}
                        onChange={(e) => setSegmentForm({ ...segmentForm, description: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Breve descripción"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                  <h3 className="text-lg font-bold text-green-800 mb-4">Previsualización</h3>
                  {segmentPreview.loading ? (
                    <p className="text-green-600">Calculando...</p>
                  ) : (
                    <p className="text-2xl font-bold text-green-600">{segmentPreview.count.toLocaleString('es-ES')} usuarios</p>
                  )}
                </div>

                <div className="bg-purple-50 rounded-xl p-5 border border-purple-100">
                  <h3 className="text-lg font-bold text-purple-800 mb-4">Datos Personales</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Nombre contiene</label>
                      <input
                        type="text"
                        value={segmentForm.filters.name_contains}
                        onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, name_contains: e.target.value } })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Email contiene</label>
                      <input
                        type="text"
                        value={segmentForm.filters.email_contains}
                        onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, email_contains: e.target.value } })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 rounded-xl p-5 border border-green-100">
                  <h3 className="text-lg font-bold text-green-800 mb-4">Puntos</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Puntos mínimos</label>
                      <input
                        type="number"
                        min="0"
                        value={segmentForm.filters.points_min ?? ''}
                        onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, points_min: e.target.value ? parseInt(e.target.value) : undefined } })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-1">Puntos máximos</label>
                      <input
                        type="number"
                        min="0"
                        value={segmentForm.filters.points_max ?? ''}
                        onChange={(e) => setSegmentForm({ ...segmentForm, filters: { ...segmentForm.filters, points_max: e.target.value ? parseInt(e.target.value) : undefined } })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={resetSegmentForm}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Limpiar
                </button>
                <button
                  onClick={() => setShowSegmentModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveSegment}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingSegment ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Automatización */}
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
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre</label>
                  <input
                    type="text"
                    value={automationForm.name}
                    onChange={(e) => setAutomationForm({ ...automationForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Bienvenida a nuevos miembros"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">¿Cuándo se envía?</label>
                  <select
                    value={automationForm.trigger_type}
                    onChange={(e) => setAutomationForm({ ...automationForm, trigger_type: e.target.value as EmailAutomation['trigger_type'] })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="signup">Cuando alguien se registra</option>
                    <option value="purchase">Cuando alguien compra</option>
                    <option value="birthday">En el cumpleaños</option>
                    <option value="inactivity">Cuando hay inactividad</option>
                    <option value="points_milestone">Al alcanzar puntos</option>
                    <option value="anniversary">En el aniversario</option>
                    <option value="custom_date">Fecha personalizada</option>
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Esperar (horas)</label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={automationForm.delay_hours}
                      onChange={(e) => setAutomationForm({ ...automationForm, delay_hours: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Plantilla</label>
                  <select
                    value={automationForm.template_id || ''}
                    onChange={(e) => setAutomationForm({ ...automationForm, template_id: e.target.value ? Number(e.target.value) : null })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona una plantilla</option>
                    {templates.filter(t => t.is_active).map(template => (
                      <option key={template.id} value={template.id}>{template.name} - {template.subject}</option>
                    ))}
                  </select>
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
                    Automatización activa
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAutomationModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveAutomation}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingAutomation ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MarketingDashboard;
