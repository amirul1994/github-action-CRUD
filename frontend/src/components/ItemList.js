import React, { useState, useEffect } from 'react';
import { itemsApi } from '../services/api';
import ItemForm from './ItemForm';

const ItemList = () => {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await itemsApi.getAll(currentPage, itemsPerPage, searchTerm);
      setItems(data.items);
      setTotal(data.total);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch items');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [currentPage, searchTerm]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page on new search
    // The fetchItems will be triggered by the currentPage or searchTerm change
  };

  const handleEdit = (item) => {
    setSelectedItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      await itemsApi.delete(id);
      setDeleteConfirm(null);
      fetchItems();
    } catch (err) {
      setError('Failed to delete item');
    }
  };

  const handleFormSave = (savedItem) => {
    setShowForm(false);
    setSelectedItem(null);
    fetchItems();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedItem(null);
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  if (showForm) {
    return (
      <ItemForm
        item={selectedItem}
        onSave={handleFormSave}
        onCancel={handleFormCancel}
      />
    );
  }

  return (
    <div className="item-list">
      <div className="list-header">
        <h2>Items</h2>
        <button 
          className="btn-primary" 
          onClick={() => {
            setSelectedItem(null);
            setShowForm(true);
          }}
        >
          Add New Item
        </button>
      </div>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search by title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : items.length === 0 ? (
        <div className="empty-list">No items found</div>
      ) : (
        <>
          <table className="items-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Description</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{item.title}</td>
                  <td>{item.description ? item.description.substring(0, 50) + (item.description.length > 50 ? '...' : '') : 'N/A'}</td>
                  <td>
                    <span className={`status ${item.is_active ? 'active' : 'inactive'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="actions">
                    <button 
                      className="btn-edit" 
                      onClick={() => handleEdit(item)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn-delete" 
                      onClick={() => setDeleteConfirm(item.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              <span className="page-info">
                Page {currentPage} of {totalPages}
              </span>
              
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {deleteConfirm && (
        <div className="delete-modal">
          <div className="delete-modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this item?</p>
            <div className="delete-modal-actions">
              <button 
                className="btn-secondary" 
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemList;