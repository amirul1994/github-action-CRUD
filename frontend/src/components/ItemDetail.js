import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { itemsApi } from '../services/api';

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const data = await itemsApi.getById(id);
        setItem(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch item details');
        setLoading(false);
      }
    };

    fetchItem();
  }, [id]);

  const handleBack = () => {
    navigate('/');
  };

  const handleEdit = () => {
    navigate(`/edit/${id}`);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return (
      <div className="item-detail error">
        <div className="error-message">{error}</div>
        <button onClick={handleBack} className="btn-primary">
          Back to List
        </button>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="item-detail not-found">
        <h2>Item Not Found</h2>
        <p>The requested item could not be found.</p>
        <button onClick={handleBack} className="btn-primary">
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="item-detail">
      <div className="detail-header">
        <h2>{item.title}</h2>
        <div className="detail-actions">
          <button onClick={handleBack} className="btn-secondary">
            Back
          </button>
          <button onClick={handleEdit} className="btn-primary">
            Edit
          </button>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-field">
          <label>ID:</label>
          <span>{item.id}</span>
        </div>
        
        <div className="detail-field">
          <label>Title:</label>
          <span>{item.title}</span>
        </div>
        
        <div className="detail-field">
          <label>Description:</label>
          <p>{item.description || 'No description available'}</p>
        </div>
        
        <div className="detail-field">
          <label>Status:</label>
          <span className={`status ${item.is_active ? 'active' : 'inactive'}`}>
            {item.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>
        
        <div className="detail-field">
          <label>Created:</label>
          <span>{new Date(item.created_at).toLocaleString()}</span>
        </div>
        
        <div className="detail-field">
          <label>Last Updated:</label>
          <span>{new Date(item.updated_at).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default ItemDetail;