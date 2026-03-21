export interface SliderItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  buttonUrl: string;
  active: boolean;
}

export interface InfoCard {
  id: string;
  title: string;
  content: string;
  iconClass: string;
  contactUrl: string;
  buttonText?: string;
  active: boolean;
  orden: number;
}

export interface FeaturedItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  url: string;
}

export type ContentType = 'slider' | 'card' | 'featured';
