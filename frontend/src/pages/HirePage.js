import React, { useState, useEffect, useMemo } from 'react';
import { Truck, Snowflake, Tent, Utensils, Loader2, AlertCircle, Search as SearchIcon, X, Star, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { equipmentService } from '../services/equipmentService';
import { formatCurrency } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/opacity.css';
import { CONTACT } from '../config/contact';

// Define prop types for better type checking
export const HirePage = ({ onQuoteClick }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedDesc, setExpandedDesc] = useState({});
  const [infoItem, setInfoItem] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Category icon mapping
  const categoryIcons = {
    'Mobile Toilets': Truck,
    'Mobile Freezers': Snowflake,
    'Tents & Marquees': Tent,
    'Slaughtering Services': Utensils,
    default: Truck
  };

  // Fetch equipment from MongoDB in real-time
  useEffect(() => {
    let isMounted = true;
    
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        setError(null);
        const equipmentData = await equipmentService.getAllEquipment();
        
        if (isMounted) {
          // Ensure we have valid data before setting state
          if (Array.isArray(equipmentData)) {
        
            setEquipment(equipmentData);
          } else {
            console.error('Invalid equipment data format:', equipmentData);
            setError('Invalid data format received from server');
            setEquipment([]);
          }
        }
      } catch (err) {
        console.error('Error fetching equipment:', err);
        if (isMounted) {
          setError(err.response?.data?.message || 'Error loading equipment. Please try again.');
          setEquipment([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchEquipment();
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, []);

  // Generate categories from equipment data
  const categories = useMemo(() => [
    { id: 'all', name: 'All Equipment' },
    ...Array.from(new Set(equipment.map(item => item.category)))
      .filter(Boolean) // Remove any undefined/null categories
      .map(category => ({ id: category, name: category }))
  ], [equipment]);

  // Filter equipment based on category and search query
  const filteredEquipment = useMemo(() => {
    return equipment.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCategory && matchesSearch;
    });
  }, [equipment, selectedCategory, searchQuery]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Clear search query
  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="">
{/* Equipment Section */}
      <section id="equipment" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Search and Filter Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative overflow-hidden rounded-xl shadow-md bg-center bg-cover bg-no-repeat min-h-[220px] sm:min-h-[260px]"
            style={{ backgroundImage: "url('/images/HOME3.webp')", backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
          >
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Foreground content */}
            <div className="relative z-10 p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Find Your Perfect Equipment</h2>
            
            {/* Search Bar */}
            <div className="relative max-w-2xl mb-6">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Search equipment by name or description..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="block w-full pl-10 pr-3 py-3 rounded-lg bg-white/90 backdrop-blur-sm border border-white/40 placeholder-gray-600 text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500 transition-all duration-200"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-white/60 rounded-r-lg px-2 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Category Filters */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-white mb-3">Filter by Category:</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <motion.button
                    key={category.id}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'bg-gold-600 text-black shadow-md hover:bg-gold-500'
                        : 'bg-white/90 text-gray-800 hover:bg-white border border-white/40 backdrop-blur-sm'
                    }`}
                  >
                    {category.id === 'all' ? 'All Equipment' : category.name}
                  </motion.button>
                ))}
              </div>
            </div>
            </div>
          </motion.div>

          {/* Active filters info */}
          {(selectedCategory !== 'all' || searchQuery) && (
            <div className="text-center text-sm text-gray-600">
              Showing {filteredEquipment.length} {filteredEquipment.length === 1 ? 'item' : 'items'} 
              {selectedCategory !== 'all' && ` in "${categories.find(c => c.id === selectedCategory)?.name || selectedCategory}"`}
              {searchQuery && ` matching "${searchQuery}"`}
              <button 
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="ml-2 text-gold-600 hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm"
            >
              <Loader2 className="h-12 w-12 animate-spin mb-4" />
              <p className="text-gray-600">Loading equipment...</p>
            </motion.div>
          ) : error ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white rounded-xl shadow-sm"
            >
              <AlertCircle className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Equipment</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gold-600 text-white font-semibold rounded-lg hover:bg-gold-700 transition-colors shadow-sm"
              >
                Try Again
              </button>
            </motion.div>
          ) : equipment.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white rounded-xl shadow-sm"
            >
              <Truck className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Equipment Available</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We're currently updating our equipment inventory. Please check back soon or contact us for immediate assistance.
              </p>
              <button
                onClick={() => onQuoteClick({ type: 'custom' })}
                className="px-6 py-3 bg-gold-600 text-white font-semibold rounded-lg hover:bg-gold-700 transition-colors shadow-sm"
              >
                Request Custom Quote
              </button>
            </motion.div>
          ) : filteredEquipment.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 bg-white rounded-xl shadow-sm"
            >
              <SearchIcon className="w-16 h-16 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Equipment Found</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                We couldn't find any equipment matching your criteria. Try adjusting your filters or contact us for custom solutions.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="px-6 py-3 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm mr-3"
              >
                Clear All Filters
              </button>
              <button
                onClick={() => onQuoteClick({ type: 'custom' })}
                className="px-6 py-3 bg-gold-600 text-white font-semibold rounded-lg hover:bg-gold-700 transition-colors shadow-sm"
              >
                Request Custom Quote
              </button>
            </motion.div>
          ) : (
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4 px-2 sm:px-0"
                role="list"
                aria-label="Equipment listing"
              >
              {filteredEquipment.map((item, index) => {
                const IconComponent = categoryIcons[item.category] || categoryIcons.default;
                const isAvailable = ((item.quantity || 0) > 0) && (item.availability !== false);
                
                return (
                  <motion.article
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ 
                      type: 'spring',
                      stiffness: 300,
                      damping: 30,
                      delay: Math.min(index * 0.05, 0.3) // Staggered animation
                    }}
                    whileHover={{ 
                      y: -4,
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0,0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                    }}
                    className="group bg-white rounded-md shadow-sm overflow-hidden transition-all duration-300 border border-gray-100 hover:border-gold-200 flex flex-col h-full text-xs sm:text-sm md:text-sm justify-start"
                    aria-labelledby={`item-${item._id}-title`}
                  >
                    {/* Image area with multi-image mosaic */}
                    <div className="relative pt-[75%] sm:pt-[56.25%] bg-gray-50 overflow-hidden">
                      <div className="absolute inset-0">
                        {item.images && item.images.length > 0 ? (
                          (() => {
                            const imgs = item.images.slice(0, 3);
                            if (imgs.length === 1) {
                              const img = imgs[0];
                              return (
                                <LazyLoadImage
                                  src={img.url}
                                  alt={img.alt || item.name}
                                  effect="opacity"
                                  width="100%"
                                  height="100%"
                                  className="w-full h-full object-cover"
                                  placeholderSrc={img.url}
                                />
                              );
                            }
                            else if (imgs.length === 2) {
                              return (
                                <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                                  {imgs.map((im, i) => (
                                    <LazyLoadImage
                                      key={i}
                                      src={im.url}
                                      alt={im.alt || item.name}
                                      effect="opacity"
                                      width="100%"
                                      height="100%"
                                      className="w-full h-full object-cover"
                                      placeholderSrc={imgs[0].url}
                                    />
                                  ))}
                                </div>
                              );
                            }
                            // 3+ images: main + two stacked thumbnails
                            return (
                              <div className="grid grid-cols-3 gap-0.5 w-full h-full">
                                <div className="col-span-2 h-full">
                                  <LazyLoadImage
                                    src={imgs[0].url}
                                    alt={imgs[0].alt || item.name}
                                    effect="opacity"
                                    width="100%"
                                    height="100%"
                                    className="w-full h-full object-cover"
                                    placeholderSrc={imgs[0].url}
                                  />
                                </div>
                                <div className="col-span-1 grid grid-rows-2 gap-0.5 h-full">
                                  <LazyLoadImage
                                    src={imgs[1].url}
                                    alt={imgs[1].alt || item.name}
                                    effect="opacity"
                                    width="100%"
                                    height="100%"
                                    className="w-full h-full object-cover"
                                    placeholderSrc={imgs[0].url}
                                  />
                                  <div className="relative">
                                    <LazyLoadImage
                                      src={imgs[2].url}
                                      alt={imgs[2].alt || item.name}
                                      effect="opacity"
                                      width="100%"
                                      height="100%"
                                      className="w-full h-full object-cover"
                                      placeholderSrc={imgs[0].url}
                                    />
                                    {item.images.length > 3 && (
                                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <span className="text-white text-xs sm:text-sm font-semibold px-2 py-1 rounded-full bg-black/60">
                                          +{item.images.length - 3}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })()
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            <IconComponent className="h-8 w-8 sm:h-16 sm:w-16" />
                          </div>
                        )}
                      </div>
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 right-3 flex justify-between">
                        {item.isPopular && (
                          <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-md">
                            <Star className="h-3.5 w-3.5 mr-1.5 fill-current" />
                            <span>Popular</span>
                          </div>
                        )}
                        <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
                          {item.category}
                        </div>
                      </div>
                      
                      {/* Overlay */}
                      {!isAvailable && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-full">
                            Currently Unavailable
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="p-2 sm:p-3 flex flex-col">
                      <div className="flex justify-between items-start space-x-1 mb-0.5 sm:mb-1">
                        <h3 
                          id={`item-${item._id}-title`}
                          className="text-[11px] sm:text-sm font-bold text-gray-900 leading-tight line-clamp-1 sm:line-clamp-2"
                        >
                          {item.name}
                        </h3>
                        <div className="flex flex-col items-end ml-2 flex-shrink-0">
                          <span className="text-xs sm:text-sm md:text-base font-bold text-gold-600 whitespace-nowrap">
                            {formatCurrency(item.pricePerDay)}
                          </span>
                          <span className="text-[10px] text-gray-500">per day</span>
                        </div>
                      </div>
                      
                      <div className="mb-1.5 sm:mb-2 flex-grow">
                        <p 
                          className={`text-gray-600 text-xs sm:text-sm ${expandedDesc[item._id] ? '' : 'line-clamp-1 sm:line-clamp-3'}`}
                          aria-expanded={!!expandedDesc[item._id]}
                        >
                          {item.description || 'No description available.'}
                        </p>
                        {item.description && item.description.length > 120 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedDesc(prev => ({ ...prev, [item._id]: !prev[item._id] }));
                            }}
                            className="text-gold-600 text-xs font-medium hover:underline mt-1 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 rounded"
                            aria-controls={`item-${item._id}-description`}
                          >
                            {expandedDesc[item._id] ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </div>
                      
                      {/* Features */}
                      {item.features && item.features.length > 0 && (
                        <div className="mb-2.5 sm:mb-3">
                          <div className="flex flex-wrap gap-1.5">
                            {item.features.slice(0, 3).map((feature, index) => (
                              <span 
                                key={index}
                                className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-100 hover:bg-gray-100 transition-colors ${index >= 1 ? 'hidden sm:inline-flex' : ''}`}
                                title={feature}
                              >
                                {feature.length > 15 ? `${feature.substring(0, 15)}...` : feature}
                              </span>
                            ))}
                            {item.features.length > 1 && (
                              <span 
                                className="inline-flex sm:hidden items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                                title={`${item.features.length - 1} more features`}
                              >
                                +{item.features.length - 1}
                              </span>
                            )}
                            {item.features.length > 3 && (
                              <span 
                                className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors"
                                title={`${item.features.length - 3} more features`}
                              >
                                +{item.features.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Availability & Condition */}
                      <div className="flex items-center justify-between mt-auto pt-1.5 pb-1 border-t border-gray-100">
                        <div className="flex items-center">
                          <div 
                            className={`h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full mr-1.5 sm:mr-2 flex-shrink-0 ${
                              isAvailable ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            aria-hidden="true"
                          ></div>
                          <span className="text-xs sm:text-sm font-medium text-gray-700">
                            {isAvailable 
                              ? `${item.quantity} ${item.quantity === 1 ? 'Unit' : 'Units'}` 
                              : 'Out of Stock'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-gray-500 block">Condition</span>
                          <span className="text-xs sm:text-sm font-medium text-gray-700 capitalize">
                            {item.condition?.toLowerCase() || 'Good'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions Row: Details (left) and Add to Quote (right) */}
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentImageIndex(0);
                            setInfoItem(item);
                          }}
                          className="w-full py-1.5 sm:py-2 rounded-lg font-semibold transition-all duration-200 text-[11px] sm:text-sm bg-gold-600 text-white hover:bg-gold-700 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2"
                          aria-label={`View details for ${item.name}`}
                        >
                          Details
                        </motion.button>
                        <motion.button
                          whileHover={isAvailable ? { scale: 1.02 } : {}}
                          whileTap={isAvailable ? { scale: 0.98 } : {}}
                          onClick={() => isAvailable && onQuoteClick({
                            preSelectedItem: {
                              _id: item._id,
                              name: item.name,
                              category: item.category,
                              pricing: { dailyRate: item.pricePerDay },
                              inventory: { availableUnits: item.quantity },
                              image: item.images?.[0]?.url
                            }
                          })}
                          disabled={!isAvailable}
                          className={`w-full py-1.5 sm:py-2 rounded-lg font-semibold transition-all duration-200 text-[11px] sm:text-sm flex items-center justify-center ${
                            isAvailable 
                              ? 'bg-gold-600 text-white hover:bg-gold-700 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2' 
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                          aria-label={isAvailable ? `Add ${item.name} to quote` : `${item.name} is currently unavailable`}
                        >
                          {isAvailable ? (
                            <>
                              <span>Add to Quote</span>
                              <svg className="w-4 h-4 ml-2 -mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </>
                          ) : (
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Notify When Available
                            </span>
                          )}
                        </motion.button>
                      </div>
                      
                      {isAvailable && (
                        <div className="mt-3 flex items-center justify-center text-xs text-gray-500">
                          <Clock className="h-3.5 w-3.5 mr-1.5" />
                          <span>Flexible rental periods available</span>
                        </div>
                      )}
                    </div>
                  </motion.article>
                );
              })}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </section>
      
      {/* Call to Action Section */}
      <section className="py-16 bg-gradient-to-r from-gray-900 to-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-6">Need Help Choosing the Right Equipment?</h2>
            <p className="text-lg text-gray-300 mb-8">
              Our team of experts is here to help you select the perfect equipment for your event. 
              Contact us today for personalized recommendations and a quote.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onQuoteClick({ type: 'custom' })}
                className="px-8 py-3 bg-gold-600 text-black font-semibold rounded-lg hover:bg-gold-500 transition-colors shadow-lg"
              >
                Get a Free Consultation
              </motion.button>
              <motion.a
                href={`tel:${CONTACT.phones[0].tel}`}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-3 bg-transparent border-2 border-gold-600 text-gold-400 font-semibold rounded-lg hover:bg-gold-600/10 transition-colors"
              >
                Call Us Now
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Info Modal */}
      <AnimatePresence>
        {infoItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
            role="dialog"
            aria-modal="true"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 line-clamp-1">{infoItem.name}</h3>
                <button
                  onClick={() => setInfoItem(null)}
                  className="p-2 rounded-md hover:bg-gray-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Image Carousel */}
                <div className="rounded-lg bg-gray-50 flex flex-col">
                  <div className="relative aspect-video overflow-hidden">
                    {infoItem.images?.length ? (
                      <img
                        src={infoItem.images[currentImageIndex]?.url}
                        alt={infoItem.images[currentImageIndex]?.alt || infoItem.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">No image available</div>
                    )}
                    {infoItem.images?.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow"
                          onClick={() => setCurrentImageIndex((prev) => (prev - 1 + infoItem.images.length) % infoItem.images.length)}
                          aria-label="Previous image"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow"
                          onClick={() => setCurrentImageIndex((prev) => (prev + 1) % infoItem.images.length)}
                          aria-label="Next image"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                  {infoItem.images?.length > 1 && (
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                      {infoItem.images.map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className={`h-14 w-20 flex-shrink-0 rounded-md overflow-hidden border ${idx === currentImageIndex ? 'border-gold-500 ring-1 ring-gold-300' : 'border-gray-200'}`}
                          onClick={() => setCurrentImageIndex(idx)}
                          aria-label={`View image ${idx + 1}`}
                        >
                          <img src={img.url} alt={img.alt || `${infoItem.name} ${idx + 1}`} className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {infoItem.category}
                    </span>
                    <div className="text-right">
                      <div className="text-gold-600 font-bold">{formatCurrency(infoItem.pricePerDay)}</div>
                      <div className="text-xs text-gray-500">per day</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3 max-h-32 overflow-auto">
                    {infoItem.description || 'No description available.'}
                  </p>
                  {infoItem.features?.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Features</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {infoItem.features.slice(0, 6).map((f, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-gray-50 border border-gray-200 text-gray-700">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center">
                      <div className={`h-2.5 w-2.5 rounded-full mr-2 ${((infoItem.quantity || 0) > 0) && (infoItem.availability !== false) ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm text-gray-700">
                        {((infoItem.quantity || 0) > 0) && (infoItem.availability !== false) ? `${infoItem.quantity} ${infoItem.quantity === 1 ? 'Unit' : 'Units'}` : 'Out of Stock'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">Condition: <span className="capitalize font-medium">{infoItem.condition?.toLowerCase() || 'Good'}</span></div>
                  </div>
                </div>
              </div>
              <div className="px-4 sm:px-6 py-3 border-t flex justify-end gap-2">
                <button
                  onClick={() => setInfoItem(null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    if (((infoItem.quantity || 0) > 0) && (infoItem.availability !== false)) {
                      // Reuse the quote flow via a custom event; simple approach is to trigger onQuoteClick with preSelectedItem-like object
                      // Note: onQuoteClick is available in this component scope
                      setInfoItem(null);
                      onQuoteClick({
                        preSelectedItem: {
                          _id: infoItem._id,
                          name: infoItem.name,
                          category: infoItem.category,
                          pricing: { dailyRate: infoItem.pricePerDay },
                          inventory: { availableUnits: infoItem.quantity },
                          image: infoItem.images?.[0]?.url
                        }
                      });
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-gold-600 text-white hover:bg-gold-700 disabled:opacity-50"
                  disabled={!( (infoItem?.quantity || 0) > 0 && (infoItem?.availability !== false) )}
                >
                  Add to Quote
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
