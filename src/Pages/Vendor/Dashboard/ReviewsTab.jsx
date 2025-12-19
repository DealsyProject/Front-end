import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import axiosInstance from '../../../Components/utils/axiosInstance';

const ReviewsTab = ({ vendorProfile, handleApiError }) => {
  // Reviews states
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [productReviews, setProductReviews] = useState([]);
  const [expandedReviews, setExpandedReviews] = useState({});
  const [reviewStats, setReviewStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    totalProductsWithReviews: 0
  });

  // Filter states
  const [ratingFilter, setRatingFilter] = useState('all'); // 'all', '5', '4', '3', '2', '1'
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredReviews, setFilteredReviews] = useState([]);
  
  // Selected product for modal view
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showReviewsModal, setShowReviewsModal] = useState(false);

  // Fetch reviews for all vendor products
  const fetchVendorProductReviews = useCallback(async () => {
    try {
      setReviewsLoading(true);
      const response = await axiosInstance.get('/review/products-with-reviews');
      
      if (response.data && Array.isArray(response.data)) {
        // Filter out products with no reviews and transform data
        const productsWithReviews = response.data
          .filter(product => product.ReviewCount > 0)
          .map(product => ({
            productId: product.ProductId,
            productName: product.ProductName,
            imageUrl: product.ImageUrl,
            averageRating: product.AverageRating || 0,
            reviewCount: product.ReviewCount || 0,
            reviews: (product.Reviews || []).map(review => ({
              id: review.Id || Math.random().toString(36).substr(2, 9),
              rating: review.Rating || review.rating || 0,
              comment: review.Comment || review.comment || '',
              customerName: review.CustomerName || review.customerName || 'Anonymous Customer',
              createdOn: review.CreatedOn || review.createdOn
            }))
          }));

        setProductReviews(productsWithReviews);
        
        // Calculate overall statistics
        const totalReviews = productsWithReviews.reduce((acc, product) => acc + product.reviewCount, 0);
        const totalRating = productsWithReviews.reduce((acc, product) => acc + (product.averageRating * product.reviewCount), 0);
        const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;
        
        setReviewStats({
          totalReviews,
          averageRating: parseFloat(averageRating.toFixed(1)),
          totalProductsWithReviews: productsWithReviews.length
        });
        
        setFilteredReviews(productsWithReviews);
      } else {
        setProductReviews([]);
        setFilteredReviews([]);
      }
    } catch (error) {
      console.error('Error fetching vendor product reviews:', error);
      handleApiError(error, 'Failed to load product reviews');
      setProductReviews([]);
      setFilteredReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    if (vendorProfile) {
      fetchVendorProductReviews();
    }
  }, [vendorProfile, fetchVendorProductReviews]);

  // Apply filters whenever ratingFilter or searchTerm changes
  useEffect(() => {
    let filtered = [...productReviews];

    // Apply rating filter
    if (ratingFilter !== 'all') {
      const ratingValue = parseInt(ratingFilter);
      filtered = filtered.filter(product => 
        Math.floor(product.averageRating) === ratingValue
      );
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.productName.toLowerCase().includes(searchLower) ||
        product.reviews.some(review =>
          review.comment.toLowerCase().includes(searchLower) ||
          review.customerName.toLowerCase().includes(searchLower)
        )
      );
    }

    setFilteredReviews(filtered);
  }, [ratingFilter, searchTerm, productReviews]);

  // Toggle expanded state for a review
  const toggleReviewExpanded = (reviewId) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

  // View all reviews for a specific product
  const viewProductReviews = (product) => {
    setSelectedProduct(product);
    setShowReviewsModal(true);
  };

  const renderRatingStars = (rating) => (
    <div className="flex items-center space-x-1">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      ))}
      <span className="text-sm text-gray-600 ml-1">{rating.toFixed(1)}</span>
    </div>
  );

  const renderCompactRatingStars = (rating) => (
    <div className="flex items-center space-x-0.5">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`text-xs ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      ))}
    </div>
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (reviewsLoading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-4 border-[#586330]"></div>
        <p className="mt-4 text-lg text-gray-600">Loading customer reviews...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Reviews Summary Banner */}
      <div className="bg-gradient-to-r from-[#586330] to-[#6b7a3a] text-white p-6 rounded-xl shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold">{reviewStats.totalReviews}</div>
            <p className="text-sm opacity-90 mt-2">Total Reviews</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold">{reviewStats.averageRating.toFixed(1)}</div>
            <p className="text-sm opacity-90 mt-2">Average Rating</p>
            <div className="flex justify-center mt-2">
              {renderRatingStars(reviewStats.averageRating)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold">{reviewStats.totalProductsWithReviews}</div>
            <p className="text-sm opacity-90 mt-2">Products with Reviews</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Rating Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Rating
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setRatingFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  ratingFilter === 'all'
                    ? 'bg-[#586330] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All Ratings
              </button>
              {[5, 4, 3, 2, 1].map(rating => (
                <button
                  key={rating}
                  onClick={() => setRatingFilter(rating.toString())}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-1 ${
                    ratingFilter === rating.toString()
                      ? 'bg-[#586330] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span>{rating}★</span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Reviews
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by product name, customer, or comment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#586330] focus:border-transparent"
              />
              <svg className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600">
          Showing {filteredReviews.length} product{filteredReviews.length !== 1 ? 's' : ''} with reviews
          {ratingFilter !== 'all' && ` (${ratingFilter}★ and above)`}
          {searchTerm && ` matching "${searchTerm}"`}
        </div>
      </div>

      {/* Products with Reviews Grid */}
      {filteredReviews.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow-md">
          <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center text-5xl">
            📝
          </div>
          <h3 className="text-xl font-semibold text-gray-600">
            {productReviews.length === 0 ? 'No reviews yet' : 'No matching reviews found'}
          </h3>
          <p className="text-gray-500 mt-2">
            {productReviews.length === 0 
              ? 'Customers haven\'t reviewed your products yet' 
              : 'Try adjusting your filters or search term'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((product) => (
            <div key={product.productId} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition duration-300">
              {/* Product Image */}
              <div className="h-48 bg-gray-200 overflow-hidden relative">
                <img
                  src={product.imageUrl || 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'}
                  alt={product.productName}
                  className="w-full h-full object-cover hover:scale-105 transition duration-300"
                  onError={(e) => (e.target.src = 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400')}
                />
               
                <div className="absolute top-3 right-3 bg-[#586330] text-white px-2 py-1 rounded text-sm">
                  {product.reviewCount} review{product.reviewCount !== 1 ? 's' : ''}
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                  {product.productName}
                </h3>
                
              

                {/* Recent Reviews Preview */}
                <div className="space-y-3 mb-4">
                  <h4 className="text-sm font-medium text-gray-700">Recent Reviews</h4>
                  {product.reviews.slice(0, 2).map((review) => (
                    <div key={review.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-[#586330] text-white rounded-full flex items-center justify-center text-xs font-semibold">
                            {review.customerName?.charAt(0) || 'C'}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{review.customerName}</span>
                        </div>
                        <div className="flex items-center">
                          {renderCompactRatingStars(review.rating)}
                          <span className="text-xs font-semibold text-gray-700 ml-1">{review.rating}.0</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {review.comment}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(review.createdOn)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* View All Reviews Button */}
                <button
                  onClick={() => viewProductReviews(product)}
                  className="w-full bg-[#586330] text-white py-2.5 rounded-lg hover:bg-[#586330]/80 transition font-medium text-sm"
                >
                  View All Reviews ({product.reviewCount})
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reviews Modal */}
      {showReviewsModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-[#586330] text-white p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{selectedProduct.productName}</h3>
                  <div className="flex items-center mt-2">
                    {renderRatingStars(selectedProduct.averageRating)}
                    <span className="ml-3">
                      {selectedProduct.reviewCount} review{selectedProduct.reviewCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowReviewsModal(false)}
                  className="text-white hover:text-gray-200 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                {selectedProduct.reviews.map((review) => {
                  const isExpanded = expandedReviews[review.id] || review.comment.length <= 300;
                  const displayComment = isExpanded 
                    ? review.comment 
                    : `${review.comment.substring(0, 300)}...`;
                  
                  return (
                    <div key={review.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
                        <div className="flex items-start space-x-3">
                          <div className="w-10 h-10 bg-[#586330] text-white rounded-full flex items-center justify-center font-semibold flex-shrink-0">
                            {review.customerName?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{review.customerName}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(review.createdOn)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-lg ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="font-semibold text-gray-700">{review.rating}.0</span>
                        </div>
                      </div>

                      <div className="text-gray-700">
                        <p className="whitespace-pre-wrap">
                          {displayComment}
                          {review.comment.length > 300 && !isExpanded && (
                            <button
                              onClick={() => toggleReviewExpanded(review.id)}
                              className="ml-1 text-[#586330] font-medium hover:underline"
                            >
                              Read more
                            </button>
                          )}
                        </p>
                        
                        {isExpanded && review.comment.length > 300 && (
                          <button
                            onClick={() => toggleReviewExpanded(review.id)}
                            className="mt-2 text-[#586330] font-medium hover:underline text-sm"
                          >
                            Show less
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewsTab;