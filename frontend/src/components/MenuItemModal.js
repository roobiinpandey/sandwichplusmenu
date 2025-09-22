import React from 'react';
import axios from 'axios';
import { getItemImageUrl } from '../utils/imageUtils';

function MenuItemModal({ mode, item, onClose, onSuccess, categories }) {
  const [hasSizes, setHasSizes] = React.useState(item?.sizes && item?.sizes.length > 0);
  const [price, setPrice] = React.useState(item?.price || '');
  const [formData, setFormData] = React.useState({
    name_en: item?.name_en || '',
    name_ar: item?.name_ar || '',
    sizes: item?.sizes || [{ label_en: '', label_ar: '', price: '' }],
    mainCategory: item?.category || '',
    subcategory: item?.subcategory || '',
    description_en: item?.description_en || '',
    description_ar: item?.description_ar || '',
    imageFile: null,
    images: item?.images || []
  });
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.name_en) newErrors.name_en = 'Name (EN) is required.';
    if (!formData.mainCategory) newErrors.mainCategory = 'Main category is required.';
    // Validation: if hasSizes, require at least one size with price; else require price
    if (hasSizes) {
      if (!formData.sizes || !formData.sizes.length || formData.sizes.some(sz => !sz.price)) {
        newErrors.sizes = 'At least one size and price is required.';
      }
    } else {
      if (!price) {
        newErrors.price = 'Price is required for simple items.';
      }
    }
    if (mode === 'add' && !formData.imageFile) newErrors.imageFile = 'Image is required for new items.';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const submitData = new FormData();
    submitData.append('name_en', formData.name_en);
    submitData.append('name_ar', formData.name_ar);
    submitData.append('category', formData.mainCategory);
    if (formData.subcategory) {
      submitData.append('subcategory', formData.subcategory);
    }
    submitData.append('description_en', formData.description_en);
    submitData.append('description_ar', formData.description_ar);
    submitData.append('has_sizes', hasSizes ? 'true' : '');
    if (hasSizes) {
  submitData.append('sizes', JSON.stringify(formData.sizes));
    } else {
      submitData.append('price', price);
    }
    if (formData.imageFile) {
      submitData.append('image', formData.imageFile);
    }
    try {
      const token = localStorage.getItem('authToken');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      if (mode === 'add') {
        await axios.post('/menu', submitData, { headers });
      } else {
        await axios.put(`/menu/${item.id}`, submitData, { headers });
      }
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (error) {
      const status = error.response?.status;
      const serverMsg = error.response?.data?.error || error.response?.data || error.message;
      setErrors({ submit: `Failed to ${mode} item: ${status ? status + ' - ' : ''}${serverMsg}` });
    }
  };

  return (
  <>
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(255,255,255,0.25)',
      backdropFilter: 'blur(8px)',
      zIndex: 999
    }} />
    <dialog className="admin-login-dialog menu-item-modal" open>
  {showSuccess && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'rgba(0, 128, 0, 0.95)',
          color: 'white',
          padding: '8px 14px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '600',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>Update Successful!</div>
      )}
      <div className="dialog-header">
        <h3>{mode === 'add' ? 'Add Menu Item' : 'Edit Menu Item'}</h3>
        <button className="close-btn" type="button" onClick={onClose}>✕</button>
      </div>
      <div className="dialog-body">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label>
            Name (EN):
            <input
              type="text"
              value={formData.name_en}
              onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
              required
            />
            </label>
            <label>
              Name (AR):
              <input
                type="text"
                value={formData.name_ar}
                onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
              />
          </label>
          <label>
            Main Category:
            <select
              value={formData.mainCategory}
              onChange={e => setFormData({ ...formData, mainCategory: e.target.value })}
              required
            >
              <option value="">Select Main Category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.mainCategory && <div style={{ color: '#d32f2f', fontWeight: 600 }}>{errors.mainCategory}</div>}
          </label>
          <label>
            Subcategory (Optional):
            <select
              value={formData.subcategory}
              onChange={e => setFormData({ ...formData, subcategory: e.target.value })}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ccc', marginTop: '4px' }}
            >
              <option value="">Select Subcategory (Optional)</option>
              <option value="CHICKEN">CHICKEN</option>
              <option value="BEEF">BEEF</option>
              <option value="HOT">HOT</option>
              <option value="COLD">COLD</option>
              <option value="BLENDED">BLENDED</option>
              <option value="TEA">TEA</option>
              <option value="DRINKS">DRINKS</option>
            </select>
            {errors.subcategory && <div style={{ color: '#d32f2f', fontWeight: 600 }}>{errors.subcategory}</div>}
          </label>
          <label>
            Description (EN):
            <input
              type="text"
              value={formData.description_en}
              onChange={(e) => setFormData({ ...formData, description_en: e.target.value })}
            />
          </label>
          <label>
            Description (AR):
            <input
              type="text"
              value={formData.description_ar}
              onChange={(e) => setFormData({ ...formData, description_ar: e.target.value })}
            />
          </label>
          <label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" checked={hasSizes} onChange={e => {
                    setHasSizes(e.target.checked);
                    if (!e.target.checked) {
                      setFormData({ ...formData, sizes: [{ size: '', price: '' }] });
                    }
                  }} />
                  This item has multiple sizes
                </label>
                {hasSizes ? (
                  <label>
                    Sizes & Prices:
                    {formData.sizes.map((sz, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                        <input type="text" placeholder="Size (e.g. Small)" value={sz.size} onChange={e => {
                          const arr = [...formData.sizes]; arr[idx].size = e.target.value; setFormData({ ...formData, sizes: arr });
                        }} style={{ width: 90 }} />
                        <input type="number" placeholder="Price" value={sz.price} min="0" step="0.01" onChange={e => {
                          const arr = [...formData.sizes]; arr[idx].price = e.target.value; setFormData({ ...formData, sizes: arr });
                        }} style={{ width: 80 }} />
                        <button type="button" onClick={() => setFormData({ ...formData, sizes: formData.sizes.filter((_, i) => i !== idx) })} style={{ color: '#ff6b6b', fontWeight: 700, border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setFormData({ ...formData, sizes: [...formData.sizes, { size: '', price: '' }] })} style={{ marginBottom: 10, background: 'var(--accent)', color: 'var(--white)', border: 'none', borderRadius: 6, padding: '4px 12px', fontWeight: 700, cursor: 'pointer' }}>Add Size</button>
                    {errors.sizes && <div style={{ color: '#d32f2f', fontWeight: 600 }}>{errors.sizes}</div>}
                  </label>
                ) : (
                  <label>
                    Price:
                    <input type="number" placeholder="Price" value={price} min="0" step="0.01" onChange={e => setPrice(e.target.value)} style={{ width: 120 }} />
                    {errors.price && <div style={{ color: '#d32f2f', fontWeight: 600 }}>{errors.price}</div>}
                  </label>
                )}
            Image {mode === 'add' ? '(required)' : '(optional)'}:
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFormData({ ...formData, imageFile: e.target.files[0] })}
              required={mode === 'add'}
            />
            {errors.imageFile && <div style={{ color: '#d32f2f', fontWeight: 600 }}>{errors.imageFile}</div>}
            {mode === 'edit' && formData.images?.length > 0 && (
              <div style={{ marginTop: '6px' }}>
                <span>Current image:</span><br />
                <img
                  src={getItemImageUrl({ images: formData.images })}
                  alt="Current"
                  style={{ maxWidth: '120px', maxHeight: '120px', borderRadius: '8px', marginTop: '4px' }}
                />
              </div>
            )}
          </label>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexDirection: 'column' }}>
            {errors.submit && <div style={{ color: '#d32f2f', fontWeight: 600, marginBottom: 8 }}>{errors.submit}</div>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--white)',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {mode === 'add' ? 'Add' : 'Update'}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: 'var(--primary)',
                  color: 'var(--white)',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
      <div className="dialog-footer">
        <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
      </div>
    </dialog>
  </>
  );
}

export default MenuItemModal;
