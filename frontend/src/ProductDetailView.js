import React, { useMemo, useState, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getItemImageUrl } from './utils/imageUtils';

// Detail view (renamed from ProductDetailPage) with swipe navigation and size handling
const ProductDetailView = ({ categories, lang, addToCart, openCart, openPlaceOrder, order, setLang }) => {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug('[ProductDetailView] render start');
  }
  const { id: rawId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromCategory = searchParams.get('category');
  const allItems = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    const collected = [];
    try {
      categories.forEach(cat => {
        if (Array.isArray(cat.items)) {
          cat.items.forEach(entry => {
            if (entry && Array.isArray(entry.items)) {
              entry.items.forEach(sub => sub && collected.push(sub));
            } else if (entry) {
              collected.push(entry);
            }
          });
        }
      });
    } catch (e) { return collected; }
    return collected;
  }, [categories]);
  const normalizedId = useMemo(() => {
    const hasNumeric = allItems.some(it => typeof it?.id === 'number');
    if (hasNumeric) { const asNum = Number(rawId); return isNaN(asNum) ? rawId : asNum; }
    return rawId;
  }, [rawId, allItems]);
  const idx = useMemo(() => allItems.findIndex(item => item?.id === normalizedId), [allItems, normalizedId]);
  const product = idx >= 0 ? allItems[idx] : null;
  const [quantity, setQuantity] = useState(1);
  const initialSize = product?.has_sizes && product.sizes.length ? (lang === 'ar' ? product.sizes[0].label_ar : product.sizes[0].label_en) : null;
  const [size, setSize] = useState(initialSize);
  const [addedMsg, setAddedMsg] = useState(false);
  const [adding, setAdding] = useState(false);
  const addingRef = useRef(false);
  // Use react-swipeable for swipe gestures
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => handleSwipe('left'),
    onSwipedRight: () => handleSwipe('right'),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
  });
  if (!product) {
    return (<div style={{ padding: 40, textAlign: 'center', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      <h2 style={{ color: 'var(--primary)', marginBottom: 16 }}>{lang === 'ar' ? 'المنتج غير موجود' : 'Product not found'}</h2>
      <button onClick={() => navigate('/')} style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontWeight: 600 }}>{lang === 'ar' ? 'القائمة' : 'Go to Menu'}</button>
    </div>);
  }
  const handleSwipe = direction => {
    if (idx < 0) return; let newIdx = idx; const isRTL = lang === 'ar'; if (direction === 'left') newIdx = isRTL ? idx + 1 : idx - 1; else if (direction === 'right') newIdx = isRTL ? idx - 1 : idx + 1; if (newIdx >= 0 && newIdx < allItems.length) { const target = allItems[newIdx]; if (target && target.id !== undefined && target.id !== null) { navigate(`/detail/${target.id}${fromCategory ? `?category=${encodeURIComponent(fromCategory)}` : ''}`); } } };
  return (<div className="detail-page" {...swipeHandlers} style={{ direction: lang === 'ar' ? 'rtl' : 'ltr', minHeight: '100vh', background: '#fff' }}>
    <div className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--primary)', padding: '15px 20px', marginBottom: '20px', color: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <div className="logo"><i className="fas fa-utensils"></i>{lang === 'ar' ? (<span className="arabic" style={{ fontWeight: 700, marginRight: '8px' }}>ساندويتش بلس+</span>) : (<span className="english" style={{ fontWeight: 700, marginLeft: '8px' }}>SANDWICH PLUS+</span>)}</div>
      </div>
      <div className="language-toggle">
        <button className={`lang-btn${lang === 'en' ? ' active' : ''}`} onClick={() => typeof setLang === 'function' && setLang('en')} data-lang="en" style={{ background: lang === 'en' ? '#fff' : 'transparent', color: lang === 'en' ? 'var(--primary)' : '#fff', border: '1px solid #fff', padding: '4px 8px', marginRight: '8px', borderRadius: '4px', cursor: 'pointer' }}>EN</button>
        <button className={`lang-btn${lang === 'ar' ? ' active' : ''}`} onClick={() => typeof setLang === 'function' && setLang('ar')} data-lang="ar" style={{ background: lang === 'ar' ? '#fff' : 'transparent', color: lang === 'ar' ? 'var(--primary)' : '#fff', border: '1px solid #fff', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer' }}>AR</button>
      </div>
    </div>
  <div style={{ padding: '20px', width: '100%', background: '#fff', borderRadius: '0', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
      <div style={{ marginBottom: 20, textAlign: lang === 'ar' ? 'right' : 'left', borderBottom: '1px solid #e0e0e0', paddingBottom: '15px' }}>
        <button onClick={() => { if (fromCategory) { navigate('/', { state: { activeCategory: fromCategory } }); } else { navigate(-1); } }} className="back-btn" style={{ marginRight: lang === 'ar' ? 0 : '10px', marginLeft: lang === 'ar' ? '10px' : 0, padding: '10px 20px', fontSize: '1rem', borderRadius: '8px', background: '#52a373', color: '#fff', border: 'none', cursor: 'pointer', transition: 'background 0.3s ease', boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>{lang === 'ar' ? 'رجوع' : 'Back'}</button>
      </div>
      <div className="order-summary" id="orderSummary" style={{ position: 'relative', width: '100%', background: '#fff', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '24px 18px', zIndex: 100 }}>
        <div className="detail-content">
          <h2 style={{ fontSize: '2rem', color: 'var(--primary)', marginBottom: '20px', fontWeight: '700', textAlign: lang === 'ar' ? 'right' : 'left' }}>{lang === 'ar' ? product.name_ar : product.name_en}</h2>
          {product.images && product.images.length > 0 && (
            <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', marginBottom: '24px' }}>
              <img src={getItemImageUrl(product)} alt={lang === 'ar' ? product.name_ar : product.name_en} style={{ width: '100%', height: '400px', objectFit: 'cover', display: 'block' }} />
            </div>
          )}
          <div style={{ display: 'flex', margin: '24px 0' }}>
            <div style={{ background: '#e8f5e9', borderRadius: '16px', padding: '20px', fontSize: '1.1rem', color: '#1b5e20', boxShadow: '0 4px 15px rgba(76,175,80,0.1)', lineHeight: '1.6', textAlign: lang === 'ar' ? 'right' : 'left', borderLeft: '10px solid #2a5c45', flex: 1 }}>
              {lang === 'ar' ? product.description_ar : product.description_en}
            </div>
          </div>
          <div style={{ margin: '24px 0', background: '#f8f9fa', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', padding: '28px 24px' }}>
            <div style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: 18, color: '#2a5c45', textAlign: 'center' }}>{lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</div>
            {order.length === 0 ? (
              <div style={{ textAlign: 'center', margin: '24px 0', fontSize: '1.1rem', color: '#888' }}>{lang === 'ar' ? 'سلة التسوق فارغة' : 'Your cart is empty.'}</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {order.map((item, idx) => (
                  <li key={item.id + (item.size || '')} style={{ marginBottom: 16, background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.04)', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.08rem', marginBottom: 2 }}>{lang === 'ar' ? item.name_ar : item.name_en} {item.size ? `(${item.size})` : ''}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: '1rem', color: '#2a5c45', fontWeight: 700 }}>{lang === 'ar' ? 'الكمية:' : 'Qty:'} {item.quantity}</span>
                      <span style={{ fontSize: '1rem', color: '#555', fontWeight: 600 }}>{lang === 'ar' ? 'السعر:' : 'Price:'} AED {item.price}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div style={{ fontWeight: 800, fontSize: '1.18rem', margin: '28px 0 18px 0', textAlign: 'center', color: '#2a5c45' }}>{lang === 'ar' ? 'المجموع:' : 'Total:'} AED {order.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</div>
          </div>
        </div>
        <div className="price-box" style={{ background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)', borderRadius: '8px', padding: '10px 16px', marginBottom: '20px', display: 'inline-flex', justifyContent: lang === 'ar' ? 'flex-end' : 'flex-start', alignItems: 'center', gap: '8px', boxShadow: '0 2px 8px rgba(76,175,80,0.1)' }}>
          <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>{lang === 'ar' ? 'السعر:' : 'Price:'}</strong>
          <span className="price-bold" style={{ fontSize: '1.2rem', color: 'var(--accent)', fontWeight: '700' }}>{product.price} AED</span>
        </div>
        {product.has_sizes && product.sizes.length > 0 && (<div className="size-select" style={{ marginBottom: '24px', padding: '20px', background: '#f5f5f5', borderRadius: '12px', textAlign: lang === 'ar' ? 'right' : 'left' }}><label style={{ display: 'block', marginBottom: '10px', fontSize: '1.1rem', color: 'var(--primary)', fontWeight: '600' }}>{lang === 'ar' ? 'الحجم:' : 'Size:'}</label><select value={size} onChange={e => { const selected = product.sizes.find(s => s.label_en === e.target.value || s.label_ar === e.target.value); setSize(selected ? selected.label_en : e.target.value); }} style={{ width: '100%', padding: '12px', fontSize: '1rem', borderRadius: '8px', border: '2px solid #e0e0e0', outline: 'none', cursor: 'pointer', transition: 'border-color 0.3s ease' }}>{product.sizes.map(s => (<option key={s.label_en} value={s.label_en}>{lang === 'ar' ? s.label_ar : s.label_en} ({s.price} AED)</option>))}</select></div>)}
        <div className="quantity-select" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', padding: '16px', background: '#f5f5f5', borderRadius: '12px', justifyContent: lang === 'ar' ? 'flex-end' : 'flex-start' }}>
          <label style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: '600' }}>{lang === 'ar' ? 'الكمية:' : 'Quantity:'}</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#fff', padding: '3px', borderRadius: '6px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: '28px', height: '28px', borderRadius: '4px', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
            <span style={{ fontSize: '1rem', fontWeight: '600', width: '30px', textAlign: 'center' }}>{quantity}</span>
            <button onClick={() => setQuantity(q => q + 1)} style={{ width: '28px', height: '28px', borderRadius: '4px', border: 'none', background: 'var(--primary)', color: '#fff', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
        </div>
        <div style={{ position: 'relative', width: '100%', height: '60px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>{addedMsg && (<div style={{ position: 'absolute', background: 'linear-gradient(135deg, #43a047 0%, #388e3c 100%)', color: '#fff', padding: '12px 28px', borderRadius: '12px', fontWeight: '700', fontSize: '1.1rem', boxShadow: '0 4px 12px rgba(67,160,71,0.2)', zIndex: 10, animation: 'fadeIn 0.3s ease', whiteSpace: 'nowrap' }}>{lang === 'ar' ? 'تمت الإضافة' : 'Added'}</div>)}</div>
        <div style={{ background: '#f8f9fa', borderRadius: '16px', padding: '24px', marginTop: '20px', boxShadow: '0 -4px 20px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: lang === 'ar' ? 'flex-end' : 'flex-start', marginBottom: '20px', width: '100%' }}>
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (addingRef.current) return; addingRef.current = true; setAdding(true); let sizeLabel = size; if (product.has_sizes && product.sizes.length > 0) { const selected = product.sizes.find(s => s.label_en === size || s.label_ar === size); sizeLabel = selected ? selected.label_en : size; } const actionId = `${product.id}-detail-${Date.now()}`; addToCart(product, { quantity, sizeLabel, source: 'ProductDetailView', actionId }); setQuantity(1); setAddedMsg(true); setTimeout(() => setAddedMsg(false), 1800); setTimeout(() => { addingRef.current = false; setAdding(false); }, 500); }} className="add-btn" style={{ minWidth: '200px', padding: '14px 28px', fontSize: '1.1rem', fontWeight: '700', borderRadius: '12px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.6 : 1, transition: 'all 0.3s ease', boxShadow: '0 4px 15px rgba(42,92,69,0.2)' }} disabled={adding}>{lang === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: '20px', width: '100%' }}>
            {/* This button triggers the global OrderSummaryModal, matching menu page UI */}
            <button onClick={openCart} className="view-order-btn" style={{ flex: 1, padding: '14px', fontSize: '1.1rem', fontWeight: '600', borderRadius: '12px', background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', opacity: 0.9 }}>{lang === 'ar' ? 'عرض الطلب' : 'View Order'}</button>
            <button onClick={() => { if (order && order.length > 0) openPlaceOrder(); }} className="place-order-btn" style={{ flex: 1, padding: '14px', fontSize: '1.1rem', fontWeight: '600', borderRadius: '12px', background: order && order.length > 0 ? 'var(--primary)' : '#e0e0e0', color: '#fff', border: 'none', cursor: (!order || order.length === 0) ? 'not-allowed' : 'pointer', opacity: (!order || order.length === 0) ? 0.7 : 1, transition: 'all 0.3s ease' }} disabled={!order || order.length === 0}>{lang === 'ar' ? 'تقديم الطلب' : 'Place Order'}</button>
          </div>
        </div>
      </div>
    </div>
  </div>);
};

export default ProductDetailView;
