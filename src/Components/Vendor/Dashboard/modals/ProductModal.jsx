// Components/Vendor/Dashboard/modals/ProductModal.jsx
import React, { useState, useEffect } from 'react';

const ProductModal = ({
  title,
  newProduct,
  setNewProduct,
  onSave,
  onClose,
  handleImageUpload,
  handleRemoveImage,
  categories = [], // Now receives array of strings like ["Grocery", "Electronics"]
  isSaving = false,
  editingProduct = null
}) => {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Fallback categories removed — we now rely 100% on props
  // If no categories passed, show loading or empty state

  const isFileObject = (img) => img instanceof File;
  const isImageUrl = (img) => typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:'));

  const getImageSrc = (img) => {
    if (isFileObject(img)) {
      return URL.createObjectURL(img);
    } else if (isImageUrl(img)) {
      return img;
    }
    return 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400';
  };

  const handleInputChange = (field, value) => {
    setNewProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleNumberInputChange = (field, value) => {
    const numValue = value === '' ? 0 : parseFloat(value) || 0;
    setNewProduct(prev => ({ ...prev, [field]: numValue }));
  };

  const existingImages = newProduct.images?.filter(isImageUrl) || [];
  const newImages = newProduct.images?.filter(isFileObject) || [];
  const totalImages = existingImages.length + newImages.length;

  useEffect(() => {
    if (activeImageIndex >= totalImages && totalImages > 0) {
      setActiveImageIndex(totalImages - 1);
    } else if (totalImages === 0) {
      setActiveImageIndex(0);
    }
  }, [totalImages, activeImageIndex]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="bg-[#586330] text-white p-6">
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-green-100 mt-1">Fill in the product details below (Upload up to 3 images)</p>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={newProduct.productName || ''}
                  onChange={(e) => handleInputChange('productName', e.target.value)}
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#586330] outline-none"
                  placeholder="e.g., Organic Apples"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={newProduct.productCategory || ''}
                  onChange={(e) => handleInputChange('productCategory', e.target.value)}
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#586330] bg-white"
                  disabled={categories.length === 0}
                >
                  <option value="">
                    {categories.length === 0 ? 'No categories available' : 'Select a category'}
                  </option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-xs text-red-600 mt-1">Please create categories first in Admin panel.</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newProduct.price || ''}
                    onChange={(e) => handleNumberInputChange('price', e.target.value)}
                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#586330]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    value={newProduct.quantity || ''}
                    onChange={(e) => handleNumberInputChange('quantity', e.target.value)}
                    className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#586330]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  rows="5"
                  value={newProduct.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#586330] resize-none"
                  placeholder="Describe features, specifications, benefits..."
                />
              </div>
            </div>

            {/* Right: Images */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Images (1–3) *
                {totalImages > 0 && (
                  <span className="text-xs text-gray-500 ml-2">
                    ({existingImages.length} existing • {newImages.length} new)
                  </span>
                )}
              </label>

              {totalImages > 0 ? (
                <div className="space-y-3">
                  <div className="relative">
                    <img
                      src={getImageSrc(newProduct.images[activeImageIndex])}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-lg border-2 border-[#586330]"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                      {activeImageIndex + 1} / {totalImages}
                    </div>
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold ${
                      isFileObject(newProduct.images[activeImageIndex]) ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'
                    }`}>
                      {isFileObject(newProduct.images[activeImageIndex]) ? 'NEW' : 'KEPT'}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3">
                    {newProduct.images.map((img, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={getImageSrc(img)}
                          onClick={() => setActiveImageIndex(i)}
                          className={`w-full h-20 object-cover rounded cursor-pointer border-2 transition-all ${
                            i === activeImageIndex ? 'border-[#586330] ring-4 ring-[#586330]/30' : 'border-gray-300'
                          }`}
                          alt={`Thumb ${i + 1}`}
                        />
                        <button
                          onClick={(e) => { e.stopPropagation(); handleRemoveImage(i); }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {totalImages < 3 && (
                      <label className="cursor-pointer">
                        <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                        <div className="h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-[#586330] hover:bg-gray-50">
                          <span className="text-3xl text-gray-400">+</span>
                        </div>
                      </label>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                  <div className="text-2xl mb-4">Add images</div>
                  <p className="text-gray-600 font-medium">No images yet</p>
                  <label>
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                    <div className="mt-4 inline-block px-6 py-3 bg-[#586330] text-white rounded-lg hover:bg-[#4b572a] cursor-pointer">
                      Upload Images
                    </div>
                  </label>
                </div>
              )}

              <p className="text-xs text-gray-500 bg-blue-50 p-3 rounded border border-blue-200">
                Supported: JPEG, PNG, WebP • Max 5MB • Up to 3 images
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={isSaving || categories.length === 0}
            className="px-6 py-3 bg-[#586330] text-white rounded-lg hover:bg-[#4b572a] disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              editingProduct ? 'Update Product' : 'Save Product'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;