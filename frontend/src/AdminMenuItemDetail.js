import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemImageUrl } from '../utils/imageUtils';
import axios from 'axios';
import './AdminDashboard.css';

export default function AdminMenuItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/menu').then(res => {
      // Find item by id in all categories, subcategories, and items
      let found = null;
      for (const cat of res.data.categories) {
        if (Array.isArray(cat.items)) {
          for (const sub of cat.items) {
            // If sub is a subcategory
            if (sub.subcategory_en && Array.isArray(sub.items)) {
              for (const subItem of sub.items) {
                if (String(subItem.id) === String(id)) {
                  found = { ...subItem, category: cat.name_en, subcategory: sub.subcategory_en };
                }
              }
            } else {
              // If sub is a direct menu item (not a subcategory)
              if (String(sub.id) === String(id)) {
                found = { ...sub, category: cat.name_en };
              }
            }
          }
        }
      }
      setItem(found);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="loader">Loading...</div>;
  if (!item) return <div className="error-message">Menu item not found.</div>;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(255,255,255,0.98)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'auto',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
        padding: '40px 32px',
        maxWidth: 540,
        width: '100%',
        textAlign: 'center',
        position: 'relative',
      }}>
        <button style={{ position: 'absolute', top: 24, left: 24, background: '#d32f2f', color: '#fff', borderRadius: 6, padding: '8px 18px', fontWeight: 600, border: 'none', cursor: 'pointer' }} onClick={() => navigate(-1)}>&larr; Back</button>
        <h2 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: 24 }}>{item.name_en || item.name_ar || item.name}</h2>
        <img src={getItemImageUrl(item, 'https://via.placeholder.com/540x320?text=No+Image')} alt={item.name_en || item.name_ar || item.name} style={{ width: '100%', maxWidth: 420, borderRadius: 16, marginBottom: 28, boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }} />
        <div style={{ fontWeight: 600, fontSize: '1.25rem', marginBottom: 18 }}>{item.description_en || item.description_ar || ''}</div>
        <div style={{ fontWeight: 700, fontSize: '1.4rem', marginBottom: 24, color: 'var(--primary)' }}>Price: AED {item.price}</div>
        <div style={{ fontSize: '1.1rem', marginBottom: 10 }}>Category: <span style={{ fontWeight: 600 }}>{item.category}</span></div>
        {item.subcategory && <div style={{ fontSize: '1.1rem', marginBottom: 10 }}>Subcategory: <span style={{ fontWeight: 600 }}>{item.subcategory}</span></div>}
        <button style={{ background: '#d32f2f', color: '#fff', borderRadius: 6, padding: '10px 28px', fontWeight: 700, border: 'none', cursor: 'pointer', marginTop: 24, fontSize: '1.1rem' }} onClick={() => navigate(-1)}>Close</button>
      </div>
    </div>
  );
}
