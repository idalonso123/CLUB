export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone: string;
  address?: string;
  city?: string;
  postalCode?: string;
  points: number;
  registrationDate: string;
  photo?: string;
  photoUrl?: string;
  birthDate?: string;
  country?: string;
  status?: number;
  enabled?: boolean | number;
}

export interface PropertyData {
  characteristics: string[];
  animals: string[];
  description: string;
  surfaceArea: number;
}

export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phonePrefix: string;
  phone: string;
  address?: string;
  city: string;
  postalCode: string;
  country: string;
  points: number;
  birthDate?: string;
  property?: PropertyData;
}

export interface EditingState {
  personalInfo: boolean;
  security: boolean;
  contact: boolean;
  location: boolean;
  property: boolean;
}

export interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}