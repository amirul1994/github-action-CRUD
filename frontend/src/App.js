import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ItemList from './components/ItemList';
import ItemDetail from './components/ItemDetail';
import ItemForm from './components/ItemForm';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Header />
        <main className="container">
          <Routes>
            <Route path="/" element={<ItemList />} />
            <Route path="/items/:id" element={<ItemDetail />} />
            <Route 
              path="/create" 
              element={
                <ItemForm 
                  onSave={() => window.location.href = '/'} 
                  onCancel={() => window.location.href = '/'} 
                />
              } 
            />
            <Route 
              path="/edit/:id" 
              element={
                <ItemForm 
                  onSave={() => window.location.href = '/'} 
                  onCancel={() => window.location.href = '/'} 
                />
              } 
            />
          </Routes>
        </main>
        <footer className="app-footer">
          <div className="container">
            <p>Poridhi Crud Application</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;