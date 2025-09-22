
import React from 'react';
export default function OrderSuccessModal({ show, lang, orderId, customerName, total, onNewOrder }) {
  if (!show) return null;
  return (
    <div className="modal fade-in" onClick={onNewOrder} style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      width: '100vw', 
      height: '100vh', 
      background: 'rgba(0,0,0,0.5)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      zIndex: 9999 
    }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ 
        minWidth: 340, 
        maxWidth: '90vw', 
        background: '#fff', 
        borderRadius: 16, 
        padding: '32px 24px', 
        textAlign: 'center', 
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)' 
      }}>
        {/* Success Icon */}
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>✅</div>
        <h2 style={{ 
          marginBottom: 24, 
          color: '#2a5c45', 
          fontSize: '1.5rem', 
          fontWeight: 800 
        }}>{lang === 'ar' ? 'تم استلام الطلب بنجاح!' : 'Order Placed Successfully!'}</h2>
        
        <div style={{ 
          background: '#f8f9fa', 
          borderRadius: 12, 
          padding: '20px', 
          marginBottom: 24,
          textAlign: 'left'
        }}>
          <div style={{ fontSize: '1.1rem', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span>{lang === 'ar' ? 'رقم الطلب:' : 'Order ID:'}</span>
            <span style={{ fontWeight: 700, color: '#2a5c45' }}>{orderId}</span>
          </div>
          <div style={{ fontSize: '1.1rem', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
            <span>{lang === 'ar' ? 'اسم العميل:' : 'Customer:'}</span>
            <span style={{ fontWeight: 700 }}>{customerName}</span>
          </div>
          <div style={{ fontSize: '1.1rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>{lang === 'ar' ? 'المجموع:' : 'Total:'}</span>
            <span style={{ fontWeight: 700, color: '#2a5c45' }}>AED {total.toFixed(2)}</span>
          </div>
        </div>
        
        <p style={{ 
          color: '#666', 
          fontSize: '1rem', 
          marginBottom: 24 
        }}>{lang === 'ar' ? 'سيتم تحضير طلبك قريباً' : 'Your order is being prepared!'}</p>
        
        <button 
          onClick={onNewOrder} 
          style={{ 
            background: '#2a5c45', 
            color: '#fff', 
            border: 'none', 
            padding: '12px 32px', 
            borderRadius: 8, 
            fontSize: '1.1rem',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(42, 92, 69, 0.2)' 
          }}
        >{lang === 'ar' ? 'طلب جديد' : 'Place New Order'}</button>
      </div>
    </div>
  );
}
