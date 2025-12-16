
import React, { useState } from 'react';
import { Product } from '../types';
import { AdUnit } from './AdUnit';

interface ProductDetailsProps {
  product: Product;
  onBack: () => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ product, onBack }) => {
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);

  // Fallback if no images
  const images = product.images && product.images.length > 0 ? product.images : [];
  
  // Hostname for display or fallback link
  let hostname = '';
  try {
    hostname = new URL(product.originalUrl).hostname;
  } catch (e) {
    hostname = 'الموقع الأصلي';
  }

  // Helper to generate WhatsApp link
  // 1. Use explicit whatsapp link if available
  // 2. Generate from phone number if available
  const getWhatsAppLink = (phone?: string): string | null => {
    if (!phone) return null;
    let cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '212' + cleanPhone.substring(1);
    }
    return `https://wa.me/${cleanPhone}`;
  };

  const explicitWhatsapp = product.whatsapp;
  const derivedWhatsapp = getWhatsAppLink(product.phoneNumber);
  const finalWhatsappLink = explicitWhatsapp || derivedWhatsapp;

  // Has ANY contact method?
  const hasContactMethod = !!product.phoneNumber || !!finalWhatsappLink;

  return (
    <div className="bg-white rounded-xl shadow-xl min-h-[500px] border border-slate-100 overflow-hidden animate-fade-in">
      {/* Header Bar */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-600 hover:text-indigo-600 font-bold transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>رجوع للقائمة</span>
        </button>
        <div className="text-sm font-semibold text-slate-400">
          تفاصيل المنتج
        </div>
      </div>

      <div className="p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Right Column: Image Gallery */}
        <div className="flex flex-col gap-4">
          {/* Main Large Image */}
          <div className="relative aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
            {images.length > 0 ? (
              <img 
                src={images[selectedImgIndex]} 
                alt={product.title} 
                className="w-full h-full object-contain mix-blend-multiply"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                لا توجد صور متاحة
              </div>
            )}
            
            {product.price && product.price !== '---' && (
              <div className="absolute top-4 right-4 bg-emerald-600 text-white text-lg font-bold px-4 py-2 rounded-lg shadow-md">
                {product.price}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImgIndex(idx)}
                  className={`relative w-20 h-20 shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImgIndex === idx 
                      ? 'border-indigo-600 shadow-md ring-2 ring-indigo-100' 
                      : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`Thumbnail ${idx}`} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Left Column: Details */}
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 leading-tight mb-4">
            {product.title}
          </h1>

          <div className="prose prose-slate max-w-none mb-8">
            <h3 className="text-lg font-bold text-slate-700 mb-2">الوصف:</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line text-base bg-slate-50 p-4 rounded-xl border border-slate-100">
              {product.description || "لا يوجد وصف متاح."}
            </p>
          </div>

          {product.sources && product.sources.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-bold text-slate-400 uppercase mb-2">المصادر المعتمدة:</h3>
              <div className="flex flex-wrap gap-2">
                {product.sources.map((source, idx) => (
                  <a 
                    key={idx}
                    href={source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors border border-indigo-100 truncate max-w-xs"
                  >
                    {new URL(source).hostname}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-auto pt-6 border-t border-slate-100 flex flex-col gap-3">
            {hasContactMethod ? (
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Phone Call Button - Only if Phone Number exists */}
                {product.phoneNumber && (
                  <a 
                    href={`tel:${product.phoneNumber}`}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-center font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-emerald-200 flex items-center justify-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>اتصال {product.phoneNumber}</span>
                  </a>
                )}

                {/* WhatsApp Button - If explicit OR derived link exists */}
                {finalWhatsappLink && (
                  <a 
                    href={finalWhatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-[#25D366] hover:bg-[#20b858] text-white text-center font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg hover:shadow-green-200 flex items-center justify-center gap-2"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span>واتساب</span>
                  </a>
                )}
              </div>
            ) : (
              // Fallback: View on Site Button (If NO contact info)
              <a 
                href={product.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-800 hover:bg-slate-900 text-white text-center font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
              >
                <span>مشاهدة في {hostname}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
          
          {/* AD PLACEMENT: Bottom Details Banner */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <AdUnit label="بانر سفلي للتفاصيل" />
          </div>

        </div>
      </div>
    </div>
  );
};
