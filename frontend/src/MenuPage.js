import React, { useState, useEffect } from 'react';
import './App.css';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MenuItem from './MenuItem';
import OrderSummaryModal from './components/OrderSummaryModal';
import PlaceOrderModal from './components/PlaceOrderModal';
import OrderSuccessModal from './components/OrderSuccessModal';

// Configure axios base URL for API calls - ensure consistency with App.js
const API_BASE_URL = 'https://swp-backend-x36i.onrender.com';
console.log('[DEBUG] MenuPage - Using API Base URL:', API_BASE_URL);
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = false;
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

// Store Closed Modal
function StoreClosedModal({ show, lang, onClose, storeStatus }) {
  if (!show) return null;
  
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12 === 0 ? 12 : hour12}:${minutes} ${ampm}`;
  };
  
  return (
    <div className="modal fade-in" onClick={onClose} style={{ 
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', 
      zIndex: 9999, background: 'rgba(0,0,0,0.5)' 
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 12, padding: '24px', 
        maxWidth: '400px', margin: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: '48px', marginBottom: 16 }}>🔒</div>
          <h2 style={{ color: '#d32f2f', marginBottom: 12, fontSize: '1.5rem', fontWeight: 700 }}>
            {lang === 'ar' ? 'آسفون، نحن مغلقون اليوم' : 'Sorry, we\'re closed for today'}
          </h2>
          <div style={{ color: '#666', fontSize: '1.1rem', marginBottom: 18 }}>
            {lang === 'ar' ? 'ساعات العمل:' : 'Store Operating Hours:'}
          </div>
          <div style={{ 
            background: '#f8f9fa', padding: '16px', borderRadius: 8, 
            fontSize: '1.2rem', fontWeight: 600, color: '#2a5c45'
          }}>
            {formatTime(storeStatus.openTime)} - {formatTime(storeStatus.closeTime)}
          </div>
          <div style={{ marginTop: 16, color: '#888', fontSize: '0.95rem' }}>
            {lang === 'ar' ? 'يرجى العودة خلال ساعات العمل' : 'Please visit us during operating hours'}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={onClose} 
            style={{ 
              background: '#2a5c45', color: '#fff', borderRadius: 8, 
              padding: '12px 24px', fontWeight: 600, border: 'none', 
              cursor: 'pointer', fontSize: '1rem'
            }}
          >
            {lang === 'ar' ? 'موافق' : 'Okay'}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function MenuPage({ categories, lang, order, setOrder, addToCart, openCart, openPlaceOrder, setLang }) {
  const navigate = useNavigate();

  // Store status state
  const [storeStatus, setStoreStatus] = useState({
    isOpen: true,
    openTime: '07:30',
    closeTime: '22:00'
  });
  const [showClosedModal, setShowClosedModal] = useState(false);

  // Order modal states
  const [showPlaceOrder, setShowPlaceOrder] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [showEmptyCartModal, setShowEmptyCartModal] = useState(false);

  // Load store status from backend
  useEffect(() => {
    const loadStoreStatus = async () => {
      try {
        const response = await axios.get('/store/status');
        const newStatus = response.data;
        setStoreStatus(newStatus);
        
        // If store is closed, immediately block any active ordering process
        if (!newStatus.isOpen || !isStoreCurrentlyOpen(newStatus)) {
          setShowPlaceOrder(false);
          setShowCart(false);
          // Show closed modal if user was in the middle of ordering
          if (showPlaceOrder || showCart) {
            setShowClosedModal(true);
          }
        }
      } catch (error) {
        console.error('Failed to load store status:', error);
      }
    };
    loadStoreStatus();
    
    // Check every 10 seconds for immediate response to admin changes  
    const interval = setInterval(loadStoreStatus, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPlaceOrder, showCart]); // Dependencies for detecting when user is ordering

  // Check if store is currently open
  const isStoreCurrentlyOpen = (statusOverride = null) => {
    const currentStatus = statusOverride || storeStatus;
    if (!currentStatus.isOpen) return false; // Manual override
    
    const now = new Date();
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    // Convert times to minutes for easier comparison
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    const currentMinutes = timeToMinutes(currentTime);
    const openMinutes = timeToMinutes(currentStatus.openTime);
    const closeMinutes = timeToMinutes(currentStatus.closeTime);
    
    // Handle overnight hours (e.g., 22:00 to 07:30)
    if (closeMinutes < openMinutes) {
      return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    }
    
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  };

  // Function to check store status before allowing order operations
  const checkStoreStatusAndProceed = (callback) => {
    if (!isStoreCurrentlyOpen()) {
      setShowClosedModal(true);
      return false;
    }
    callback();
    return true;
  };

  
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
  
  // Customer order state (moved to top with other states)
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
    
    // Check store status one more time before processing order
    if (!isStoreCurrentlyOpen()) {
      setShowPlaceOrder(false);
      setShowClosedModal(true);
      return;
    }
    
    const nameToUse = payload.customer || customerName;
    // Note: Name validation is now handled inline in PlaceOrderModal
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
      console.log('[DEBUG] MenuPage POST /orders payload', JSON.stringify(orderData, null, 2));
      
      // Add detailed debugging before the request
      console.log('[DEBUG] MenuPage - About to send POST request to:', axios.defaults.baseURL + '/orders');
      console.log('[DEBUG] MenuPage - Axios config:', { 
        baseURL: axios.defaults.baseURL,
        withCredentials: axios.defaults.withCredentials 
      });
      
      await axios.post('/orders', orderData);
      setOrderSuccess({ show: true, orderId: '#' + Math.floor(10000 + Math.random() * 90000), customerName: nameToUse, total: orderData.total });
      setOrder([]);
      setCustomerName('');
      setNotes('');
    } catch (err) {
      console.error('[DEBUG] MenuPage - Order placement failed:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          baseURL: err.config?.baseURL,
          data: err.config?.data
        },
        request: err.request ? 'Request was made but no response received' : 'No request made'
      });
      
      // Check if it's a network error vs server error
      if (!err.response) {
        console.error('[DEBUG] MenuPage - Network error - no response received');
        console.error('[DEBUG] MenuPage - Request details:', err.request);
      } else {
        console.error('[DEBUG] MenuPage - Server responded with error:', err.response.status, err.response.data);
      }
      
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
          <button className="order-btn view-order-btn" onClick={() => checkStoreStatusAndProceed(() => setShowCart(true))} style={{ fontWeight: 600, fontSize: '1rem', padding: '10px 0' }}>
            {lang === 'ar' ? 'عرض الطلب بالكامل' : 'View Full Order'}
          </button>
          <button className="order-btn place-order-btn" onClick={() => {
            if (order.length === 0) {
              setShowEmptyCartModal(true);
            } else {
              checkStoreStatusAndProceed(() => setShowPlaceOrder(true));
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
          checkStoreStatusAndProceed(() => setShowPlaceOrder(true));
        }}
      />
      <StoreClosedModal
        show={showClosedModal}
        lang={lang}
        storeStatus={storeStatus}
        onClose={() => setShowClosedModal(false)}
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
