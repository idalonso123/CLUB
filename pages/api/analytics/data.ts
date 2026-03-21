import { NextApiRequest, NextApiResponse } from 'next';
import { BetaAnalyticsDataClient } from '@google-analytics/data';

interface AnalyticsRow {
  dimensionValues?: {
    value: string;
  }[];
  metricValues?: {
    value: string;
  }[];
}

interface AnalyticsData {
  visitsByDay: {
    labels: string[];
    values: number[];
  };
  deviceUsage: {
    labels: string[];
    values: number[];
  };
  topPages: {
    page: string;
    views: number;
    avgTimeOnPage: string;
  }[];
  userMetrics: {
    users: number;
    newUsers: number;
    sessions: number;
    bounceRate: number;
    avgSessionDuration: string;
  };
  usersByCountry: {
    country: string;
    users: number;
  }[];
}

const propertyId = process.env.GA_PROPERTY_ID ? process.env.GA_PROPERTY_ID.replace(/"/g, '') : '';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    const { period = 'last30days' } = req.query;
    if (!process.env.GA_PROPERTY_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.warn('Credenciales de Google Analytics no configuradas. Usando datos de ejemplo.');
      const mockData: AnalyticsData = getMockDataForPeriod(period as string);
      return res.status(200).json(mockData);
    }
    const { startDate, endDate } = getDateRangeFromPeriod(period as string);
    try {
      const analyticsDataClient = new BetaAnalyticsDataClient({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL ? process.env.GOOGLE_CLIENT_EMAIL.replace(/"/g, '') : '',
          private_key: process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/"/g, '').replace(/\\n/g, '\n') : '',
        },
      });
      console.log('Conectando a Google Analytics con ID de propiedad:', propertyId);
      const analyticsData = await fetchGoogleAnalyticsData(analyticsDataClient, startDate, endDate);
      return res.status(200).json(analyticsData);
    } catch (gaError) {
      console.error('Error al conectar con Google Analytics API:', gaError);
      const mockData: AnalyticsData = getMockDataForPeriod(period as string);
      return res.status(200).json(mockData);
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return res.status(500).json({ message: 'Error al obtener datos de Analytics' });
  }
}

function getDateRangeFromPeriod(period: string): { startDate: string; endDate: string } {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  let startDate: string;
  switch (period) {
    case 'last7days':
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(today.getDate() - 7);
      startDate = sevenDaysAgo.toISOString().split('T')[0];
      break;
    case 'last30days':
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      startDate = thirtyDaysAgo.toISOString().split('T')[0];
      break;
    case 'last90days':
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(today.getDate() - 90);
      startDate = ninetyDaysAgo.toISOString().split('T')[0];
      break;
    case 'lastYear':
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(today.getFullYear() - 1);
      startDate = oneYearAgo.toISOString().split('T')[0];
      break;
    default:
      const defaultDaysAgo = new Date();
      defaultDaysAgo.setDate(today.getDate() - 30);
      startDate = defaultDaysAgo.toISOString().split('T')[0];
  }
  return { startDate, endDate };
}

async function fetchGoogleAnalyticsData(
  analyticsDataClient: any,
  startDate: string,
  endDate: string
): Promise<AnalyticsData> {
  const [metricsResponse] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'newUsers' },
      { name: 'sessions' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' }
    ]
  });
  const [visitsByDayResponse] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ dimension: { dimensionName: 'date' } }]
  });
  const [deviceUsageResponse] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [{ name: 'activeUsers' }]
  });
  const [topPagesResponse] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'pagePath' }],
    metrics: [
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' }
    ],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 5
  });
  const [usersByCountryResponse] = await analyticsDataClient.runReport({
    property: `properties/${propertyId}`,
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'country' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 5
  });
  const visitsByDayLabels: string[] = [];
  const visitsByDayValues: number[] = [];
  if (visitsByDayResponse.rows && visitsByDayResponse.rows.length > 0) {
    visitsByDayResponse.rows.forEach((row: AnalyticsRow) => {
      if (row.dimensionValues && row.metricValues) {
        const date = row.dimensionValues[0].value || '';
        const year = date.substring(0, 4);
        const month = date.substring(4, 6);
        const day = date.substring(6, 8);
        const formattedDate = `${day}/${month}`;
        visitsByDayLabels.push(formattedDate);
        visitsByDayValues.push(Number(row.metricValues[0].value || 0));
      }
    });
  }
  const deviceLabels: string[] = [];
  const deviceValues: number[] = [];
  if (deviceUsageResponse.rows && deviceUsageResponse.rows.length > 0) {
    deviceUsageResponse.rows.forEach((row: AnalyticsRow) => {
      if (row.dimensionValues && row.metricValues) {
        deviceLabels.push(row.dimensionValues[0].value || 'Desconocido');
        deviceValues.push(Number(row.metricValues[0].value || 0));
      }
    });
  }
  const topPages = [];
  if (topPagesResponse.rows && topPagesResponse.rows.length > 0) {
    for (const row of topPagesResponse.rows) {
      if (row.dimensionValues && row.metricValues) {
        const pagePath = row.dimensionValues[0].value || '';
        const views = Number(row.metricValues[0].value || 0);
        const avgTimeSeconds = Number(row.metricValues[1].value || 0);
        const minutes = Math.floor(avgTimeSeconds / 60);
        const seconds = Math.floor(avgTimeSeconds % 60);
        const avgTimeFormatted = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
        topPages.push({
          page: pagePath,
          views: views,
          avgTimeOnPage: avgTimeFormatted
        });
      }
    }
  }
  const usersByCountry = [];
  if (usersByCountryResponse.rows && usersByCountryResponse.rows.length > 0) {
    for (const row of usersByCountryResponse.rows) {
      if (row.dimensionValues && row.metricValues) {
        usersByCountry.push({
          country: row.dimensionValues[0].value || 'Desconocido',
          users: Number(row.metricValues[0].value || 0)
        });
      }
    }
  }
  let users = 0;
  let newUsers = 0;
  let sessions = 0;
  let bounceRate = 0;
  let avgSessionDuration = '0:00';
  if (metricsResponse.rows && metricsResponse.rows.length > 0 && metricsResponse.rows[0].metricValues) {
    users = Number(metricsResponse.rows[0].metricValues[0].value || 0);
    newUsers = Number(metricsResponse.rows[0].metricValues[1].value || 0);
    sessions = Number(metricsResponse.rows[0].metricValues[2].value || 0);
    bounceRate = Number(metricsResponse.rows[0].metricValues[3].value || 0);
    const durationSeconds = Number(metricsResponse.rows[0].metricValues[4].value || 0);
    const minutes = Math.floor(durationSeconds / 60);
    const seconds = Math.floor(durationSeconds % 60);
    avgSessionDuration = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  }
  return {
    visitsByDay: {
      labels: visitsByDayLabels.length > 0 ? visitsByDayLabels : ['Sin datos'],
      values: visitsByDayValues.length > 0 ? visitsByDayValues : [0]
    },
    deviceUsage: {
      labels: deviceLabels.length > 0 ? deviceLabels : ['Sin datos'],
      values: deviceValues.length > 0 ? deviceValues : [0]
    },
    topPages: topPages.length > 0 ? topPages : [
      { page: 'Sin datos', views: 0, avgTimeOnPage: '0:00' }
    ],
    userMetrics: {
      users,
      newUsers,
      sessions,
      bounceRate,
      avgSessionDuration
    },
    usersByCountry: usersByCountry.length > 0 ? usersByCountry : [
      { country: 'Sin datos', users: 0 }
    ]
  };
}

function getMockDataForPeriod(period: string): AnalyticsData {
  let labels: string[] = [];
  let values: number[] = [];
  switch (period) {
    case 'last7days':
      labels = ['27 Mayo', '28 Mayo', '29 Mayo', '30 Mayo', '31 Mayo', '1 Junio', '2 Junio'];
      values = [180, 220, 250, 310, 290, 350, 380];
      break;
    case 'last30days':
      labels = ['1 Mayo', '5 Mayo', '10 Mayo', '15 Mayo', '20 Mayo', '25 Mayo', '30 Mayo', '2 Junio'];
      values = [120, 190, 210, 250, 220, 280, 350, 380];
      break;
    case 'last90days':
      labels = ['1 Mar', '15 Mar', '1 Abr', '15 Abr', '1 Mayo', '15 Mayo', '1 Junio', '2 Junio'];
      values = [90, 120, 150, 180, 210, 250, 320, 380];
      break;
    case 'lastYear':
      labels = ['Jun 2024', 'Jul 2024', 'Ago 2024', 'Sep 2024', 'Oct 2024', 'Nov 2024', 'Dic 2024', 'Ene 2025', 'Feb 2025', 'Mar 2025', 'Abr 2025', 'May 2025'];
      values = [80, 95, 110, 130, 150, 200, 250, 220, 190, 230, 280, 350];
      break;
    default:
      labels = ['1 Mayo', '5 Mayo', '10 Mayo', '15 Mayo', '20 Mayo', '25 Mayo', '30 Mayo', '2 Junio'];
      values = [120, 190, 210, 250, 220, 280, 350, 380];
  }
  return {
    visitsByDay: {
      labels,
      values
    },
    deviceUsage: {
      labels: ['Móvil', 'Desktop', 'Tablet'],
      values: period === 'last7days' ? [70, 25, 5] : [65, 30, 5]
    },
    topPages: [
      { page: '/dashboard', views: period === 'last7days' ? 845 : 1245, avgTimeOnPage: '2m 35s' },
      { page: '/rewards', views: period === 'last7days' ? 687 : 987, avgTimeOnPage: '3m 12s' },
      { page: '/profile', views: period === 'last7days' ? 565 : 765, avgTimeOnPage: '1m 45s' },
      { page: '/login', views: period === 'last7days' ? 454 : 654, avgTimeOnPage: '0m 58s' },
      { page: '/register', views: period === 'last7days' ? 343 : 543, avgTimeOnPage: '2m 10s' }
    ],
    userMetrics: {
      users: period === 'last7days' ? 1543 : period === 'last30days' ? 2543 : period === 'last90days' ? 5432 : 12543,
      newUsers: period === 'last7days' ? 476 : period === 'last30days' ? 876 : period === 'last90days' ? 1876 : 4321,
      sessions: period === 'last7days' ? 2321 : period === 'last30days' ? 4321 : period === 'last90days' ? 9876 : 23456,
      bounceRate: period === 'last7days' ? 44.3 : period === 'last30days' ? 42.3 : period === 'last90days' ? 40.5 : 38.7,
      avgSessionDuration: period === 'last7days' ? '2m 15s' : period === 'last30days' ? '2m 45s' : period === 'last90days' ? '3m 10s' : '2m 55s'
    },
    usersByCountry: [
      { country: 'España', users: period === 'last7days' ? 1245 : 1845 },
      { country: 'México', users: period === 'last7days' ? 242 : 342 },
      { country: 'Colombia', users: period === 'last7days' ? 106 : 156 },
      { country: 'Argentina', users: period === 'last7days' ? 68 : 98 },
      { country: 'Otros', users: period === 'last7days' ? 72 : 102 }
    ]
  };
}