import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { jsPDF } from "jspdf";
import './Dashboard.css';
import './AdminDashboard.css';

function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('today');
  const [customDate, setCustomDate] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  
  // Store operation state
  const [storeOpen, setStoreOpen] = useState(() => {
    const saved = localStorage.getItem('storeOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [openTime, setOpenTime] = useState(() => {
    return localStorage.getItem('storeOpenTime') || '07:30';
  });
  const [closeTime, setCloseTime] = useState(() => {
    return localStorage.getItem('storeCloseTime') || '22:00';
  });
  
  // Edit time modal state
  const [showEditTimeModal, setShowEditTimeModal] = useState(false);
  const [tempOpenTime, setTempOpenTime] = useState('');
  const [tempCloseTime, setTempCloseTime] = useState('');
  
  // Sync store status with backend
  const updateStoreStatus = async (newStatus) => {
    try {
      await axios.post('/store/status', {
        isOpen: newStatus.isOpen !== undefined ? newStatus.isOpen : storeOpen,
        openTime: newStatus.openTime || openTime,
        closeTime: newStatus.closeTime || closeTime
      });
    } catch (error) {
      console.error('Failed to update store status:', error);
    }
  };

  // Load store status from backend on component mount
  useEffect(() => {
    const loadStoreStatus = async () => {
      try {
        const response = await axios.get('/store/status');
        const status = response.data;
        setStoreOpen(status.isOpen);
        setOpenTime(status.openTime);
        setCloseTime(status.closeTime);
        localStorage.setItem('storeOpen', JSON.stringify(status.isOpen));
        localStorage.setItem('storeOpenTime', status.openTime);
        localStorage.setItem('storeCloseTime', status.closeTime);
      } catch (error) {
        console.error('Failed to load store status:', error);
      }
    };
    loadStoreStatus();
  }, []);
  
  // Handle edit time modal
  const handleEditTime = () => {
    setTempOpenTime(openTime);
    setTempCloseTime(closeTime);
    setShowEditTimeModal(true);
  };

  const handleSaveTime = async () => {
    setOpenTime(tempOpenTime);
    setCloseTime(tempCloseTime);
    localStorage.setItem('storeOpenTime', tempOpenTime);
    localStorage.setItem('storeCloseTime', tempCloseTime);
    await updateStoreStatus({ openTime: tempOpenTime, closeTime: tempCloseTime });
    setShowEditTimeModal(false);
  };

  const handleCancelEdit = () => {
    setShowEditTimeModal(false);
    setTempOpenTime('');
    setTempCloseTime('');
  };

  const formatTimeDisplay = (time) => {
    const [hours, minutes] = time.split(':');
    const hour12 = parseInt(hours) % 12 || 12;
    const ampm = parseInt(hours) >= 12 ? 'PM' : 'AM';
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  const [downloadMsg] = useState('');
  const [newOrderIds, setNewOrderIds] = useState([]);
  const [newOrderToastIds, setNewOrderToastIds] = useState([]);
  const [actionMsg, setActionMsg] = useState('');
  const [newOrderAnim, setNewOrderAnim] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const closeOrderDialog = () => {
    const dlg = orderDialogRef.current;
    if (dlg) { dlg.classList.add('closing'); setTimeout(() => setSelectedOrder(null), 180); } else setSelectedOrder(null);
  };

  const markCompleted = (orderId) => {
    axios.patch(`/orders/${orderId}`, { status: 'completed' })
      .then(() => {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'completed' } : o));
        setNewOrderIds(ids => ids.filter(id => id !== orderId));
        setNewOrderToastIds(ids => ids.filter(id => id !== orderId));
        if (selectedOrder && selectedOrder._id === orderId) setSelectedOrder(prev => prev ? { ...prev, status: 'completed' } : prev);
      })
      .catch(err => {
        setActionMsg('Failed to mark order as completed. Please try again.');
        setTimeout(() => setActionMsg(''), 2500);
        console.error('Failed to mark completed', err);
      });
  };
  const orderDialogRef = useRef(null);
  const prevOrderIds = useRef([]);

  useEffect(() => {
    const fetchOrders = () => {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      // Add debug logging
      console.log('[Dashboard] Fetching orders...', new Date().toLocaleTimeString());
      
      // Always request all orders, not just today's
      axios.get('/orders?all=true', { headers }).then(res => {
        // ensure newest-first by time
        const sorted = (res.data || []).slice().sort((a, b) => new Date(b.time) - new Date(a.time));
        setOrders(sorted);
        const ids = (res.data || []).map(o => o._id);
        
        console.log('[Dashboard] Current orders:', ids.length, 'Previous:', prevOrderIds.current.length);
        
        if (prevOrderIds.current.length && ids.length > prevOrderIds.current.length) {
          const added = ids.filter(id => !prevOrderIds.current.includes(id));
          if (added.length) {
            console.log('[Dashboard] New orders detected:', added);
            setNewOrderIds(ids => [...ids, ...added]);
            setNewOrderToastIds(ids => [...ids, ...added]);
          }
          setNewOrderAnim(true);
          setTimeout(() => setNewOrderAnim(false), 1200);
        }
        prevOrderIds.current = ids;
      }).catch(err => {
        setActionMsg('Failed to fetch orders. Please check your connection.');
        setTimeout(() => setActionMsg(''), 2500);
        console.error('Failed to fetch orders', err);
      });
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, []);

  const filterOrders = (orders) => {
    const now = new Date();
    return orders.filter(order => {
      if (!order.time) return false;
      const orderDateStr = new Date(order.time).toISOString().slice(0,10);
      if (orderFilter === 'today') return orderDateStr === now.toISOString().slice(0,10);
      if (orderFilter === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return orderDateStr === yesterday.toISOString().slice(0,10);
      }
      if (orderFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return orderDateStr >= weekAgo.toISOString().slice(0,10) && orderDateStr <= now.toISOString().slice(0,10);
      }
      if (orderFilter === 'month') return orderDateStr.slice(0,7) === now.toISOString().slice(0,7);
      if (orderFilter === 'custom' && customDate) return orderDateStr === customDate;
      return true;
    });
  };

  const processOrders = (orders) => {
    let filtered = filterOrders(orders);
    if (orderStatusFilter !== 'all') {
      filtered = filtered.filter(order => {
        // Normalize status to lowercase, fallback to 'pending' if missing
        const status = (order.status || 'pending').toLowerCase();
        return status === orderStatusFilter.toLowerCase();
      });
    }
    return filtered;
  };

  const downloadSalesReport = () => {
    const filteredOrders = filterOrders(orders);
    const doc = new jsPDF();
  // Title, logo/icon, and subtitle
  doc.setFontSize(22);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(40, 120, 60);
  // Simple sandwich icon (circle + rectangle)
  doc.circle(10, 15, 6, 'F');
  doc.setFillColor(255, 220, 120);
  doc.rect(6, 15, 8, 4, 'F');
  doc.setTextColor(40, 120, 60);
  doc.text('Sandwich Plus', 22, 18);
  doc.setFontSize(16);
  doc.setTextColor(30, 30, 30);
  doc.text('Sales Report', 22, 28);
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    let reportDate;
    if (customDate) {
      reportDate = new Date(customDate).toLocaleDateString();
    } else {
      reportDate = new Date().toLocaleDateString();
    }
  doc.setFontSize(12);
  const downloadTime = new Date().toLocaleTimeString();
  doc.text(`Date: ${reportDate}   Time: ${downloadTime}`, 170, 18, { align: 'right' });
  // Summary section
  doc.setFontSize(13);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(80, 80, 80);
  doc.text('Summary of sales for the selected day', 22, 38);
  doc.setFont(undefined, 'normal');
  // Table headers with colored backgrounds
  const headers = ['Order No.', 'Customer', 'Total (AED)', 'Status', 'Time'];
  let startY = 52;
  // Calculate summary stats
  const totalOrders = filteredOrders.length;
  const totalSales = filteredOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const avgSale = totalOrders ? (totalSales / totalOrders) : 0;
  doc.setFontSize(12);
  doc.setTextColor(40, 120, 60);
  doc.text(`Total Orders: ${totalOrders}`, 22, startY);
  doc.setTextColor(40, 80, 120);
  doc.text(`Average Sale: AED ${avgSale.toFixed(2)}`, 80, startY);
  doc.setTextColor(30, 30, 30);
  startY += 10;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(14, startY - 4, 195, startY - 4);
  // Draw colored rectangles for each column header
  doc.setFillColor(255, 235, 205); // Order No. - light orange
  doc.rect(14, startY - 6, 32, 10, 'F');
  doc.setFillColor(220, 240, 255); // Customer - light blue
  doc.rect(46, startY - 6, 54, 10, 'F');
  doc.setFillColor(220, 255, 220); // Total - light green
  doc.rect(100, startY - 6, 28, 10, 'F');
  doc.setFillColor(255, 220, 240); // Status - light pink
  doc.rect(128, startY - 6, 28, 10, 'F');
  doc.setFillColor(255, 245, 200); // Time - light yellow
  doc.rect(156, startY - 6, 39, 10, 'F');
  // Header text
  doc.setFont(undefined, 'bold');
  doc.setTextColor(120, 80, 40);
  doc.text(headers[0], 16, startY);
  doc.setTextColor(40, 80, 120);
  doc.text(headers[1], 48, startY);
  doc.setTextColor(40, 120, 60);
  doc.text(headers[2], 102, startY);
  doc.setTextColor(160, 60, 100);
  doc.text(headers[3], 130, startY);
  doc.setTextColor(160, 120, 40);
  doc.text(headers[4], 158, startY);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(30, 30, 30);
  startY += 12;
    filteredOrders.forEach((order, idx) => {
      const orderId = order.orderNumber || order.id || order._id;
      // Format time
      let orderTime = '';
      if (order.time) {
        const d = new Date(order.time);
        orderTime = d.toLocaleTimeString();
      }
      // Alternate row background
      if (idx % 2 === 0) {
        doc.setFillColor(255, 255, 245);
        doc.rect(14, startY - 7, 181, 11, 'F');
      }
      // Table row with colored columns
      doc.setTextColor(120, 80, 40);
      doc.text(String(orderId), 16, startY);
      doc.setTextColor(40, 80, 120);
      doc.text(String(order.customer || ''), 48, startY);
      doc.setTextColor(40, 120, 60);
      doc.text(String(Number(order.total).toFixed(2)), 102, startY);
      doc.setTextColor(160, 60, 100);
      doc.text(String(order.status || ''), 130, startY);
      doc.setTextColor(160, 120, 40);
      doc.text(orderTime, 158, startY);
      doc.setTextColor(30, 30, 30);
      doc.setDrawColor(240, 240, 240);
      doc.line(14, startY + 3, 195, startY + 3);
      startY += 10;
      if (startY > 270) {
        doc.addPage();
        startY = 20;
      }
    });
  // Show total sales at the end
  startY += 10;
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(40, 120, 60);
  doc.setDrawColor(23, 108, 58);
  doc.setLineWidth(1.5);
  doc.line(14, startY - 8, 195, startY - 8);
  doc.text(`Total Sales: AED ${totalSales.toFixed(2)}`, 14, startY, { align: 'left' });
  // Footer removed as requested
  doc.save('sales_report.pdf');
  };

  const buttonStyle = {
    fontWeight: 700,
    fontSize: '1.1rem',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(76,175,80,0.15)',
    transition: 'all 0.2s ease',
    padding: '8px 12px',
    borderRadius: 8,
    border: 'none',
    background: 'var(--white)',
    color: 'var(--primary)'
  };
  const activeButtonStyle = {
    ...buttonStyle,
    background: 'var(--accent)',
    color: 'var(--white)',
    boxShadow: '0 2px 8px rgba(42,92,69,0.15)',
  };

  return (
    <div className={`admin-dashboard${newOrderAnim ? ' new-order-anim' : ''}`}>
      {/* Store Operation Hour & Toggle */}
      <div style={{
        marginTop: '100px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        justifyContent: 'center',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        padding: '18px 32px',
        fontWeight: 600
      }}>
        <label style={{ fontWeight: 700 }}>Store Operation Hours:</label>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          background: '#f8f9fa',
          padding: '10px 16px',
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <span style={{ fontWeight: 600, color: '#2a5c45' }}>
            {formatTimeDisplay(openTime)} - {formatTimeDisplay(closeTime)}
          </span>
          <button
            onClick={handleEditTime}
            style={{
              padding: '6px 12px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            ✏️ Edit Time
          </button>
        </div>
        
        {/* ON/OFF Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '18px' }}>
          <span style={{ fontWeight: 700, color: storeOpen ? '#2a5c45' : '#666' }}>
            {storeOpen ? 'STORE OPEN' : 'STORE CLOSED'}
          </span>
          <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
            <input 
              type="checkbox" 
              checked={storeOpen}
              onChange={(e) => {
                const newStatus = e.target.checked;
                setStoreOpen(newStatus);
                localStorage.setItem('storeOpen', JSON.stringify(newStatus));
                updateStoreStatus({ isOpen: newStatus });
              }}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              cursor: 'pointer',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: storeOpen ? '#2a5c45' : '#ccc',
              transition: '0.4s',
              borderRadius: '34px',
            }}>
              <span style={{
                position: 'absolute',
                content: '',
                height: '26px',
                width: '26px',
                left: storeOpen ? '30px' : '4px',
                bottom: '4px',
                backgroundColor: 'white',
                transition: '0.4s',
                borderRadius: '50%'
              }}></span>
            </span>
          </label>
        </div>
      </div>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: 'var(--primary)', color: 'var(--white)', padding: '10px 0', textAlign: 'center', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)', zIndex: 100 }}>
        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.6rem', color: 'var(--light)', textShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'inline-block' }}>Admin Dashboard</h1>
        <div style={{ position: 'absolute', right: 20, top: 10, display: 'flex', gap: 8, alignItems: 'center', zIndex: 120 }}>
          <button onClick={downloadSalesReport} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: 'var(--secondary)', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>
            <span role="img" aria-label="download" style={{ marginRight: '6px' }}>📄</span>
            Download
          </button>
          {/* cashier header: no admin controls */}
        </div>
      </div>
      {downloadMsg && (
        <div style={{ position: 'fixed', top: 64, right: 20, background: 'rgba(0,0,0,0.8)', color: '#fff', padding: '8px 12px', borderRadius: 8, zIndex: 130 }}>
          {downloadMsg}
        </div>
      )}
      {actionMsg && (
        <div className="action-msg" style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', background: 'rgba(220,53,69,0.95)', color: '#fff', padding: '10px 18px', borderRadius: 8, zIndex: 9999, fontWeight: 700, fontSize: '1.1rem', boxShadow: '0 2px 8px rgba(220,53,69,0.15)' }}>
          {actionMsg}
        </div>
      )}
      {newOrderToastIds.length > 0 && (
        <div 
          className="new-order-toast" 
          onClick={() => {
            setNewOrderToastIds([]);
            setNewOrderAnim(false);
          }}
          style={{
          position: 'fixed',
          top: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(90deg,#ffb347,#ffcc80 80%)',
          color: '#222',
          padding: '16px 36px',
          borderRadius: 16,
          zIndex: 99999,
          fontWeight: 900,
          fontSize: '1.25rem',
          boxShadow: '0 6px 24px rgba(255,179,71,0.18)',
          letterSpacing: '1.5px',
          textShadow: '0 2px 8px rgba(255,179,71,0.10)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          border: '2px solid #ffb347',
          animation: 'popBell 1.2s cubic-bezier(.68,-0.55,.27,1.55)',
          cursor: 'pointer'
        }}>
          <span style={{ fontSize: '2.2rem', animation: 'ringBell 1.2s infinite' }} role="img" aria-label="bell">🔔</span>
          <span>New order received! (Click to dismiss)</span>
        </div>
      )}
      {/* Add bell ring animation and sound effect */}
      <style>{`
        @keyframes ringBell {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(-20deg); }
          20% { transform: rotate(15deg); }
          30% { transform: rotate(-10deg); }
          40% { transform: rotate(5deg); }
          50% { transform: rotate(-3deg); }
          60% { transform: rotate(2deg); }
          70% { transform: rotate(-1deg); }
          80% { transform: rotate(1deg); }
          90% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes popBell {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.08); opacity: 1; }
          80% { transform: scale(0.98); }
          100% { transform: scale(1); }
        }
      `}</style>
      {/* Play sound effect when new order arrives */}
      {newOrderToastIds.length > 0 && (
        <audio autoPlay src="https://cdn.jsdelivr.net/gh/roobiin/sounds/bell.mp3" style={{ display: 'none' }} />
      )}
      {selectedOrder && (
        <>
          <div className="order-dialog-blur" />
          <dialog open className="order-details-dialog" aria-modal="true" ref={orderDialogRef} onClick={closeOrderDialog}>
            <form method="dialog" onClick={e => e.stopPropagation()} style={{ padding: 0, width: '100%', position: 'relative' }}>
              <div className="order-dialog-card">
                <div className="order-dialog-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="order-dialog-title">Order Details</div>
                    <div className="order-dialog-badge">{(function(){ if (selectedOrder.orderNumber) { const p = String(selectedOrder.orderNumber).split('-'); if (p.length===2) { const seq = p[0]; return `${seq}` } return selectedOrder.orderNumber } return selectedOrder._id.slice(0,3) })()}</div>
                  </div>
                  <button className="order-dialog-close" type="button" onClick={closeOrderDialog} aria-label="Close">✕</button>
                </div>
                <div className="order-dialog-body">
                  <div className="order-dialog-row"><strong>Customer:</strong> <span>{selectedOrder.customer || '—'}</span></div>
                  <div className="order-dialog-row"><strong>Phone:</strong> <span>{selectedOrder.phone || selectedOrder.customerPhone || '—'}</span></div>
                  {selectedOrder.notes && (
                    <div className="order-dialog-row"><strong>Notes:</strong> <span style={{ color: '#a63a00', fontWeight: 700 }}>{selectedOrder.notes}</span></div>
                  )}
                  <div className="order-dialog-row" style={{ marginTop: 10 }}><strong>Items:</strong></div>
                  <ul className="order-dialog-items">
                    {selectedOrder.items && selectedOrder.items.map((it, idx) => (
                      <li key={idx} className="order-dialog-item">
                        {it.name_en || it.name || it.id} x {it.quantity || 1}
                        {/* Show bread selection if available */}
                        {it.breadDisplay && (
                          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px', fontStyle: 'italic' }}>
                            Bread: {it.breadDisplay}
                          </div>
                        )}
                        {/* Show size if available */}
                        {it.size && (
                          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '2px', fontStyle: 'italic' }}>
                            Size: {it.size}
                          </div>
                        )}
                        <span className="order-dialog-item-price">AED {Number(it.price || it.unitPrice || 0).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="order-dialog-row order-dialog-total"><strong>Total:</strong> <span>AED {Number(selectedOrder.total || 0).toFixed(2)}</span></div>
                </div>
                <div className="order-dialog-footer">
                  <button type="button" className="order-dialog-close-btn" onClick={closeOrderDialog}>Close</button>
                </div>
              </div>
            </form>
          </dialog>
        </>
      )}
      <div style={{ marginTop: '80px', padding: '20px' }}>
        <div style={{
          marginBottom: '32px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '18px',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--white)',
          borderRadius: '16px',
          boxShadow: '0 4px 18px rgba(76,175,80,0.10)',
          padding: '24px 18px',
        }}>
          <button style={orderFilter === 'today' ? activeButtonStyle : buttonStyle} onClick={() => setOrderFilter('today')}>Today</button>
          <button style={orderFilter === 'yesterday' ? activeButtonStyle : buttonStyle} onClick={() => setOrderFilter('yesterday')}>Yesterday</button>
          <button style={orderFilter === 'week' ? activeButtonStyle : buttonStyle} onClick={() => setOrderFilter('week')}>This Week</button>
          <button style={orderFilter === 'month' ? activeButtonStyle : buttonStyle} onClick={() => setOrderFilter('month')}>This Month</button>
          <input id="custom-date" type="date" value={customDate} onChange={e => { setCustomDate(e.target.value); setOrderFilter('custom'); }} style={{ ...buttonStyle, padding: '8px 16px', width: '220px', color: 'var(--primary)', background: 'var(--white)', border: '2px solid var(--accent)', fontSize: '1.1rem', borderRadius: '8px', boxShadow: '0 2px 8px rgba(76,175,80,0.10)' }} />
        </div>
        <div style={{ marginBottom: '24px', display: 'flex', gap: '14px', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <button style={orderStatusFilter === 'all' ? activeButtonStyle : buttonStyle} onClick={() => setOrderStatusFilter('all')}>All Orders</button>
            <button style={orderStatusFilter === 'pending' ? activeButtonStyle : buttonStyle} onClick={() => setOrderStatusFilter('pending')}>Pending Orders</button>
            <button style={orderStatusFilter === 'completed' ? activeButtonStyle : buttonStyle} onClick={() => setOrderStatusFilter('completed')}>Completed Orders</button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* download button moved to header */}
          </div>
        </div>
        <div className="orders-header">
          <h2>Recent Orders</h2>
        </div>
        <div className="orders-grid">
          {processOrders(orders).map(order => (
            <div key={order._id} className={`order-card ${order.status || ''} ${(newOrderIds.includes(order._id) && (order.status || '').toLowerCase() !== 'completed') ? 'new-order' : ''}`}
              style={
                (newOrderIds.includes(order._id) && (order.status || '').toLowerCase() !== 'completed')
                  ? {
                      boxShadow: '0 0 0 4px #ffb347, 0 4px 18px rgba(255,179,71,0.10)',
                      border: '2px solid #ffb347',
                      background: 'linear-gradient(90deg,#fffbe6,#ffecd2 80%)'
                    }
                  : {}
              }
            >
              {/* ...existing order card content... */}
              <div className="order-info">
                <div className="order-id">
                  Order No: {
                    (function() {
                      if (order.orderNumber) {
                        // expected backend format: "NNN-YYYYMMDD"
                        const parts = String(order.orderNumber).split('-');
                        if (parts.length === 2) {
                          const seq = parts[0];
                          const ymd = parts[1];
                          if (ymd.length === 8) {
                            const yyyy = ymd.slice(0,4);
                            const mm = ymd.slice(4,6);
                            const dd = ymd.slice(6,8);
                            return `${seq}-${dd}/${mm}/${yyyy}`;
                          }
                        }
                        return order.orderNumber;
                      }
                      // fallback: format from time to dd/mm/yyyy and use short seq placeholder
                      if (order.time) {
                        const d = new Date(order.time);
                        const dd = String(d.getDate()).padStart(2,'0');
                        const mm = String(d.getMonth()+1).padStart(2,'0');
                        const yyyy = d.getFullYear();
                        return `${order._id.slice(0,6)}-${dd}/${mm}/${yyyy}`;
                      }
                      return order._id;
                    })()
                  }
                </div>
                <div className="order-date">{new Date(order.time).toLocaleString()}</div>
                <div className={`order-status ${order.status}`}>{order.status}</div>
              </div>
              <div className="order-details">
                <div className="order-items">
                  {order.items.map(item => {
                    const isDrink = item.category && (item.category.toLowerCase().includes('drink') || item.category.toLowerCase().includes('hot') || item.category.toLowerCase().includes('cold'));
                    const validSizes = ['small','medium','large'];
                    const showSize = isDrink && item.size && validSizes.includes(item.size.toLowerCase());
                    return (
                      <div key={item.id} className="order-item">
                        {item.name_en}
                        {showSize ? <span style={{ color: '#888', fontSize: '0.95em' }}> ({item.size})</span> : null}
                        {/* Show bread selection if available */}
                        {item.breadDisplay && (
                          <span style={{ color: '#d32f2f', fontSize: '0.9em', fontWeight: '600', marginLeft: '8px' }}>
                            [Bread: {item.breadDisplay}]
                          </span>
                        )}
                        x {item.quantity}
                        {showSize && item.price ? <span style={{ marginLeft: 8, color: '#2a8d6d', fontWeight: 600 }}>AED {Number(item.price).toFixed(2)}</span> : null}
                      </div>
                    );
                  })}
                </div>
                <div className="order-total">
                  Total: AED {order.total.toFixed(2)}
                </div>
              </div>
              <div className="order-actions">
                {(order.status || '').toLowerCase() !== 'completed' && (
                  <button className="mark-completed-btn" onClick={() => markCompleted(order._id)}>
                    Mark as Completed
                  </button>
                )}
                <button className="view-details-btn" onClick={async () => {
                  try {
                    // Prefer singular endpoint that worked in this environment
                    try {
                      const resSingle = await axios.get(`/order/${order._id}`);
                      const single = resSingle && resSingle.data ? { ...resSingle.data, notes: (resSingle.data.notes || resSingle.data.note || '') } : null;
                      if (single) { setSelectedOrder(single); return; }
                    } catch (errSing) {
                      console.debug('GET /order/:id failed, trying plural endpoint', errSing && errSing.message);
                    }

                    try {
                      const resPlural = await axios.get(`/orders/${order._id}`);
                      const single = resPlural && resPlural.data ? { ...resPlural.data, notes: (resPlural.data.notes || resPlural.data.note || '') } : null;
                      if (single) { setSelectedOrder(single); return; }
                    } catch (errPlural) {
                      console.debug('GET /orders/:id failed, falling back to date fetch', errPlural && errPlural.message);
                    }

                    const res = await axios.get('/orders', { params: { date: order.orderDate } });
                    const foundRaw = (res.data || []).find(o => o._id === order._id);
                    const found = foundRaw ? { ...foundRaw, notes: (foundRaw.notes || foundRaw.note || '') } : null;
                    setSelectedOrder(found || { ...order, notes: (order.notes || order.note || '') });
                  } catch (err) {
                    console.error('Failed to fetch order details, falling back to local copy', err);
                    setSelectedOrder({ ...order, notes: (order.notes || order.note || '') });
                  }
                }}>
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
        
      </div>
      
      {/* Edit Time Modal */}
      {showEditTimeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2a5c45', fontWeight: 700 }}>
              Edit Store Operation Hours
            </h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Opening Time:
              </label>
              <input
                type="time"
                value={tempOpenTime}
                onChange={(e) => setTempOpenTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontWeight: 600 }}>
                Closing Time:
              </label>
              <input
                type="time"
                value={tempCloseTime}
                onChange={(e) => setTempCloseTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '16px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTime}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#2a5c45',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}

export default Dashboard;

