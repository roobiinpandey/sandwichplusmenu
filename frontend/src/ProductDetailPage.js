import React, { useMemo, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

// Detail page: shows a single menu item (handles swipe left/right navigation)
// Robustness enhancements added: safer flattening, id coercion, guards.
const ProductDetailPage = ({ categories, lang, addToCart, openCart, openPlaceOrder, order, setLang }) => {
  // Debug: ensure component executed (helps diagnose invalid element type)
  if (process.env.NODE_ENV === 'development') {
    // Avoid noisy logs in production
    // eslint-disable-next-line no-console
    console.debug('[ProductDetailPage] render start');
  }
  const { id: rawId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromCategory = searchParams.get('category');

  // Flatten categories -> items (handles nested subcategories with their own items arrays)
  const allItems = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    const collected = [];
    try {
      categories.forEach(cat => {
        if (Array.isArray(cat.items)) {
          cat.items.forEach(entry => {
            // If entry has nested items (subcategory), include those instead of the container
            if (entry && Array.isArray(entry.items)) {
              entry.items.forEach(sub => sub && collected.push(sub));
            } else if (entry) {
              collected.push(entry);
            }
          });
        }
      });
    } catch (e) {
      // Silent – fallback empty list if structure unexpected
      return collected;
    }
    return collected;
  }, [categories]);

  // Coerce id type if numeric ids are used in data
  const normalizedId = useMemo(() => {
    const hasNumeric = allItems.some(it => typeof it?.id === 'number');
    if (hasNumeric) {
      const asNum = Number(rawId);
      return isNaN(asNum) ? rawId : asNum;
    }
    return rawId;
  }, [rawId, allItems]);

  // Locate product & its index for swipe navigation
  const idx = useMemo(() => allItems.findIndex(item => item?.id === normalizedId), [allItems, normalizedId]);
  const product = idx >= 0 ? allItems[idx] : null;

  const [quantity, setQuantity] = useState(1);
  const initialSize = product?.has_sizes && product.sizes.length ? (lang === 'ar' ? product.sizes[0].label_ar : product.sizes[0].label_en) : null;
  const [size, setSize] = useState(initialSize);
  const [addedMsg, setAddedMsg] = useState(false);
  const [adding, setAdding] = useState(false);
  const addingRef = useRef(false);

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null); // otherwise the swipe is fired even with usual touch events
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) handleSwipe('left');
    if (isRightSwipe) handleSwipe('right');
  };

  // Early fallback if product not found (avoid downstream undefined access)
  if (!product) {
    return (
      <div style={{ padding: 40, textAlign: 'center', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
        <h2 style={{ color: 'var(--primary)', marginBottom: 16 }}>
          {lang === 'ar' ? 'المنتج غير موجود' : 'Product not found'}
        </h2>
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'var(--primary)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          {lang === 'ar' ? 'القائمة' : 'Go to Menu'}
        </button>
      </div>
    );
  }

  // Swipe navigation
  const handleSwipe = direction => {
    if (idx < 0) return;
    let newIdx = idx;
    const isRTL = lang === 'ar';
    if (direction === 'left') newIdx = isRTL ? idx + 1 : idx - 1;
    else if (direction === 'right') newIdx = isRTL ? idx - 1 : idx + 1;
    if (newIdx >= 0 && newIdx < allItems.length) {
      const target = allItems[newIdx];
      if (target && target.id !== undefined && target.id !== null) {
        navigate(`/detail/${target.id}${fromCategory ? `?category=${encodeURIComponent(fromCategory)}` : ''}`);
      }
    }
  };

  return (
    <div className="detail-page" 
      onTouchStart={onTouchStart} 
      onTouchMove={onTouchMove} 
      onTouchEnd={onTouchEnd}
      style={{ 
        direction: lang === 'ar' ? 'rtl' : 'ltr',
        minHeight: '100vh',
        background: '#fff'
      }}
    >
      {/* Header Bar */}
      <div className="header" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        background: 'var(--primary)',
        padding: '15px 20px',
        marginBottom: '20px',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <div className="logo">
            <i className="fas fa-utensils"></i>
            {lang === 'ar' ? (
              <span className="arabic" style={{ fontWeight: 700, marginRight: '8px' }}>ساندويتش بلس+</span>
            ) : (
              <span className="english" style={{ fontWeight: 700, marginLeft: '8px' }}>SANDWICH PLUS+</span>
            )}
          </div>
        </div>
        <div className="language-toggle">
          <button 
            className={`lang-btn${lang === 'en' ? ' active' : ''}`} 
            onClick={() => typeof setLang === 'function' && setLang('en')} 
            data-lang="en"
            style={{
              background: lang === 'en' ? '#fff' : 'transparent',
              color: lang === 'en' ? 'var(--primary)' : '#fff',
              border: '1px solid #fff',
              padding: '4px 8px',
              marginRight: '8px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            EN
          </button>
          <button 
            className={`lang-btn${lang === 'ar' ? ' active' : ''}`} 
            onClick={() => typeof setLang === 'function' && setLang('ar')} 
            data-lang="ar"
            style={{
              background: lang === 'ar' ? '#fff' : 'transparent',
              color: lang === 'ar' ? 'var(--primary)' : '#fff',
              border: '1px solid #fff',
              padding: '4px 8px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            AR
          </button>
        </div>
      </div>
      
      <div style={{ 
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          marginBottom: 20, 
          textAlign: lang === 'ar' ? 'right' : 'left',
          borderBottom: '1px solid #e0e0e0',
          paddingBottom: '15px'
        }}>
          <button 
            onClick={() => {
              if (fromCategory) {
                navigate('/', { state: { activeCategory: fromCategory } });
              } else {
                navigate(-1);
              }
            }} 
            className="back-btn" 
            style={{ 
              marginRight: lang === 'ar' ? 0 : '10px', 
              marginLeft: lang === 'ar' ? '10px' : 0,
              padding: '10px 20px',
              fontSize: '1rem',
              borderRadius: '8px',
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.3s ease'
            }}
          >
            {lang === 'ar' ? 'رجوع' : 'Back'}
          </button>
        </div>
        <div className="detail-content">
          <h2 style={{
            fontSize: '2rem',
            color: 'var(--primary)',
            marginBottom: '20px',
            fontWeight: '700',
            textAlign: lang === 'ar' ? 'right' : 'left'
          }}>
            {lang === 'ar' ? product.name_ar : product.name_en}
          </h2>
          {product.images && product.images.length > 0 && (
            <div style={{
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              marginBottom: '24px'
            }}>
              <img 
                src={product.images[0]} 
                alt={lang === 'ar' ? product.name_ar : product.name_en} 
                style={{ 
                  width: '100%',
                  height: '400px',
                  objectFit: 'cover',
                  display: 'block'
                }} 
              />
            </div>
          )}
          <div style={{
            background: 'linear-gradient(145deg, rgba(76, 175, 80, 0.1) 0%, rgba(76, 175, 80, 0.2) 100%)',
            borderRadius: '16px',
            padding: '20px',
            margin: '24px 0',
            fontSize: '1.1rem',
            color: '#1b5e20',
            boxShadow: '0 4px 15px rgba(76,175,80,0.1)',
            lineHeight: '1.6',
            textAlign: lang === 'ar' ? 'right' : 'left'
          }}>
            {lang === 'ar' ? product.description_ar : product.description_en}
          </div>
          <div className="price-box" style={{
            background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
            borderRadius: '8px',
            padding: '10px 16px',
            marginBottom: '20px',
            display: 'inline-flex',
            justifyContent: lang === 'ar' ? 'flex-end' : 'flex-start',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 8px rgba(76,175,80,0.1)'
          }}>
            <strong style={{ fontSize: '1rem', color: 'var(--primary)' }}>
              {lang === 'ar' ? 'السعر:' : 'Price:'}
            </strong> 
            <span className="price-bold" style={{ 
              fontSize: '1.2rem', 
              color: 'var(--accent)',
              fontWeight: '700'
            }}>
              {product.price} AED
            </span>
          </div>
          {product.has_sizes && product.sizes.length > 0 && (
            <div className="size-select" style={{
              marginBottom: '24px',
              padding: '20px',
              background: '#f5f5f5',
              borderRadius: '12px',
              textAlign: lang === 'ar' ? 'right' : 'left'
            }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '10px',
                fontSize: '1.1rem',
                color: 'var(--primary)',
                fontWeight: '600'
              }}>
                {lang === 'ar' ? 'الحجم:' : 'Size:'}
              </label>
              <select 
                value={size} 
                onChange={e => {
                  const selected = product.sizes.find(s => s.label_en === e.target.value || s.label_ar === e.target.value);
                  setSize(selected ? selected.label_en : e.target.value);
                }}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '1rem',
                  borderRadius: '8px',
                  border: '2px solid #e0e0e0',
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'border-color 0.3s ease'
                }}
              >
                {product.sizes.map(s => (
                  <option key={s.label_en} value={s.label_en}>
                    {lang === 'ar' ? s.label_ar : s.label_en} ({s.price} AED)
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="quantity-select" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px',
            marginBottom: '24px',
            padding: '16px',
            background: '#f5f5f5',
            borderRadius: '12px',
            justifyContent: lang === 'ar' ? 'flex-end' : 'flex-start'
          }}>
            <label style={{ 
              fontSize: '1rem',
              color: 'var(--primary)',
              fontWeight: '600'
            }}>
              {lang === 'ar' ? 'الكمية:' : 'Quantity:'}
            </label>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              background: '#fff',
              padding: '3px',
              borderRadius: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
            }}>
              <button 
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >-</button>
              <span style={{ 
                fontSize: '1rem',
                fontWeight: '600',
                width: '30px',
                textAlign: 'center'
              }}>{quantity}</span>
              <button 
                onClick={() => setQuantity(q => q + 1)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '4px',
                  border: 'none',
                  background: 'var(--primary)',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >+</button>
            </div>
          </div>
          {/* Message Container with Fixed Height */}
          <div style={{ 
            position: 'relative',
            width: '100%',
            height: '60px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            {addedMsg && (
              <div style={{
                position: 'absolute',
                background: 'linear-gradient(135deg, #43a047 0%, #388e3c 100%)',
                color: '#fff',
                padding: '12px 28px',
                borderRadius: '12px',
                fontWeight: '700',
                fontSize: '1.1rem',
                boxShadow: '0 4px 12px rgba(67,160,71,0.2)',
                zIndex: 10,
                animation: 'fadeIn 0.3s ease',
                whiteSpace: 'nowrap'
              }}>
                {lang === 'ar' ? 'تمت الإضافة' : 'Added'}
              </div>
            )}
          </div>
          {/* Action Buttons Container */}
          <div style={{ 
            background: '#f8f9fa',
            borderRadius: '16px',
            padding: '24px',
            marginTop: '20px',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
          }}>
            {/* Add to Cart button */}
            <div style={{ 
              display: 'flex', 
              justifyContent: lang === 'ar' ? 'flex-end' : 'flex-start', 
              marginBottom: '20px', 
              width: '100%' 
            }}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (addingRef.current) return;
                  addingRef.current = true;
                  setAdding(true);
                  let sizeLabel = size;
                  if (product.has_sizes && product.sizes.length > 0) {
                    const selected = product.sizes.find(s => s.label_en === size || s.label_ar === size);
                    sizeLabel = selected ? selected.label_en : size;
                  }
                  const actionId = `${product.id}-detail-${Date.now()}`;
                  addToCart(product, { quantity, sizeLabel, source: 'ProductDetail', actionId });
                  setQuantity(1);
                  setAddedMsg(true);
                  setTimeout(() => setAddedMsg(false), 1800);
                  setTimeout(() => {
                    addingRef.current = false;
                    setAdding(false);
                  }, 500);
                }}
                className="add-btn"
                style={{ 
                  minWidth: '200px',
                  padding: '14px 28px',
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  borderRadius: '12px',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  cursor: adding ? 'not-allowed' : 'pointer',
                  opacity: adding ? 0.6 : 1,
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(42,92,69,0.2)'
                }}
                disabled={adding}
              >
                {lang === 'ar' ? 'أضف إلى السلة' : 'Add to Cart'}
              </button>
            </div>
            
            {/* Order Action Buttons */}
            <div style={{ 
              display: 'flex', 
              flexDirection: 'row', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '20px', 
              width: '100%'
            }}>
              <button 
                onClick={openCart} 
                className="view-order-btn" 
                style={{ 
                  flex: 1,
                  padding: '14px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  borderRadius: '12px',
                  background: 'var(--primary)',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  opacity: 0.9
                }}
              >
                {lang === 'ar' ? 'عرض الطلب' : 'View Order'}
              </button>
              
              <button
                onClick={() => {
                  if (order && order.length > 0) {
                    openPlaceOrder();
                  }
                }}
                className="place-order-btn"
                style={{ 
                  flex: 1,
                  padding: '14px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  borderRadius: '12px',
                  background: order && order.length > 0 ? 'var(--primary)' : '#e0e0e0',
                  color: '#fff',
                  border: 'none',
                  cursor: (!order || order.length === 0) ? 'not-allowed' : 'pointer',
                  opacity: (!order || order.length === 0) ? 0.7 : 1,
                  transition: 'all 0.3s ease'
                }}
                disabled={!order || order.length === 0}
              >
                {lang === 'ar' ? 'تقديم الطلب' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
