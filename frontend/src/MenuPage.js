import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MenuItem from './MenuItem';
import OrderSummaryModal from './components/OrderSummaryModal';
import PlaceOrderModal from './components/PlaceOrderModal';
import OrderSuccessModal from './components/OrderSuccessModal';
// EmptyCartModal uses same style as OrderSummaryModal
function EmptyCartModal({ show, lang, onClose }) {
  if (!show) return null;
  return (
    <div className="modal fade-in" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2 style={{ textAlign: 'center', marginBottom: 18 }}>{lang === 'ar' ? 'سلة التسوق فارغة' : 'Your cart is empty.'}</h2>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
          <button onClick={onClose} style={{ background: '#d32f2f', color: '#fff', borderRadius: 6, padding: '8px 18px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>{lang === 'ar' ? 'إغلاق' : 'Close'}</button>
        </div>
      </div>
    </div>
  );
}


export default function MenuPage({ categories, lang, order, setOrder, addToCart, openCart, openPlaceOrder, setLang, openRestoreCart, hasCartHistory }) {
  const navigate = useNavigate();

  
  // Category tabs - use location state if available


  // Track active category by language
  const [activeCategory, setActiveCategory] = useState(null);

  // Update activeCategory when categories or language changes
  useEffect(() => {
    if (!categories || categories.length === 0) return;
    // If current activeCategory is not in the new list, reset
    const keys = categories.map(getCategoryKey);
    if (!activeCategory || !keys.includes(activeCategory)) {
      setActiveCategory(keys[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories, lang]);

  // Helper to get category key for current language
  const getCategoryKey = cat => lang === 'ar' ? (cat.name_ar || cat.name_en) : cat.name_en;
  // Add state for placing order
  const [showCart, setShowCart] = useState(false);
  const [showPlaceOrder, setShowPlaceOrder] = useState(false);
  const [showEmptyCartModal, setShowEmptyCartModal] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'default' });
  const [orderSuccess, setOrderSuccess] = useState(null);

  // Cart handlers
  const handleRemoveItem = (idx) => setOrder(o => o.filter((_, i) => i !== idx));
  const handleChangeQuantity = (idx, delta) => setOrder(o => o.map((it, i) => i === idx ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it));
  const handleClearOrder = () => setOrder([]);

  const handlePlaceOrder = async (payload = {}) => {
    try { console.log('[TRACE] MenuPage.handlePlaceOrder called', payload); } catch (e) {}
    const nameToUse = payload.customer || customerName;
    if (!nameToUse.trim()) {
      setToast({ show: true, message: lang === 'ar' ? 'يرجى إدخال اسمك' : 'Please enter your name', type: 'error' });
      return;
    }
    try {
      const orderData = {
        customer: nameToUse,
        phone: payload.phone || '',
        notes: payload.notes || '',
        items: order,
        total: order.reduce((sum, item) => sum + item.price * item.quantity, 0),
        time: new Date().toISOString(),
        status: 'Pending'
      };
      setShowPlaceOrder(false);
      try { console.log('[DEBUG] POST /orders payload', orderData); } catch (e) {}
      await axios.post('/orders', orderData);
      setOrderSuccess({ show: true, orderId: '#' + Math.floor(10000 + Math.random() * 90000), customerName: nameToUse, total: orderData.total });
      setOrder([]);
      setCustomerName('');
      setNotes('');
    } catch (err) {
      setToast({ show: true, message: lang === 'ar' ? 'فشل تقديم الطلب. حاول مرة أخرى.' : 'Failed to place order. Please try again.', type: 'error' });
    }
  };

  // Language toggle
  const handleLangChange = (newLang) => {
    if (typeof setLang === 'function') {
      setLang(newLang);
    }
  };

  // Category tab click



  // If no categories, show fallback
  if (!categories || categories.length === 0) {
    return (
      <div className="error-message">
        <div className={lang === 'ar' ? 'arabic' : 'english'}>
          {lang === 'ar' ? 'فشل تحميل بيانات القائمة. يتم عرض قائمة نموذجية.' : 'Failed to load menu data. Showing sample menu.'}
        </div>
      </div>
    );
  }

  // Main UI
  return (
    <div className="App" data-lang={lang}>
      {/* Header */}
      <div className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div className="logo">
            <i className="fas fa-utensils"></i>
            {lang === 'ar' ? (
              <span className="arabic" style={{ fontWeight: 700 }}>ساندويتش بلس+</span>
            ) : (
              <span className="english" style={{ fontWeight: 700 }}>SANDWICH PLUS+</span>
            )}
          </div>
          {/* Cart counter */}
          {/* Cart counter removed as requested */}
        </div>
        <div className="language-toggle">
          <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => handleLangChange('en')} data-lang="en">EN</button>
          <button className={`lang-btn${lang === 'ar' ? ' active' : ''}`} onClick={() => handleLangChange('ar')} data-lang="ar">AR</button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs" id="categoryTabs">
        {categories.map((cat, idx) => {
          const catKey = getCategoryKey(cat);
          return (
            <div
              key={catKey}
              className={`category-tab${activeCategory === catKey ? ' active' : ''}`}
              data-category={catKey}
              onClick={() => setActiveCategory(catKey)}
            >
              {catKey}
            </div>
          );
        })}
      </div>

      {/* Menu Container - show all items including subcategories */}
      <div className="menu-container">
        {activeCategory && (() => {
          const cat = categories.find(cat => getCategoryKey(cat) === activeCategory);
          if (!cat) return null;
          // Group items by subcategory
          const subcatGroups = {};
          const itemsWithoutSubcat = []; // Items with no subcategory
          const knownHotColdSubs = ['HOT', 'COLD', 'BLENDED', 'TEA', 'DRINKS'];
          if (Array.isArray(cat.items)) {
            cat.items.forEach(item => {
              let subcat = item.subcategory;
              if (cat.name_en === 'HOT & COLD DRINKS') {
                if (!subcat || !knownHotColdSubs.includes(subcat)) {
                  itemsWithoutSubcat.push(item); // Don't show "Other" for HOT & COLD DRINKS
                  return;
                }
              } else {
                if (!subcat) {
                  itemsWithoutSubcat.push(item); // Items without subcategory go here
                  return;
                }
              }
              if (!subcatGroups[subcat]) subcatGroups[subcat] = [];
              subcatGroups[subcat].push(item);
            });
          }
          return (
            <div className="menu-section">
              <h2 className="subcategory-heading">{getCategoryKey(cat)}</h2>
              
              {/* Items without subcategory - displayed directly without subcategory heading */}
              {itemsWithoutSubcat.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <div className="menu-grid">
                    {itemsWithoutSubcat.map((item, index) => (
                      <div key={item.id} className="menu-card">
                        <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>
                          {lang === 'ar' ? item.name_ar : item.name_en}
                        </div>
                        <MenuItem
                          item={item}
                          lang={lang}
                          cartQuantity={order.find(o => o.id === item.id)?.quantity || 0}
                          onAddToCart={(product, opts) => {
                            addToCart(product, opts);
                            setToast({ show: true, message: `${lang === 'ar' ? 'تمت إضافة المنتج' : 'Item is added'} (${(order.find(o => o.id === item.id)?.quantity || 0) + 1} ${lang === 'ar' ? 'منتج' : 'item(s)'})`, type: 'success' });
                            setTimeout(() => setToast({ show: false, message: '', type: 'default' }), 2000);
                          }}
                          onChangeQuantity={delta => {
                            const idx = order.findIndex(o => o.id === item.id);
                            if (idx !== -1) handleChangeQuantity(idx, delta);
                          }}
                          onShowDetail={() => navigate(`/detail/${item.id}?category=${activeCategory}`)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Items with subcategories */}
              {Object.entries(subcatGroups).map(([subcat, items]) => (
                  <div key={subcat} style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontWeight: 700, fontSize: '1.3rem', marginBottom: '12px', color: 'var(--primary)' }}>
                      {subcat}
                    </h3>
                    <div className="menu-grid">
                      {items.map(item => (
                        <div key={item.id} className="menu-card">
                          <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 6 }}>
                            {lang === 'ar' ? item.name_ar : item.name_en}
                          </div>
                          <MenuItem
                            item={item}
                            lang={lang}
                            cartQuantity={order.find(o => o.id === item.id)?.quantity || 0}
                            onAddToCart={(product, opts) => {
                              addToCart(product, opts);
                              setToast({ show: true, message: `${lang === 'ar' ? 'تمت إضافة المنتج' : 'Item is added'} (${(order.find(o => o.id === item.id)?.quantity || 0) + 1} ${lang === 'ar' ? 'منتج' : 'item(s)'})`, type: 'success' });
                              setTimeout(() => setToast({ show: false, message: '', type: 'default' }), 2000);
                            }}
                            onChangeQuantity={delta => {
                              const idx = order.findIndex(o => o.id === item.id);
                              if (idx !== -1) handleChangeQuantity(idx, delta);
                            }}
                            onShowDetail={() => navigate(`/detail/${item.id}?category=${activeCategory}`)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          );
        })()}
      </div>

  {/* Empty Cart Modal - overlays above order summary bar */}
  <EmptyCartModal show={showEmptyCartModal} lang={lang} onClose={() => setShowEmptyCartModal(false)} />
  {/* Order Summary Bar - middle bottom placement */}
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
          <button className="order-btn view-order-btn" onClick={() => setShowCart(true)} style={{ fontWeight: 600, fontSize: '1rem', padding: '10px 0' }}>
            {lang === 'ar' ? 'عرض الطلب بالكامل' : 'View Full Order'}
          </button>
          
          {/* Restore Cart Button */}
          {hasCartHistory && (
            <button 
              className="order-btn" 
              onClick={openRestoreCart}
              style={{ 
                fontWeight: 600, 
                fontSize: '0.9rem', 
                padding: '8px 0',
                backgroundColor: '#6c757d',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#5a6268'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#6c757d'}
            >
              {lang === 'ar' ? '🕒 استعادة العربة' : '🕒 Restore Cart'}
            </button>
          )}
          
          <button className="order-btn place-order-btn" onClick={() => {
            if (order.length === 0) {
              setShowEmptyCartModal(true);
            } else {
              setShowPlaceOrder(true);
            }
          }} style={{ fontWeight: 600, fontSize: '1rem', padding: '10px 0' }}>
            {lang === 'ar' ? 'تقديم الطلب' : 'Place Order'}
          </button>
  {/* Empty Cart Modal - removed duplicate */}
        </div>
      </div>

      {/* Modals */}
      <OrderSummaryModal
        show={showCart}
        order={order}
        lang={lang}
        onClose={() => setShowCart(false)}
        onRemoveItem={handleRemoveItem}
        onChangeQuantity={handleChangeQuantity}
        onClearOrder={handleClearOrder}
        onPlaceOrder={() => {
          setShowCart(false);
          setShowPlaceOrder(true);
        }}
      />
      <PlaceOrderModal
        show={showPlaceOrder}
        order={order}
        lang={lang}
        customerName={customerName}
        setCustomerName={setCustomerName}
        notes={notes}
        setNotes={setNotes}
        onCancel={() => setShowPlaceOrder(false)}
        onConfirm={handlePlaceOrder}
      />
      <OrderSuccessModal
        show={orderSuccess?.show}
        lang={lang}
        orderId={orderSuccess?.orderId}
        customerName={orderSuccess?.customerName}
        total={orderSuccess?.total || 0}
        onNewOrder={() => setOrderSuccess(null)}
      />
      {/* Toast Notification: do not show for empty cart */}
      {toast.show && toast.message && toast.message !== 'Your cart is empty' && toast.message !== 'سلة التسوق فارغة' && (
        <div className="toast" style={{ opacity: 1 }}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
