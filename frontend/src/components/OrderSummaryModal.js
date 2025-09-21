import React, { useRef } from 'react';

const OrderSummaryModal = ({ show, order = [], onClose, onRemoveItem, onChangeQuantity, onClearOrder, onPlaceOrder, lang }) => {
  const dialogRef = useRef(null);
  if (!show) return null;
  const total = order.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleClose = () => {
    const el = dialogRef.current;
    if (!el) return onClose && onClose();
    el.classList.add('closing');
    setTimeout(() => onClose && onClose(), 190);
  };

  const backdropClick = (e) => {
    if (e.target === dialogRef.current) handleClose();
  };

  return (
    <dialog className="admin-login-dialog menu-item-modal" open ref={dialogRef} onClick={backdropClick}>
      <button className="close-btn" onClick={(e) => { e.stopPropagation(); handleClose(); }}>&times;</button>
      <div className="dialog-header">
        <div>
          <div className="dialog-title">{lang === 'ar' ? 'ملخص الطلب' : 'Order Summary'}</div>
          <div className="dialog-subtitle">{lang === 'ar' ? 'راجع طلبك قبل الإرسال' : 'Review your order before placing'}</div>
        </div>
      </div>
      <div className="dialog-body">
        {order.length === 0 ? <p style={{ textAlign: 'center', color: '#666' }}>{lang === 'ar' ? 'السلة فارغة' : 'Your cart is empty'}</p> : (
          <ul className="modal-items">
            {order.map((item, idx) => (
              <li key={idx} className="item-row">
                <div className="item-left">
                  <div>
                    <div style={{ fontWeight: 700 }}>{(lang === 'ar' ? item.name_ar : item.name_en) || item.name}</div>
                    <div style={{ color: '#667085', marginTop: 4 }}>{lang === 'ar' ? 'الكمية' : 'Qty'}: {item.quantity}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="item-price">AED {(item.price * item.quantity).toFixed(2)}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={(e) => { e.stopPropagation(); onChangeQuantity(idx, 1); }} className="secondary-btn">+</button>
                    <button onClick={(e) => { e.stopPropagation(); onChangeQuantity(idx, -1); }} className="secondary-btn">-</button>
                    <button onClick={(e) => { e.stopPropagation(); onRemoveItem(idx); }} className="secondary-btn" style={{ borderColor: '#d32f2f', color: '#d32f2f' }}>{lang === 'ar' ? 'حذف' : 'Remove'}</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="total-row" style={{ marginTop: 12 }}>
          <div className="label">{lang === 'ar' ? 'المجموع' : 'Total'}</div>
          <div className="amount">AED {total.toFixed(2)}</div>
        </div>
      </div>
      <div className="dialog-footer">
  <button type="button" onClick={(e) => { e.stopPropagation(); onClearOrder && onClearOrder(); }} className="btn-clear">{lang === 'ar' ? 'افرغ السلة' : 'Clear Cart'}</button>
  <button type="button" onClick={(e) => { e.stopPropagation(); onPlaceOrder && onPlaceOrder(); }} disabled={!order.length} className="btn-place">{lang === 'ar' ? 'تقديم الطلب' : 'Place Order'}</button>
  <button type="button" onClick={(e) => { e.stopPropagation(); handleClose(); }} className="btn-close-light">{lang === 'ar' ? 'إغلاق' : 'Close'}</button>
      </div>
    </dialog>
  );
};

export default OrderSummaryModal;
