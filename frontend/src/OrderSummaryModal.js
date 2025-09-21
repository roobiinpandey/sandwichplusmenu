
import React from 'react';
export default function OrderSummaryModal({ show, order, lang, onClose, onRemoveItem, onChangeQuantity, onClearOrder, onPlaceOrder }) {
  if (!show) return null;
  return (
    <div className="modal fade-in" onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, background: 'rgba(0,0,0,0.18)' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ minWidth: 340, maxWidth: '95vw', background: '#fff', borderRadius: 22, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: 0, overflow: 'hidden', position: 'relative', fontFamily: 'inherit' }}>
        {/* Header */}
  <div style={{ background: '#2a5c45', color: '#fff', padding: '22px 36px', borderTopLeftRadius: 22, borderTopRightRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(42, 92, 69, 0.08)' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.02em' }}>{lang === 'ar' ? 'سلة التسوق' : 'Your Cart'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '2rem', fontWeight: 700, cursor: 'pointer', marginLeft: 12 }} aria-label="Close">×</button>
        </div>
        <div style={{ padding: '28px 36px', background: '#f8f9fa' }}>
          {order.length === 0 ? (
            <div style={{ textAlign: 'center', margin: '24px 0', fontSize: '1.1rem', color: '#888' }}>{lang === 'ar' ? 'سلة التسوق فارغة' : 'Your cart is empty.'}</div>
          ) : (
            <>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {order.map((item, idx) => (
                  <li key={item.id + (item.size || '')} style={{ marginBottom: 16, background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.04)', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.08rem', marginBottom: 2 }}>{lang === 'ar' ? item.name_ar : item.name_en} {item.size ? `(${item.size})` : ''}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: '1rem', color: '#2a5c45', fontWeight: 700 }}>{lang === 'ar' ? 'الكمية:' : 'Qty:'} {item.quantity}</span>
                      <button onClick={() => onChangeQuantity(idx, 1)} style={{ padding: '6px 14px', fontSize: '1.08rem', fontWeight: 700, background: '#e6f4ea', color: '#2a5c45', border: '1px solid #2a5c45', borderRadius: 6, cursor: 'pointer' }}>+</button>
                      <button onClick={() => onChangeQuantity(idx, -1)} style={{ padding: '6px 14px', fontSize: '1.08rem', fontWeight: 700, background: '#f8d7da', color: '#d32f2f', border: '1px solid #d32f2f', borderRadius: 6, cursor: 'pointer' }}>-</button>
                      <button onClick={() => onRemoveItem(idx)} style={{ padding: '6px 14px', color: '#d32f2f', background: '#fff', border: '1px solid #d32f2f', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                    </div>
                    <div style={{ fontSize: '1rem', color: '#555', fontWeight: 600 }}>{lang === 'ar' ? 'السعر:' : 'Price:'} AED {item.price}</div>
                  </li>
                ))}
              </ul>
              <div style={{ fontWeight: 800, fontSize: '1.18rem', margin: '28px 0 18px 0', textAlign: 'center', color: '#2a5c45' }}>{lang === 'ar' ? 'المجموع:' : 'Total:'} AED {order.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</div>
              <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 18 }}>
                <button onClick={onClearOrder} style={{ background: '#eee', border: 'none', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: '1.08rem', color: '#333', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>{lang === 'ar' ? 'مسح السلة' : 'Clear Cart'}</button>
                <button onClick={onPlaceOrder} style={{ background: '#2a5c45', color: '#fff', border: 'none', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: '1.08rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(42, 92, 69, 0.10)' }}>{lang === 'ar' ? 'تقديم الطلب' : 'Place Order'}</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
