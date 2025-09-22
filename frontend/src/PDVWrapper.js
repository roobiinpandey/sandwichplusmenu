
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
  const handleAddToCart = () => {
    addToCart(product, { quantity: 1, source: 'PDVWrapper' });
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
        <p className="menu-item-desc">{product.description_en || product.description_ar || ''}</p>
        <div className="price-box">{lang === 'ar' ? 'السعر:' : 'Price:'} <span className="price-bold">AED {product.price}</span></div>
        <div className="detail-actions">
          <button className="add-btn" onClick={handleAddToCart} style={{ background: '#2a5c45', color: '#fff', borderRadius: 6, padding: '10px 24px', fontWeight: 600, border: 'none', fontSize: '1.08rem', cursor: 'pointer' }}>
            {lang === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}
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
  <div className="order-summary" id="orderSummary" style={{ position: 'fixed', left: '50%', bottom: '32px', transform: 'translateX(-50%)', width: '340px', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '24px 18px', zIndex: 100 }}>
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
