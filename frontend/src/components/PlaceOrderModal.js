import React, { useState, useRef, useEffect } from 'react';

const PlaceOrderModal = ({ show, order = [], lang, customerName, setCustomerName, onCancel, onConfirm, onRemoveItem, onChangeQuantity, onClearOrder, notes, setNotes }) => {
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [nameError, setNameError] = useState(false);
  const phoneRef = React.useRef(null);
  const notesRef = useRef(null);
  const dialogRef = useRef(null);
  useEffect(() => {
    if (show) setPhone(''); // Always clear phone input when modal opens
  }, [show]);
  if (!show) return null;
  const total = order.reduce((sum, it) => sum + it.price * it.quantity, 0).toFixed(2);
  const validatePhone = (value) => {
    // Must be 10 digits, start with 0, all digits
    return /^0\d{9}$/.test(value);
  };
  const handleClose = () => {
    const el = dialogRef.current;
    if (!el) return onCancel && onCancel();
    el.classList.add('closing');
    setTimeout(() => onCancel && onCancel(), 190);
  };
  const handleConfirm = () => {
    // Check if name is empty
    if (!customerName || !customerName.trim()) {
      setNameError(true);
      return;
    }
    
    if (order.length === 0) {
      setPhoneError(lang === 'ar' ? 'سلة الطلبات فارغة' : 'Your order is empty');
      return;
    }
    if (!validatePhone(phone)) {
      const message = lang === 'ar' ? 'رقم الهاتف يجب أن يكون 10 أرقام ويبدأ بـ 0' : 'Phone number must be exactly 10 digits and start with 0';
      setPhoneError(message);
      // log validation failure so user can see why confirm was blocked
      try { console.log('[DEBUG] PlaceOrderModal confirm blocked - invalid phone:', phone); } catch (e) {}
      // focus phone input to prompt correction
      setTimeout(() => phoneRef.current && phoneRef.current.focus(), 60);
      return;
    }
    setPhoneError('');
    setNameError(false);
  // Persist any notes from the textarea to parent state before confirming
  const currentNotes = notesRef.current ? notesRef.current.value : (notes || '');
  try { setNotes && setNotes(currentNotes); } catch (err) {}
  const payload = { customer: customerName, phone, notes: currentNotes };
  try { console.log('[DEBUG] PlaceOrderModal confirm payload', payload); } catch(e) {}
  onConfirm && onConfirm(payload);
  };
  const backdropClick = (e) => {
    // only close when clicking the backdrop (the dialog element itself)
    if (e.target === dialogRef.current) handleClose();
  };

  return (
    <dialog className="admin-login-dialog menu-item-modal" open ref={dialogRef} onClick={backdropClick}>
      <button className="close-btn" onClick={(e) => { e.stopPropagation(); handleClose(); }}>&times;</button>
      <div className="dialog-header">
        <div>
          <div className="dialog-title">{lang === 'ar' ? 'تأكيد الطلب' : 'Confirm Your Order'}</div>
          <div className="dialog-subtitle">{lang === 'ar' ? 'تفاصيل الطلب والمشتري' : 'Order & customer details'}</div>
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
                    <button onClick={(e) => { e.stopPropagation(); if (typeof onChangeQuantity === 'function') onChangeQuantity(idx, 1); }} className="secondary-btn">+</button>
                    <button onClick={(e) => { e.stopPropagation(); if (typeof onChangeQuantity === 'function') onChangeQuantity(idx, -1); }} className="secondary-btn">-</button>
                    <button onClick={(e) => { e.stopPropagation(); if (typeof onRemoveItem === 'function') onRemoveItem(idx); }} className="secondary-btn" style={{ borderColor: '#d32f2f', color: '#d32f2f' }}>{lang === 'ar' ? 'حذف' : 'Remove'}</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="total-row" style={{ marginTop: 12 }}>
          <div className="label">{lang === 'ar' ? 'الإجمالي' : 'Total'}</div>
          <div className="amount">AED {total}</div>
        </div>

        <div style={{ marginTop: 14 }}>
          <h3>{lang === 'ar' ? 'تفاصيل العميل' : 'Customer Details'}</h3>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontWeight: 700, color: nameError ? '#d32f2f' : 'inherit' }} htmlFor="po-name">{lang === 'ar' ? 'الاسم' : 'Name'}</label>
            <input 
              id="po-name" 
              name="customerName" 
              type="text" 
              autoComplete="off" 
              spellCheck={false} 
              autoCapitalize="words" 
              value={customerName} 
              onChange={e => {
                setCustomerName(e.target.value);
                if (nameError && e.target.value.trim()) {
                  setNameError(false);
                }
              }} 
              placeholder={nameError ? "Please enter your name" : (lang === 'ar' ? 'أدخل اسمك' : 'Enter your name')} 
              aria-label={lang === 'ar' ? 'الاسم' : 'Name'} 
              style={{
                border: nameError ? '2px solid #d32f2f' : '1px solid #e6e6f0',
                backgroundColor: nameError ? '#fff5f5' : 'white',
                padding: '8px 12px',
                borderRadius: '6px'
              }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); } }} 
            />
          </div>
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontWeight: 700 }}>{lang === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
            <input
              id="po-phone"
              name="phone"
              ref={phoneRef}
              type="tel"
              autoComplete="off"
              inputMode="tel"
              spellCheck={false}
              className={`phone-input ${phoneError ? 'aria-invalid' : ''}`}
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
              maxLength={10}
              placeholder={lang === 'ar' ? 'أدخل رقمك (05XXXXXXXX)' : 'Enter your number (05XXXXXXXX)'}
              aria-invalid={!!phoneError}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); } }}
            />
            {phoneError && <div style={{ color: '#d32f2f', marginTop: 6, fontWeight: 600 }}>{phoneError}</div>}
          </div>
        
        <div style={{ marginTop: 12 }}>
          <label style={{ fontWeight: 700 }}>{lang === 'ar' ? 'ملاحظات' : 'Add Notes'}</label>
            {/* Use uncontrolled textarea to avoid controlled-update blocking; persist on blur */}
      <textarea
                id="po-notes"
                name="notes"
                ref={notesRef}
        autoComplete="off"
              defaultValue={notes || ''}
              onBlur={(e) => { try { setNotes && setNotes(e.target.value); } catch (err) {} }}
              placeholder={lang === 'ar' ? 'أضف ملاحظة خاصة (مثلاً: لا بصل)' : 'Add any special instructions (e.g. no onions)'}
              style={{ width: '100%', minHeight: 80, padding: '10px 12px', borderRadius: 8, border: '1px solid #e6e6f0', marginTop: 8 }}
            />
        </div>
        </div>
      </div>
      <div className="dialog-footer">
  <button type="button" onClick={(e) => { e.stopPropagation(); handleConfirm(); }} className="btn-place" disabled={!order.length}>{lang === 'ar' ? 'تأكيد' : 'Confirm'}</button>
  <button type="button" onClick={(e) => { e.stopPropagation(); handleClose(); }} className="btn-close-light">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
      </div>
    </dialog>
  );
};

export default PlaceOrderModal;
