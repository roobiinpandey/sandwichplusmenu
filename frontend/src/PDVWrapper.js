
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getItemImageUrl } from './utils/imageUtils';
import './App.css';

const LANGS = [
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' }
];

export default function PDVWrapper({ categories, lang, addToCart, openCart, openPlaceOrder, order, setLang, handleChangeQuantity, customerName, setCustomerName, notes, setNotes, showPlaceOrder, handlePlaceOrder, toast }) {
  const [showItemControls, setShowItemControls] = React.useState(false);
  const { id } = useParams();
  const navigate = useNavigate();

  // Bread selection for Breakfast Plus items
  const breadOptions = [
    { en: 'Toast', ar: 'نخب' },
    { en: 'Baguette', ar: 'الرغيف الفرنسي' },
    { en: 'Brioche Bun', ar: 'كعكة بريوش' },
    { en: 'Saj Bread', ar: 'خبز صاج' }
  ];
  const [selectedBread, setSelectedBread] = React.useState('');

  // Find product by id in categories
  let product = null;
  for (const cat of categories || []) {
    if (Array.isArray(cat.items)) {
      for (const sub of cat.items) {
        if (sub.subcategory_en && Array.isArray(sub.items)) {
          for (const subItem of sub.items) {
            if (String(subItem.id) === String(id)) {
              product = { ...subItem, category: cat.name_en, subcategory: sub.subcategory_en };
            }
          }
        } else {
          if (String(sub.id) === String(id)) {
            product = { ...sub, category: cat.name_en };
          }
        }
      }
    }
  }

  if (!product) {
    return <div style={{ padding: 32, textAlign: 'center' }}>Menu item not found.</div>;
  }

  // Toast handler for Add to Cart
  const isBreakfastPlus = product?.category === 'Breakfast Plus';
  const handleAddToCart = () => {
    // Check if bread selection is required but not selected
    if (isBreakfastPlus && !selectedBread) {
      // Can't show toast here as it's controlled globally, but we can prevent the action
      return;
    }
    
    // Create product with bread information if applicable
    let productToAdd = { ...product };
    if (isBreakfastPlus && selectedBread) {
      const breadOption = breadOptions.find(b => b.en === selectedBread);
      productToAdd.bread = {
        en: breadOption.en,
        ar: breadOption.ar
      };
      productToAdd.breadDisplay = lang === 'ar' ? breadOption.ar : breadOption.en;
    }
    
    addToCart(productToAdd, { quantity: 1, source: 'PDVWrapper' });
    setShowItemControls(true);
    // Toast for add to cart is handled globally in App.js
  };

  // Find current quantity in cart for this product
  const cartItem = order.find(it => it.id === product.id);

  const handleLocalChangeQuantity = (delta) => {
    if (!cartItem) return;
    const idx = order.findIndex(it => it.id === product.id);
    if (idx !== -1 && typeof handleChangeQuantity === 'function') {
      handleChangeQuantity(idx, delta);
      // If quantity drops to zero, hide controls
      if (cartItem.quantity + delta <= 0) {
        setShowItemControls(false);
      }
    }
  };


  return (
    <div className="App detail-page" data-lang={lang}>
      <div className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <button className="back-btn" onClick={() => navigate(-1)} style={{ marginRight: 12 }}>&larr; {lang === 'ar' ? 'رجوع' : 'Back'}</button>
          <div className="logo">
            <i className="fas fa-utensils"></i>
            {lang === 'ar' ? (
              <span className="arabic" style={{ fontWeight: 700 }}>ساندويتش بلس+</span>
            ) : (
              <span className="english" style={{ fontWeight: 700 }}>SANDWICH PLUS+</span>
            )}
          </div>
        </div>
        <div className="language-toggle">
          {LANGS.map(l => (
            <button
              key={l.code}
              className={`lang-btn${lang === l.code ? ' active' : ''}`}
              onClick={() => setLang(l.code)}
              data-lang={l.code}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>
      <div className="detail-content">
        <h2>{product.name_en || product.name_ar || product.name}</h2>
        <img
          src={getItemImageUrl(product, 'https://via.placeholder.com/540x320?text=No+Image')}
          alt={product.name_en || product.name_ar || product.name}
        />
        <p className="menu-item-desc">{lang === 'ar' ? (product.description_ar || product.description_en || '') : (product.description_en || product.description_ar || '')}</p>
        
        {/* Bread selection for Breakfast Plus items */}
        {isBreakfastPlus && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '16px', 
            background: '#f8f9fa', 
            borderRadius: '8px',
            border: selectedBread ? '2px solid #2a5c45' : '2px solid #ff6b6b'
          }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px',
              fontSize: '1.05rem',
              color: selectedBread ? '#2a5c45' : '#d32f2f',
              fontWeight: '600'
            }}>
              {lang === 'ar' ? 'اختر نوع الخبز:' : 'Choose Your Base Bread:'} 
              <span style={{ color: '#d32f2f', marginLeft: 4 }}>*</span>
            </label>
            <select 
              value={selectedBread} 
              onChange={e => setSelectedBread(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '1rem',
                borderRadius: '6px',
                border: selectedBread ? '1px solid #2a5c45' : '1px solid #ff6b6b',
                outline: 'none',
                cursor: 'pointer',
                backgroundColor: selectedBread ? '#fff' : '#fff5f5'
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
              <div style={{ fontSize: '0.85rem', color: '#d32f2f', marginTop: 6, fontWeight: 600 }}>
                {lang === 'ar' ? 'مطلوب اختيار نوع الخبز' : 'Bread selection is required'}
              </div>
            )}
          </div>
        )}
        
        <div className="price-box">{lang === 'ar' ? 'السعر:' : 'Price:'} <span className="price-bold">AED {product.price}</span></div>
        <div className="detail-actions">
          <button 
            className="add-btn" 
            onClick={handleAddToCart} 
            style={{ 
              background: (isBreakfastPlus && !selectedBread) ? '#ccc' : '#2a5c45', 
              color: '#fff', 
              borderRadius: 6, 
              padding: '10px 24px', 
              fontWeight: 600, 
              border: 'none', 
              fontSize: '1.08rem', 
              cursor: (isBreakfastPlus && !selectedBread) ? 'not-allowed' : 'pointer',
              opacity: (isBreakfastPlus && !selectedBread) ? 0.6 : 1,
              width: '100%'
            }}
            disabled={isBreakfastPlus && !selectedBread}
          >
            {(isBreakfastPlus && !selectedBread)
              ? (lang === 'ar' ? 'اختر الخبز أولاً' : 'Choose Bread First')
              : (lang === 'ar' ? 'أضف إلى السلة' : 'Add to Cart')
            }
          </button>
          {showItemControls && cartItem && (
            <div className="added-item-controls" style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 16, background: '#f8f8f8', borderRadius: 8, padding: '12px 18px' }}>
              <span style={{ fontWeight: 600 }}>{lang === 'ar' ? cartItem.name_ar : cartItem.name_en}</span>
              <button onClick={() => handleLocalChangeQuantity(1)} style={{ padding: '4px 12px', fontSize: '1.1rem', fontWeight: 700 }}>+</button>
              <span style={{ fontWeight: 600 }}>{cartItem.quantity}</span>
              <button onClick={() => handleLocalChangeQuantity(-1)} style={{ padding: '4px 12px', fontSize: '1.1rem', fontWeight: 700 }}>-</button>
            </div>
          )}
          {/* Toast Notification: appears below Add to Cart, does not move layout */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {toast.show && toast.message && (
              <div className="toast" style={{ marginTop: 12, background: '#323232', color: '#fff', padding: '10px 28px', borderRadius: 8, fontWeight: 600, fontSize: '1.05rem', opacity: 0.97, boxShadow: '0 2px 8px rgba(0,0,0,0.10)', textAlign: 'center', minWidth: 180 }}>
                {toast.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Summary Bar - matches main menu style */}
  {/* Order Summary Bar - improved positioning to avoid blocking content */}
  <div className="order-summary" id="orderSummary" style={{ 
    position: 'fixed', 
    left: '50%', 
    bottom: '16px',  /* Reduced from 32px to 16px */
    transform: 'translateX(-50%)', 
    width: 'min(340px, calc(100vw - 32px))',  /* Responsive width */
    background: '#fff', 
    borderRadius: '12px', 
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',  /* Enhanced shadow */
    padding: '20px 16px',  /* Slightly reduced padding */
    zIndex: 1000,  /* Higher z-index */
    transition: 'transform 0.3s ease, opacity 0.3s ease'  /* Smooth transitions */
  }}>
        <div className="order-info" style={{ marginBottom: '18px', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
          <div className="order-items-count" style={{ 
            fontWeight: 600, 
            fontSize: '1.1rem', 
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {lang === 'ar' ? (
              <>
                <span>المنتجات:</span>
                <span>{order.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </>
            ) : (
              <>
                <span>Items:</span>
                <span>{order.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </>
            )}
          </div>
          <div className="order-total-price" style={{ 
            fontWeight: 700, 
            fontSize: '1.2rem', 
            marginBottom: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            {lang === 'ar' ? (
              <>
                <span>المجموع:</span>
                <span>{order.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)} درهم</span>
              </>
            ) : (
              <>
                <span>Total:</span>
                <span>{order.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)} AED</span>
              </>
            )}
          </div>
        </div>
        <div className="order-actions" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button className="order-btn view-order-btn" onClick={openCart} style={{ fontWeight: 600, fontSize: '1rem', padding: '10px 0' }}>
            {lang === 'ar' ? 'عرض الطلب بالكامل' : 'View Full Order'}
          </button>
          <button className="order-btn place-order-btn" onClick={() => openPlaceOrder()} style={{ fontWeight: 600, fontSize: '1rem', padding: '10px 0' }}>
            {lang === 'ar' ? 'تقديم الطلب' : 'Place Order'}
          </button>
        </div>
  {/* PlaceOrderModal is now handled globally in App.js, not here */}
  </div>
    </div>
  );
}
