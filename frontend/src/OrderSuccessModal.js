
import React from 'react';
export default function OrderSuccessModal({ show, lang, orderId, customerName, total, onNewOrder }) {
  if (!show) return null;
  return (
    <div className="modal fade-in" onClick={onNewOrder}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ minWidth: 340, textAlign: 'center' }}>
        <h2 style={{ marginBottom: 18 }}>{lang === 'ar' ? 'تم استلام الطلب!' : 'Order Received!'}</h2>
        <div style={{ fontSize: '1.1rem', marginBottom: 12 }}>{lang === 'ar' ? 'رقم الطلب:' : 'Order ID:'} <span style={{ fontWeight: 700 }}>{orderId}</span></div>
        <div style={{ fontSize: '1.1rem', marginBottom: 12 }}>{lang === 'ar' ? 'اسم العميل:' : 'Customer:'} <span style={{ fontWeight: 700 }}>{customerName}</span></div>
        <div style={{ fontSize: '1.1rem', marginBottom: 12 }}>{lang === 'ar' ? 'المجموع:' : 'Total:'} <span style={{ fontWeight: 700 }}>AED {total}</span></div>
        <button onClick={onNewOrder} style={{ background: 'var(--primary)', color: '#fff', border: 'none', padding: '8px 18px', borderRadius: 6, marginTop: 18 }}>{lang === 'ar' ? 'طلب جديد' : 'New Order'}</button>
      </div>
    </div>
  );
}
