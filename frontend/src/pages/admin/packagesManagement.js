import axios from 'axios';
import { useEffect, useMemo, useState } from 'react';
import { getAuthToken } from '../../services/api';

// Align with global API base used in services/api.js
const API_BASE = process.env.REACT_APP_API_URL || 'https://backend-g983.onrender.com';
// Public packages endpoint (list and read)
const API_URL = `${API_BASE}/api/packages`;
// Admin-protected packages endpoint for create/update/delete (backend mounts under /api/packages with protect middleware)
const ADMIN_API_URL = `${API_BASE}/api/packages`;
const UPLOAD_URL = `${API_BASE}/api/upload`;

// API Service Functions
// Normalize a package from backend to UI shape
const normalizeFromBackend = (pkg) => {
  if (!pkg || typeof pkg !== 'object') return pkg;
  if (!pkg.imageUrl && Array.isArray(pkg.images) && pkg.images.length > 0) {
    const primary = pkg.images.find(i => i && i.isPrimary) || pkg.images[0];
    if (primary && primary.url) {
      return { ...pkg, imageUrl: primary.url };
    }
  }
  return pkg;
};

const fetchAllPackages = async () => {
  try {
    const response = await axios.get(API_URL);
    const payload = response.data?.data ?? response.data;
    // Ensure we always return an array, even if the response is empty or malformed
    const list = Array.isArray(payload) ? payload : [];
    return list.map(normalizeFromBackend);
  } catch (error) {
    console.error('Error fetching packages:', error);
    // Return empty array on error to prevent crashes
    return [];
  }
};

const createNewPackage = async (packageData, token) => {
  try {

    // Map to backend expectations: basePrice and lowercase category
    const payload = {
      name: packageData.name,
      description: packageData.description || '',
      category: (packageData.category || 'other').toLowerCase(),
      basePrice: typeof packageData.price !== 'undefined' ? Number(packageData.price) : undefined,
      features: Array.isArray(packageData.features) ? packageData.features : [],
      includedServices: packageData.includedServices,
      includedEquipment: packageData.includedEquipment,
      specifications: packageData.specifications,
      isPopular: !!packageData.isPopular,
      isFeatured: !!packageData.isFeatured,
      images: Array.isArray(packageData.images) ? packageData.images : []
    };
    // Prefer explicit images array if provided; otherwise, fall back to legacy imageUrl
    if ((!payload.images || payload.images.length === 0) && packageData.imageUrl) {
      payload.images = [{ url: packageData.imageUrl, isPrimary: true }];
    }

    
    // Use protected endpoint for creating packages
    const response = await axios.post(ADMIN_API_URL, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      validateStatus: (status) => status < 500 // Don't throw for 4xx errors
    });
    
    
    
    if (response.status >= 400) {
      // Surface validation error messages if available
      const details = Array.isArray(response.data?.errors) ? `: ${response.data.errors.join(', ')}` : '';
      const error = new Error((response.data?.message || 'Failed to create package') + details);
      error.response = response;
      throw error;
    }
    
    // Controller returns { message, data }
    const created = response.data?.data || response.data;
    return normalizeFromBackend(created);
  } catch (error) {
    console.error('Error in createNewPackage:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
    
    // Enhance the error with more context
    if (!error.response) {
      error.message = 'Network error: Could not connect to the server. Please check your connection.';
    }
    
    throw error;
  }
};

const updatePackage = async (id, packageData, token) => {
  try {
    // Map to backend: ensure lowercase category and basePrice when price is provided
    const payload = {
      ...packageData,
      ...(packageData.category !== undefined && { category: String(packageData.category).toLowerCase() }),
      ...(packageData.price !== undefined && { basePrice: Number(packageData.price) })
    };
    // If images array is provided, respect it. Otherwise map legacy imageUrl.
    if ((!Array.isArray(payload.images) || payload.images.length === 0) && payload.imageUrl !== undefined) {
      payload.images = payload.imageUrl ? [{ url: payload.imageUrl, isPrimary: true }] : [];
    }
    // Use protected endpoint for updating packages
    const response = await axios.put(`${ADMIN_API_URL}/${id}`, payload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    // Controller returns { message, data }
    const updated = response.data?.data || response.data;
    return normalizeFromBackend(updated);
  } catch (error) {
    console.error('Error updating package:', error);
    throw error;
  }
};

const deletePackage = async (id, token) => {
  try {
    // Use protected endpoint for deleting packages
    const response = await axios.delete(`${ADMIN_API_URL}/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error deleting package:', error);
    throw error;
  }
};

const getPackageById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data?.data || response.data;
  } catch (error) {
    console.error('Error fetching package:', error);
    throw error;
  }
};

// React Component for Packages Management
export const PackagesManagement = () => {
  const [packages, setPackages] = useState([]);
  // Separate loading states for clearer UX
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPackage, setEditPackage] = useState(null);
  // Add Package modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPackage, setNewPackage] = useState({
    name: '',
    category: 'other',
    price: '',
    priceUnit: 'R',
    description: '',
    imageUrl: '',
    images: [],
    features: [],
    includedServices: [],
    includedEquipment: [],
    isPopular: false,
    isFeatured: false
  });
  // Toast state for lightweight notifications
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }
  // Helper: show toast for 3 seconds
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // Helper: upload many files with a concurrency limit and per-file progress
  const uploadFilesWithConcurrency = async (files, {
    onFileProgress,
    onFileDone,
    onFileError,
    concurrency = 3,
  } = {}) => {
    const queue = Array.from(files);
    let index = 0;

    const workers = new Array(Math.min(concurrency, queue.length)).fill(0).map(async () => {
      while (index < queue.length) {
        const currentIndex = index++;
        const file = queue[currentIndex];
        const id = `${file.name}-${currentIndex}-${Date.now()}`;
        try {
          const img = await uploadImageFile(file, false, (p) => {
            if (onFileProgress) onFileProgress({ id, file, progress: p });
          });
          if (onFileDone) onFileDone({ id, file, img });
        } catch (err) {
          if (onFileError) onFileError({ id, file, error: err });
        }
      }
    });

    await Promise.all(workers);
  };

  const [newFeature, setNewFeature] = useState('');
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [newAddFeature, setNewAddFeature] = useState('');
  const [uploadingAddImage, setUploadingAddImage] = useState(false);
  // New inputs for services/equipment
  const [newService, setNewService] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [newAddService, setNewAddService] = useState('');
  const [newAddEquipment, setNewAddEquipment] = useState('');
  // View controls (must be declared before any early returns)
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyPopular, setOnlyPopular] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  // Per-file upload progress tracking
  const [addUploads, setAddUploads] = useState([]); // [{ id, name, progress, status: 'uploading'|'done'|'error', error? }]
  const [editUploads, setEditUploads] = useState([]);

  // Helper: upload image file to backend and return URL with metadata
  const uploadImageFile = async (file, isPrimary = false, onProgress = null) => {
    // Validate file type (accepts jpg, jpeg, png, webp, gif)
    const validTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 
      'image/webp', 'image/gif', 'image/svg+xml'
    ];
    
    if (!file) {
      throw new Error('No file selected');
    }
    
    // Check file type
    const fileType = file.type.toLowerCase();
    const isValidType = validTypes.some(type => fileType.includes(type.split('/')[1]));
    
    if (!isValidType) {
      throw new Error('Invalid file type. Please upload an image (JPG, PNG, WebP, GIF, or SVG).');
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`File is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is 10MB.`);
    }

    // Create form data
    const formData = new FormData();
    formData.append('image', file);
    
    // Add any additional metadata
    formData.append('filename', file.name);
    formData.append('size', file.size);
    formData.append('type', file.type);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const config = {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-Requested-With': 'XMLHttpRequest'
        },
        signal: controller.signal,
        onUploadProgress: (progressEvent) => {
          if (onProgress && typeof onProgress === 'function') {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        },
      };
      
      const resp = await axios.post(UPLOAD_URL, formData, config);
      clearTimeout(timeoutId);
      
      if (!resp || !resp.data) {
        throw new Error('Invalid server response');
      }
      
      // Handle different response formats
      let url = '';
      if (typeof resp.data === 'string') {
        url = resp.data; // Handle string response
      } else if (resp.data.url) {
        url = resp.data.url;
      } else if (resp.data.path) {
        url = new URL(resp.data.path, UPLOAD_URL).href;
      } else if (resp.data.data?.url) {
        url = resp.data.data.url; // Handle nested response
      }
      
      if (!url) {
        console.error('No valid URL in response:', resp.data);
        throw new Error('Invalid response format from server');
      }
      
      // Ensure URL is absolute
      if (!url.startsWith('http') && !url.startsWith('//')) {
        const baseUrl = new URL(UPLOAD_URL).origin;
        url = url.startsWith('/') ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
      }
      
      // Create image object with metadata
      return {
        url,
        filename: file.name,
        fileType: file.type,
        fileSize: file.size,
        isPrimary,
        createdAt: new Date().toISOString(),
        dimensions: resp.data.dimensions || resp.data.data?.dimensions || null,
        id: resp.data.id || Date.now().toString() // Add unique ID for tracking
      };
      
    } catch (error) {
      console.error('Upload error:', {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Upload failed. ';
      
      if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
        errorMessage += 'Request timed out. Please try again.';
      } else if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        if (status === 401 || status === 403) {
          errorMessage = 'Authentication required. Please log in again.';
          // Consider redirecting to login
          // window.location.href = '/login';
        } else if (status === 413) {
          errorMessage = 'File is too large. Please upload an image smaller than 10MB.';
        } else if (status === 415) {
          errorMessage = 'Unsupported file type. Please upload a valid image file.';
        } else if (status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage += error.response.data?.message || `Server returned status ${status}`;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'No response from server. Please check your internet connection.';
      } else if (error.message) {
        // Something happened in setting up the request
        errorMessage += error.message;
      }
      
      throw new Error(errorMessage);
    }
  };
  
  

  // Inline subcomponent: Image mosaic for admin cards (similar to Hire page)
  const AdminCardImageCarousel = ({ pkg, hidePrice = false }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Build images list: primary first, then others; fallback to placeholder
    const images = useMemo(() => {
      try {
        const list = [];
        // Add images from pkg.images array if available
        if (Array.isArray(pkg?.images) && pkg.images.length > 0) {
          // Sort with primary images first
          const sorted = [...pkg.images].sort((a, b) => 
            (b?.isPrimary === true ? 1 : 0) - (a?.isPrimary === true ? 1 : 0)
          );
          
          // Add valid images to the list
          for (const img of sorted) {
            try {
              if (typeof img === 'string' && img) {
                list.push({ url: img });
              } else if (img?.url) {
                list.push({ 
                  url: img.url,
                  isPrimary: img.isPrimary || false,
                  alt: img.alt || pkg?.name || 'Package image'
                });
              }
            } catch (imgError) {
              console.warn('Invalid image format:', img);
              continue;
            }
          }
        }
        
        // Add legacy imageUrl if it exists and not already in the list
        if (pkg?.imageUrl && !list.some(img => img.url === pkg.imageUrl)) {
          list.unshift({ 
            url: pkg.imageUrl,
            isPrimary: list.length === 0, // Make primary if it's the only image
            alt: pkg.name ? `${pkg.name} - Main` : 'Main package image'
          });
        }
        
        // Remove duplicates and invalid URLs
        const seen = new Set();
        const validList = list.filter((img) => {
          if (!img?.url || seen.has(img.url)) return false;
          try {
            new URL(img.url); // Will throw if invalid URL
            seen.add(img.url);
            return true;
          } catch {
            return false;
          }
        });
        
        // Return valid images or fallback to placeholder
        return validList.length > 0 
          ? validList 
          : [{ 
              url: '/images/aux.jpg', 
              alt: 'Placeholder image',
              isPrimary: true 
            }];
            
      } catch (error) {
        console.error('Error processing images:', error);
        setError('Error loading images');
        return [{ url: '/images/aux.jpg', alt: 'Error loading image', isPrimary: true }];
      } finally {
        setLoading(false);
      }
    }, [pkg]);

    const total = images.length;
    const priceVal = useMemo(() => {
      const p = (pkg?.basePrice ?? pkg?.price ?? 0);
      const n = Number(p);
      return Number.isFinite(n) ? n : 0;
    }, [pkg]);

    return (
      <div className="relative w-full h-48 bg-gray-100 overflow-hidden">
        {/* Mosaic area */}
        <div className="absolute inset-0">
          {total === 1 && (
            <img 
              src={images[0].url} 
              alt={pkg?.name || ''} 
              className="w-full h-full object-cover" 
              loading="lazy" 
              decoding="async"
              onError={(e) => {
                e.target.src = '/images/aux.jpg';
              }}
            />
          )}
          {total === 2 && (
            <div className="grid grid-cols-2 gap-0.5 w-full h-full">
              {images.slice(0, 2).map((im, i) => (
                <img 
                  key={i} 
                  src={im.url} 
                  alt={pkg?.name || ''} 
                  className="w-full h-full object-cover" 
                  loading="lazy" 
                  decoding="async"
                  onError={(e) => {
                    e.target.src = '/images/aux.jpg';
                  }}
                />
              ))}
            </div>
          )}
          {total >= 3 && (
            <div className="grid grid-cols-3 gap-0.5 w-full h-full">
              <div className="col-span-2 h-full">
                <img 
                  src={images[0].url} 
                  alt={pkg?.name || ''} 
                  className="w-full h-full object-cover" 
                  loading="lazy" 
                  decoding="async"
                  onError={(e) => {
                    e.target.src = '/images/aux.jpg';
                  }}
                />
              </div>
              <div className="col-span-1 grid grid-rows-2 gap-0.5 h-full">
                <img 
                  src={images[1].url} 
                  alt={pkg?.name || ''} 
                  className="w-full h-full object-cover" 
                  loading="lazy" 
                  decoding="async"
                  onError={(e) => {
                    e.target.src = '/images/aux.jpg';
                  }}
                />
                <div className="relative">
                  <img 
                    src={images[2].url} 
                    alt={pkg?.name || ''} 
                    className="w-full h-full object-cover" 
                    loading="lazy" 
                    decoding="async"
                    onError={(e) => {
                      e.target.src = '/images/aux.jpg';
                    }}
                  />
                  {total > 3 && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-semibold px-2 py-1 rounded-full bg-black/60">+{total - 3}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        {/* Price badge */}
        {!hidePrice && (
          <div className="absolute top-3 right-3">
            <div className="px-3 py-1 bg-gold-500 text-black rounded-full text-sm font-bold shadow-md">
              R{priceVal.toLocaleString()}
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    let isMounted = true; // Track if component is still mounted
    
    const loadPackages = async () => {
      if (!isMounted) return;
      
      setLoadingPage(true);
      setError(null);
      
      try {
        // Add a small delay to prevent UI flicker for fast networks
        const [data] = await Promise.all([
          fetchAllPackages(),
          new Promise(resolve => setTimeout(resolve, 300)) // Minimum loading time
        ]);
        
        if (!isMounted) return;
        
        if (!data) {
          throw new Error('No data received from server. Please try again later.');
        }
        
        if (!Array.isArray(data)) {
          console.warn('Expected array but received:', typeof data, data);
          throw new Error('Invalid data format received from server');
        }
        
        // Validate and normalize each package
        const validatedPackages = data.map(pkg => {
          // Ensure required fields exist and pkg is a valid object
          if (!pkg || typeof pkg !== 'object' || !pkg._id || !pkg.name) {
            console.warn('Package missing required fields:', pkg);
            return null;
          }
          
          // Normalize package data
          return {
            ...pkg,
            // Ensure images array exists and has at least one image
            images: Array.isArray(pkg.images) ? pkg.images : 
                   pkg.imageUrl ? [{ url: pkg.imageUrl, isPrimary: true }] : [],
            // Ensure features is an array
            features: Array.isArray(pkg.features) ? pkg.features : [],
            // Ensure included arrays exist (normalize to string names for UI chips)
            includedServices: Array.isArray(pkg.includedServices)
              ? pkg.includedServices
                  .map(it => typeof it === 'string' ? it : (it && (it.name || it.serviceName) ? (it.name || it.serviceName) : ''))
                  .filter(Boolean)
              : [],
            includedEquipment: Array.isArray(pkg.includedEquipment)
              ? pkg.includedEquipment
                  .map(it => typeof it === 'string' ? it : (it && (it.name || it.equipmentName) ? (it.name || it.equipmentName) : ''))
                  .filter(Boolean)
              : [],
            // Ensure boolean flags are properly set
            isPopular: !!pkg.isPopular,
            isFeatured: !!pkg.isFeatured,
            // Ensure price is a number
            price: typeof pkg.price === 'number' ? pkg.price : 
                  typeof pkg.basePrice === 'number' ? pkg.basePrice : 0,
            // Ensure price unit exists
            priceUnit: pkg.priceUnit || 'R',
            // Ensure category is normalized
            category: String(pkg.category || 'other').toLowerCase()
          };
        }).filter(Boolean); // Remove any invalid packages
        
        if (validatedPackages.length === 0 && data.length > 0) {
          console.warn('No valid packages found in response');
          throw new Error('No valid packages found in server response');
        }
        
        setPackages(validatedPackages);
        
        // Clear any previous errors; do not show an error for empty results
        setError(null);
        
      } catch (err) {
        console.error('Error in loadPackages:', err);
        if (!isMounted) return;
        
        // Handle different error types with user-friendly messages
        let errorMessage = 'Failed to load packages. ';
        
        if (err.response) {
          // Server responded with error status
          if (err.response.status === 401) {
            errorMessage += 'Authentication required. Please log in again.';
            // Optionally redirect to login
            // window.location.href = '/login';
          } else if (err.response.status >= 500) {
            errorMessage += 'Server error. Please try again later.';
          } else {
            errorMessage += err.response.data?.message || 'Please try again.';
          }
        } else if (err.request) {
          // Request was made but no response received
          errorMessage += 'No response from server. Please check your connection.';
        } else {
          // Something happened in setting up the request
          errorMessage += err.message || 'An unexpected error occurred.';
        }
        
        setError(errorMessage);
        setPackages([]); // Clear any stale data
      } finally {
        setLoadingPage(false);
      }
    };

    loadPackages();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this package?')) {
      try {
        const token = getAuthToken();
        if (!token) {
          setError('Authentication required. Please log in again.');
          window.location.href = '/admin/login?session=expired';
          return;
        }
        await deletePackage(id, token);
        setPackages(packages.filter(pkg => pkg._id !== id));
      } catch (err) {
        setError('Failed to delete package');
      }
    }
  };
  
  
  

  if (loadingPage && packages.length === 0) return <div className="p-4">Loading packages...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  
  // Ensure packages is an array before mapping
  const packagesList = Array.isArray(packages) ? packages : [];
  
  // Available categories (values MUST match quotation form event types exactly)
  const categories = [
    'construction',
    'industrial',
    'mining',
    'roadworks',
    'building',
    'infrastructure',
    'wedding',
    'birthday',
    'corporate',
    'festival',
    'private',
    'community',
    'charity',
    'other'
  ];
  const labelFor = (val) => {
    const labels = {
      'construction': 'Construction Site',
      'industrial': 'Industrial Site', 
      'mining': 'Mining Operation',
      'roadworks': 'Road Works',
      'building': 'Building Project',
      'infrastructure': 'Infrastructure Project',
      'wedding': 'Wedding',
      'birthday': 'Birthday Party',
      'corporate': 'Corporate Event',
      'festival': 'Festival',
      'private': 'Private Party',
      'community': 'Community Event',
      'charity': 'Charity Event',
      'other': 'Other'
    };
    return labels[val] || val.charAt(0).toUpperCase() + val.slice(1);
  };

  // Local derived list based on filters

  const viewList = packagesList.filter((p) => {
    if (!p) return false;
    const matchesSearch = search
      ? (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(search.toLowerCase())
      : true;
    const matchesCategory = categoryFilter === 'all' ? true : (p.category === categoryFilter);
    const matchesPopular = onlyPopular ? !!p.isPopular : true;
    const matchesFeatured = onlyFeatured ? !!p.isFeatured : true;
    return matchesSearch && matchesCategory && matchesPopular && matchesFeatured;
  });

  // Package templates for quick creation
  const packageTemplates = [
    {
      key: 'wedding_starter',
      label: 'Wedding Starter',
      data: {
        name: 'Wedding Starter Package',
        category: 'wedding',
        price: 1999,
        priceUnit: 'R',
        description: 'Essential setup for intimate weddings. Perfect for small venues and intimate ceremonies.',
        features: [
          'Compact sound system',
          '1 wireless microphone',
          'Basic lighting setup',
          'Setup & teardown included',
          'Up to 3 hours service'
        ],
        isPopular: true,
        isFeatured: false
      }
    },
    {
      key: 'wedding_premium',
      label: 'Wedding Premium',
      data: {
        name: 'Wedding Premium Package',
        category: 'wedding',
        price: 5499,
        priceUnit: 'R',
        description: 'Full-featured package for large weddings with professional coverage and effects.',
        features: [
          'Professional sound system',
          '2+ wireless microphones',
          'Full lighting rig',
          'DJ & MC service',
          'Special effects (haze/FX)',
          'On-site technician',
          'Up to 8 hours service'
        ],
        isPopular: true,
        isFeatured: true
      }
    },
    {
      key: 'corporate_standard',
      label: 'Corporate Standard',
      data: {
        name: 'Corporate Standard Package',
        category: 'corporate',
        price: 3999,
        priceUnit: 'R',
        description: 'Professional AV for meetings and presentations.',
        features: [
          '2 speakers + mixer',
          '2 wireless handheld mics',
          'Podium mic (optional)',
          'Laptop audio integration',
          'Basic stage wash lighting',
          'Up to 4 hours on-site'
        ],
        isPopular: true,
        isFeatured: false
      }
    },
    {
      key: 'birthday_basic',
      label: 'Birthday Basic',
      data: {
        name: 'Birthday Basic Package',
        category: 'birthday',
        price: 1499,
        priceUnit: 'R',
        description: 'Fun and affordable setup for birthday celebrations.',
        features: [
          'Portable sound system',
          '1 wireless microphone',
          'Party lighting effects',
          'Music playlist support',
          'Up to 3 hours service'
        ],
        isPopular: true,
        isFeatured: false
      }
    },
    {
      key: 'conference_premium',
      label: 'Conference Premium',
      data: {
        name: 'Conference Premium Package',
        category: 'conference',
        price: 5999,
        priceUnit: 'R',
        description: 'Advanced conference setup with enhanced features for important presentations.',
        features: [
          '4 speakers + advanced mixer',
          '3 wireless mics + podium',
          'Projector/screen setup',
          'Video recording capability',
          'Professional lighting',
          'Full-day support'
        ],
        isPopular: false,
        isFeatured: true
      }
    },
    {
      key: 'anniversary_luxury',
      label: 'Anniversary Luxury',
      data: {
        name: 'Anniversary Luxury Package',
        category: 'anniversary',
        price: 4499,
        priceUnit: 'R',
        description: 'Luxury anniversary celebration with premium features.',
        features: [
          'High-end sound system',
          '2 wireless microphones',
          'Elegant lighting design',
          'Live music support',
          'Special effects',
          'Up to 6 hours service'
        ],
        isPopular: false,
        isFeatured: true
      }
    }
  ];

  const applyTemplate = (tpl) => {
    if (!tpl || !tpl.data) return;
    setNewPackage(prev => ({
      ...prev,
      ...tpl.data,
      // Keep existing image if user already selected one
      imageUrl: prev.imageUrl || tpl.data.imageUrl || '',
      // Ensure features is always an array
      features: Array.isArray(tpl.data.features) ? tpl.data.features : []
    }));
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Packages</h1>
          <p className="text-gray-600 mt-1">Create and manage your event packages and services</p>
        </div>
        <button
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black px-4 py-2 rounded-lg font-semibold flex items-center shadow-sm focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 transition-colors mt-4 md:mt-0"
          onClick={() => {
            setNewPackage({
              name: '',
              category: 'other',
              price: '',
              priceUnit: 'R',
              description: '',
              imageUrl: '',
              images: [],
              features: [],
              includedServices: [],
              includedEquipment: [],
              isPopular: false,
              isFeatured: false
            });
            setNewAddFeature('');
            setShowAddModal(true);
          }}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Package
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">Filter & Search</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
              placeholder="Search packages..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{labelFor(cat)}</option>
            ))}
          </select>
          <label className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input type="checkbox" className="h-4 w-4 text-gold-600 focus:ring-gold-500 border-gray-300 rounded" checked={onlyPopular} onChange={(e) => setOnlyPopular(e.target.checked)} />
            <span className="text-sm font-medium text-gray-700">Popular only</span>
          </label>
          <label className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
            <input type="checkbox" className="h-4 w-4 text-gold-600 focus:ring-gold-500 border-gray-300 rounded" checked={onlyFeatured} onChange={(e) => setOnlyFeatured(e.target.checked)} />
            <span className="text-sm font-medium text-gray-700">Featured only</span>
          </label>
        </div>
      </div>

      {/* Packages */}
      {viewList.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-14">
          <button
            className="bg-gold-600 hover:bg-gold-700 text-black px-4 py-2 rounded-lg font-medium"
            onClick={() => {
              setNewPackage({
                name: '',
                category: 'other',
                price: '',
                priceUnit: 'R',
                description: '',
                imageUrl: '',
                features: [],
                isPopular: false,
                isFeatured: false
              });
              setNewAddFeature('');
              setShowAddModal(true);
            }}
          >
            Add Package
          </button>
          <div className="mt-2 text-sm text-gray-500">No packages yet</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {viewList.map((pkg, idx) => (
            <div key={pkg?._id || idx} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200 flex flex-col h-full">
              <AdminCardImageCarousel pkg={pkg || {}} />
              <div className="p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{pkg?.name || 'Untitled'}</h2>
                  <button
                    onClick={() => {
                      // Initialize edit state with proper price fields and images array
                      const initialPrice = ((pkg?.price ?? pkg?.basePrice) ?? 0);
                      const priceUnit = pkg?.priceUnit ?? 'R';
                      const images = Array.isArray(pkg?.images) && pkg.images.length
                        ? pkg.images
                        : (pkg?.imageUrl ? [{ url: pkg.imageUrl, isPrimary: true }] : []);
                      const imageUrl = images.find(im => im.isPrimary)?.url || images[0]?.url || pkg?.imageUrl || '';
                      setEditPackage({ ...(pkg || {}), price: initialPrice, priceUnit, images, imageUrl });
                      setShowEditModal(true);
                    }}
                    className="bg-gold-600 hover:bg-gold-700 text-black px-3 py-1.5 rounded-lg font-medium text-sm"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-3">{pkg?.description || ''}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {Array.isArray(pkg?.features) && pkg.features.map((f, i) => (
                    <span key={i} className="bg-gold-50 border border-gold-200 text-gold-800 text-xs font-medium px-2.5 py-0.5 rounded">{f}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    {pkg?.isPopular && <span className="px-2 py-0.5 rounded text-xs bg-gold-100 text-gold-800 border border-gold-200">Popular</span>}
                    {pkg?.isFeatured && <span className="px-2 py-0.5 rounded text-xs bg-emerald-100 text-emerald-800 border border-emerald-200">Featured</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => pkg?._id && handleDelete(pkg._id)}
                      className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Add Package</h2>
                <button 
                  onClick={() => { setShowAddModal(false); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Quick templates */}
              <div className="mb-4">
                <div className="text-sm text-gray-700 mb-2 font-medium">Quick templates</div>
                <div className="flex flex-wrap gap-2">
                  {packageTemplates.map((tpl) => (
                    <button
                      key={tpl.key}
                      type="button"
                      className="px-3 py-1.5 rounded border border-gold-300 text-gold-700 bg-white hover:bg-gold-50 text-sm transition-colors"
                      onClick={() => applyTemplate(tpl)}
                    >
                      {tpl.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="px-3 py-1.5 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100 text-sm text-gray-700"
                    onClick={() => {
                      setNewPackage({
                        name: '',
                        category: 'other',
                        price: '',
                        priceUnit: 'R',
                        description: '',
                        imageUrl: '',
                        features: [],
                        isPopular: false,
                        isFeatured: false
                      });
                      setNewAddFeature('');
                      setError(null);
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                
                // Prevent form submission if any uploads are in progress
                const activeUploads = addUploads.filter(u => u.status === 'uploading');
                if (activeUploads.length > 0) {
                  const fileNames = activeUploads.map(u => u.name).join(', ');
                  setError(`Please wait for file uploads to complete: ${fileNames}`);
                  showToast(`Please wait for ${activeUploads.length} upload(s) to complete`, 'error');
                  return;
                }
                
                try {
                  setLoadingEdit(true);
                  setError(null);
                  
                  // Validate required fields
                  if (!newPackage.name?.trim()) {
                    throw new Error('Package name is required');
                  }
                  
                  const priceNum = parseFloat(newPackage.price);
                  if (isNaN(priceNum) || priceNum <= 0) {
                    throw new Error('Please enter a valid price (must be a positive number)');
                  }
                  const token = getAuthToken();
                  if (!token) {
                    setError('Authentication required. Please log in again.');
                    window.location.href = '/admin/login?session=expired';
                    return;
                  }
                  const payload = {
                    name: newPackage.name,
                    category: newPackage.category,
                    price: priceNum,
                    priceUnit: newPackage.priceUnit,
                    description: newPackage.description,
                    imageUrl: newPackage.imageUrl,
                    images: Array.isArray(newPackage.images) ? newPackage.images : [],
                    features: Array.isArray(newPackage.features) ? newPackage.features : [],
                    includedServices: Array.isArray(newPackage.includedServices)
                      ? newPackage.includedServices.map(s => ({ name: String(s) }))
                      : [],
                    includedEquipment: Array.isArray(newPackage.includedEquipment)
                      ? newPackage.includedEquipment.map(s => ({ name: String(s) }))
                      : [],
                    isPopular: !!newPackage.isPopular,
                    isFeatured: !!newPackage.isFeatured
                  };
                  const created = await createNewPackage(payload, token);
                  setPackages(prev => [created, ...prev]);
                  setShowAddModal(false);
                  setNewPackage({
                    name: '',
                    category: 'other',
                    price: '',
                    priceUnit: 'R',
                    description: '',
                    imageUrl: '',
                    features: [],
                    includedServices: [],
                    includedEquipment: [],
                    isPopular: false,
                    isFeatured: false
                  });
                  setError(null);
                  showToast('Package created successfully', 'success');
                } catch (err) {
                  console.error('Error creating package:', err);
                  let msg = 'Failed to create package';
                  if (err.response?.status === 400) msg = 'Invalid data. Please check the fields.';
                  if (err.response?.status === 409) msg = 'A package with this name already exists.';
                  if (err.response?.data?.message) msg = err.response.data.message;
                  if (err.message && !err.response) {
                    msg = err.message;
                  }
                  setError(msg);
                  showToast(msg, 'error');
                } finally {
                  setLoadingEdit(false);
                }
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Name *</label>
                    <input
                      type="text"
                      required
                      aria-required="true"
                      aria-invalid={!newPackage.name?.trim()}
                      className="w-full p-2 border rounded"
                      value={newPackage.name}
                      onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      required
                      aria-required="true"
                      className="w-full p-2 border rounded"
                      value={newPackage.category}
                      onChange={(e) => setNewPackage({ ...newPackage, category: e.target.value })}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{labelFor(cat)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        {newPackage.priceUnit}
                      </span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        pattern="[0-9]*[.,]?[0-9]*"
                        onWheel={(e) => e.currentTarget.blur()}
                        className="flex-1 p-2 border rounded-r"
                        value={newPackage.price}
                        onChange={(e) => setNewPackage({ ...newPackage, price: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Preview</label>
                    <div className="mb-3 border rounded overflow-hidden">
                      <AdminCardImageCarousel
                        hidePrice
                        pkg={{
                          name: editPackage?.name,
                          price: editPackage?.price,
                          basePrice: editPackage?.basePrice,
                          imageUrl: editPackage?.imageUrl,
                          images: Array.isArray(editPackage?.images) ? editPackage.images : [],
                        }}
                      />
                    </div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Images</label>
                    {/* Add image by URL */}
                    <div className="flex gap-2 mb-2">
                      <input
                        type="url"
                        className="flex-1 p-2 border rounded"
                        value={newPackage.imageUrl || ''}
                        onChange={(e) => setNewPackage({ ...newPackage, imageUrl: e.target.value })}
                        placeholder="https://.../image.jpg (primary)"
                      />
                      <button
                        type="button"
                        className="px-3 py-2 rounded bg-gray-100 border hover:bg-gray-200 text-sm"
                        onClick={() => {
                          const url = (newPackage.imageUrl || '').trim();
                          if (!url) return;
                          setNewPackage(prev => {
                            const hasPrimary = Array.isArray(prev.images) && prev.images.some(im => im.isPrimary);
                            const already = Array.isArray(prev.images) && prev.images.some(im => im.url === url);
                            const images = already ? prev.images : [...(prev.images || []), { url, isPrimary: !hasPrimary }];
                            const primaryUrl = images.find(im => im.isPrimary)?.url || images[0]?.url || '';
                            return { ...prev, images, imageUrl: primaryUrl };
                          });
                          showToast('Image added from URL', 'success');
                        }}
                      >
                        Add URL
                      </button>
                    </div>
                    {/* Upload multiple files */}
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml"
                        multiple
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (!files.length) return;
                          setUploadingAddImage(true);
                          // Initialize upload rows
                          const startRows = files.map((f, i) => ({ id: `${f.name}-${i}-${Date.now()}`, name: f.name, progress: 0, status: 'uploading' }));
                          setAddUploads(startRows);
                          let success = 0;
                          let failed = 0;
                          try {
                            await uploadFilesWithConcurrency(files, {
                              concurrency: 3,
                              onFileProgress: ({ id, file, progress }) => {
                                setAddUploads(prev => prev.map(u => u.id === id || (u.name === file.name && u.status === 'uploading') ? { ...u, id: u.id || id, progress } : u));
                              },
                              onFileDone: ({ id, file, img }) => {
                                success += 1;
                                setAddUploads(prev => prev.map(u => (u.id === id || (u.name === file.name && u.status === 'uploading')) ? { ...u, id: id, progress: 100, status: 'done' } : u));
                                const imgObj = {
                                  url: img.url,
                                  filename: img.filename,
                                  fileType: img.fileType,
                                  fileSize: img.fileSize,
                                  dimensions: img.dimensions || null,
                                  id: img.id || `${Date.now()}-${Math.random()}`,
                                  isPrimary: true,
                                  createdAt: img.createdAt || new Date().toISOString(),
                                };
                                setNewPackage(prev => {
                                  const hadPrimary = Array.isArray(prev.images) && prev.images.some(im => im.isPrimary);
                                  let images = [...(prev.images || []), imgObj];
                                  if (!hadPrimary && images.length) {
                                    images = images.map((im, idx) => ({ ...im, isPrimary: idx === 0 }));
                                  }
                                  const primaryUrl = images.find(im => im.isPrimary)?.url || images[0]?.url || prev.imageUrl || '';
                                  return { ...prev, images, imageUrl: primaryUrl };
                                });
                              },
                              onFileError: ({ id, file, error }) => {
                                failed += 1;
                                setAddUploads(prev => prev.map(u => (u.id === id || (u.name === file.name && u.status === 'uploading')) ? { ...u, id: id, status: 'error', error: error.message || 'Upload failed' } : u));
                              }
                            });
                            if (success > 0) {
                              showToast(`${success} image${success > 1 ? 's' : ''} uploaded`, 'success');
                            }
                            if (failed > 0) {
                              showToast(`${failed} upload${failed > 1 ? 's' : ''} failed`, 'error');
                            }
                          } catch (err) {
                            console.error('Image upload failed:', err);
                            setError(err.message || 'Image upload failed');
                          } finally {
                            setUploadingAddImage(false);
                            setTimeout(() => setAddUploads([]), 1200);
                            e.target.value = '';
                          }
                        }}
                        className="text-sm"
                      />
                      {uploadingAddImage && <span className="text-xs text-gray-500">Uploading...</span>}
                    </div>
                    {/* Per-file upload progress (Add) */}
                    {addUploads.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {addUploads.map((u, i) => (
                          <div key={`${u.id}-${i}`} className="text-xs">
                            <div className="flex justify-between mb-0.5">
                              <span className="text-gray-600 truncate max-w-[60%]" title={u.name}>{u.name}</span>
                              <span className="text-gray-500">{u.status === 'done' ? '100%' : `${u.progress || 0}%`}</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 rounded">
                              <div className={`h-1.5 rounded ${u.status === 'error' ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${u.status === 'done' ? 100 : (u.progress || 0)}%` }} />
                            </div>
                            {u.status === 'error' && <div className="text-red-600 mt-0.5">{u.error}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Thumbnails */}
                    {Array.isArray(newPackage.images) && newPackage.images.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                        {newPackage.images.map((im, idx) => (
                          <div
                            key={idx}
                            className={`relative border rounded-sm overflow-hidden group ${im.isPrimary ? 'ring-2 ring-gold-500' : 'hover:ring-2 hover:ring-amber-300'}`}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', String(idx));
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
                              if (Number.isNaN(from) || from === idx) return;
                              setNewPackage(prev => {
                                const arr = [...(prev.images || [])];
                                const [moved] = arr.splice(from, 1);
                                arr.splice(idx, 0, moved);
                                // Ensure exactly one primary, keep first as primary if none
                                let images = arr;
                                if (!images.some(x => x.isPrimary)) {
                                  images = images.map((x, i) => ({ ...x, isPrimary: i === 0 }));
                                }
                                const primaryUrl = images.find(x => x.isPrimary)?.url || images[0]?.url || prev.imageUrl || '';
                                return { ...prev, images, imageUrl: primaryUrl };
                              });
                            }}
                          >
                            <img src={im.url} alt="" className="w-full h-16 object-cover" loading="lazy" decoding="async" />
                            <div className="absolute inset-x-0 bottom-0 flex justify-between p-1 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                className="text-[10px] text-white px-1 py-0.5 bg-black/60 rounded"
                                onClick={() => {
                                  setNewPackage(prev => {
                                    const images = (prev.images || []).map((img, i) => ({ ...img, isPrimary: i === idx }));
                                    const primaryUrl = images[idx]?.url || prev.imageUrl || '';
                                    return { ...prev, images, imageUrl: primaryUrl };
                                  });
                                }}
                              >
                                {im.isPrimary ? 'Primary' : 'Set primary'}
                              </button>
                              <button
                                type="button"
                                className="text-[10px] text-red-100 px-1 py-0.5 bg-red-600/80 rounded"
                                onClick={() => {
                                  setNewPackage(prev => {
                                    let images = (prev.images || []).filter((_, i) => i !== idx);
                                    if (!images.length) return { ...prev, images: [], imageUrl: '' };
                                    // Ensure one primary remains
                                    if (!images.some(im => im.isPrimary)) {
                                      images = images.map((img, i) => ({ ...img, isPrimary: i === 0 }));
                                    }
                                    const primaryUrl = images.find(im => im.isPrimary)?.url || images[0]?.url || '';
                                    return { ...prev, images, imageUrl: primaryUrl };
                                  });
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-end space-x-4 md:col-span-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="addIsPopular"
                        className="h-4 w-4 text-amber-600 rounded"
                        checked={!!newPackage.isPopular}
                        onChange={(e) => setNewPackage({ ...newPackage, isPopular: e.target.checked })}
                      />
                      <label htmlFor="addIsPopular" className="ml-2 text-sm text-gray-700">Popular</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="addIsFeatured"
                        className="h-4 w-4 text-amber-600 rounded"
                        checked={!!newPackage.isFeatured}
                        onChange={(e) => setNewPackage({ ...newPackage, isFeatured: e.target.checked })}
                      />
                      <label htmlFor="addIsFeatured" className="ml-2 text-sm text-gray-700">Featured</label>
                    </div>
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    rows="3"
                    value={newPackage.description}
                    onChange={(e) => setNewPackage({ ...newPackage, description: e.target.value })}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      className="flex-1 p-2 border rounded-l"
                      placeholder="Add a feature"
                      value={newAddFeature}
                      onChange={(e) => setNewAddFeature(e.target.value)}
                    />
                    <button
                      className="px-4 rounded-r bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-600 hover:to-amber-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!newAddFeature.trim()}
                      onClick={(e) => {
                        e.preventDefault();
                        const val = newAddFeature.trim();
                        if (!val) return;
                        if (!Array.isArray(newPackage.features)) {
                          setNewPackage({ ...newPackage, features: [val] });
                          setNewAddFeature('');
                          return;
                        }
                        const exists = newPackage.features.some(f => String(f).toLowerCase() === val.toLowerCase());
                        if (!exists) {
                          setNewPackage({
                            ...newPackage,
                            features: [...newPackage.features, val]
                          });
                          setNewAddFeature('');
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(newPackage.features) && newPackage.features.map((feature, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-800 px-2 py-1 rounded flex items-center">
                        {feature}
                        <button
                          className="ml-2 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.preventDefault();
                            setNewPackage({
                              ...newPackage,
                              features: newPackage.features.filter(f => f !== feature)
                            });
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                {/* Included Services */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Included Services</label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      className="flex-1 p-2 border rounded-l"
                      placeholder="Add a service"
                      value={newAddService}
                      onChange={(e) => setNewAddService(e.target.value)}
                    />
                    <button
                      className="px-4 rounded-r bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-600 hover:to-amber-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!newAddService.trim()}
                      onClick={(e) => {
                        e.preventDefault();
                        const val = newAddService.trim();
                        if (!val) return;
                        const curr = Array.isArray(newPackage.includedServices) ? newPackage.includedServices : [];
                        const exists = curr.some(s => String(s).toLowerCase() === val.toLowerCase());
                        if (!exists) {
                          setNewPackage({
                            ...newPackage,
                            includedServices: [...curr, val]
                          });
                        }
                        setNewAddService('');
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(newPackage.includedServices) && newPackage.includedServices.map((svc, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-800 px-2 py-1 rounded flex items-center">
                        {svc}
                        <button
                          className="ml-2 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.preventDefault();
                            setNewPackage({
                              ...newPackage,
                              includedServices: newPackage.includedServices.filter((s) => s !== svc)
                            });
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                {/* Included Equipment */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Included Equipment</label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      className="flex-1 p-2 border rounded-l"
                      placeholder="Add equipment"
                      value={newAddEquipment}
                      onChange={(e) => setNewAddEquipment(e.target.value)}
                    />
                    <button
                      className="px-4 rounded-r bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-600 hover:to-amber-700 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={!newAddEquipment.trim()}
                      onClick={(e) => {
                        e.preventDefault();
                        const val = newAddEquipment.trim();
                        if (!val) return;
                        const curr = Array.isArray(newPackage.includedEquipment) ? newPackage.includedEquipment : [];
                        const exists = curr.some(s => String(s).toLowerCase() === val.toLowerCase());
                        if (!exists) {
                          setNewPackage({
                            ...newPackage,
                            includedEquipment: [...curr, val]
                          });
                        }
                        setNewAddEquipment('');
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(newPackage.includedEquipment) && newPackage.includedEquipment.map((eq, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-800 px-2 py-1 rounded flex items-center">
                        {eq}
                        <button
                          className="ml-2 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.preventDefault();
                            setNewPackage({
                              ...newPackage,
                              includedEquipment: newPackage.includedEquipment.filter((s) => s !== eq)
                            });
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button 
                    type="button"
                    className="px-4 py-2 rounded border"
                    onClick={() => { setShowAddModal(false); }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 rounded bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-600 hover:to-amber-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={loadingEdit || uploadingAddImage}
                  >
                    {uploadingAddImage ? 'Uploading...' : (loadingEdit ? 'Creating...' : 'Create Package')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Edit Package Modal (moved here to avoid nesting inside Add Package modal) */}
      {showEditModal && editPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Package</h2>
                <button 
                  onClick={() => { setShowEditModal(false); setEditPackage(null); }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  setLoadingEdit(true);
                  // Basic validation
                  const priceNum = parseFloat(editPackage.price) || 0;
                  if (!editPackage.name?.trim()) {
                    throw new Error('Package name is required');
                  }
                  if (priceNum <= 0) {
                    throw new Error('Price must be greater than 0');
                  }
                  const token = getAuthToken();
                  if (!token) {
                    setError('Authentication required. Please log in again.');
                    window.location.href = '/admin/login?session=expired';
                    return;
                  }
                  const payload = {
                    name: editPackage.name,
                    category: editPackage.category,
                    price: priceNum,
                    priceUnit: editPackage.priceUnit,
                    description: editPackage.description,
                    imageUrl: editPackage.imageUrl,
                    images: Array.isArray(editPackage.images) ? editPackage.images : [],
                    features: Array.isArray(editPackage.features) ? editPackage.features : [],
                    includedServices: Array.isArray(editPackage.includedServices)
                      ? editPackage.includedServices.map(s => ({ name: String(s) }))
                      : [],
                    includedEquipment: Array.isArray(editPackage.includedEquipment)
                      ? editPackage.includedEquipment.map(s => ({ name: String(s) }))
                      : [],
                    isPopular: !!editPackage.isPopular,
                    isFeatured: !!editPackage.isFeatured
                  };
                  const updated = await updatePackage(editPackage._id, payload, token);
                  setPackages(prev => prev.map(p => p._id === updated._id ? updated : p));
                  setShowEditModal(false);
                  setEditPackage(null);
                  setError(null);
                  showToast('Package updated successfully', 'success');
                } catch (err) {
                  console.error('Error updating package:', err);
                  let msg = 'Failed to update package';
                  if (err.response?.status === 400) msg = 'Invalid data. Please check the fields.';
                  if (err.response?.status === 409) msg = 'A package with this name already exists.';
                  if (err.response?.data?.message) msg = err.response.data.message;
                  setError(msg);
                  if (err.message && !err.response) {
                    // Local validation error
                    setError(err.message);
                    msg = err.message;
                  }
                  showToast(msg, 'error');
                } finally {
                  setLoadingEdit(false);
                }
              }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Package Name *</label>
                    <input
                      type="text"
                      required
                      className="w-full p-2 border rounded"
                      value={editPackage.name}
                      onChange={(e) => setEditPackage({ ...editPackage, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                    <select
                      required
                      className="w-full p-2 border rounded"
                      value={editPackage.category}
                      onChange={(e) => setEditPackage({ ...editPackage, category: e.target.value })}
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{labelFor(cat)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price *</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 rounded-l border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        {editPackage.priceUnit}
                      </span>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        className="flex-1 p-2 border rounded-r"
                        value={editPackage.price}
                        onChange={(e) => setEditPackage({ ...editPackage, price: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">Images</label>
                    
                    {/* Primary Image URL */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Primary Image URL</label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={editPackage.imageUrl || ''}
                          onChange={(e) => setEditPackage({ ...editPackage, imageUrl: e.target.value })}
                          placeholder="https://.../image.jpg"
                        />
                        <button
                          type="button"
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 text-sm font-medium"
                          onClick={() => {
                            const url = (editPackage.imageUrl || '').trim();
                            if (!url) return;
                            setEditPackage(prev => {
                              const hasPrimary = Array.isArray(prev.images) && prev.images.some(im => im.isPrimary);
                              const already = Array.isArray(prev.images) && prev.images.some(im => im.url === url);
                              const images = already ? prev.images : [...(prev.images || []), { url, isPrimary: !hasPrimary }];
                              const primaryUrl = images.find(im => im.isPrimary)?.url || images[0]?.url || '';
                              return { ...prev, images, imageUrl: primaryUrl };
                            });
                            showToast('Image added from URL', 'success');
                          }}
                        >
                          Add URL
                        </button>
                      </div>
                    </div>
                    {/* Upload multiple files */}
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml"
                        multiple
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []);
                          if (!files.length) return;
                          setUploadingEditImage(true);
                          const startRows = files.map((f, i) => ({ id: `${f.name}-${i}-${Date.now()}`, name: f.name, progress: 0, status: 'uploading' }));
                          setEditUploads(startRows);
                          let success = 0;
                          let failed = 0;
                          try {
                            await uploadFilesWithConcurrency(files, {
                              concurrency: 3,
                              onFileProgress: ({ id, file, progress }) => {
                                setEditUploads(prev => prev.map(u => u.id === id || (u.name === file.name && u.status === 'uploading') ? { ...u, id: u.id || id, progress } : u));
                              },
                              onFileDone: ({ id, file, img }) => {
                                success += 1;
                                setEditUploads(prev => prev.map(u => (u.id === id || (u.name === file.name && u.status === 'uploading')) ? { ...u, id: id, progress: 100, status: 'done' } : u));
                                const imgObj = {
                                  url: img.url,
                                  filename: img.filename,
                                  fileType: img.fileType,
                                  fileSize: img.fileSize,
                                  dimensions: img.dimensions || null,
                                  id: img.id || `${Date.now()}-${Math.random()}`,
                                  isPrimary: true,
                                  createdAt: img.createdAt || new Date().toISOString(),
                                };
                                setEditPackage(prev => {
                                  const hadPrimary = Array.isArray(prev.images) && prev.images.some(im => im.isPrimary);
                                  let images = [...(prev.images || []), imgObj];
                                  if (!hadPrimary && images.length) {
                                    images = images.map((im, idx) => ({ ...im, isPrimary: idx === 0 }));
                                  }
                                  const primaryUrl = images.find(im => im.isPrimary)?.url || images[0]?.url || prev.imageUrl || '';
                                  return { ...prev, images, imageUrl: primaryUrl };
                                });
                              },
                              onFileError: ({ id, file, error }) => {
                                failed += 1;
                                setEditUploads(prev => prev.map(u => (u.id === id || (u.name === file.name && u.status === 'uploading')) ? { ...u, id: id, status: 'error', error: error.message || 'Upload failed' } : u));
                              }
                            });
                            if (success > 0) {
                              showToast(`${success} image${success > 1 ? 's' : ''} uploaded`, 'success');
                            }
                            if (failed > 0) {
                              showToast(`${failed} upload${failed > 1 ? 's' : ''} failed`, 'error');
                            }
                          } catch (err) {
                            console.error('Image upload failed:', err);
                            setError(err.message || 'Image upload failed');
                          } finally {
                            setUploadingEditImage(false);
                            setTimeout(() => setEditUploads([]), 1200);
                            e.target.value = '';
                          }
                        }}
                        className="text-sm"
                      />
                      {uploadingEditImage && <span className="text-xs text-gray-500">Uploading...</span>}
                    </div>
                    {/* Per-file upload progress (Edit) */}
                    {editUploads.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {editUploads.map((u, i) => (
                          <div key={`${u.id}-${i}`} className="text-xs">
                            <div className="flex justify-between mb-0.5">
                              <span className="text-gray-600 truncate max-w-[60%]" title={u.name}>{u.name}</span>
                              <span className="text-gray-500">{u.status === 'done' ? '100%' : `${u.progress || 0}%`}</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 rounded">
                              <div className={`h-1.5 rounded ${u.status === 'error' ? 'bg-red-500' : 'bg-amber-500'}`} style={{ width: `${u.status === 'done' ? 100 : (u.progress || 0)}%` }} />
                            </div>
                            {u.status === 'error' && <div className="text-red-600 mt-0.5">{u.error}</div>}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Image Gallery */}
                    {Array.isArray(editPackage.images) && editPackage.images.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Image Gallery</h4>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {editPackage.images.map((im, idx) => (
                          <div
                            key={idx}
                            className={`relative border-2 rounded-lg overflow-hidden group ${im.isPrimary ? 'ring-2 ring-amber-500 border-amber-500' : 'border-gray-200 hover:border-gray-300'}`}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', String(idx));
                            }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
                              if (Number.isNaN(from) || from === idx) return;
                              setEditPackage(prev => {
                                const arr = [...(prev.images || [])];
                                const [moved] = arr.splice(from, 1);
                                arr.splice(idx, 0, moved);
                                let images = arr;
                                if (!images.some(x => x.isPrimary)) {
                                  images = images.map((x, i) => ({ ...x, isPrimary: i === 0 }));
                                }
                                const primaryUrl = images.find(x => x.isPrimary)?.url || images[0]?.url || prev.imageUrl || '';
                                return { ...prev, images, imageUrl: primaryUrl };
                              });
                            }}
                          >
                            <img 
                              src={im.url} 
                              alt={im.filename || `Package image ${idx + 1}`} 
                              className="w-full h-20 object-cover" 
                              loading="lazy" 
                              decoding="async"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                const fallback = e.target.nextElementSibling;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div className="w-full h-20 bg-gray-100 flex items-center justify-center text-xs text-gray-500" style={{ display: 'none' }}>
                              <div className="text-center">
                                <div>Image {idx + 1}</div>
                                <div className="text-[10px] text-gray-400">Failed to load</div>
                              </div>
                            </div>
                            
                            {/* Primary indicator */}
                            {im.isPrimary && (
                              <div className="absolute top-1 left-1 bg-amber-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                                Primary
                              </div>
                            )}
                            <div className="absolute inset-x-0 bottom-0 flex justify-between p-1 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  className="text-[10px] text-white px-1 py-0.5 bg-green-600/80 rounded"
                                  onClick={() => window.open(im.url, '_blank')}
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  className="text-[10px] text-white px-1 py-0.5 bg-blue-600/80 rounded"
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/jpeg,image/jpg,image/png,image/webp,image/gif,image/svg+xml';
                                    input.onchange = async (e) => {
                                      const file = e.target.files[0];
                                      if (!file) return;
                                      try {
                                        const uploadedImg = await uploadImageFile(file, true);
                                        setEditPackage(prev => {
                                          const images = [...(prev.images || [])];
                                          images[idx] = { ...uploadedImg, isPrimary: true };
                                          const primaryUrl = images.find(im => im.isPrimary)?.url || images[0]?.url || '';
                                          return { ...prev, images, imageUrl: primaryUrl };
                                        });
                                        showToast('Image updated successfully', 'success');
                                      } catch (err) {
                                        showToast('Failed to update image', 'error');
                                      }
                                    };
                                    input.click();
                                  }}
                                >
                                  Change Image
                                </button>
                              </div>
                              <button
                                type="button"
                                className="text-[10px] text-white px-1 py-0.5 bg-black/60 rounded"
                                onClick={() => {
                                  setEditPackage(prev => {
                                    const images = (prev.images || []).map((img, i) => ({ ...img, isPrimary: i === idx }));
                                    const primaryUrl = images[idx]?.url || prev.imageUrl || '';
                                    return { ...prev, images, imageUrl: primaryUrl };
                                  });
                                }}
                              >
                                {im.isPrimary ? 'Primary' : 'Set primary'}
                              </button>
                              <button
                                type="button"
                                className="text-[10px] text-red-100 px-1 py-0.5 bg-red-600/80 rounded"
                                onClick={() => {
                                  setEditPackage(prev => {
                                    let images = (prev.images || []).filter((_, i) => i !== idx);
                                    if (!images.length) return { ...prev, images: [], imageUrl: '' };
                                    if (!images.some(im => im.isPrimary)) {
                                      images = images.map((img, i) => ({ ...img, isPrimary: i === 0 }));
                                    }
                                    const primaryUrl = images.find(im => im.isPrimary)?.url || images[0]?.url || '';
                                    return { ...prev, images, imageUrl: primaryUrl };
                                  });
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Drag images to reorder • Click "Set Primary" to make an image the main display image
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-end space-x-4 md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="editIsPopular"
                        className="h-4 w-4 text-amber-600 rounded"
                        checked={!!editPackage.isPopular}
                        onChange={(e) => setEditPackage({ ...editPackage, isPopular: e.target.checked })}
                      />
                      <label htmlFor="editIsPopular" className="ml-2 text-sm text-gray-700">Popular</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="editIsFeatured"
                        className="h-4 w-4 text-amber-600 rounded"
                        checked={!!editPackage.isFeatured}
                        onChange={(e) => setEditPackage({ ...editPackage, isFeatured: e.target.checked })}
                      />
                      <label htmlFor="editIsFeatured" className="ml-2 text-sm text-gray-700">Featured</label>
                    </div>
                  </div>
                </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    className="w-full p-2 border rounded"
                    rows="3"
                    value={editPackage.description}
                    onChange={(e) => setEditPackage({ ...editPackage, description: e.target.value })}
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Features</label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      className="flex-1 p-2 border rounded-l"
                      placeholder="Add a feature"
                      value={newFeature}
                      onChange={(e) => setNewFeature(e.target.value)}
                    />
                    <button
                      className="px-4 rounded-r bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-600 hover:to-amber-700"
                      onClick={(e) => {
                        e.preventDefault();
                        if (newFeature.trim() && !editPackage.features.includes(newFeature.trim())) {
                          setEditPackage({
                            ...editPackage,
                            features: [...editPackage.features, newFeature.trim()]
                          });
                          setNewFeature('');
                        }
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(editPackage.features) && editPackage.features.map((feature, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-800 px-2 py-1 rounded flex items-center">
                        {feature}
                        <button
                          className="ml-2 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.preventDefault();
                            setEditPackage({
                              ...editPackage,
                              features: editPackage.features.filter(f => f !== feature)
                            });
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                {/* Included Services */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Included Services</label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      className="flex-1 p-2 border rounded-l"
                      placeholder="Add a service"
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                    />
                    <button
                      className="px-4 rounded-r bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-600 hover:to-amber-700"
                      onClick={(e) => {
                        e.preventDefault();
                        const val = newService.trim();
                        if (!val) return;
                        const curr = Array.isArray(editPackage.includedServices) ? editPackage.includedServices : [];
                        const exists = curr.some(s => String(s).toLowerCase() === val.toLowerCase());
                        if (!exists) {
                          setEditPackage({
                            ...editPackage,
                            includedServices: [...curr, val]
                          });
                        }
                        setNewService('');
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(editPackage.includedServices) && editPackage.includedServices.map((svc, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-800 px-2 py-1 rounded flex items-center">
                        {svc}
                        <button
                          className="ml-2 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.preventDefault();
                            setEditPackage({
                              ...editPackage,
                              includedServices: editPackage.includedServices.filter((s) => s !== svc)
                            });
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                {/* Included Equipment */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Included Equipment</label>
                  <div className="flex mb-2">
                    <input
                      type="text"
                      className="flex-1 p-2 border rounded-l"
                      placeholder="Add equipment"
                      value={newEquipment}
                      onChange={(e) => setNewEquipment(e.target.value)}
                    />
                    <button
                      className="px-4 rounded-r bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-600 hover:to-amber-700"
                      onClick={(e) => {
                        e.preventDefault();
                        const val = newEquipment.trim();
                        if (!val) return;
                        const curr = Array.isArray(editPackage.includedEquipment) ? editPackage.includedEquipment : [];
                        const exists = curr.some(s => String(s).toLowerCase() === val.toLowerCase());
                        if (!exists) {
                          setEditPackage({
                            ...editPackage,
                            includedEquipment: [...curr, val]
                          });
                        }
                        setNewEquipment('');
                      }}
                    >
                      Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(editPackage.includedEquipment) && editPackage.includedEquipment.map((eq, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-800 px-2 py-1 rounded flex items-center">
                        {eq}
                        <button
                          className="ml-2 text-red-500 hover:text-red-700"
                          onClick={(e) => {
                            e.preventDefault();
                            setEditPackage({
                              ...editPackage,
                              includedEquipment: editPackage.includedEquipment.filter((s) => s !== eq)
                            });
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button 
                    type="button"
                    className="px-4 py-2 rounded border"
                    onClick={() => { setShowEditModal(false); setEditPackage(null); }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 rounded bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold hover:from-amber-600 hover:to-amber-700"
                    disabled={loadingEdit}
                  >
                    {loadingEdit ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-2 rounded shadow text-white ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

// Export all the API functions for use elsewhere
export { 
  fetchAllPackages, 
  createNewPackage, 
  updatePackage, 
  deletePackage, 
  getPackageById 
};

