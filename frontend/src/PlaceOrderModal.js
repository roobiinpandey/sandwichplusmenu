
import React, { useState } from 'react';
export default function PlaceOrderModal({ show, order, lang, customerName, setCustomerName, notes, setNotes, onCancel, onConfirm, onRemoveItem, onChangeQuantity, onClearOrder, toast }) {
  const [localName, setLocalName] = useState(customerName || '');
  const [localNotes, setLocalNotes] = useState(notes || '');
  const [phone, setPhone] = useState('');
  const [nameError, setNameError] = useState(false);
  
  // Add CSS for shake animation
  React.useEffect(() => {
    if (!document.getElementById('shake-animation-style')) {
      const style = document.createElement('style');
      style.id = 'shake-animation-style';
      style.textContent = `
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);
  
  // Handle confirm with validation
  const handleConfirm = () => {
    const trimmedName = localName.trim();
    
    // Check if cart is empty
    if (order.length === 0) {
      alert(lang === 'ar' ? 'سلة التسوق فارغة' : 'Your cart is empty');
      return;
    }
    
    // Check if name is empty
    if (!trimmedName) {
      setNameError(true);
      // Focus the name input
      const nameInput = document.getElementById('po-name');
      if (nameInput) {
        nameInput.focus();
        // Add a subtle shake to the input
        nameInput.style.animation = 'shake 0.5s ease-in-out';
        setTimeout(() => {
          nameInput.style.animation = '';
        }, 500);
      }
      return;
    }
    
    setNameError(false);
    onConfirm({ customer: trimmedName, phone, notes: localNotes });
  };
  
  // Handle name change and clear error
  const handleNameChange = (e) => {
    const value = e.target.value;
    setLocalName(value);
    setCustomerName(value);
    if (nameError && value.trim()) {
      setNameError(false);
    }
  };
  if (!show) return null;
  const accentColor = '#2a5c45';
  const isFormValid = order.length > 0; // Always enable button if cart has items, validation on click
  return (
    <div className="modal fade-in" onClick={onCancel} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, background: 'rgba(0,0,0,0.18)' }}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ minWidth: 340, maxWidth: '95vw', background: '#fff', borderRadius: 22, boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: 0, overflow: 'hidden', position: 'relative', fontFamily: 'inherit' }}>
        {/* Header */}
        <div style={{ background: accentColor, color: '#fff', padding: '22px 36px', borderTopLeftRadius: 22, borderTopRightRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(42, 92, 69, 0.08)' }}>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.02em' }}>{lang === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'}</h2>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '2rem', fontWeight: 700, cursor: 'pointer', marginLeft: 12 }} aria-label="Close">×</button>
        </div>
        {/* Toast Notification inside modal, at top */}
        {toast && toast.show && toast.message && toast.context === 'placeOrder' && (
          <div className="toast" style={{ 
            margin: '18px 32px 0 32px', 
            background: toast.type === 'error' ? '#d32f2f' : '#323232', 
            color: '#fff', 
            padding: '12px 32px', 
            borderRadius: 10, 
            fontWeight: 700, 
            fontSize: '1.1rem', 
            opacity: 0.97, 
            textAlign: 'center', 
            minWidth: 180, 
            boxShadow: '0 2px 8px rgba(211,47,47,0.10)'
          }}>
            {toast.message}
          </div>
        )}
        <div className="dialog-body" style={{ padding: '28px 36px', background: '#f8f9fa' }}>
          {order.length === 0 ? (
            <div style={{ textAlign: 'center', margin: '24px 0', fontSize: '1.1rem', color: '#888' }}>{lang === 'ar' ? 'سلة التسوق فارغة' : 'Your cart is empty.'}</div>
          ) : (
            <>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {order.map((item, idx) => (
                  <li key={item.id + (item.size || '') + (item.breadDisplay || '')} style={{ marginBottom: 16, background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.04)', padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.08rem', marginBottom: 2 }}>{lang === 'ar' ? item.name_ar : item.name_en} {item.size ? `(${item.size})` : ''}</div>
                    {item.breadDisplay && (
                      <div style={{ fontSize: '0.9rem', color: '#666', fontStyle: 'italic', marginBottom: 4 }}>
                        🍞 {lang === 'ar' ? 'خبز:' : 'Bread:'} {item.breadDisplay}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: '1rem', color: accentColor, fontWeight: 700 }}>{lang === 'ar' ? 'الكمية:' : 'Qty:'} {item.quantity}</span>
                      <button onClick={() => onChangeQuantity(idx, 1)} style={{ padding: '6px 14px', fontSize: '1.08rem', fontWeight: 700, background: '#e6f4ea', color: accentColor, border: `1px solid ${accentColor}`, borderRadius: 6, cursor: 'pointer' }}>+</button>
                      <button onClick={() => onChangeQuantity(idx, -1)} style={{ padding: '6px 14px', fontSize: '1.08rem', fontWeight: 700, background: '#f8d7da', color: '#d32f2f', border: '1px solid #d32f2f', borderRadius: 6, cursor: 'pointer' }}>-</button>
                      <button onClick={() => onRemoveItem(idx)} style={{ padding: '6px 14px', color: '#d32f2f', background: '#fff', border: '1px solid #d32f2f', borderRadius: 6, fontWeight: 700, cursor: 'pointer' }}>Remove</button>
                    </div>
                    <div style={{ fontSize: '1rem', color: '#555', fontWeight: 600 }}>{lang === 'ar' ? 'السعر:' : 'Price:'} AED {item.price}</div>
                  </li>
                ))}
              </ul>
                {/* Removed duplicate Total, Clear Cart, and Confirm Order section here. Only customer details and confirm/cancel buttons at the bottom remain. */}
            </>
          )}
          <div className="total-row" style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.15rem', color: '#333' }}>
            <div className="label">Total</div>
            <div className="amount">AED {order.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</div>
          </div>
          <div style={{ marginTop: 22, background: '#fff', borderRadius: 12, boxShadow: '0 1px 6px rgba(0,0,0,0.04)', padding: '18px 20px' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: 12, color: accentColor }}>Customer Details</h3>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label htmlFor="po-name" style={{ fontWeight: 700, fontSize: '1rem', color: nameError ? '#d32f2f' : 'inherit' }}>
                Name {nameError && <span style={{ color: '#d32f2f' }}>*Required</span>}
              </label>
              <input 
                id="po-name"
                name="customerName"
                type="text"
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="words"
                placeholder={nameError ? "Please enter your name" : "Enter your name"}
                aria-label="Name"
                value={localName}
                onChange={handleNameChange}
                style={{
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: nameError ? '2px solid #d32f2f' : '1px solid #e6e6f0',
                  backgroundColor: nameError ? '#fff5f5' : 'white',
                  fontSize: '1rem',
                  marginTop: 2,
                  boxShadow: nameError ? '0 0 0 3px rgba(211, 47, 47, 0.1)' : 'none'
                }}
              />
            </div>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontWeight: 700, fontSize: '1rem' }}>Phone Number</label>
              <input id="po-phone" name="phone" type="tel" autoComplete="off" inputMode="tel" spellCheck={false} className="phone-input" maxLength={10} placeholder="Enter your number (05XXXXXXXX)" aria-invalid="false" value={phone} onChange={e => setPhone(e.target.value)} style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #e6e6f0', fontSize: '1rem', marginTop: 2 }} />
            </div>
            <div style={{ marginTop: 12 }}>
              <label style={{ fontWeight: 700, fontSize: '1rem' }}>Add Notes</label>
              <textarea id="po-notes" name="notes" autoComplete="off" placeholder="Add any special instructions (e.g. no onions)" style={{ width: '100%', minHeight: 80, padding: '10px 12px', borderRadius: 8, border: '1px solid #e6e6f0', marginTop: 8, fontSize: '1rem' }} value={localNotes} onChange={e => { setLocalNotes(e.target.value); setNotes(e.target.value); }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 28 }}>
            <button onClick={onCancel} style={{ background: '#eee', border: 'none', padding: '12px 28px', borderRadius: 10, fontWeight: 700, fontSize: '1.08rem', color: '#333', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>Cancel</button>
            <button 
              onClick={handleConfirm} 
              disabled={!isFormValid}
              style={{ 
                background: isFormValid ? accentColor : '#ccc', 
                color: '#fff', 
                border: 'none', 
                padding: '12px 28px', 
                borderRadius: 10, 
                fontWeight: 700, 
                fontSize: '1.08rem', 
                cursor: isFormValid ? 'pointer' : 'not-allowed', 
                boxShadow: isFormValid ? '0 2px 8px rgba(42, 92, 69, 0.10)' : 'none',
                opacity: isFormValid ? 1 : 0.6,
                transition: 'all 0.2s ease'
              }}
            >
              {lang === 'ar' ? 'تأكيد الطلب' : 'Confirm Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
