import React, { useRef, useEffect, useCallback } from 'react';

const OrderSuccessModal = ({ show, lang, orderId, customerName, total, onNewOrder }) => {
  const dialogRef = useRef(null);
  const handleClose = useCallback(() => {
    const el = dialogRef.current;
    if (!el) return onNewOrder && onNewOrder();
    el.classList.add('closing');
    setTimeout(() => onNewOrder && onNewOrder(), 190);
  }, [onNewOrder]);
  const backdropClick = (e) => {
    if (e.target === dialogRef.current) handleClose();
  };

  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => {
      handleClose();
      // refresh the page after a short delay to allow modal closing animation
      setTimeout(() => window.location.reload(), 300);
    }, 2000);
    return () => clearTimeout(t);
  }, [show, handleClose]);

  if (!show) return null;

  return (
    <dialog className="admin-login-dialog menu-item-modal" open ref={dialogRef} onClick={backdropClick}>
      <button className="close-btn" onClick={(e) => { e.stopPropagation(); handleClose(); }}>&times;</button>
      <div className="dialog-body" style={{ textAlign: lang === 'ar' ? 'right' : 'left', direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <i className="fas fa-check-circle" style={{ color: '#4CAF50', fontSize: '48px', marginBottom: '8px' }}></i>
          <h2 style={{ color: '#4CAF50', marginBottom: '6px' }}>{lang === 'ar' ? 'تم إرسال الطلب بنجاح' : 'Order Placed Successfully!'}</h2>
          <p style={{ color: '#666', fontSize: '1rem' }}>{lang === 'ar' ? 'شكراً لطلبك' : 'Thank you for your order.'}</p>
        </div>
        <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
          {orderId && <p style={{ marginBottom: '8px', fontSize: '1.05rem' }}><strong>{lang === 'ar' ? 'رقم الطلب:' : 'Order ID:'}</strong> {orderId}</p>}
          <p style={{ marginBottom: '8px', fontSize: '1.05rem' }}><strong>{lang === 'ar' ? 'الإجمالي:' : 'Total:'}</strong> AED {total?.toFixed ? total.toFixed(2) : total}</p>
          {customerName && <p style={{ fontSize: '1.05rem' }}><strong>{lang === 'ar' ? 'العميل:' : 'Customer:'}</strong> {customerName}</p>}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); handleClose(); }} 
          className="btn-place"
        >
          {lang === 'ar' ? 'طلب جديد' : 'New Order'}
        </button>
      </div>
    </dialog>
  );
};

export default OrderSuccessModal;
