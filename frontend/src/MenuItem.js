import React, { useState, useRef } from 'react';
import { getItemImageUrl } from './utils/imageUtils';

const MenuItem = ({ item, lang, onAddToCart, cartQuantity, onChangeQuantity, onShowDetail }) => {
  const [addedMsg, setAddedMsg] = useState('');
  const [adding, setAdding] = useState(false);
  const addingRef = useRef(false);
  
  // Size selector state
  const isDrink = item.category && (item.category.toLowerCase().includes('drink') || item.category.toLowerCase().includes('hot') || item.category.toLowerCase().includes('cold'));
  const validSizes = ['small', 'medium', 'large'];
  const availableSizes = Array.isArray(item.sizes) ? item.sizes.filter(sz => validSizes.includes(sz.size?.toLowerCase())) : [];
  const [selectedSize, setSelectedSize] = useState(availableSizes[0]?.size || '');
  const selectedPrice = availableSizes.find(sz => sz.size === selectedSize)?.price || item.price;
  
  // Bread selector state for Breakfast Plus items
  const isBreakfastPlus = item.category === 'Breakfast Plus';
  const breadOptions = [
    { en: 'Toast', ar: 'نخب' },
    { en: 'Baguette', ar: 'الرغيف الفرنسي' },
    { en: 'Brioche Bun', ar: 'كعكة بريوش' },
    { en: 'Saj Bread', ar: 'خبز صاج' }
  ];
  const [selectedBread, setSelectedBread] = useState('');
  
  const handleAdd = () => {
    if (addingRef.current) {
      console.debug('[MenuItem] blocked by ref');
      return;
    }
    
    // Check if bread selection is required but not selected
    if (isBreakfastPlus && !selectedBread) {
      setAddedMsg(lang === 'ar' ? 'يرجى اختيار نوع الخبز أولاً' : 'Please choose your bread first');
      setTimeout(() => setAddedMsg(''), 3000);
      return;
    }
    
    addingRef.current = true;
    setAdding(true);
    console.debug('[MenuItem] proceeding to add');
    const actionId = `${item.id}-${Date.now()}`;
    console.debug('[MenuItem] trigger add', { itemId: item.id, actionId });
    
    // Create item with additional options
    let itemToAdd = { ...item };
    if (isBreakfastPlus && selectedBread) {
      const breadOption = breadOptions.find(b => b.en === selectedBread);
      itemToAdd.bread = {
        en: breadOption.en,
        ar: breadOption.ar
      };
      itemToAdd.breadDisplay = lang === 'ar' ? breadOption.ar : breadOption.en;
    }
    
    // Pass size and price for drinks
    if (isDrink && selectedSize) {
      onAddToCart({ ...itemToAdd, size: selectedSize, price: Number(selectedPrice) }, { quantity: 1, source: 'MenuItem', actionId });
    } else {
      onAddToCart(itemToAdd, { quantity: 1, source: 'MenuItem', actionId });
    }
    setTimeout(() => {
      setAddedMsg(`${lang === 'ar' ? 'تمت إضافة المنتج' : 'Item is added'} (${cartQuantity + 1} ${lang === 'ar' ? 'منتج' : 'item(s)'})`);
      setTimeout(() => setAddedMsg(''), 2000);
    }, 50);
    setTimeout(() => {
      addingRef.current = false;
      setAdding(false);
    }, 500);
  };
  
  // Simple inline SVG placeholder without base64 encoding
  const placeholderSvg = 'data:image/svg+xml,' + encodeURIComponent(`
    <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f0f0f0"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#999" text-anchor="middle" dy=".3em">
        No Image
      </text>
    </svg>
  `);

  return (
    <div className="menu-item" onClick={e => { if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'SELECT') onShowDetail && onShowDetail(); }}>
      <div className="menu-item-image-container">
        <img
          src={getItemImageUrl(item, placeholderSvg)}
          className="menu-item-image"
          alt={lang === 'ar' ? item.name_ar : item.name_en}
          onError={e => { e.target.onerror = null; e.target.src = placeholderSvg; }}
        />
      </div>
      <div className="menu-item-info">
        <div className="menu-item-name">
          {lang === 'ar' ? item.name_ar : item.name_en}
          <span className="menu-item-price"><strong>AED {isDrink && selectedSize ? Number(selectedPrice).toFixed(2) : (item.price ? item.price : 0).toFixed(2)}</strong></span>
        </div>
        {/* Size selector for drinks */}
        {isDrink && availableSizes.length > 0 && (
          <div style={{ marginTop: 8, marginBottom: 4 }}>
            <label style={{ fontWeight: 600, marginRight: 8 }}>{lang === 'ar' ? 'الحجم:' : 'Size:'}</label>
            <select value={selectedSize} onChange={e => setSelectedSize(e.target.value)} style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #ccc', fontWeight: 600 }}>
              {availableSizes.map(sz => (
                <option key={sz.size} value={sz.size}>{sz.size.charAt(0).toUpperCase() + sz.size.slice(1)} - AED {Number(sz.price).toFixed(2)}</option>
              ))}
            </select>
          </div>
        )}
        
        {/* Bread selector for Breakfast Plus items */}
        {isBreakfastPlus && (
          <div style={{ marginTop: 8, marginBottom: 4 }}>
            <label style={{ fontWeight: 600, marginRight: 8, display: 'block', marginBottom: 4 }}>
              {lang === 'ar' ? 'اختر نوع الخبز:' : 'Choose Your Base Bread:'}
            </label>
            <select 
              value={selectedBread} 
              onChange={e => setSelectedBread(e.target.value)} 
              style={{ 
                padding: '6px 12px', 
                borderRadius: 6, 
                border: selectedBread ? '1px solid #2a5c45' : '2px solid #ff6b6b', 
                fontWeight: 600,
                width: '100%',
                backgroundColor: selectedBread ? '#f8f9fa' : '#fff5f5'
              }}
            >
              <option value="">{lang === 'ar' ? 'اختر نوع الخبز' : 'Select Bread Type'}</option>
              {breadOptions.map(bread => (
                <option key={bread.en} value={bread.en}>
                  {lang === 'ar' ? bread.ar : bread.en}
                </option>
              ))}
            </select>
            {!selectedBread && (
              <div style={{ fontSize: '0.85rem', color: '#d32f2f', marginTop: 2, fontWeight: 600 }}>
                {lang === 'ar' ? 'مطلوب' : 'Required'}
              </div>
            )}
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <button
            style={{ 
              background: (isBreakfastPlus && !selectedBread) ? '#ccc' : '#2a5c45', 
              color: '#fff', 
              borderRadius: 6, 
              padding: '6px 16px', 
              fontWeight: 600, 
              border: 'none', 
              cursor: (adding || (isBreakfastPlus && !selectedBread)) ? 'not-allowed' : 'pointer', 
              opacity: (adding || (isBreakfastPlus && !selectedBread)) ? 0.6 : 1,
              width: '100%'
            }}
            onClick={e => { e.preventDefault(); e.stopPropagation(); handleAdd(); }}
            disabled={adding || (isBreakfastPlus && !selectedBread)}
          >
            {(isBreakfastPlus && !selectedBread) 
              ? (lang === 'ar' ? 'اختر الخبز أولاً' : 'Choose Bread First')
              : (lang === 'ar' ? 'أضف إلى السلة' : 'Add to Cart')
            }
          </button>
          {cartQuantity > 0 && (
            <div style={{ marginLeft: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 8 }}>
              <span>{lang === 'ar' ? 'الكمية:' : 'Quantity:'}</span>
              <button style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '16px' }} onClick={() => onChangeQuantity(1)}>
                +
              </button>
              <span style={{ minWidth: 32, textAlign: 'center', fontWeight: 700, fontSize: '18px', background: '#f5f5f5', borderRadius: 6, padding: '4px 0' }}>{cartQuantity}</span>
              <button style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #ccc', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '16px' }} onClick={() => onChangeQuantity(-1)}>
                -
              </button>
            </div>
          )}
        </div>
        {addedMsg && <div style={{ color: '#2a5c45', marginTop: 8, fontWeight: 600 }}>{addedMsg}</div>}
      </div>
    </div>
  );
};
export default MenuItem;
