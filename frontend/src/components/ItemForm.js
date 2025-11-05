import React, { useState, useEffect } from 'react';
import { itemsApi } from '../services/api';

const ItemForm = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_active: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title || '',
        description: item.description || '',
        is_active: item.is_active !== undefined ? item.is_active : true
      });
    }
  }, [item]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      let savedItem;
      if (item && item.id) {
        // Update existing item
        savedItem = await itemsApi.update(item.id, formData);
      } else {
        // Create new item
        savedItem = await itemsApi.create(formData);
      }
      
      setIsSubmitting(false);
      onSave(savedItem);
    } catch (err) {
      setIsSubmitting(false);
      setError(err.response?.data?.detail || 'An error occurred while saving the item');
    }
  };

  return (
    <div className="item-form">
      <h2>{item ? 'Edit Item' : 'Create New Item'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows="4"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              disabled={isSubmitting}
            />
            Active
          </label>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={isSubmitting}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={isSubmitting || !formData.title}
            className="btn-primary"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ItemForm;