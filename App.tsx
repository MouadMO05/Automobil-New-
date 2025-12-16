
import React, { useState, useEffect } from 'react';
import { extractProductDetails } from './services/geminiService';
import { loadProductsFromStorage, saveProductsToStorage } from './services/storageService';
import { Product } from './types';
import { ProductCard } from './components/ProductCard';
import { Spinner } from './components/Spinner';
import { ProductDetails } from './components/ProductDetails';
import { AdUnit } from './components/AdUnit';

const MAX_IMAGES_PER_PRODUCT = 10;

const App: React.FC = () => {
  // State - Initialize directly from storage to prevent data loss on refresh
  const [urlInput, setUrlInput] = useState('');
  const [products, setProducts] = useState<Product[]>(() => loadProductsFromStorage());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [draftProduct, setDraftProduct] = useState<Product | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8); // Default 8 for mobile

  // Responsive Page Size Logic
  useEffect(() => {
    const handleResize = () => {
      // lg breakpoint in Tailwind is usually 1024px.
      // If width >= 1024px (Desktop), show 12 (multiple of 3 and 4). Else (Mobile/Tablet), show 8.
      if (window.innerWidth >= 1024) {
        setItemsPerPage(12);
      } else {
        setItemsPerPage(8);
      }
    };

    // Initial check
    handleResize();

    // Listen for resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save to Storage whenever products change
  useEffect(() => {
    saveProductsToStorage(products);
  }, [products]);

  // Handle Fetching (Creates a Draft)
  const handleFetchProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    // Validate Avito URL
    if (!urlInput.toLowerCase().includes('avito.ma')) {
      setError('يتعذر اضافة الرابط');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, sources } = await extractProductDetails(urlInput);
      
      const newProduct: Product = {
        id: Date.now().toString(),
        originalUrl: urlInput,
        title: data.title,
        description: data.description,
        images: data.images,
        price: data.price,
        sources: sources,
        phoneNumber: data.phoneNumber,
        whatsapp: data.whatsapp,
      };

      setDraftProduct(newProduct);
      setUrlInput('');
    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء جلب تفاصيل المنتج. يرجى التأكد من صحة الرابط.');
    } finally {
      setIsLoading(false);
    }
  };

  // Publish Draft to Main List
  const handlePublishDraft = () => {
    if (draftProduct) {
      setProducts(prev => [draftProduct, ...prev]);
      setDraftProduct(null);
      setCurrentPage(1); // Reset to first page to see the new item
    }
  };

  // Cancel Draft
  const handleCancelDraft = () => {
    setDraftProduct(null);
  };

  const removeProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    setError(null);
    if (selectedProduct?.id === id) {
      setSelectedProduct(null);
    }
    // Adjust page if we deleted the last item on the current page
    const totalPagesAfterDelete = Math.ceil((products.length - 1) / itemsPerPage);
    if (currentPage > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
        setCurrentPage(totalPagesAfterDelete);
    }
  };

  // Image Handler for Draft Product
  const handleAddImagesToDraft = (id: string, newImages: string[]) => {
    if (draftProduct && draftProduct.id === id) {
      const currentImages = draftProduct.images || [];
      const availableSlots = MAX_IMAGES_PER_PRODUCT - currentImages.length;
      if (availableSlots <= 0) return;
      
      const imagesToAdd = newImages.slice(0, availableSlots);
      setDraftProduct({ ...draftProduct, images: [...currentImages, ...imagesToAdd] });
    }
  };

  const handleRemoveImageFromDraft = (id: string, imageIndex: number) => {
    if (draftProduct && draftProduct.id === id) {
      const newImages = [...draftProduct.images];
      newImages.splice(imageIndex, 1);
      setDraftProduct({ ...draftProduct, images: newImages });
    }
  };


  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-['Cairo']">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-700 to-purple-800 text-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setSelectedProduct(null); setDraftProduct(null); }}>
              <div className="bg-white/10 p-1.5 rounded-lg backdrop-blur-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <h1 className="text-lg md:text-xl font-bold tracking-wide">
                معرض السيارات
              </h1>
            </div>
            
            <div className="text-indigo-200 text-xs">
              عدد العروض: {products.length}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-2 md:px-4 mt-6">
        
        {/* AD PLACEMENT: Top Banner */}
        {!selectedProduct && !draftProduct && (
           <AdUnit label="بانر علوي" />
        )}

        {/* VIEW 1: Product Details */}
        {selectedProduct ? (
          <div className="max-w-6xl mx-auto">
            <ProductDetails 
              product={selectedProduct} 
              onBack={() => setSelectedProduct(null)} 
            />
          </div>
        ) : draftProduct ? (
          /* VIEW 2: Draft Mode (Review before Publish) */
          <div className="max-w-md mx-auto animate-fade-in py-6">
             <div className="bg-white rounded-xl shadow-2xl border-2 border-indigo-200 overflow-hidden ring-4 ring-indigo-50">
                <div className="bg-indigo-600 p-4 border-b border-indigo-700 text-center text-white">
                   <h2 className="font-bold text-xl">مراجعة الإعلان قبل النشر</h2>
                   <p className="text-indigo-100 text-sm mt-1 opacity-90">قم بإضافة صور إضافية أو تأكد من التفاصيل</p>
                </div>
                
                <div className="p-6 bg-slate-50 flex justify-center">
                   <div className="w-[280px] shadow-lg transform hover:scale-[1.02] transition-transform duration-300">
                      <ProductCard 
                        product={draftProduct}
                        onRemoveProduct={undefined} // Don't show delete icon in draft
                        onAddImages={handleAddImagesToDraft}
                        onRemoveImage={handleRemoveImageFromDraft}
                        onViewDetails={undefined} // Don't allow clicking details in draft
                      />
                   </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-100 flex flex-col gap-3">
                   <button 
                     onClick={handlePublishDraft}
                     className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-lg"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                     </svg>
                     نشر الإعلان الآن
                   </button>
                   
                   <button 
                     onClick={handleCancelDraft}
                     className="w-full py-3 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-lg font-bold transition-all text-sm"
                   >
                     إلغاء العملية
                   </button>
                </div>
             </div>
          </div>
        ) : (
          /* VIEW 3: Main List & Input */
          <>
            {/* Input Form */}
            <div className="max-w-4xl mx-auto mb-8 animate-fade-in-down">
              <div className="bg-white rounded-xl shadow-lg p-4 md:p-6 border border-slate-100 relative overflow-hidden">
                <form onSubmit={handleFetchProduct} className="flex flex-col md:flex-row gap-3">
                  <div className="flex-grow relative">
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder=""
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 text-sm"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="font-bold py-3 px-6 rounded-lg transition-all shadow-md flex items-center justify-center gap-2 min-w-[120px] text-sm bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <Spinner />
                        <span>جلب...</span>
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span>إضافة</span>
                      </>
                    )}
                  </button>
                </form>
                
                <div className="flex justify-between items-center mt-2 px-1">
                  <span className="text-xs font-medium text-slate-400">
                    عدد العروض الكلي: {products.length}
                  </span>
                </div>

                {error && (
                  <div className="mt-3 p-3 bg-red-50 text-red-600 rounded-lg border border-red-100 flex items-center gap-2 text-sm animate-pulse">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                  </div>
                )}
              </div>
            </div>

            {/* AD PLACEMENT: Middle Banner (Above Grid) */}
            <div className="max-w-4xl mx-auto">
               <AdUnit label="بانر وسط" />
            </div>

            {/* Product Grid - Vertical Scrolling */}
            <div className="mb-20">
              {products.length === 0 ? (
                <div className="text-center py-16 opacity-60">
                  <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-slate-600">
                    لا توجد عروض حالياً
                  </h3>
                  <p className="text-slate-400 text-sm mt-1">أضف رابط منتج في الأعلى للبدء</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4 px-1">
                    <h2 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                      <span>أحدث العروض</span>
                      <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full">
                        صفحة {currentPage} من {totalPages}
                      </span>
                    </h2>
                  </div>
                  
                  {/* Grid Layout Container */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 mb-8">
                    {currentProducts.map((product) => (
                      <div key={product.id} className="w-full">
                        <ProductCard 
                          product={product} 
                          onRemoveProduct={removeProduct}
                          // onAddImages removed for published products
                          // onRemoveImage removed for published products
                          onViewDetails={setSelectedProduct}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {products.length > itemsPerPage && (
                    <div className="flex items-center justify-center gap-4 mt-8 mb-8">
                        <button 
                          onClick={goToPrevPage}
                          disabled={currentPage === 1}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                            currentPage === 1 
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                              : 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-sm border border-indigo-100'
                          }`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          السابق
                        </button>
                        
                        <div className="text-sm font-semibold text-slate-500">
                           {currentPage} / {totalPages}
                        </div>

                        <button 
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                            currentPage === totalPages 
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                              : 'bg-white text-indigo-600 hover:bg-indigo-50 shadow-sm border border-indigo-100'
                          }`}
                        >
                          التالي
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default App;
