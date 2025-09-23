import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';
import MenuItemModal from './components/MenuItemModal';
import ConfirmModal from './components/ConfirmModal';

// Set the backend URL directly
const API_BASE_URL = 'https://swp-backend-x36i.onrender.com';
axios.defaults.baseURL = API_BASE_URL;
// Configure axios for credentials but don't use withCredentials since we're using Authorization headers
axios.defaults.withCredentials = false;

function AdminPanel() {
  // JWT-based admin auth (token stored in localStorage; axios header set)
  // Helper to get token from localStorage
  const [menuAccessGranted, setMenuAccessGranted] = useState(!!localStorage.getItem('authToken'));
  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };
  const [loginId, setLoginId] = useState('');
  const [menuPassword, setMenuPassword] = useState('');
  const [menuPasswordError, setMenuPasswordError] = useState('');
  const loginDialogRef = React.createRef();

  // Menu management state
  const [menu, setMenu] = useState([]);
  const [categories, setCategories] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState({ show: false, name: null, id: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMenuItem, setNewMenuItem] = useState({ name_en: '', name_ar: '', price: '', category: '', description_en: '', description_ar: '', imageFile: null, sizes: [{ size: '', price: '' }] });
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [activeTab, setActiveTab] = useState('menu');
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // If token exists in localStorage, set axios header
    const token = localStorage.getItem('authToken');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    // Fetch menu and categories
    axios.get('/menu', { headers: getAuthHeaders() }).then(res => {
      setCategories(res.data.categories.map(cat => cat.name_en));
      const items = res.data.categories.flatMap(cat => cat.items.map(item => ({ ...item, category: cat.name_en })));
      setMenu(items);
    });
  }, []);

  useEffect(() => {
    if (activeTab === 'orders') {
      axios.get('/orders', { headers: getAuthHeaders() }).then(res => setOrders(res.data));
    }
  }, [activeTab]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/auth/login', { username: loginId, password: menuPassword });
      if (res.status === 200 && res.data && res.data.token) {
        localStorage.setItem('authToken', res.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        const dlg = loginDialogRef.current;
        if (dlg) { dlg.classList.add('closing'); setTimeout(() => setMenuAccessGranted(true), 180); }
        else setMenuAccessGranted(true);
        setMenuPasswordError('');
      } else {
        setMenuPasswordError('Invalid credentials');
      }
    } catch (err) {
      setMenuPasswordError(err.response?.data?.error || 'Invalid credentials');
      localStorage.removeItem('authToken');
      axios.defaults.headers.common['Authorization'] = '';
      setMenuAccessGranted(false);
    }
  };

  const handleLogout = async () => {
    // logout via POST so server clears cookie
    try { await axios.post('/auth/logout', {}, { headers: getAuthHeaders() }); } catch (e) {}
    localStorage.removeItem('authToken');
    axios.defaults.headers.common['Authorization'] = '';
    setMenuAccessGranted(false);
    window.location.reload();
  };

  const handleSearch = (e) => setSearchTerm(e.target.value);
  const handleCategoryFilter = (e) => setCategoryFilter(e.target.value);

  const filteredMenu = menu.filter(item => {
    const nameEn = item.name_en ? item.name_en : '';
    const matchesSearch = nameEn.toLowerCase().includes(searchTerm.toLowerCase()) || (item.name_ar && item.name_ar.includes(searchTerm));
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const [deleteDialog, setDeleteDialog] = useState({ show: false, id: null });
  const deleteMenuItem = (id) => {
    setDeleteDialog({ show: true, id });
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog.id) return;
    try {
      await axios.delete(`/menu/${deleteDialog.id}`, { headers: getAuthHeaders() });
      setMenu(menu.filter(item => item.id !== deleteDialog.id));
    } catch (e) {
      alert('Failed to delete item');
    } finally {
      setDeleteDialog({ show: false, id: null });
    }
  };

  // Calculate total sales
  const totalSales = orders.reduce((sum, order) => sum + (order.total || 0), 0);

  // Calculate most ordered item
  const itemCounts = {};
  orders.forEach(order => {
    order.items.forEach(item => {
      const key = item.name_en || item.name_ar || item.name;
      itemCounts[key] = (itemCounts[key] || 0) + item.quantity;
    });
  });
  const mostOrderedItem = Object.entries(itemCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="admin-dashboard">
      <header className="admin-header" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#2a5c45',
        color: 'var(--white)', padding: '18px 32px', borderRadius: '0 0 18px 18px', boxShadow: '0 4px 18px rgba(42,92,69,0.08)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src="/public/logo192.png" alt="Logo" style={{ width: 44, height: 44, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }} />
          <h1 style={{ margin: 0, fontWeight: 900, fontSize: '2.1rem', color: '#fff', letterSpacing: '2px', textShadow: '0 2px 8px rgba(6,122,50,0.10)' }}>Admin Dashboard</h1>
        </div>
        {menuAccessGranted && (
          <button onClick={handleLogout} style={{ padding: '10px 18px', borderRadius: 10, border: 'none', background: '#ff6b6b', color: '#fff', fontWeight: 700, fontSize: '1rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(255,107,0,0.12)' }}>Logout</button>
        )}
      </header>
      {menuAccessGranted && (
        <nav style={{
          marginTop: '32px',
          padding: '0 24px',
          display: 'flex',
          gap: '18px',
          alignItems: 'center',
          marginBottom: '28px',
          justifyContent: 'flex-start',
        }}>
          <button
            style={{
              background: activeTab === 'menu' ? '#2a5c45' : '#2a5c45',
              color: 'var(--white)',
              border: 'none',
              borderRadius: '10px',
              padding: '14px 32px',
              fontWeight: 800,
              fontSize: '1.15rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'menu' ? '0 4px 16px rgba(42,92,69,0.18)' : '0 2px 8px rgba(42,92,69,0.10)',
              transition: 'all 0.2s ease',
              letterSpacing: '1px',
            }}
            onClick={() => setActiveTab('menu')}
          >
            Menu Management
          </button>
          <button
            style={{
              background: activeTab === 'orders' ? '#2a5c45' : '#2a5c45',
              color: 'var(--white)',
              border: 'none',
              borderRadius: '10px',
              padding: '14px 32px',
              fontWeight: 800,
              fontSize: '1.15rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'orders' ? '0 4px 16px rgba(42,92,69,0.18)' : '0 2px 8px rgba(42,92,69,0.10)',
              transition: 'all 0.2s ease',
              letterSpacing: '1px',
            }}
            onClick={() => setActiveTab('orders')}
          >
            View Orders
          </button>
        </nav>
      )}
      {/* Login Popup for Admin Panel (JWT) */}
      {!menuAccessGranted && (
        <dialog open className="admin-login-dialog" aria-modal="true" ref={loginDialogRef}>
          <form method="dialog" onSubmit={handlePasswordSubmit} style={{ padding: 20, width: '100%', position: 'relative' }} autoComplete="off">
            {/* Hidden dummy inputs to discourage browser autofill */}
            <input type="text" name="fakeusernameremembered" autoComplete="username" style={{ display: 'none' }} />
            <input type="password" name="fakepasswordremembered" autoComplete="new-password" style={{ display: 'none' }} />
            <button type="button" className="close-btn" aria-label="Close" onClick={() => {
              const dlg = loginDialogRef.current;
              if (dlg) { dlg.classList.add('closing'); setTimeout(() => window.location.href = '/', 180); } else window.location.href = '/';
            }}>&times;</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 10, background: 'linear-gradient(135deg,var(--primary), #2a8de6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>SP</div>
              <div>
                <h3 style={{ margin: 0 }}>Admin Login</h3>
                <p className="subtitle">Sign in to manage menu and orders</p>
              </div>
            </div>
            <label style={{ display: 'block', marginTop: 14 }} htmlFor="admin-login-id">
              <input
                id="admin-login-id"
                type="text"
                name="loginId"
                autoComplete="off"
                value={loginId}
                onChange={e => setLoginId(e.target.value)}
                placeholder="Login ID"
                autoFocus
              />
            </label>
            <label style={{ display: 'block', marginTop: 10 }} htmlFor="admin-menu-password">
              <input
                id="admin-menu-password"
                type="password"
                name="menuPassword"
                autoComplete="new-password"
                value={menuPassword}
                onChange={e => setMenuPassword(e.target.value)}
                placeholder="Password"
              />
            </label>
            <div className="actions">
              <button type="submit" className="primary-btn">Login</button>
            </div>
            {menuPasswordError && <div style={{ color: 'red', marginTop: 10 }}>{menuPasswordError}</div>}
          </form>
        </dialog>
      )}
      {menuAccessGranted && (
        <>

          {activeTab === 'menu' && (
            <>
              <div className="menu-controls" style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center' }}>
                <input
                  id="menu-search"
                  type="text"
                  placeholder="Search menu items..."
                  value={searchTerm}
                  onChange={handleSearch}
                  style={{ 
                    padding: '12px 16px', 
                    borderRadius: '8px', 
                    border: '1px solid var(--light)', 
                    minWidth: '220px',
                    fontSize: '1rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease'
                  }}
                />
                <select 
                  value={categoryFilter} 
                  onChange={handleCategoryFilter} 
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
                    transition: 'all 0.2s ease'
                  }}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <button 
                  style={{ 
                    background: '#2a5c45',
                    color: 'var(--white)',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(42,92,69,0.15)',
                    transition: 'all 0.2s ease'
                  }} 
                  onClick={() => setShowAddModal(true)}
                >
                  Add Menu Item
                </button>
              </div>
              <ConfirmModal
                show={confirmDelete.show}
                title={`Delete category`}
                message={`Delete category "${confirmDelete.name}"? Choose a category to reassign affected items or leave blank to clear.`}
                reassignOptions={categories.filter(c => c !== confirmDelete.name)}
                onCancel={() => setConfirmDelete({ show: false, name: null, id: null })}
                onConfirm={async (reassignTo) => {
                  try {
                    // send delete with JSON body { reassignTo }
                    await axios({ method: 'delete', url: `/categories/${confirmDelete.id}`, data: { reassignTo }, headers: getAuthHeaders() });
                    const res = await axios.get('/categories', { headers: getAuthHeaders() });
                    setCategories(res.data.categories.map(c => c.name_en));
                    const m = await axios.get('/menu', { headers: getAuthHeaders() });
                    const items = m.data.categories.flatMap(c => c.items.map(i => ({ ...i, category: c.name_en })));
                    setMenu(items);
                  } catch (e) {
                    alert(e.response?.data?.error || e.message || 'Failed to delete');
                  } finally {
                    setConfirmDelete({ show: false, name: null, id: null });
                  }
                }}
                confirmLabel="Delete"
                cancelLabel="Cancel"
              />
              <div className="menu-grid" style={{ marginTop: 24 }}>
                {filteredMenu.map(item => (
                  <div key={item.id} className="menu-card" style={{ boxShadow: '0 4px 18px rgba(6,122,50,0.08)', border: '1px solid #e6e6f0', borderRadius: '14px', padding: '1.2rem 1.5rem', background: '#fff', marginBottom: '8px', transition: 'box-shadow 0.2s' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.15rem', marginBottom: 6, color: '#067a32' }}>{item.name_en || item.name_ar || item.name}</div>
                    <div style={{ color: '#667085', fontSize: '0.98rem', marginBottom: 2 }}>Main Category: <span style={{ fontWeight: 600 }}>{item.category}</span></div>
                    <div style={{ color: '#667085', fontSize: '0.98rem', marginBottom: 2 }}>Subcategory: <span style={{ fontWeight: 600 }}>{item.subcategory || '—'}</span></div>
                    <div style={{ color: '#2a8de6', fontWeight: 700, fontSize: '1.05rem', marginBottom: 4 }}>Price: AED {item.price}</div>
                    <div className="menu-actions" style={{ marginTop: 8 }}>
                      <button style={{ background: '#2a5c45', color: '#fff', fontWeight: 700, borderRadius: 8, padding: '8px 18px', border: 'none', boxShadow: '0 2px 8px rgba(42,92,69,0.10)', fontSize: '1rem', cursor: 'pointer', marginRight: 8 }} onClick={() => setSelectedMenuItem(item)}>Edit</button>
                      <button style={{ background: 'linear-gradient(90deg,#ff6b6b,#e53935)', color: '#fff', fontWeight: 700, borderRadius: 8, padding: '8px 18px', border: 'none', boxShadow: '0 2px 8px rgba(255,107,0,0.10)', fontSize: '1rem', cursor: 'pointer' }} onClick={() => deleteMenuItem(item.id)}>Delete</button>
      {deleteDialog.show && (
        <dialog open style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.18)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 4px 24px rgba(6,122,50,0.18)', padding: '32px 28px', minWidth: 320, textAlign: 'center' }}>
            <h3 style={{ color: '#d32f2f', marginBottom: 18 }}>Delete Menu Item</h3>
            <p style={{ fontSize: '1.08rem', marginBottom: 22 }}>Are you sure you want to delete this item? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 18, justifyContent: 'center', marginTop: 10 }}>
              <button style={{ background: 'linear-gradient(90deg,#067a32,#045c27)', color: '#fff', fontWeight: 700, borderRadius: 8, padding: '10px 22px', border: 'none', fontSize: '1rem', cursor: 'pointer' }} onClick={handleConfirmDelete}>Yes, Delete</button>
              <button style={{ background: '#eee', color: '#333', fontWeight: 700, borderRadius: 8, padding: '10px 22px', border: 'none', fontSize: '1rem', cursor: 'pointer' }} onClick={() => setDeleteDialog({ show: false, id: null })}>Cancel</button>
            </div>
          </div>
        </dialog>
      )}
                    </div>
                  </div>
                ))}
              </div>
              {selectedMenuItem && (
                <MenuItemModal
                  mode="edit"
                  item={selectedMenuItem}
                  categories={categories}
                  onClose={() => setSelectedMenuItem(null)}
                  onSuccess={() => {
                    setSelectedMenuItem(null);
                    axios.get('/menu', { headers: getAuthHeaders() }).then(res => {
                      const items = res.data.categories.flatMap(cat => cat.items.map(item => ({ ...item, category: cat.name_en }))); 
                      setMenu(items);
                    });
                  }}
                />
              )}
              {showAddModal && (
                <MenuItemModal
                  mode="add"
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
                      sizes: [{ size: '', price: '' }]
                    });
                  }}
                  onSuccess={() => {
                    axios.get('/menu', { headers: getAuthHeaders() }).then(res => {
                      const items = res.data.categories.flatMap(cat => cat.items.map(item => ({ ...item, category: cat.name_en }))); 
                      setMenu(items);
                    });
                    setShowAddModal(false);
                  }}
                />
              )}
            </>
          )}
          {activeTab === 'orders' && (
            <div style={{ marginTop: '32px' }}>
              <h2>Order Statistics</h2>
              <div style={{ display: 'flex', gap: '32px', marginBottom: '24px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '1rem', color: 'var(--text-light)' }}>Total Sales</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--primary)' }}>AED {totalSales.toFixed(2)}</div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: '1rem', color: 'var(--text-light)' }}>Most Ordered Item</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: '700', color: 'var(--accent)' }}>{mostOrderedItem ? `${mostOrderedItem[0]} (${mostOrderedItem[1]})` : 'N/A'}</div>
                </div>
              </div>
              {/* You can add more order details or a table here if needed */}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AdminPanel;
