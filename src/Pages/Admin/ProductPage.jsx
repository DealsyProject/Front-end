import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, AlertTriangle, Eye, Download, Bell, X, Star, Calendar, Package, User, Tag, Plus, Edit, Trash2, List } from 'lucide-react';
import Navbar from '../../Components/Admin/Navbar.jsx';
import axiosInstance from '../../Components/utils/axiosInstance.js';
import { toast } from 'react-toastify';

// Product Detail Modal Component
const ProductDetailModal = ({ product, isOpen, onClose }) => {
  if (!isOpen || !product) return null;

  const getProductImage = (product) => {
    if (!product.Images || product.Images.length === 0) {
      return null;
    }
    
    if (product.Images[0] && typeof product.Images[0] === 'object' && product.Images[0].ImageData) {
      return product.Images[0].ImageData;
    }
    
    if (typeof product.Images[0] === 'string') {
      return product.Images[0];
    }
    
    return null;
  };

  const getStatusColor = (product) => {
    if (product.Quantity <= 0) {
      return 'bg-red-100 text-red-700 border border-red-200';
    } else if (product.Quantity <= 10) {
      return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    } else {
      return 'bg-[#e5e9d3] text-[#586330] border border-[#a5ad8b]';
    }
  };

  const getStatusText = (product) => {
    if (product.Quantity <= 0) return 'Out of Stock';
    if (product.Quantity <= 10) return 'Low Stock';
    return 'In Stock';
  };

  const productImage = getProductImage(product);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#586330] rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Product Details</h2>
              <p className="text-gray-500">Complete information about {product.ProductName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Images and Basic Info */}
            <div className="space-y-6">
              {/* Product Image */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                {productImage ? (
                  <img 
                    src={productImage} 
                    alt={product.ProductName}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-64 bg-[#e5e9d3] rounded-lg flex items-center justify-center">
                    <Package className="w-16 h-16 text-[#586330]" />
                  </div>
                )}
                
                {/* Image Gallery */}
                {product.Images && product.Images.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto">
                    {product.Images.slice(0, 3).map((image, index) => (
                      <div key={index} className="flex-shrink-0">
                        <img 
                          src={typeof image === 'object' ? image.ImageData : image}
                          alt={`${product.ProductName} ${index + 1}`}
                          className="w-16 h-16 object-cover rounded border border-gray-300"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Stock</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{product.Quantity}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(product)}`}>
                    {getStatusText(product)}
                  </span>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium text-green-800">Price</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mt-1">${product.Price}</p>
                  <span className="text-xs text-green-700">Current price</span>
                </div>
              </div>
            </div>

            {/* Right Column - Detailed Information */}
            <div className="space-y-6">
              {/* Product Name and Rating */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.ProductName}</h1>
                {product.Rating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.Rating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-lg font-semibold text-gray-700">{product.Rating}</span>
                    <span className="text-gray-500">rating</span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-200">
                  {product.Description || 'No description available.'}
                </p>
              </div>

              {/* Product Details Grid */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <User className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Vendor</p>
                    <p className="font-semibold text-gray-900">{product.VendorName || 'Unknown Vendor'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Tag className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Category</p>
                    <p className="font-semibold text-gray-900 capitalize">{product.ProductCategory?.toLowerCase()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Created On</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(product.CreatedOn).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {product.ModifiedOn && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(product.ModifiedOn).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Images Count */}
              {product.Images && product.Images.length > 0 && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Package className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-600">Total Images</p>
                    <p className="font-semibold text-purple-900">{product.Images.length} image(s)</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Add Category Modal Component
const AddCategoryModal = ({ isOpen, onClose, onAddCategory, editingCategory, onUpdateCategory, onDeleteCategory }) => {
  const [categoryName, setCategoryName] = useState(editingCategory?.name || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editingCategory) {
      setCategoryName(editingCategory.name);
    } else {
      setCategoryName('');
    }
  }, [editingCategory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    setIsLoading(true);
    try {
      if (editingCategory) {
        await onUpdateCategory({
          ...editingCategory,
          name: categoryName.trim(),
        });
      } else {
        await onAddCategory({
          name: categoryName.trim(),
        });
      }
      setCategoryName('');
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editingCategory) return;
    
    if (window.confirm(`Are you sure you want to delete the category "${editingCategory.name}"? This action cannot be undone.`)) {
      setIsLoading(true);
      try {
        await onDeleteCategory(editingCategory.id);
        onClose();
      } catch (error) {
        console.error('Error deleting category:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#586330] rounded-lg">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <p className="text-gray-500">
                {editingCategory ? 'Update category details' : 'Create a new product category'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#586330] focus:border-transparent"
                placeholder="Enter category name"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            {editingCategory && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#586330] hover:bg-[#4b572a] text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {editingCategory ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  {editingCategory ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Category List Component
const CategoryList = ({ categories, onEditCategory, onDeleteCategory, products }) => {
  // Calculate product count for each category
  const getProductCount = (categoryName) => {
    if (categoryName === 'All') return products.length;
    return products.filter(product => product.ProductCategory === categoryName).length;
  };

  // Filter out 'All' from categories for display
  const displayCategories = categories.filter(cat => cat !== 'All');

  if (displayCategories.length === 0) {
    return (
      <div className="text-center py-8">
        <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No categories found. Add your first category!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayCategories.map((category) => {
        const productCount = getProductCount(category);
        const isCategoryEmpty = productCount === 0;
        
        return (
          <div 
            key={category} 
            className={`bg-white rounded-lg border ${isCategoryEmpty ? 'border-gray-300' : 'border-[#a5ad8b]'} shadow-sm hover:shadow-md transition-shadow p-4`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isCategoryEmpty ? 'bg-gray-100' : 'bg-[#e5e9d3]'}`}>
                  <Tag className={`w-5 h-5 ${isCategoryEmpty ? 'text-gray-500' : 'text-[#586330]'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 capitalize">{category.toLowerCase()}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${isCategoryEmpty ? 'bg-gray-100 text-gray-700' : 'bg-blue-100 text-blue-700'}`}>
                      {productCount} {productCount === 1 ? 'product' : 'products'}
                    </span>
                    {isCategoryEmpty && (
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                        Empty
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditCategory(category)}
                  className="p-1.5 text-gray-500 hover:text-[#586330] transition-colors rounded hover:bg-gray-100"
                  title="Edit Category"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (productCount > 0) {
                      toast.warning(`Cannot delete category "${category}" because it has ${productCount} products.`);
                    } else {
                      if (window.confirm(`Delete category "${category}"?`)) {
                        onDeleteCategory(category);
                      }
                    }
                  }}
                  className={`p-1.5 transition-colors rounded ${
                    productCount > 0 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                  }`}
                  title={productCount > 0 ? "Cannot delete - has products" : "Delete Category"}
                  disabled={productCount > 0}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Products in this category (preview) */}
            {productCount > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Recent products in this category:</p>
                <div className="space-y-1">
                  {products
                    .filter(product => product.ProductCategory === category)
                    .slice(0, 3)
                    .map(product => (
                      <div key={product.Id} className="flex items-center justify-between text-sm">
                        <span className="truncate text-gray-700">{product.ProductName}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${product.Quantity <= 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {product.Quantity} left
                        </span>
                      </div>
                    ))}
                  {productCount > 3 && (
                    <div className="text-xs text-gray-500 text-center pt-1">
                      + {productCount - 3} more products
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [viewMode, setViewMode] = useState('table');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [notifiedProducts, setNotifiedProducts] = useState(new Set());
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [showCategoriesList, setShowCategoriesList] = useState(false);

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axiosInstance.get('/Product/all');
      console.log('API Response:', response.data);
      setProducts(response.data.products || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch products';
      setError(errorMessage);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
  try {
    setCategoryLoading(true);
    // Correct endpoint based on your controller
    const response = await axiosInstance.get('/Category'); // ← Fixed URL
    
    // The response has { Categories: [{ Id, Name }] }
    const categoriesList = response.data.Categories || [];
    
    // Extract just the names as strings
    const categoryNames = categoriesList.map(cat => cat.Name);
    
    setCategories(['All', ...categoryNames]);
  } catch (err) {
    console.error('Error fetching categories:', err);
    toast.error('Failed to load categories');
    
    // Fallback: extract from products
    const productCategories = [...new Set(products.map(p => p.ProductCategory).filter(Boolean))];
    setCategories(['All', ...productCategories]);
  } finally {
    setCategoryLoading(false);
  }
};
  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      fetchCategories();
    }
  }, [products]);

  // View product details
  const viewProductDetails = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  // Close product modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  // Open category modal
  const openCategoryModal = (category = null) => {
    if (typeof category === 'string' && category !== 'All') {
      setEditingCategory({
        id: category,
        name: category
      });
    } else {
      setEditingCategory(category);
    }
    setIsCategoryModalOpen(true);
  };

  // Close category modal
  const closeCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  // Add new category
  const handleAddCategory = async (categoryData) => {
    try {
      // API call to add category
      const response = await axiosInstance.post('/Category', {
        name: categoryData.name
      });
      
      const newCategory = response.data.category || {
        id: Date.now().toString(),
        name: categoryData.name,
        productCount: 0
      };

      // Update categories list
      setCategories(prev => {
        const filtered = prev.filter(cat => cat !== 'All' && cat !== newCategory.name);
        return ['All', newCategory.name, ...filtered];
      });

      toast.success(`Category "${newCategory.name}" added successfully`);
      
      // Refresh categories from server
      await fetchCategories();
      
    } catch (err) {
      console.error('Error adding category:', err);
      toast.error(err.response?.data?.message || 'Failed to add category');
      throw err;
    }
  };

  // Update existing category
  const handleUpdateCategory = async (categoryData) => {
    try {
      // API call to update category
      await axiosInstance.put(`/Category/${categoryData.id}`, {
        name: categoryData.name
      });
      
      toast.success(`Category "${categoryData.name}" updated successfully`);
      
      // Update categories list
      setCategories(prev => {
        const updated = prev.map(cat => 
          cat === editingCategory.name ? categoryData.name : cat
        );
        return updated;
      });

      // Update products with the new category name
      setProducts(prev => 
        prev.map(product => 
          product.ProductCategory === editingCategory.name 
            ? { ...product, ProductCategory: categoryData.name }
            : product
        )
      );
      
    } catch (err) {
      console.error('Error updating category:', err);
      toast.error(err.response?.data?.message || 'Failed to update category');
      throw err;
    }
  };

  // Delete category
  const handleDeleteCategory = async (categoryName) => {
    try {
      // First check if category has products
      const productCount = products.filter(p => p.ProductCategory === categoryName).length;
      if (productCount > 0) {
        toast.error(`Cannot delete category "${categoryName}" because it has ${productCount} products.`);
        return;
      }

      // API call to delete category (you'll need to get the category ID first)
      // For now, simulate deletion
      // await axiosInstance.delete(`/Product/categories/${categoryId}`);
      
      // Update categories list
      setCategories(prev => prev.filter(cat => cat !== categoryName));
      
      toast.success(`Category "${categoryName}" deleted successfully`);
      
    } catch (err) {
      console.error('Error deleting category:', err);
      toast.error(err.response?.data?.message || 'Failed to delete category');
      throw err;
    }
  };

  // Send out-of-stock notification to vendor
  const sendOutOfStockNotification = async (product) => {
    try {
      if (notifiedProducts.has(product.Id)) {
        toast.info(`Notification already sent to vendor for "${product.ProductName}"`);
        return;
      }

      const notificationData = {
        vendorId: product.VendorId,
        productId: product.Id,
        productName: product.ProductName,
        message: `Your product "${product.ProductName}" is out of stock. Please restock to continue sales.`,
        priority: 'HIGH'
      };

      const response = await axiosInstance.post('/Notification/out-of-stock', notificationData);
      
      setNotifiedProducts(prev => new Set([...prev, product.Id]));
      toast.success(`Out-of-stock notification sent to vendor for "${product.ProductName}"`);
      console.log('Notification sent:', response.data);
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to send notification';
      toast.error(`Failed to send notification: ${errorMessage}`);
      console.error('Error sending notification:', err);
    }
  };

  // Auto-detect and notify out-of-stock products
  useEffect(() => {
    if (products.length > 0) {
      const outOfStockProducts = products.filter(product => 
        product.Quantity <= 0 && !notifiedProducts.has(product.Id)
      );
      
      if (outOfStockProducts.length > 0) {
        console.log(`Found ${outOfStockProducts.length} out-of-stock products that need notification`);
      }
    }
  }, [products, notifiedProducts]);

  // Export products data
  const exportProducts = () => {
    const dataToExport = filteredProducts.map(product => ({
      'Product Name': product.ProductName,
      'Category': product.ProductCategory,
      'Description': product.Description,
      'Price': product.Price,
      'Quantity': product.Quantity,
      'Status': getStatusText(product),
      'Rating': product.Rating || 'N/A',
      'Vendor': product.VendorName || 'Unknown Vendor',
      'Created Date': new Date(product.CreatedOn).toLocaleDateString(),
      'Last Updated': product.ModifiedOn ? new Date(product.ModifiedOn).toLocaleDateString() : 'N/A'
    }));

    const csv = convertToCSV(dataToExport);
    downloadCSV(csv, 'products_export.csv');
  };

  const convertToCSV = (data) => {
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(value => 
      `"${String(value).replace(/"/g, '""')}"`
    ).join(','));
    return [headers, ...rows].join('\n');
  };

  const downloadCSV = (csv, filename) => {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Status helpers
  const getStatusColor = (product) => {
    if (product.Quantity <= 0) {
      return 'bg-red-100 text-red-700 border border-red-200';
    } else if (product.Quantity <= 10) {
      return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    } else {
      return 'bg-[#e5e9d3] text-[#586330] border border-[#a5ad8b]';
    }
  };

  const getStatusText = (product) => {
    if (product.Quantity <= 0) return 'Out of Stock';
    if (product.Quantity <= 10) return 'Low Stock';
    return 'In Stock';
  };

  const getStockIcon = (product) => {
    if (product.Quantity <= 0) {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    } else if (product.Quantity <= 10) {
      return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-600" />;
  };

  // Get image URL
  const getProductImage = (product) => {
    if (!product.Images || product.Images.length === 0) {
      return null;
    }
    
    if (product.Images[0] && typeof product.Images[0] === 'object' && product.Images[0].ImageData) {
      return product.Images[0].ImageData;
    }
    
    if (typeof product.Images[0] === 'string') {
      return product.Images[0];
    }
    
    return null;
  };

  // Filter and sort products
  const filteredProducts = products
    .filter((product) => {
      const matchesSearch =
        product.ProductName?.toLowerCase().includes(search.toLowerCase()) ||
        product.Description?.toLowerCase().includes(search.toLowerCase()) ||
        product.VendorName?.toLowerCase().includes(search.toLowerCase());
      
      const matchesCategory =
        selectedCategory === 'All' || product.ProductCategory === selectedCategory;
      
      const matchesStatus = selectedStatus === 'All' || 
        (selectedStatus === 'active' && product.Quantity > 10) ||
        (selectedStatus === 'low' && product.Quantity <= 10 && product.Quantity > 0) ||
        (selectedStatus === 'inactive' && product.Quantity <= 0);
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'price':
          aValue = a.Price;
          bValue = b.Price;
          break;
        case 'quantity':
          aValue = a.Quantity;
          bValue = b.Quantity;
          break;
        case 'date':
          aValue = new Date(a.CreatedOn);
          bValue = new Date(b.CreatedOn);
          break;
        case 'rating':
          aValue = a.Rating || 0;
          bValue = b.Rating || 0;
          break;
        default:
          aValue = a.ProductName?.toLowerCase();
          bValue = b.ProductName?.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : -1;
      }
      return aValue > bValue ? 1 : -1;
    });

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Grid View Component
  const ProductGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {filteredProducts.map((product) => {
        const productImage = getProductImage(product);
        const isOutOfStock = product.Quantity <= 0;
        const isNotified = notifiedProducts.has(product.Id);
        
        return (
          <div key={product.Id} className="bg-white rounded-lg border border-gray-300 shadow-md hover:shadow-lg transition-shadow">
            <div className="p-4">
              {/* Product Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3 flex-1">
                  {productImage ? (
                    <img 
                      src={productImage} 
                      alt={product.ProductName}
                      className="w-12 h-12 rounded object-cover border border-gray-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-12 h-12 bg-[#e5e9d3] rounded flex items-center justify-center text-sm font-bold text-[#586330] border border-[#a5ad8b] ${productImage ? 'hidden' : 'flex'}`}>
                    {product.ProductName?.[0]?.toUpperCase() || 'P'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{product.ProductName}</h3>
                    <p className="text-sm text-gray-500 truncate">{product.VendorName || 'Unknown Vendor'}</p>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Category:</span>
                  <span className="font-medium capitalize">{product.ProductCategory?.toLowerCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium text-[#586330]">${product.Price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock:</span>
                  <div className="flex items-center gap-1">
                    {getStockIcon(product)}
                    <span className={product.Quantity <= 10 ? 'font-medium' : ''}>
                      {product.Quantity}
                    </span>
                  </div>
                </div>
                {product.Rating > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating:</span>
                    <span className="font-medium">{product.Rating} ★</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Images:</span>
                  <span className="font-medium">{product.Images?.length || 0}</span>
                </div>
              </div>

              {/* Status */}
              <div className="mt-3 flex justify-between items-center">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product)}`}>
                  {getStatusText(product)}
                </span>
                {isOutOfStock && isNotified && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    Notified
                  </span>
                )}
              </div>

              {/* Actions */}
              <div className="flex justify-center mt-4 pt-3 border-t border-gray-200">
                {isOutOfStock && !isNotified && (
                  <button 
                    onClick={() => sendOutOfStockNotification(product)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    title="Notify Vendor - Out of Stock"
                  >
                    <Bell className="w-4 h-4" />
                    Notify Vendor
                  </button>
                )}
                {isOutOfStock && isNotified && (
                  <button 
                    className="flex items-center gap-2 px-4 py-2 bg-gray-400 text-white rounded-lg text-sm font-medium cursor-not-allowed"
                    title="Notification Sent"
                    disabled
                  >
                    <Bell className="w-4 h-4" />
                    Notification Sent
                  </button>
                )}
                {!isOutOfStock && (
                  <button 
                    onClick={() => viewProductDetails(product)}
                    className="p-2 text-gray-500 hover:text-[#586330] transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-gray-900 font-sans w-full">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans w-full">
      <Navbar />
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 sm:px-12 py-4">
        <h1 className="text-xl font-bold text-[#586330]">Marketplace Dashboard</h1>
      </div>

      <main className="pb-16 pt-8 px-6 sm:px-12 lg:px-20">
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError('')}
              className="text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        <div className="mb-2">
          <h2 className="text-3xl sm:text-4xl font-semibold">Product Inventory</h2>
          <p className="text-gray-500 text-sm mt-1">Monitor product stock levels and send notifications to vendors</p>
        </div>

        {/* Controls Bar */}
        <div className="bg-white rounded-lg border border-gray-300 p-4 mb-4 mt-6 flex flex-wrap items-center gap-4 shadow-md">
          <div className="flex-1 relative min-w-full sm:min-w-0">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products by name, description, or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-11 pr-4 py-2 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-[#586330] focus:ring-2 focus:ring-[#586330]/20 transition-colors shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#586330] shadow-sm min-w-[150px]"
              disabled={categoryLoading}
            >
              {categoryLoading ? (
                <option>Loading categories...</option>
              ) : (
                categories.map(category => (
                  <option key={category} value={category}>
                    {typeof category === 'object' ? category.name : category}
                  </option>
                ))
              )}
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#586330] shadow-sm"
          >
            <option value="All">All Statuses</option>
            <option value="active">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="inactive">Out of Stock</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-800 focus:outline-none focus:border-[#586330] shadow-sm"
          >
            <option value="name">Sort by Name</option>
            <option value="price">Sort by Price</option>
            <option value="quantity">Sort by Quantity</option>
            <option value="rating">Sort by Rating</option>
            <option value="date">Sort by Date</option>
          </select>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-sm text-gray-800 hover:bg-gray-200 transition-colors"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'table' 
                  ? 'bg-[#586330] text-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-[#586330] text-white' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Grid
            </button>
          </div>

          <button
            onClick={fetchProducts}
            className="px-4 py-2.5 bg-[#586330] hover:bg-[#4b572a] text-white rounded-lg text-sm font-medium shadow-md transition-colors"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>

          <button
            onClick={exportProducts}
            className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium shadow-md transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {/* Category Management Info */}
        <div className="mb-4 p-4 bg-[#586330]/10 border border-[#586330]/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-[#586330]" />
              <div>
                <h3 className="font-semibold text-[#586330]">Category Management</h3>
                <p className="text-[#586330] text-sm">
                  You have {categories.length - 1} categories. {categories.length - 1 > 0 
                    ? `Showing ${selectedCategory === 'All' ? 'all' : selectedCategory} products.`
                    : 'Add your first category!'
                  }
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCategoriesList(!showCategoriesList)}
                className="px-4 py-2 bg-[#586330]/60 hover:bg-[#586330] text-white rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                {showCategoriesList ? 'Hide Categories' : 'View All Categories'}
              </button>
              <button
                onClick={() => openCategoryModal()}
                className="px-4 py-2 bg-[#586330] hover:bg-[#4b572a] text-white rounded-lg text-sm font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add New Category
              </button>
            </div>
          </div>
        </div>

        {/* Categories List Section (Toggleable) */}
        {showCategoriesList && (
          <div className="mb-6 p-6 bg-white rounded-lg border border-gray-300 shadow-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#586330] rounded-lg">
                  <List className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Product Categories</h3>
                  <p className="text-gray-500 text-sm">
                    Manage all product categories. Click edit or delete to modify categories.
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {categories.length - 1} categories • {products.length} total products
              </div>
            </div>
            
            <CategoryList 
              categories={categories}
              onEditCategory={openCategoryModal}
              onDeleteCategory={handleDeleteCategory}
              products={products}
            />
            
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Tip: Empty categories can be deleted. Categories with products cannot be deleted.
              </p>
            </div>
          </div>
        )}

        {/* Out of Stock Alert */}
        {filteredProducts.filter(p => p.Quantity <= 0).length > 0 && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div>
                  <h3 className="font-semibold text-red-800">Out of Stock Products</h3>
                  <p className="text-red-600 text-sm">
                    {filteredProducts.filter(p => p.Quantity <= 0).length} products are out of stock. 
                    Notify vendors to restock.
                  </p>
                </div>
              </div>
              <div className="text-sm text-red-700 font-medium">
                {filteredProducts.filter(p => p.Quantity <= 0 && !notifiedProducts.has(p.Id)).length} need notification
              </div>
            </div>
          </div>
        )}

        {/* Products Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
          {filteredProducts.filter(p => p.Quantity <= 0).length > 0 && (
            <span className="ml-2 text-red-600">
              ({filteredProducts.filter(p => p.Quantity <= 0).length} out of stock)
            </span>
          )}
        </div>

        {/* Content */}
        {viewMode === 'table' ? (
          <div className="bg-white rounded-lg border border-gray-300 shadow-xl overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Product</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Vendor</th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Stock</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Rating</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                  <th className="text-center px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const productImage = getProductImage(product);
                    const isOutOfStock = product.Quantity <= 0;
                    const isNotified = notifiedProducts.has(product.Id);
                    
                    return (
                      <tr key={product.Id} className="border-b border-gray-200 hover:bg-[#e5e9d3] transition-colors">
                        <td className="px-6 py-4 flex items-center gap-3 text-gray-900">
                          {productImage ? (
                            <img 
                              src={productImage} 
                              alt={product.ProductName}
                              className="w-10 h-10 rounded object-cover border border-[#a5ad8b]"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className={`w-10 h-10 bg-[#e5e9d3] rounded flex items-center justify-center text-sm font-bold text-[#586330] border border-[#a5ad8b] ${productImage ? 'hidden' : 'flex'}`}>
                            {product.ProductName?.[0]?.toUpperCase() || 'P'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium">{product.ProductName}</span>
                            <span className="text-xs text-gray-500 max-w-xs truncate">
                              {product.Description}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {product.VendorName || 'Unknown Vendor'}
                        </td>
                        <td className="px-6 py-4 text-gray-600 capitalize">
                          {product.ProductCategory?.toLowerCase()}
                        </td>
                        <td className="px-6 py-4 text-center text-gray-900 font-medium">
                          ${product.Price}
                        </td>
                        <td className="px-6 py-4 text-center flex items-center justify-center gap-1 text-gray-800">
                          {getStockIcon(product)}
                          <span>{product.Quantity}</span>
                        </td>
                        <td className="px-6 py-4 text-center text-gray-600">
                          {product.Rating ? `${product.Rating} ★` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product)}`}>
                            {getStatusText(product)}
                          </span>
                          {isOutOfStock && isNotified && (
                            <div className="text-xs text-green-600 mt-1">Notified</div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center text-sm text-gray-500">
                          {new Date(product.CreatedOn).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {isOutOfStock && !isNotified && (
                            <button 
                              onClick={() => sendOutOfStockNotification(product)}
                              className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors"
                              title="Notify Vendor - Out of Stock"
                            >
                              <Bell className="w-3 h-3" />
                              Notify
                            </button>
                          )}
                          {isOutOfStock && isNotified && (
                            <span className="text-xs text-green-600 font-medium">Notification Sent</span>
                          )}
                          {!isOutOfStock && (
                            <button 
                              onClick={() => viewProductDetails(product)}
                              className="p-2 text-gray-500 hover:text-[#586330] transition-colors"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr> 
                    <td colSpan="9" className="text-center text-gray-500 py-10">
                      {products.length === 0 ? 'No products found.' : 'No products match your filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <ProductGridView />
        )}
      </main>

      {/* Product Detail Modal */}
      <ProductDetailModal 
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={closeModal}
      />

      {/* Add Category Modal */}
      <AddCategoryModal 
        isOpen={isCategoryModalOpen}
        onClose={closeCategoryModal}
        onAddCategory={handleAddCategory}
        editingCategory={editingCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />
    </div>
  );
}