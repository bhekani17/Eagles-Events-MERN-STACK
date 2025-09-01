import axios from 'axios';
import { useState, useEffect } from 'react';
import { getAuthToken } from '../../services/api';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5003';
const API_URL = `${API_BASE}/api/packages`;
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
      images: packageData.images
    };
    if (packageData.imageUrl) {
      payload.images = [{ url: packageData.imageUrl, isPrimary: true }];
    }

    
    const response = await axios.post(API_URL, payload, {
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
    if (payload.imageUrl !== undefined) {
      payload.images = payload.imageUrl ? [{ url: payload.imageUrl, isPrimary: true }] : [];
    }
    const response = await axios.put(`${API_URL}/${id}`, payload, {
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
    const response = await axios.delete(`${API_URL}/${id}`, {
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
  // Toast state for lightweight notifications
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }
  // Helper: show toast for 3 seconds
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  const [newFeature, setNewFeature] = useState('');
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  // View controls (must be declared before any early returns)
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [onlyPopular, setOnlyPopular] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);

  // Helper: upload image file to backend and return URL
  const uploadImageFile = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const resp = await axios.post(UPLOAD_URL, formData, {
      // Let the browser set the correct multipart boundary
      withCredentials: true,
    });
    // Backend returns { success, url, filename, ... }
    if (resp?.data?.url) return resp.data.url;
    // Fallback: path relative
    if (resp?.data?.path) {
      const backendOrigin = new URL(UPLOAD_URL).origin; // e.g., http://localhost:5003
      return new URL(resp.data.path, backendOrigin).href;
    }
    throw new Error('Upload failed: no URL returned');
  };

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const data = await fetchAllPackages();
        
        if (!data) {
          throw new Error('No data received from server');
        }
        
        if (!Array.isArray(data)) {
          console.warn('Expected array but received:', typeof data, data);
          setPackages([]);
          setError('Invalid data format received from server');
        } else {
          setPackages(data);
        }
      } catch (err) {
        console.error('Error in loadPackages:', err);
        setError(`Failed to load packages: ${err.message}`);
        setPackages([]); // Ensure packages is always an array
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Packages</h1>
          <p className="text-gray-600 mt-1">Create and manage your event packages and services</p>
        </div>
        <button
          className="bg-gold-600 hover:bg-gold-700 text-black px-4 py-2 rounded-lg font-medium flex items-center focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 mt-4 md:mt-0"
          onClick={() => alert('Add Package functionality coming soon')}
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
        <div className="flex flex-col items-center justify-center text-center bg-white rounded-lg border border-gray-200 p-10 shadow-sm">
          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No packages found</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first package</p>
          <button
            className="bg-gold-600 hover:bg-gold-700 text-black px-4 py-2 rounded-lg font-medium"
            onClick={() => alert('Add Package functionality coming soon')}
          >
            Add your first package
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {viewList.map((pkg) => (
            <div key={pkg._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200">
              {pkg.imageUrl && (
                <div className="w-full h-48 bg-gray-100 overflow-hidden relative">
                  <img 
                    src={pkg.imageUrl} 
                    alt={pkg.name} 
                    className="w-full h-full object-cover" 
                    loading="lazy" 
                    decoding="async" 
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" 
                  />
                  <div className="absolute top-3 right-3">
                    <div className="px-3 py-1 bg-gold-500 text-black rounded-full text-sm font-bold shadow-md">
                      R{(pkg.basePrice ?? pkg.price ?? 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{pkg.name}</h2>
                  <button
                    onClick={() => { setEditPackage(pkg); setShowEditModal(true); }}
                    className="bg-gold-600 hover:bg-gold-700 text-black px-3 py-1.5 rounded-lg font-medium text-sm"
                  >
                    Edit
                  </button>
                </div>
                <p className="text-sm text-gray-600 mb-3">{pkg.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {Array.isArray(pkg.features) && pkg.features.map((f, i) => (
                    <span key={i} className="bg-gold-100 text-gold-800 text-xs font-medium px-2.5 py-0.5 rounded">{f}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {pkg.isPopular && <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">Popular</span>}
                    {pkg.isFeatured && <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-800">Featured</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(pkg._id)}
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
      {/* Edit Package Modal (moved here to avoid nesting inside Add Package modal) */}
      {showEditModal && editPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                    features: Array.isArray(editPackage.features) ? editPackage.features : [],
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      className="w-full p-2 border rounded"
                      value={editPackage.imageUrl || ''}
                      onChange={(e) => setEditPackage({ ...editPackage, imageUrl: e.target.value })}
                      placeholder="https://.../image.jpg"
                    />
                    <div className="mt-2 flex items-center gap-3">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            setUploadingEditImage(true);
                            const url = await uploadImageFile(file);
                            setEditPackage(prev => ({ ...prev, imageUrl: url }));
                          } catch (err) {
                            console.error('Image upload failed:', err);
                            setError(err.message || 'Image upload failed');
                          } finally {
                            setUploadingEditImage(false);
                          }
                        }}
                        className="text-sm"
                      />
                      {uploadingEditImage && <span className="text-xs text-gray-500">Uploading...</span>}
                    </div>
                    {editPackage.imageUrl && (
                      <div className="mt-2">
                        <img 
                          src={editPackage.imageUrl} 
                          alt="Package preview" 
                          className="w-full h-32 object-cover rounded border" 
                          loading="lazy" 
                          decoding="async" 
                          sizes="(max-width: 768px) 100vw, 512px" 
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-end space-x-4">
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
