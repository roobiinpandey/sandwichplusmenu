import React, { useState } from 'react';

export default function ConfirmModal({ show, title = 'Confirm', message, onCancel, onConfirm, confirmLabel = 'Confirm', cancelLabel = 'Cancel', reassignOptions = null }) {
  const [reassignTo, setReassignTo] = useState('');
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', left: 0, right: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.35)', zIndex: 3000 }}>
      <div style={{ width: 520, background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
        <h3 id="confirm-title" style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ color: '#333' }}>{message}</p>
        {Array.isArray(reassignOptions) && reassignOptions.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#666' }}>Reassign affected items to:</label>
            <select value={reassignTo} onChange={e => setReassignTo(e.target.value)} style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd', width: '100%' }}>
              <option value="">(clear category)</option>
              {reassignOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button onClick={onCancel} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #ddd', background: '#fff' }}>{cancelLabel}</button>
          <button onClick={() => onConfirm(reassignTo)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#e53e3e', color: '#fff', fontWeight: 700 }}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
