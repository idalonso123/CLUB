import { countries } from 'countries-list';

// Tipos para el formato de la aplicación
export interface CountryData {
  code: string;
  name: string;
  format: string;
  example: string;
}

// Mapeo de códigos de país a formatos de código postal
// Basado en estándares ISO y formatos postales comunes
const postalCodeFormats: Record<string, { format: string; example: string }> = {
  AD: { format: 'AD000', example: 'AD100' },
  AR: { format: '0000', example: '1601' },
  AT: { format: '0000', example: '1010' },
  AU: { format: '0000', example: '0200' },
  BD: { format: '0000', example: '1000' },
  BE: { format: '0000', example: '1000' },
  BG: { format: '0000', example: '1000' },
  BR: { format: '00000-000', example: '01000-000' },
  CA: { format: 'A0A 0A0', example: 'K1A 0B1' },
  CH: { format: '0000', example: '1000' },
  CL: { format: '0000000', example: '1234567' },
  CN: { format: '000000', example: '100000' },
  CO: { format: '000000', example: '110000' },
  CZ: { format: '000 00', example: '100 00' },
  DE: { format: '00000', example: '01067' },
  DK: { format: '0000', example: '0800' },
  DO: { format: '00000', example: '10101' },
  EC: { format: '000000', example: '170102' },
  EE: { format: '00000', example: '15010' },
  ES: { format: '00000', example: '01001' },
  FI: { format: '00000', example: '00002' },
  FR: { format: '00000', example: '01000' },
  GB: { format: 'AA0 0AA', example: 'AB1 0AB' },
  GR: { format: '000 00', example: '100 00' },
  HK: { format: '000000', example: '000000' },
  HR: { format: '00000', example: '10000' },
  HU: { format: '0000', example: '1011' },
  ID: { format: '00000', example: '10000' },
  IE: { format: 'A00 0000', example: 'D01 0000' },
  IL: { format: '0000000', example: '6100000' },
  IN: { format: '000000', example: '110001' },
  IS: { format: '000', example: '101' },
  IT: { format: '00000', example: '00010' },
  JP: { format: '000-0000', example: '100-0001' },
  KR: { format: '00000', example: '12345' },
  LT: { format: '00000', example: '00001' },
  LU: { format: 'L-0000', example: 'L-1009' },
  LV: { format: 'LV-0000', example: 'LV-1001' },
  MA: { format: '00000', example: '10000' },
  MC: { format: '00000', example: '98000' },
  MD: { format: 'MD-0000', example: 'MD-2000' },
  MT: { format: 'AAA 0000', example: 'VLT 1000' },
  MX: { format: '00000', example: '01000' },
  MY: { format: '00000', example: '01000' },
  NL: { format: '0000 AA', example: '1000 AA' },
  NO: { format: '0000', example: '0001' },
  NZ: { format: '0000', example: '0110' },
  PE: { format: '00000', example: '10000' },
  PH: { format: '0000', example: '0400' },
  PK: { format: '00000', example: '10010' },
  PL: { format: '00-000', example: '00-001' },
  PT: { format: '0000-000', example: '1000-001' },
  PY: { format: '0000', example: '1000' },
  RO: { format: '000000', example: '010000' },
  RU: { format: '000000', example: '101000' },
  SA: { format: '00000', example: '10000' },
  SE: { format: '000 00', example: '100 00' },
  SG: { format: '000000', example: '000000' },
  SI: { format: '0000', example: '1000' },
  SK: { format: '000 00', example: '010 01' },
  TH: { format: '00000', example: '10000' },
  TR: { format: '00000', example: '01000' },
  TW: { format: '000', example: '100' },
  UA: { format: '00000', example: '01000' },
  US: { format: '00000', example: '90210' },
  UY: { format: '00000', example: '10000' },
  VE: { format: '0000', example: '1000' },
  VN: { format: '000000', example: '100000' },
  ZA: { format: '0000', example: '1000' },
};

// Función para obtener el formato postal por defecto
const getDefaultPostalFormat = (code: string): { format: string; example: string } => {
  return postalCodeFormats[code] || { format: '00000', example: '00000' };
};

// Función principal para obtener todos los países en el formato de la aplicación
export const getAllCountries = (): CountryData[] => {
  return Object.entries(countries).map(([code, data]: [string, any]) => {
    const postalFormat = getDefaultPostalFormat(code);
    
    return {
      code: code.toUpperCase(),
      name: data.native || data.name,
      format: postalFormat.format,
      example: postalFormat.example,
    };
  }).sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
};

// Función para buscar un país por código
export const getCountryByCode = (code: string): CountryData | undefined => {
  const countries = getAllCountries();
  return countries.find(c => c.code === code.toUpperCase());
};

// Función para buscar países por nombre
export const searchCountries = (query: string): CountryData[] => {
  const countries = getAllCountries();
  const lowerQuery = query.toLowerCase();
  
  return countries.filter(c => 
    c.name.toLowerCase().includes(lowerQuery) ||
    c.code.toLowerCase().includes(lowerQuery)
  );
};

// Exportar en el formato que espera la aplicación
export const countriesData = {
  countries: getAllCountries()
};

export default countriesData;
