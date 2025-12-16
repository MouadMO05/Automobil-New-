
export interface Product {
  id: string;
  originalUrl: string;
  title: string;
  description: string;
  images: string[]; // Changed from imageUrl to support gallery
  price: string;
  sources?: string[];
  phoneNumber?: string;
  whatsapp?: string;
}

export interface ProductExtractionResponse {
  title: string;
  description: string;
  images: string[]; // Changed from imageUrl
  price: string;
  phoneNumber?: string;
  whatsapp?: string;
}