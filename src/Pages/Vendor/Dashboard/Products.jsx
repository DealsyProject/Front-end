import { useState, useEffect, useCallback, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProductModal from '../../../Components/Vendor/Dashboard/modals/ProductModal';
import Sidebar from '../../../Components/Vendor/Dashboard/Sidebar';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../Components/utils/axiosInstance';

const Products = () => {
  const navigate = useNavigate();
  const isFetchingRef = useRef(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('tempUserData');
    navigate('/');
  }, [navigate]);

  const activeView = 'products';

  // Pagination & filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Server response data
  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPreviousPage, setHasPreviousPage] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const categories = [
    { id: 'all', name: 'All Products' },
    { id: 'Grocery', name: 'Grocery' },
    { id: 'Furniture', name: 'Furniture' },
    { id: 'Books', name: 'Books' },
    { id: 'Home Appliance', name: 'Home Appliance' },
    { id: 'Cloth', name: 'Cloth' },
  ];

  const [newProduct, setNewProduct] = useState({
    productName: '',
    description: '',
    price: 0,
    quantity: 1,
    productCategory: '',
    images: [],
    rating: 0,
  });

  const handleApiError = useCallback(
    (error, defaultMessage) => {
      console.error('API Error:', error);

      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        handleLogout();
        return;
      }

      if (error.response?.status === 403) {
        toast.error('You do not have permission to perform this action.');
        return;
      }

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.errorMessage ||
        defaultMessage;
      toast.error(errorMessage);
    },
    [handleLogout]
  );

  // Normalize incoming PascalCase → camelCase
  const normalizeProductData = (product) => {
    if (!product) return null;

    return {
      id: product.Id || product.id,
      vendorId: product.VendorId,
      vendorName: product.VendorName,
      productName: product.ProductName,
      description: product.Description,
      price: product.Price,
      quantity: product.Quantity,
      rating: product.Rating || 0,
      productCategory: product.ProductCategory,
      createdOn: product.CreatedOn,
      modifiedOn: product.ModifiedOn,
      images: (product.ProductImages || product.Images || []).map((image) => ({
        id: image.Id,
        imageUrl: image.ImageUrl || image.imageUrl,
        imageOrder: image.ImageOrder,
        isPrimary: image.IsPrimary,
      })),
    };
  };

  // Fetch paginated products from new endpoint
  const fetchProducts = useCallback(async () => {
    if (isFetchingRef.current) return;

    try {
      isFetchingRef.current = true;
      setLoading(true);

      const params = new URLSearchParams({
        pageNumber: currentPage,
        pageSize: 6,
        category: activeCategory === 'all' ? '' : activeCategory,
        searchTerm: searchTerm.trim(),
      });

      const response = await axiosInstance.get(
        `/Product/my-products/paginated?${params.toString()}`
      );

      const data = response.data; // PaginatedProductResponseDto

      // FIX: Handle both PascalCase and camelCase response properties
      const productsArray = data.Products || data.products || [];
      const normalized = productsArray.map(normalizeProductData);

      setProducts(normalized);
      setTotalPages(data.TotalPages || data.totalPages || 1);
      setTotalCount(data.TotalCount || data.totalCount || 0);
      setHasNextPage(data.HasNextPage || data.hasNextPage || false);
      setHasPreviousPage(data.HasPreviousPage || data.hasPreviousPage || false);

      if (normalized.length === 0 && currentPage === 1) {
        toast.info('No products found. Add your first product!');
      }
    } catch (error) {
      handleApiError(error, 'Failed to load products');
      setProducts([]);
      setTotalPages(1);
      setTotalCount(0);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [currentPage, activeCategory, searchTerm, handleApiError]);

  // Trigger fetch when page/category/search changes
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset to page 1 when category or search changes
  const handleCategoryFilter = (categoryId) => {
    setActiveCategory(categoryId);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    if (!e.target.value.trim()) {
      setCurrentPage(1);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      setCurrentPage(1);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add / Update / Delete handlers remain the same
  const handleAddProduct = () => {
    setNewProduct({
      productName: '',
      description: '',
      price: 0,
      quantity: 1,
      productCategory: '',
      images: [],
      rating: 0,
    });
    setShowAddModal(true);
  };

  const handleUpdateProduct = (product) => {
    setEditingProduct(product);

    const existingImageUrls = (product.images || []).map((img) => img.imageUrl);

    setNewProduct({
      productName: product.productName || '',
      description: product.description || '',
      price: product.price || 0,
      quantity: product.quantity || 1,
      productCategory: product.productCategory || '',
      images: existingImageUrls, // keep old URLs (backend handles deletion separately if needed)
      rating: product.rating || 0,
    });
    setShowUpdateModal(true);
  };

  const validateProduct = () => {
    if (!newProduct.productName?.trim()) return toast.error('Product Name is required!'), false;
    if (!newProduct.productCategory?.trim()) return toast.error('Category is required!'), false;
    if (!newProduct.description?.trim()) return toast.error('Description is required!'), false;
    if (newProduct.price <= 0) return toast.error('Price must be > 0!'), false;
    if (newProduct.quantity < 0) return toast.error('Quantity cannot be negative!'), false;
    if (newProduct.images.length === 0) return toast.error('At least 1 image required!'), false;
    if (newProduct.images.length > 3) return toast.error('Maximum 3 images allowed!'), false;
    return true;
  };

  const handleSaveNewProduct = async () => {
    if (!validateProduct()) return;
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('productName', newProduct.productName.trim());
      formData.append('description', newProduct.description.trim());
      formData.append('price', parseFloat(newProduct.price));
      formData.append('quantity', parseInt(newProduct.quantity));
      formData.append('productCategory', newProduct.productCategory.trim());
      formData.append('rating', parseFloat(newProduct.rating) || 0);

      newProduct.images.forEach((img) => {
        if (img instanceof File) formData.append('images', img);
      });

      await axiosInstance.post('/Product/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Product added successfully!');
      setShowAddModal(false);
      setCurrentPage(1); // go back to first page
      fetchProducts();
    } catch (error) {
      handleApiError(error, 'Failed to add product');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUpdatedProduct = async () => {
    if (!validateProduct()) return;
    setSaving(true);
    try {
      const productId = editingProduct.id;
      const formData = new FormData();

      formData.append('Id', productId);
      formData.append('productName', newProduct.productName.trim());
      formData.append('description', newProduct.description.trim());
      formData.append('price', parseFloat(newProduct.price));
      formData.append('quantity', parseInt(newProduct.quantity));
      formData.append('productCategory', newProduct.productCategory.trim());
      formData.append('rating', parseFloat(newProduct.rating) || 0);

      // Only append new files (strings = old URLs, File = new)
      newProduct.images.forEach((img) => {
        if (img instanceof File) formData.append('images', img);
      });

      await axiosInstance.put(`/Product/update/${productId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Product updated successfully!');
      setShowUpdateModal(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      handleApiError(error, 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Delete this product permanently?')) return;

    try {
      await axiosInstance.delete(`/Product/delete/${productId}`);
      toast.success('Product deleted!');
      fetchProducts();
    } catch (error) {
      handleApiError(error, 'Failed to delete product');
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (newProduct.images.length + files.length > 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }

    const validFiles = files.filter((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        return false;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        toast.error(`Invalid file type: ${file.name}`);
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setNewProduct((prev) => ({
        ...prev,
        images: [...prev.images, ...validFiles],
      }));
      toast.success(`${validFiles.length} image(s) added`);
    }
    e.target.value = '';
  };

  const handleRemoveImage = (index) => {
    setNewProduct((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    toast.info('Image removed');
  };

  const formatPrice = (price) => `₹${parseFloat(price).toLocaleString('en-IN')}`;

  const renderRating = (rating) => (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`text-sm ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      ))}
      <span className="text-xs text-gray-600 ml-1">({rating})</span>
    </div>
  );

  // Pagination UI helpers
  const getPageNumbers = () => {
    const pages = [];
    const max = 5;
    let start = Math.max(1, currentPage - Math.floor(max / 2));
    let end = Math.min(totalPages, start + max - 1);
    if (end - start + 1 < max) start = Math.max(1, end - max + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  const ProductCard = ({ product }) => {
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const images = product.images || [];
    const hasMultiple = images.length > 1;

    const getImageUrl = (img) =>
      img?.imageUrl || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400';

    const primaryImage = images.find((i) => i.isPrimary) || images[0];
    const displayImage = images[selectedImageIndex] ? getImageUrl(images[selectedImageIndex]) : getImageUrl(primaryImage);

    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition duration-300 border border-gray-200">
        <div className="h-48 bg-gray-200 overflow-hidden relative group">
          <img
            src={displayImage}
            alt={product.productName}
            className="w-full h-full object-cover hover:scale-105 transition"
            onError={(e) => (e.target.src = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400')}
          />
          {product.quantity === 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm">
              Out of Stock
            </div>
          )}
          {product.rating > 0 && (
            <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
              ⭐ {product.rating.toFixed(1)}
            </div>
          )}
          {hasMultiple && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              {selectedImageIndex + 1}/{images.length}
            </div>
          )}
          {hasMultiple && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 opacity-0 group-hover:opacity-100 transition">
              <div className="flex gap-2 justify-center">
                {images.map((img, i) => (
                  <button
                    key={img.id || i}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedImageIndex(i);
                    }}
                    className={`w-12 h-12 rounded overflow-hidden ${
                      selectedImageIndex === i ? 'ring-2 ring-white scale-110' : 'opacity-70'
                    }`}
                  >
                    <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <h4 className="text-lg font-semibold text-gray-900 line-clamp-2">
              {product.productName}
            </h4>
            <span className="text-xs text-[#586330] bg-[#586330]/20 px-2 py-1 rounded-full">
              {product.productCategory}
            </span>
          </div>

          <div className="mb-3">
            <span className="text-[#586330] font-bold text-xl">
              {formatPrice(product.price)}
            </span>
            {product.rating > 0 && <div className="mt-1">{renderRating(product.rating)}</div>}
          </div>

          <p className="text-gray-600 mb-4 text-sm line-clamp-3">{product.description}</p>

          <div className="space-y-2 text-sm text-gray-700 mb-4">
            <div className="flex justify-between">
              <span className="font-medium">Stock:</span>
              <span className={product.quantity > 10 ? 'text-green-600' : product.quantity > 0 ? 'text-yellow-600' : 'text-red-600'}>
                {product.quantity} left
              </span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Images:</span>
              <span>{images.length} photo{images.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => handleUpdateProduct(product)}
              className="flex-1 bg-[#586330] text-white py-2 rounded-lg hover:bg-[#586330]/80 transition font-medium text-sm"
            >
              Update
            </button>
            <button
              onClick={() => handleDeleteProduct(product.id)}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar handleLogout={handleLogout} activeView={activeView} />
      <div className="flex-1 p-6 text-black">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Products</h1>
            <p className="text-gray-600 mt-2">Manage your product inventory</p>
          </div>
          <button
            onClick={handleAddProduct}
            className="bg-[#586330] text-white px-6 py-3 rounded-lg hover:bg-[#586330]/80 transition flex items-center space-x-2 font-medium"
          >
            <span className="text-lg">+</span>
            <span>Add Product</span>
          </button>
        </header>

        {/* Search */}
        <div className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Search by name, category, description..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyPress={handleSearchSubmit}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#586330]"
            />
            <button
              onClick={handleSearchSubmit}
              className="px-6 py-3 bg-[#586330] text-white rounded-lg hover:bg-[#586330]/80 font-medium"
            >
              Search
            </button>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex gap-4 mb-8 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryFilter(cat.id)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeCategory === cat.id
                  ? 'bg-[#586330] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-[#586330] border-t-transparent"></div>
            <p className="mt-4 text-lg text-gray-600">Loading products...</p>
          </div>
        )}

        {/* Summary */}
        {!loading && (
          <div className="mb-6 flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Showing page {currentPage} of {totalPages} ({totalCount} products)
            </span>
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-md">
            <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl">
              📦
            </div>
            <h3 className="text-xl font-semibold text-gray-600">
              {searchTerm || activeCategory !== 'all' ? 'No products found' : 'No products yet'}
            </h3>
            <p className="text-gray-500 mt-2">
              {searchTerm
                ? 'Try different keywords'
                : activeCategory !== 'all'
                ? `No items in "${categories.find((c) => c.id === activeCategory)?.name}"`
                : 'Start by adding your first product'}
            </p>
            {totalCount === 0 && (
              <button
                onClick={handleAddProduct}
                className="mt-6 bg-[#586330] text-white px-6 py-3 rounded-lg hover:bg-[#586330]/80"
              >
                Add Your First Product
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center mt-10 space-x-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPreviousPage}
              className={`px-4 py-2 rounded-lg ${hasPreviousPage ? 'bg-[#586330] text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              Previous
            </button>

            {getPageNumbers().map((p) => (
              <button
                key={p}
                onClick={() => handlePageChange(p)}
                className={`px-4 py-2 rounded-lg ${currentPage === p ? 'bg-[#586330] text-white' : 'bg-white border border-gray-300'}`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNextPage}
              className={`px-4 py-2 rounded-lg ${hasNextPage ? 'bg-[#586330] text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              Next
            </button>
          </div>
        )}

        {/* Modals */}
        {showAddModal && (
          <ProductModal
            title="Add New Product"
            newProduct={newProduct}
            setNewProduct={setNewProduct}
            onSave={handleSaveNewProduct}
            onClose={() => {
              setShowAddModal(false);
              setNewProduct({ productName: '', description: '', price: 0, quantity: 1, productCategory: '', images: [], rating: 0 });
            }}
            handleImageUpload={handleImageUpload}
            handleRemoveImage={handleRemoveImage}
            categories={categories.filter((c) => c.id !== 'all')}
            isSaving={saving}
          />
        )}

        {showUpdateModal && (
          <ProductModal
            title="Update Product"
            newProduct={newProduct}
            setNewProduct={setNewProduct}
            onSave={handleSaveUpdatedProduct}
            onClose={() => {
              setShowUpdateModal(false);
              setEditingProduct(null);
              setNewProduct({ productName: '', description: '', price: 0, quantity: 1, productCategory: '', images: [], rating: 0 });
            }}
            handleImageUpload={handleImageUpload}
            handleRemoveImage={handleRemoveImage}
            categories={categories.filter((c) => c.id !== 'all')}
            isSaving={saving}
            editingProduct={editingProduct}
          />
        )}

        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </div>
  );
};

export default Products;