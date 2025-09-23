import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import MenuItemModal from './components/MenuItemModal';
import { notificationService } from './services/OrderNotificationService';

function Dashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [newOrderIds, setNewOrderIds] = useState([]);
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [newMenuItem, setNewMenuItem] = useState({
    name_en: '',
    name_ar: '',
    price: '',
    category: '',
    description_en: '',
    description_ar: '',
    imageFile: null,
    images: []
  });
  const [view, setView] = useState('orders');
  const prevOrderIds = useRef([]);
  const [newOrderAnim, setNewOrderAnim] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Notification settings
  const [soundNotifications, setSoundNotifications] = useState(true);
  const [notificationVolume, setNotificationVolume] = useState(0.7);

  // Helper for status badge styling (use normalized lowercase)
  const statusColor = (status) => {
    if (!status) return '';
    const s = status.toString().toLowerCase();
    if (s === 'completed') return 'badge-completed';
    if (s === 'pending' || s === 'new') return 'badge-new';
    return 'badge-other';
  };

  const markCompleted = (orderId) => {
    axios.patch(`/orders/${orderId}`, { status: 'completed' })
      .then(() => {
        setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'completed' } : o));
        setNewOrderIds(ids => ids.filter(id => id !== orderId));
        if (selectedOrder && selectedOrder._id === orderId) setSelectedOrder(prev => ({ ...prev, status: 'completed' }));
      })
      .catch(err => console.error('Failed to mark completed', err));
  };

  // Menu helpers (minimal implementations)
  const refreshMenu = () => {
    axios.get('/menu').then(res => {
      const cats = (res.data && res.data.categories) ? res.data.categories.map(c=>c.name_en) : [];
      setCategories(cats);
      const items = [];
      if (res.data && Array.isArray(res.data.categories)) {
        res.data.categories.forEach(cat => {
          if (Array.isArray(cat.items)) cat.items.forEach(it => items.push({ ...it, category: cat.name_en }));
        });
      }
      setMenu(items);
    }).catch(err => console.error('refreshMenu failed', err));
  };

  const openAddModal = () => {
    setModalMode('add');
    setShowAddModal(true);
    setNewMenuItem({ name_en: '', name_ar: '', price: '', category: '', description_en: '', description_ar: '', imageFile: null, images: [] });
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setShowAddModal(true);
    setNewMenuItem({ ...item });
  };

  const deleteMenuItem = (item) => {
    if (!item) return;
    if (item.isCategory) {
      axios.delete(`/menu/category/${encodeURIComponent(item.name_en)}`).then(refreshMenu).catch(e=>console.error(e));
      return;
    }
    if (item.id) {
      axios.delete(`/menu/${item.id}`).then(refreshMenu).catch(e=>console.error(e));
      return;
    }
    console.warn('deleteMenuItem: unknown item type', item);
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleCategoryFilter = (e) => setCategoryFilter(e.target.value);

  // Date filter state
  const [orderFilter, setOrderFilter] = useState('today');
  const [customDate, setCustomDate] = useState('');

  // Sorting and status filtering state
  const [sortOption, setSortOption] = useState('latest');
  const [statusFilter, setStatusFilter] = useState('all');

  // Real-time updates: fetch orders every 5 seconds
  useEffect(() => {
    const fetchOrders = () => {
        axios.get('/orders').then(res => {
    console.debug('[DEBUG AdminDashboard] fetched orders count', (res.data||[]).length);
    console.debug('[DEBUG AdminDashboard] sample orders slice', (res.data||[]).slice(0,3));
    const normalized = (res.data || []).map(o => ({
      ...o,
      notes: (o.notes || o.note || ''),
      status: (o.status || o.state || 'pending').toString().toLowerCase(),
      orderNumber: o.orderNumber || o.orderNum || o.order || ''
    }));
    console.debug('[DEBUG AdminDashboard] normalized orders sample', normalized.slice(0,3));
    setOrders(normalized);
          // Animation for new orders
          const ids = normalized.map(o => o._id);
        if (prevOrderIds.current.length && ids.length > prevOrderIds.current.length) {
          setNewOrderAnim(true);
          setTimeout(() => setNewOrderAnim(false), 1200);
          const newIds = ids.filter(id => !prevOrderIds.current.includes(id));
          setNewOrderIds(prev => [...prev, ...newIds]);
          
          // Play sound notification for new orders
          if (soundNotifications && newIds.length > 0) {
            console.log('[NOTIFICATION] Playing sound for', newIds.length, 'new order(s)');
            notificationService.playOrderAlert();
          }
        }
        prevOrderIds.current = ids;
      });
    };
  fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [soundNotifications]); // Add soundNotifications to dependencies

  // Initialize notification service
  useEffect(() => {
    // Request notification permissions for web browsers
    notificationService.requestPermission();
    
    // Enable notifications on component mount
    const enableNotifications = () => {
      notificationService.enable();
    };
    
    // Enable on any user interaction
    document.addEventListener('click', enableNotifications, { once: true });
    document.addEventListener('touchstart', enableNotifications, { once: true });
    
    return () => {
      document.removeEventListener('click', enableNotifications);
      document.removeEventListener('touchstart', enableNotifications);
    };
  }, []);

  const filterOrders = (ordersList) => {
    const now = new Date();
    console.log('[DEBUG] filterOrders - now:', now.toDateString(), 'filter:', orderFilter);
    return ordersList.filter(order => {
      if (!order.time) {
        console.log('[DEBUG] filterOrders - order missing time:', order._id);
        return false;
      }
      const orderDate = new Date(order.time);
      console.log('[DEBUG] filterOrders - order time:', order.time, 'orderDate:', orderDate.toDateString());
      if (orderFilter === 'today') {
        const matches = orderDate.toDateString() === now.toDateString();
        console.log('[DEBUG] filterOrders - today check:', matches);
        return matches;
      }
      if (orderFilter === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return orderDate.toDateString() === yesterday.toDateString();
      }
      if (orderFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return orderDate >= weekAgo && orderDate <= now;
      }
      if (orderFilter === 'month') return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      if (orderFilter === 'custom' && customDate) return orderDate.toDateString() === new Date(customDate).toDateString();
      return true;
    });
  };

  const processOrders = (ordersList) => {
    let filtered = filterOrders(ordersList);
    if (statusFilter !== 'all') filtered = filtered.filter(o => o.status === statusFilter);
    if (sortOption === 'latest') filtered = filtered.sort((a,b) => new Date(b.time) - new Date(a.time));
    else if (sortOption === 'oldest') filtered = filtered.sort((a,b) => new Date(a.time) - new Date(b.time));
    else if (sortOption === 'amount') filtered = filtered.sort((a,b) => (b.total||0) - (a.total||0));
    return filtered;
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
        <label htmlFor="store-open" style={{ fontWeight: 700 }}>Store Operation Hour:</label>
        <input id="store-open" type="time" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontWeight: 600 }} />
        <span style={{ fontWeight: 700 }}>to</span>
        <input id="store-close" type="time" style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', fontWeight: 600 }} />
        <button id="store-toggle" style={{
          background: '#2a5c45',
          color: '#fff',
          padding: '10px 24px',
          borderRadius: '8px',
          border: 'none',
          fontWeight: '700',
          fontSize: '1.1rem',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(42,92,69,0.15)',
          marginLeft: '18px'
        }}>Turn ON/OFF Orders</button>
      </div>
      <div style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        background: 'var(--primary)',
        color: 'var(--white)',
        padding: '15px 0',
        textAlign: 'center',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        zIndex: 100
      }}>
        <h1 style={{ 
          margin: 0, 
          fontWeight: 900, 
          fontSize: '2.2rem',
          color: 'var(--light)',
          textShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>Admin Dashboard</h1>
      </div>
      <div style={{ 
        marginTop: '80px', 
        padding: '20px',
        display: 'flex', 
        gap: '16px', 
        alignItems: 'center', 
        marginBottom: '24px', 
        justifyContent: 'center' 
      }}>
        <button 
          style={{ 
            background: 'var(--accent)',
            color: 'var(--white)',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '700',
            fontSize: '1.1rem',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(76,175,80,0.15)',
            transition: 'all 0.2s ease'
          }} 
          onClick={() => setView('orders')}
        >
          Orders
        </button>
        
        {/* Notification Settings Toggle */}
        <button 
          style={{ 
            background: soundNotifications ? 'var(--success)' : '#666',
            color: 'var(--white)',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            fontWeight: '700',
            fontSize: '1.1rem',
            cursor: 'pointer',
            boxShadow: soundNotifications 
              ? '0 2px 8px rgba(76,175,80,0.15)' 
              : '0 2px 8px rgba(102,102,102,0.15)',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }} 
          onClick={() => {
            setSoundNotifications(!soundNotifications);
            if (!soundNotifications) {
              // Enable and test the notification
              notificationService.enable();
              notificationService.playNotification('ding');
            }
          }}
          title={soundNotifications ? 'Disable sound notifications' : 'Enable sound notifications'}
        >
          🔊 {soundNotifications ? 'Sound ON' : 'Sound OFF'}
        </button>
        
        {/* Test Notification Button */}
        {soundNotifications && (
          <button 
            style={{ 
              background: '#ff9800',
              color: 'var(--white)',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '700',
              fontSize: '1.1rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(255,152,0,0.15)',
              transition: 'all 0.2s ease'
            }} 
            onClick={() => {
              console.log('[TEST] Playing test notification');
              notificationService.playOrderAlert();
            }}
            title="Test notification sound"
          >
            🔔 Test Sound
          </button>
        )}
        <a href="/admin-panel" style={{ textDecoration: 'none' }}>
          <button 
            style={{ 
              background: 'var(--primary)',
              color: 'var(--white)',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '700',
              fontSize: '1.1rem',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(42,92,69,0.15)',
              transition: 'all 0.2s ease'
            }}
          >
            Manage Menu
          </button>
        </a>
      </div>
      {view === 'orders' && (
        <div>
            {/* Order Statistics Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '20px',
              padding: '0 20px',
              marginBottom: '24px'
            }}>
              {/* Total Orders */}
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Total Orders</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--primary)' }}>
                  {processOrders(orders).length}
                </div>
              </div>

              {/* Pending Orders */}
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Pending Orders</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--order-highlight)' }}>
                  {processOrders(orders).filter(order => order.status === 'pending').length}
                </div>
              </div>

              {/* Completed Orders */}
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Completed Orders</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--accent)' }}>
                  {processOrders(orders).filter(order => order.status === 'completed').length}
                </div>
              </div>

              {/* Total Revenue */}
              <div style={{
                background: 'white',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Total Revenue</div>
                <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--primary)' }}>
                  AED {processOrders(orders).reduce((sum, order) => sum + (order.total || 0), 0).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="order-filter-bar" style={{ padding: '0 20px' }}>
            <button
              style={{
                background: orderFilter === 'today' ? 'var(--light-bg)' : 'var(--primary)',
                color: orderFilter === 'today' ? 'var(--primary)' : 'var(--white)',
                borderRadius: '8px',
                padding: '12px 24px',
                fontWeight: 700,
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: orderFilter === 'today' ? '0 2px 8px rgba(76,175,80,0.15)' : '0 2px 8px rgba(42,92,69,0.15)',
                marginRight: '12px',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setOrderFilter('today')}
            >Today</button>
            <button
              style={{
                background: orderFilter === 'yesterday' ? 'var(--light-bg)' : 'var(--primary)',
                color: orderFilter === 'yesterday' ? 'var(--primary)' : 'var(--white)',
                borderRadius: '8px',
                padding: '12px 24px',
                fontWeight: 700,
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: orderFilter === 'yesterday' ? '0 2px 8px rgba(76,175,80,0.15)' : '0 2px 8px rgba(42,92,69,0.15)',
                marginRight: '12px',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setOrderFilter('yesterday')}
            >Yesterday</button>
            <button
              style={{
                background: orderFilter === 'week' ? 'var(--light-bg)' : 'var(--primary)',
                color: orderFilter === 'week' ? 'var(--primary)' : 'var(--white)',
                borderRadius: '8px',
                padding: '12px 24px',
                fontWeight: 700,
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: orderFilter === 'week' ? '0 2px 8px rgba(76,175,80,0.15)' : '0 2px 8px rgba(42,92,69,0.15)',
                marginRight: '12px',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setOrderFilter('week')}
            >This Week</button>
            <button
              style={{
                background: orderFilter === 'month' ? 'var(--light-bg)' : 'var(--primary)',
                color: orderFilter === 'month' ? 'var(--primary)' : 'var(--white)',
                borderRadius: '8px',
                padding: '12px 24px',
                fontWeight: 700,
                fontSize: '1rem',
                border: 'none',
                cursor: 'pointer',
                boxShadow: orderFilter === 'month' ? '0 2px 8px rgba(76,175,80,0.15)' : '0 2px 8px rgba(42,92,69,0.15)',
                marginRight: '12px',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setOrderFilter('month')}
            >This Month</button>
            <input
              id="filter-date"
              name="filterDate"
              type="date"
              value={customDate}
              onChange={e => { setCustomDate(e.target.value); setOrderFilter('custom'); }}
              autoComplete="date"
              style={{ 
                marginLeft: '10px', 
                padding: '12px', 
                borderRadius: '8px', 
                border: '1px solid var(--light)',
                fontSize: '1rem',
                color: 'var(--primary)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }}
            />
          </div>
          <div className="order-filter-bar" style={{ marginTop: '16px', padding: '0 20px' }}>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)} 
              style={{ 
                padding: '12px 16px', 
                borderRadius: '8px', 
                border: '1px solid var(--light)',
                backgroundColor: 'var(--white)',
                fontSize: '1rem',
                color: 'var(--primary)',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
                minWidth: '150px'
              }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="new">New</option>
            </select>
            <select 
              value={sortOption} 
              onChange={e => setSortOption(e.target.value)} 
              style={{ 
                marginLeft: '12px', 
                padding: '12px 16px', 
                borderRadius: '8px', 
                border: '1px solid var(--light)',
                backgroundColor: 'var(--white)',
                fontSize: '1rem',
                color: 'var(--primary)',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
                minWidth: '150px'
              }}
            >
              <option value="latest">Latest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount">Highest Amount</option>
            </select>
          </div>
          <section style={{ marginTop: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '1rem' }}>Order List</h2>
            <div className="orders-grid">
              {processOrders(orders).map(order => (
                <div 
                  key={order._id || order.orderNumber || Math.random()} 
                  className={`order-card${newOrderIds.includes(order._id) && order.status !== 'completed' ? ' order-card-new' : ''}`}
                >
                  {/* Status Badge */}
                  <div className={`order-status-badge ${statusColor(order.status)}`}>
                    {order.status ? (order.status.charAt(0).toUpperCase() + order.status.slice(1)) : ''}
                  </div>

                  {/* Order Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '16px',
                    paddingRight: '100px'
                  }}>
                    <div>
                      <div style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--primary)' }}>
                        {order.orderNumber ? `Order ${order.orderNumber}` : `Order #${order.id || order._id}`}
                      </div>
                      <div style={{ fontSize: '0.95rem', color: 'var(--text-light)', marginTop: '4px' }}>
                        {order.time ? new Date(order.time).toLocaleString() : 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div style={{
                    background: 'var(--light-bg)',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      color: 'var(--text-light)',
                      marginBottom: '4px'
                    }}>
                      Customer
                    </div>
                    <div style={{ 
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      color: 'var(--primary)'
                    }}>
                      <div>{order.customer || 'N/A'}</div>
                      {order.phone && <div style={{ fontSize: '0.95rem', color: '#444', marginTop: 6 }}>Phone: {order.phone}</div>}
                    </div>
                    {(order.notes || order.note) && <div style={{ marginTop: 8, color: '#a63a00', fontWeight: 700 }}>{order.notes || order.note}</div>}
                  </div>

                  {/* Order Items */}

                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ 
                      fontSize: '0.9rem', 
                      color: 'var(--text-light)',
                      marginBottom: '8px'
                    }}>
                      Order Items
                    </div>
                    <ul style={{ 
                      padding: 0,
                      margin: 0,
                      listStyle: 'none'
                    }}>
                      {order.items && order.items.map((item, idx) => (
                        <li
                          key={item.id ? `${order._id}-${item.id}` : `${order._id}-item-${idx}`}
                          style={{
                            background: 'white',
                            border: '1px solid var(--light)',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            padding: '10px 14px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.95rem'
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: '600', color: 'var(--primary)' }}>
                            {item.name_en || item.name_ar || item.name}
                          </span>
                          <span style={{ color: 'var(--text-light)', marginLeft: '8px' }}>
                            x {item.quantity} {item.size ? `(${item.size})` : ''}
                          </span>
                        </div>
                        <div style={{ fontWeight: '600', color: 'var(--accent)' }}>
                          AED {(item.price * item.quantity).toFixed(2)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Order Total */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'var(--primary)',
                  color: 'white',
                  borderRadius: '8px',
                  marginBottom: '16px'
                }}>
                  <span style={{ fontSize: '0.95rem' }}>Total Amount</span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '700' }}>
                    AED {order.total}
                  </span>
                </div>

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    onClick={async () => {
                      // Prefer the working singular endpoint /order/:id (some environments/servers may not handle /orders/:id)
                      try {
                        try {
                          const resSingle = await axios.get(`/order/${order._id}`);
                          const single = resSingle && resSingle.data ? { ...resSingle.data, notes: (resSingle.data.notes || resSingle.data.note || '') } : null;
                          if (single) {
                            console.debug('[DEBUG AdminDashboard] fetched single order via /order/:id', order._id, single && single.notes);
                            setSelectedOrder(single);
                            return;
                          }
                        } catch (errSing) {
                          console.debug('[DEBUG AdminDashboard] GET /order/:id failed, trying /orders/:id', errSing && errSing.message);
                        }

                        // Try the plural endpoint next
                        try {
                          const resPlural = await axios.get(`/orders/${order._id}`);
                          const single = resPlural && resPlural.data ? { ...resPlural.data, notes: (resPlural.data.notes || resPlural.data.note || '') } : null;
                          if (single) {
                            console.debug('[DEBUG AdminDashboard] fetched single order via /orders/:id', order._id, single && single.notes);
                            setSelectedOrder(single);
                            return;
                          }
                        } catch (errPlural) {
                          console.debug('[DEBUG AdminDashboard] GET /orders/:id failed, will fall back to date fetch', errPlural && errPlural.message);
                        }

                        // Fallback: fetch by date and locate by _id
                        const res = await axios.get('/orders', { params: { date: order.orderDate } });
                        console.debug('[DEBUG AdminDashboard] fetched orders for date', order.orderDate, 'count', (res.data||[]).length);
                        const foundRaw = (res.data || []).find(o => o._id === order._id);
                        const found = foundRaw ? { ...foundRaw, notes: (foundRaw.notes || foundRaw.note || '') } : null;
                        console.debug('[DEBUG AdminDashboard] found order by id via date fetch', !!found, found && found.notes);
                        const pick = found || { ...order, notes: (order.notes || order.note || '') };
                        console.debug('[DEBUG AdminDashboard] selecting order, notes on pick:', pick && pick.notes);
                        setSelectedOrder(pick);
                      } catch (err) {
                        console.error('Failed to fetch order details, falling back to local copy', err && err.message);
                        setSelectedOrder({ ...order, notes: (order.notes || order.note || '') });
                      }
                    }}
                    style={{
                      background: 'var(--primary)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => {
                      try {
                        const el = document.getElementById('raw-' + order._id);
                        if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                      } catch (e) { console.error('raw toggle failed', e); }
                    }}
                    style={{ marginLeft: 8, background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '6px 10px', borderRadius: 6 }}
                  >
                    Raw
                  </button>
                  {order.status !== 'completed' && (
                    <button
                      onClick={() => markCompleted(order._id)}
                      style={{
                        background: 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          </section>
                    {/* Hidden raw JSON blocks for debugging (toggle with Raw button) */}
            <div>
            {processOrders(orders).map(order => (
              <pre key={order._id ? `raw-${order._id}` : order.orderNumber ? `raw-${order.orderNumber}` : `raw-unknown`}
                   id={'raw-' + order._id}
                   style={{ display: 'none', whiteSpace: 'pre-wrap', background: '#f8f8f8', padding: 12, borderRadius: 8, marginTop: 8 }}>
                {JSON.stringify(order, null, 2)}
              </pre>
            ))}
          </div>
          {selectedOrder && (
            <div className="order-details-modal modal">
              {console.debug && console.debug('[DEBUG AdminDashboard] rendering details modal, selectedOrder notes:', selectedOrder && (selectedOrder.notes || selectedOrder.note))}
              <div className="modal-content" style={{ maxWidth: '500px', width: '90%' }}>
                {/* Modal Header */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--light)'
                }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '1.5rem', 
                    color: 'var(--primary)',
                    fontWeight: '700'
                  }}>
                    Order Details
                  </h3>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      color: 'var(--text-light)',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    ×
                  </button>
                </div>

                {/* Order Info Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px',
                  marginBottom: '24px'
                }}>
                  {/* Order ID */}
                  <div style={{ background: 'var(--light-bg)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '4px' }}>Order ID</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary)' }}>#{selectedOrder._id}</div>
                  </div>

                  {/* Status */}
                  <div style={{ background: 'var(--light-bg)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '4px' }}>Status</div>
                    <div className={`status-${selectedOrder.status.toLowerCase()}`} style={{ 
                      fontSize: '1.1rem', 
                      fontWeight: '600',
                      color: selectedOrder.status === 'completed' ? 'var(--accent)' : 'var(--order-highlight)'
                    }}>
                      {selectedOrder.status ? (selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)) : ''}
                    </div>
                  </div>

                  {/* Customer */}
                    <div style={{ background: 'var(--light-bg)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '4px' }}>Customer</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary)' }}>{selectedOrder.customer || 'N/A'}</div>
                    {selectedOrder.phone && <div style={{ marginTop: 6, color: '#334155', fontWeight: 600 }}>Phone: {selectedOrder.phone}</div>}
                  </div>

                  {/* Time */}
                  <div style={{ background: 'var(--light-bg)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '4px' }}>Order Time</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: '600', color: 'var(--primary)' }}>
                      {selectedOrder.time ? new Date(selectedOrder.time).toLocaleString() : 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Notes - show any customer notes/instructions */}
                {selectedOrder.notes && (
                  <div style={{ background: 'var(--light-bg)', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-light)', marginBottom: '4px' }}>Notes</div>
                    <div style={{ fontSize: '1.05rem', color: '#a63a00', fontWeight: 700 }}>{selectedOrder.notes}</div>
                  </div>
                )}

                {/* Order Items */}
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ 
                    fontSize: '1.1rem', 
                    fontWeight: '600', 
                    color: 'var(--primary)',
                    marginBottom: '12px'
                  }}>
                    Order Items
                  </div>
                  <div style={{ 
                    maxHeight: '300px', 
                    overflowY: 'auto',
                    padding: '4px'
                  }}>
                    {selectedOrder.items && selectedOrder.items.map((item, idx) => (
                      <div key={item.id ? `${selectedOrder._id}-${item.id}` : `${selectedOrder._id}-item-${idx}`} style={{ 
                        background: 'white',
                        border: '1px solid var(--light)',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        padding: '12px 16px'
                      }}>
                        <div style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '1rem' }}>
                              {item.name_en || item.name_ar || item.name}
                            </div>
                            <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', marginTop: '4px' }}>
                              Quantity: {item.quantity} {item.size ? `• Size: ${item.size}` : ''}
                            </div>
                          </div>
                          <div style={{ 
                            fontWeight: '700', 
                            color: 'var(--accent)',
                            fontSize: '1.1rem'
                          }}>
                            AED {(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total and Actions */}
                <div style={{
                  borderTop: '1px solid var(--light)',
                  paddingTop: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Total Amount</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--primary)' }}>
                      AED {selectedOrder.total}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {selectedOrder.status !== 'completed' && (
                      <button
                        onClick={() => {
                          markCompleted(selectedOrder.id);
                          setSelectedOrder(null);
                        }}
                        style={{
                          background: 'var(--accent)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '10px 20px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Mark as Completed
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedOrder(null)}
                      style={{
                        background: 'var(--light-bg)',
                        color: 'var(--text)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 20px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      {view === 'menu' && (
        <div>
          <h2>Manage Menu</h2>
          <div className="menu-controls" style={{ display: 'flex', gap: '16px', marginBottom: '18px', alignItems: 'center' }}>
            <input
              id="menu-search"
              name="menuSearch"
              type="text"
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={handleSearch}
              style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc', minWidth: '180px' }}
            />
            <select id="menu-category-filter" name="menuCategoryFilter" value={categoryFilter} onChange={handleCategoryFilter} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ccc' }}>
              <option value="all">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <button style={{ background: 'var(--accent)', color: 'var(--white)', padding: '8px 18px', borderRadius: '6px', border: 'none', fontWeight: '600', cursor: 'pointer' }} onClick={openAddModal}>Add Menu Item</button>
          </div>
          <div className="menu-grid">
            {menu.map((item, idx) => (
              <div key={item.id ? item.id : `menu-${idx}`} className="menu-card">
                {item.isCategory ? (
                  <>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Category: {item.name_en}</div>
                    <div className="menu-actions">
                      <button style={{ background: '#d32f2f', color: '#fff', marginRight: 8 }} onClick={() => deleteMenuItem(item)}>Delete Category</button>
                    </div>
                  </>
                ) : item.isSubcategory ? (
                  <>
                    <div style={{ fontWeight: 'bold', fontSize: '1.05rem' }}>Subcategory: {item.subcategory_en}</div>
                    <div>Category: {item.category}</div>
                    <div className="menu-actions">
                      <button style={{ background: '#d32f2f', color: '#fff', marginRight: 8 }} onClick={() => deleteMenuItem(item)}>Delete Subcategory</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ cursor: 'pointer', textDecoration: 'underline', color: 'var(--primary)' }} onClick={() => navigate(`/admin/menu/${item.id}`)}><strong>{item.name_en || item.name_ar || item.name}</strong></div>
                    <div>Category: {item.category}</div>
                    <div>Price: AED {item.price}</div>
                    <div className="menu-actions">
                      <button onClick={() => openEditModal(item)}>Edit</button>
                      <button onClick={() => deleteMenuItem(item)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {showAddModal && (
            <MenuItemModal
              mode={modalMode}
              item={newMenuItem}
              categories={categories}
              onClose={() => {
                setShowAddModal(false);
                setNewMenuItem({
                  name_en: '',
                  name_ar: '',
                  price: '',
                  category: '',
                  description_en: '',
                  description_ar: '',
                  imageFile: null,
                  images: []
                });
              }}
              onSuccess={() => {
                refreshMenu();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
