import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onRemoveProduct?: (id: string) => void;
  onAddImages?: (id: string, newImages: string[]) => void; // Made optional
  onRemoveImage?: (id: string, imageIndex: number) => void; // Made optional
  onViewDetails?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onRemoveProduct, 
  onAddImages,
  onRemoveImage,
  onViewDetails
}) => {
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Ref to track image count changes for auto-navigation
  const images = product.images && product.images.length > 0 ? product.images : [];
  const prevImageCount = useRef(images.length);

  // Auto-switch to newly added images
  useEffect(() => {
    if (images.length > prevImageCount.current) {
      // Images increased, jump to the first new image
      setCurrentImgIndex(prevImageCount.current);
      setImgError(false);
    }
    prevImageCount.current = images.length;
  }, [images.length]);

  const hasImages = images.length > 0;
  
  // Safe index check
  const displayIndex = currentImgIndex >= images.length ? 0 : currentImgIndex;
  const currentImageUrl = hasImages ? images[displayIndex] : '';

  // Extract hostname for favicon fallback
  let hostname = '';
  try {
    hostname = new URL(product.originalUrl).hostname;
  } catch (e) {
    hostname = 'google.com';
  }
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !onAddImages) return;

    if (images.length >= 10) {
        alert("الحد الأقصى 10 صور لكل منتج");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
    }

    setIsProcessing(true);

    try {
        const promises = Array.from(files).map((file: File) => {
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                    if (e.target?.result && typeof e.target.result === 'string') {
                        resolve(e.target.result);
                    } else {
                        resolve(''); // Fail silently
                    }
                };
                reader.onerror = () => resolve('');
                reader.readAsDataURL(file);
            });
        });

        const results = await Promise.all(promises);
        const validImages = results.filter(s => s !== '');
        
        if (validImages.length > 0) {
            onAddImages(product.id, validImages);
        }
    } catch (error) {
        console.error("Upload error", error);
        alert("حدث خطأ أثناء رفع الصور");
    } finally {
        setIsProcessing(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }
  };

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImgIndex((prev) => (prev + 1) % images.length);
      setImgError(false);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImgIndex((prev) => (prev - 1 + images.length) % images.length);
      setImgError(false);
    }
  };

  const removeCurrentImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRemoveImage) {
        onRemoveImage(product.id, displayIndex);
        if (displayIndex >= images.length - 1) {
          setCurrentImgIndex(Math.max(0, images.length - 2));
        }
    }
  };

  return (
    <div className="relative group bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden border border-slate-200 flex flex-col h-full select-none">
      
      {/* --- Action Buttons (Top Overlay) --- */}
      
      {/* Delete Product (Top Left) - Only if handler provided */}
      {onRemoveProduct && (
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemoveProduct(product.id);
          }}
          className="absolute top-2 left-2 z-30 bg-white/95 text-red-500 hover:bg-red-500 hover:text-white p-1.5 rounded-full shadow-md cursor-pointer transition-colors"
          title="حذف المنتج بالكامل"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Add Images (Top Right) - Only if handler provided */}
      {onAddImages && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (images.length >= 10) {
                alert("الحد الأقصى 10 صور لكل منتج");
                return;
              }
              fileInputRef.current?.click();
            }}
            disabled={isProcessing}
            className="absolute top-2 right-2 z-30 bg-white/95 text-indigo-600 hover:bg-indigo-600 hover:text-white p-1.5 rounded-full shadow-md transition-colors cursor-pointer disabled:opacity-50"
            title="إضافة صور"
          >
            {isProcessing ? (
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            className="hidden" 
            accept="image/*"
            multiple 
          />
        </>
      )}


      {/* --- Image Area / Slider (Square) --- */}
      <div className="relative w-full aspect-square overflow-hidden bg-white border-b border-gray-100 group/image cursor-default">
        
        {/* Navigation Arrows - Show for everyone if multiple images */}
        {images.length > 1 && (
          <>
            <button 
              onClick={nextImage}
              className="absolute right-1 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button 
              onClick={prevImage}
              className="absolute left-1 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 text-white p-1 rounded-full transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </>
        )}

        {/* Delete Current Image Button - Only visible if onRemoveImage is provided */}
        {hasImages && onRemoveImage && (
          <button
             onClick={removeCurrentImage}
             className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-red-500/90 hover:bg-red-600 text-white p-1.5 rounded-full shadow-sm transition-colors scale-90 cursor-pointer"
             title="حذف الصورة الحالية"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}

        {/* Counter Badge */}
        {images.length > 1 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-[10px] text-white font-mono shadow-sm">
            {displayIndex + 1}/{images.length}
          </div>
        )}

        {/* The Image */}
        {hasImages && !imgError ? (
          <img 
            key={currentImageUrl} /* Force re-render when src changes */
            src={currentImageUrl} 
            alt={`${product.title} - ${displayIndex + 1}`} 
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-300 w-full h-full bg-slate-50/50">
             <img 
               src={faviconUrl} 
               alt="Logo" 
               className="w-10 h-10 opacity-40 mb-1 object-contain"
               onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
             />
             <span className="text-[10px] text-slate-400">لا توجد صور</span>
          </div>
        )}
        
        {/* Price Tag */}
        {product.price && product.price !== '---' && product.price !== 'غير متوفر' && (
          <div className="absolute bottom-1 right-1 bg-emerald-600/95 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
            {product.price}
          </div>
        )}
      </div>

      {/* Info Content - Removed Description */}
      <div className="p-3 flex-grow flex flex-col gap-1 text-right">
        {/* Title Link */}
        <div 
          onClick={() => onViewDetails && onViewDetails(product)}
          className={`group/title block ${onViewDetails ? 'cursor-pointer' : 'cursor-default'}`}
        >
          <h3 className={`font-extrabold text-slate-800 text-sm leading-snug line-clamp-2 ${onViewDetails ? 'group-hover/title:text-indigo-600 transition-colors' : ''}`}>
            {product.title}
          </h3>
        </div>
        
        {onViewDetails && (
          <div className="mt-auto pt-2 flex items-center justify-between">
            <button 
               onClick={(e) => {
                 e.stopPropagation();
                 onViewDetails(product);
               }}
              className="text-indigo-600 text-[10px] font-medium flex items-center gap-0.5 hover:underline cursor-pointer bg-transparent border-none p-0"
            >
              <span>التفاصيل</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};