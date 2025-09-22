import React from 'react';

const RestoreCartModal = ({ show, onClose, cartHistory, onRestore, lang }) => {
  if (!show) return null;

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString(lang === 'ar' ? 'ar' : 'en', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionText = (action) => {
    const actions = {
      add: lang === 'ar' ? 'إضافة منتج' : 'Added item',
      remove: lang === 'ar' ? 'حذف منتج' : 'Removed item',
      increase: lang === 'ar' ? 'زيادة الكمية' : 'Increased quantity',
      decrease: lang === 'ar' ? 'تقليل الكمية' : 'Decreased quantity',
      clear: lang === 'ar' ? 'مسح العربة' : 'Cleared cart',
      restore: lang === 'ar' ? 'استعادة العربة' : 'Restored cart'
    };
    return actions[action] || action;
  };

  const getActionColor = (action) => {
    const colors = {
      add: '#4CAF50',
      remove: '#F44336',
      increase: '#2196F3',
      decrease: '#FF9800',
      clear: '#9C27B0',
      restore: '#607D8B'
    };
    return colors[action] || '#666';
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#fff',
        borderRadius: '12px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#2a5c45'
          }}>
            {lang === 'ar' ? 'استعادة العربة' : 'Restore Cart'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#999',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '20px 24px'
        }}>
          {cartHistory.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: '#999'
            }}>
              {lang === 'ar' ? 'لا توجد سجلات لاستعادة العربة' : 'No cart history available'}
            </div>
          ) : (
            <div>
              <p style={{
                margin: '0 0 16px 0',
                color: '#666',
                fontSize: '0.9rem'
              }}>
                {lang === 'ar' 
                  ? 'اختر نقطة زمنية لاستعادة العربة إليها:' 
                  : 'Select a point in time to restore your cart:'}
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {cartHistory.map((entry) => (
                  <div
                    key={entry.id}
                    style={{
                      border: '1px solid #e0e0e0',
                      borderRadius: '8px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: '#fafafa'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f0f0f0';
                      e.target.style.borderColor = '#2a5c45';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#fafafa';
                      e.target.style.borderColor = '#e0e0e0';
                    }}
                    onClick={() => onRestore(entry)}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: '#333',
                          marginBottom: '4px'
                        }}>
                          {formatTimestamp(entry.timestamp)}
                        </div>
                        <div style={{
                          display: 'inline-block',
                          backgroundColor: getActionColor(entry.action),
                          color: '#fff',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}>
                          {getActionText(entry.action)}
                        </div>
                      </div>
                      <div style={{
                        textAlign: lang === 'ar' ? 'left' : 'right',
                        fontSize: '0.85rem',
                        color: '#666'
                      }}>
                        <div>
                          {entry.totalItems} {lang === 'ar' ? 'منتج' : 'items'}
                        </div>
                        <div style={{ fontWeight: '600', color: '#2a5c45' }}>
                          {lang === 'ar' ? 'ر.س' : 'SAR'} {entry.totalPrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    
                    {entry.cart.length > 0 && (
                      <div style={{
                        fontSize: '0.8rem',
                        color: '#888',
                        borderTop: '1px solid #e8e8e8',
                        paddingTop: '8px',
                        marginTop: '8px'
                      }}>
                        <strong>{lang === 'ar' ? 'المنتجات:' : 'Items:'}</strong>{' '}
                        {entry.cart.map(item => 
                          `${lang === 'ar' ? item.name_ar : item.name_en} (${item.quantity}x)`
                        ).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #f0f0f0',
          textAlign: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '10px 24px',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            {lang === 'ar' ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestoreCartModal;