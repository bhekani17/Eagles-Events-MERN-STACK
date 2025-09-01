import { publicAPI, adminAPI } from './api';

export const equipmentService = {
  // ==================== PUBLIC OPERATIONS ====================

  // Get all equipment (public)
  getAllEquipment: async (filters = {}) => {
    try {
      const response = await publicAPI.getEquipment(filters);
      return Array.isArray(response) ? response : [];
    } catch (error) {
      console.error('Error fetching equipment:', error);
      throw error;
    }
  },

  // Get equipment by ID (public)
  getEquipmentById: async (id) => {
    try {
      return await publicAPI.getEquipmentById(id);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      throw error;
    }
  },

  // Get equipment by category (public)
  getEquipmentByCategory: async (category) => {
    return equipmentService.getAllEquipment({ category });
  },

  // Search equipment (public)
  searchEquipment: async (query, filters = {}) => {
    try {
      return await publicAPI.searchEquipment(query, filters);
    } catch (error) {
      console.error('Error searching equipment:', error);
      throw error;
    }
  },

  // Get featured equipment (public)
  getFeaturedEquipment: async () => {
    try {
      return await publicAPI.getFeaturedEquipment();
    } catch (error) {
      console.error('Error fetching featured equipment:', error);
      throw error;
    }
  },

  // ==================== ADMIN CRUD OPERATIONS ====================

  // Get all equipment (admin - with full data)
  getAllEquipmentAdmin: async (filters = {}) => {
    try {
      const response = await adminAPI.getEquipment(filters);
      return response.data || response;
    } catch (error) {
      console.error('Error fetching equipment (admin):', error);
      throw error;
    }
  },

  // Get equipment by ID (admin)
  getEquipmentByIdAdmin: async (id) => {
    try {
      return await adminAPI.getEquipmentById(id);
    } catch (error) {
      console.error('Error fetching equipment (admin):', error);
      throw error;
    }
  },

  // Create new equipment (admin)
  createEquipment: async (equipmentData) => {
    try {
      const response = await adminAPI.addEquipment(equipmentData);
      return {
        success: true,
        data: response?.data,
        message: 'Equipment created successfully'
      };
    } catch (error) {
      console.error('Error creating equipment:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Handle validation errors
      if (error.response?.status === 400) {
        const validationError = new Error(error.response.data.message || 'Validation failed');
        validationError.status = 400;
        validationError.data = error.response.data;
        throw validationError;
      }
      
      const createError = new Error(error.response?.data?.message || 'Failed to create equipment');
      createError.status = error.response?.status || 500;
      createError.errors = error.response?.data?.errors;
      throw createError;
    }
  },

  // Update equipment (admin)
  updateEquipment: async (id, equipmentData) => {
    try {
      if (!id) throw new Error('Equipment ID is required for update');
      
      const response = await adminAPI.updateEquipment(id, equipmentData);
      
      return {
        success: true,
        data: response?.data,
        message: 'Equipment updated successfully'
      };
    } catch (error) {
      console.error('Error updating equipment:', {
        id,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      // Handle validation errors
      if (error.response?.status === 400) {
        const validationError = new Error(error.response.data.message || 'Validation failed');
        validationError.status = 400;
        validationError.data = error.response.data;
        throw validationError;
      }
      
      const updateError = new Error(error.response?.data?.message || 'Failed to update equipment');
      updateError.status = error.response?.status || 500;
      updateError.errors = error.response?.data?.errors;
      throw updateError;
    }
  },

  // Delete equipment (admin)
  deleteEquipment: async (id) => {
    try {
      if (!id) throw new Error('Equipment ID is required for deletion');
      
      const response = await adminAPI.deleteEquipment(id);
      
      return {
        success: true,
        message: 'Equipment deleted successfully',
        data: response?.data
      };
    } catch (error) {
      console.error('Error deleting equipment:', {
        id,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      const deleteError = new Error(error.response?.data?.message || 'Failed to delete equipment');
      deleteError.status = error.response?.status || 500;
      throw deleteError;
    }
  },

  // Update equipment status (admin)
  updateEquipmentStatus: async (id, status) => {
    try {
      const response = await adminAPI.updateEquipmentStatus(id, status);
      return response;
    } catch (error) {
      console.error('Error updating equipment status:', error);
      throw error;
    }
  },

  // Update inventory (admin)
  updateInventory: async (id, inventoryData) => {
    try {
      const response = await adminAPI.updateEquipment(id, { inventory: inventoryData });
      return response;
    } catch (error) {
      console.error('Error updating inventory:', error);
      throw error;
    }
  },

  // Get equipment categories (admin)
  getEquipmentCategories: async () => {
    try {
      return await adminAPI.getEquipmentCategories();
    } catch (error) {
      console.error('Error fetching equipment categories:', error);
      throw error;
    }
  },

  // Bulk operations (admin)
  bulkUpdateEquipment: async (updates) => {
    try {
      const promises = updates.map(({ id, data }) => 
        adminAPI.updateEquipment(id, data)
      );
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Error in bulk equipment update:', error);
      throw error;
    }
  }
};

export default equipmentService; 