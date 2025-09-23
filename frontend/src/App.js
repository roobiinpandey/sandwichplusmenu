import React, { useEffect, useState, useRef } from 'react';
import './App.css';
import axios from 'axios';
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import Dashboard from './Dashboard';
import AdminMenuItemDetail from './AdminMenuItemDetail';
import AdminPanel from './AdminPanel';
import MenuPage from './MenuPage';
import PDVWrapper from './PDVWrapper';
import OrderSummaryModal from './OrderSummaryModal';
import PlaceOrderModal from './PlaceOrderModal';
import OrderSuccessModal from './OrderSuccessModal';

// Configure axios base URL for API calls - Updated for new backend URL
const API_BASE_URL = 'https://swp-backend-x36i.onrender.com';
console.log('Using API Base URL:', API_BASE_URL);
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = false;

function App() {
	// Health status badge and all state/hooks
		// ...existing code...
	const [categories, setCategories] = useState([]);
	const [lang, setLang] = useState('en');
	const [menuData, setMenuData] = useState(null);
	const [loading, setLoading] = useState(true);
	// Order/cart
	const [order, setOrder] = useState([]);
	const [showCart, setShowCart] = useState(false);
	// Add state for placing order
	const [showPlaceOrder, setShowPlaceOrder] = useState(false);
	const [customerName, setCustomerName] = useState('');
	const [notes, setNotes] = useState('');
	const [toast, setToast] = useState({ show: false, message: '', type: 'default' });
	const toastTimeoutRef = useRef(null);
	// Order success state
	const [orderSuccess, setOrderSuccess] = useState(null);

	// Cart handlers
	const handleRemoveItem = (idx) => setOrder(o => o.filter((_, i) => i !== idx));
	const handleChangeQuantity = (idx, delta) => {
		setOrder(o => {
			const newOrder = [...o];
			if (newOrder[idx]) {
				const newQuantity = newOrder[idx].quantity + delta;
				if (newQuantity <= 0) {
					// Remove item if quantity drops to 0 or below
					return newOrder.filter((_, i) => i !== idx);
				} else {
					// Update quantity
					newOrder[idx] = { ...newOrder[idx], quantity: newQuantity };
				}
			}
			return newOrder;
		});
	};
	const handleClearOrder = () => setOrder([]);

	const lastAddRef = useRef({ key: null, t: 0 });
	// Track in-flight add operations to prevent near-simultaneous duplicates
	const inFlightAdds = useRef(new Set());

	const handleAddToCart = (product, { quantity = 1, sizeLabel = null, priceOverride = null, source = 'unknown', actionId = null } = {}) => {
		if (!product) return;
		let price = priceOverride ?? product.price;
		// Normalize sizeLabel to English (if available) to ensure cart keys match
		if (product.has_sizes && sizeLabel) {
			const sizeObj = product.sizes.find(s => s.label_en === sizeLabel || s.label_ar === sizeLabel);
			if (sizeObj) {
				price = sizeObj.price;
				sizeLabel = sizeObj.label_en;
			}
		}

		// Normalize empty sizeLabel to empty string for consistent keys/storage
		if (!sizeLabel) sizeLabel = '';

		// For items with sizes, if no size specified, use the first size as default
		if (product.has_sizes && sizeLabel === '') {
			// Guard against malformed product data where sizes may be missing
			const firstSize = Array.isArray(product.sizes) && product.sizes.length ? product.sizes[0] : null;
			if (firstSize) {
				sizeLabel = firstSize.label_en;
				price = firstSize.price;
			} else {
				// Fallback: treat as no-size product
				sizeLabel = '';
				price = product.price || 0;
			}
		}

		// Debug log -- helps trace duplicate callers
		try {
			console.debug('[addToCart] called', { time: new Date().toISOString(), source, actionId, productId: product.id, sizeLabel, quantity });
		} catch (e) {}

		// Duplicate-add guard: ignore identical add calls (same product+size+bread) within short window
		try {
			const breadKey = product.breadDisplay || '';
			const key = `${product.id}::${sizeLabel}::${breadKey}`;
			const now = Date.now();
			// If there's an in-flight add for this key, block it
			if (inFlightAdds.current.has(key)) {
				console.debug('[addToCart] blocked - inFlight', { key, source, actionId });
				return;
			}
			// Time-based guard (keep for extra safety)
			if (lastAddRef.current.key === key && (now - lastAddRef.current.t) < 400) {
				console.debug('[addToCart] blocked - rapid duplicate', { key, source, actionId });
				return;
			}
			lastAddRef.current = { key, t: now };
			// mark in-flight and schedule removal shortly after update
			inFlightAdds.current.add(key);
			setTimeout(() => inFlightAdds.current.delete(key), 800);
		} catch (e) {
			// ignore guard failures
		}
		console.debug('[addToCart] proceeding to setOrder', { productId: product.id, sizeLabel, quantity });
		// Use a queue to serialize setOrder updates and prevent race conditions
		setOrder(prev => {
			// For bread items, also consider bread selection when finding duplicates
			const breadKey = product.breadDisplay || '';
			const filtered = prev.filter(it => !(it.id === product.id && (it.size || '') === sizeLabel && (it.breadDisplay || '') === breadKey));
			const existing = prev.find(it => it.id === product.id && (it.size || '') === sizeLabel && (it.breadDisplay || '') === breadKey);
			let newQuantity = quantity;
			if (existing) {
				newQuantity += existing.quantity;
			}
			// Always return a single entry for this product+size+bread, preserving essential properties
			return [
				...filtered,
				{
					id: product.id,
					name_en: product.name_en,
					name_ar: product.name_ar,
					price,
					quantity: newQuantity,
					size: sizeLabel,
					// Preserve bread selection data for Breakfast Plus items
					...(product.breadDisplay && { breadDisplay: product.breadDisplay }),
					...(product.bread && { bread: product.bread }),
					// Preserve category for reference
					...(product.category && { category: product.category })
				}
			];
		});
	};

	// handlePlaceOrder optionally accepts a payload (from PlaceOrderModal) containing customer/phone/notes
		const handlePlaceOrder = async (payload = {}) => {
			try { console.log('[TRACE] handlePlaceOrder called', payload); } catch (e) {}
			const nameToUse = payload.customer || customerName;
			// Note: Name validation is now handled inline in PlaceOrderModal
		try {
			const orderData = {
				customer: nameToUse,
				phone: payload.phone || '',
				items: order,
				notes: payload.notes || notes,
				total: order.reduce((sum, item) => sum + item.price * item.quantity, 0),
				time: new Date().toISOString(),
				status: 'Pending'
			};
			setShowPlaceOrder(false);
			console.log('[DEBUG] POST /orders payload', JSON.stringify(orderData, null, 2));
			
			// Add detailed debugging before the request
			console.log('[DEBUG] About to send POST request to:', axios.defaults.baseURL + '/orders');
			console.log('[DEBUG] Axios config:', { 
				baseURL: axios.defaults.baseURL,
				withCredentials: axios.defaults.withCredentials 
			});
			
			// Add error handling with detailed logging
			try {
				const response = await axios.post('/orders', orderData);
				console.log('[DEBUG] Order placed successfully', response.data);
				setOrderSuccess({ show: true, orderId: '#' + Math.floor(10000 + Math.random() * 90000), customerName: nameToUse, total: orderData.total });
				setOrder([]);
				setCustomerName('');
				setNotes('');
			} catch (apiError) {
				console.error('[DEBUG] Order placement failed:', {
					message: apiError.message,
					response: apiError.response?.data,
					status: apiError.response?.status,
					config: {
						url: apiError.config?.url,
						method: apiError.config?.method,
						baseURL: apiError.config?.baseURL,
						data: apiError.config?.data
					},
					request: apiError.request ? 'Request was made but no response received' : 'No request made'
				});
				
				// Check if it's a network error vs server error
				if (!apiError.response) {
					console.error('[DEBUG] Network error - no response received');
					console.error('[DEBUG] Request details:', apiError.request);
				} else {
					console.error('[DEBUG] Server responded with error:', apiError.response.status, apiError.response.data);
				}
				
				setToast({ show: true, message: lang === 'ar' ? 'فشل تقديم الطلب. حاول مرة أخرى.' : 'Failed to place order. Please try again.', type: 'error', context: 'placeOrder' });
				if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
				toastTimeoutRef.current = setTimeout(() => setToast({ show: false, message: '', type: 'default', context: null }), 3000);
			}
		} catch (err) {
			setToast({ show: true, message: lang === 'ar' ? 'فشل تقديم الطلب. حاول مرة أخرى.' : 'Failed to place order. Please try again.', type: 'error' });
		}
	};

				// Hide toast when customer starts typing name
				const handleCustomerNameChange = (value) => {
					setCustomerName(value);
					// Name validation toast clearing is now handled in PlaceOrderModal
				};

		// Load menu data
		useEffect(() => {
			// Instrumentation: log when menu fetch is attempted
			console.debug('[TRACE] About to axios.get("/menu")');
			axios.get('/menu')
				.then(res => {
					setMenuData(res.data);
					setCategories(res.data.categories);
					setLoading(false);
				})
				.catch(() => {
					setMenuData(null);
					setCategories([]);
					setLoading(false);
				});
		}, []);

	// Loader
	if (loading) {
		return (
			<div className="loader">
				<div className="spinner"></div>
				<div className={lang === 'ar' ? 'arabic' : 'english'}>
					{lang === 'ar' ? 'جاري تحميل القائمة...' : 'Loading Menu...'}
				</div>
			</div>
		);
	}

	// Error fallback
	if (!menuData) {
		return (
			<div className="error-message">
				<div className={lang === 'ar' ? 'arabic' : 'english'}>
					{lang === 'ar' ? 'فشل تحميل بيانات القائمة. يتم عرض قائمة نموذجية.' : 'Failed to load menu data. Showing sample menu.'}
				</div>
			</div>
		);
	}

	// Main UI
		return (
			<div style={{ position: 'relative', minHeight: '100vh' }}>
				{/* API and DB status badge hidden */}
			<Router>
				<>
					<Routes>
						<Route path="/" element={
							<MenuPage
								categories={categories}
								lang={lang}
								order={order}
								setOrder={setOrder}
								addToCart={handleAddToCart}
								openCart={() => setShowCart(true)}
								openPlaceOrder={null} // MenuPage handles its own PlaceOrderModal
								setLang={setLang}
							/>
						} />
						<Route path="/dashboard" element={<Dashboard />} />
						<Route path="/admin-panel" element={<AdminPanel />} />
						{/* alias /admin to /admin-panel for direct access */}
						<Route path="/admin" element={<AdminPanel />} />
						<Route path="/admin/menu/:id" element={<AdminMenuItemDetail />} />
						<Route path="/detail/:id" element={
							<PDVWrapper
								categories={categories}
								lang={lang}
								addToCart={handleAddToCart}
								openCart={() => setShowCart(true)}
								openPlaceOrder={() => setShowPlaceOrder(true)}
								order={order}
								setLang={setLang}
								handleChangeQuantity={handleChangeQuantity}
								customerName={customerName}
								setCustomerName={handleCustomerNameChange}
								notes={notes}
								setNotes={setNotes}
								showPlaceOrder={showPlaceOrder}
								handlePlaceOrder={handlePlaceOrder}
								toast={toast}
							/>
						} />
					</Routes>
					{/* Modals are now global, always rendered */}
					<OrderSummaryModal
						show={showCart}
						order={order}
						lang={lang}
						onClose={() => setShowCart(false)}
						onRemoveItem={handleRemoveItem}
						onChangeQuantity={handleChangeQuantity}
						onClearOrder={handleClearOrder}
						onPlaceOrder={() => {
							setShowCart(false);
							setShowPlaceOrder(true);
						}}
					/>
					{process.env.NODE_ENV === 'development' && console.debug && console.debug('[DEBUG] App render notes', { notesType: typeof notes, setNotesType: typeof setNotes })}
					   <PlaceOrderModal
						   show={showPlaceOrder}
						   order={order}
						   lang={lang}
						   customerName={customerName}
						   setCustomerName={handleCustomerNameChange}
						   notes={notes}
						   setNotes={setNotes}
						   onCancel={() => setShowPlaceOrder(false)}
						   onConfirm={handlePlaceOrder}
						   onRemoveItem={handleRemoveItem}
						   onChangeQuantity={handleChangeQuantity}
						   onClearOrder={handleClearOrder}
						   toast={toast}
					   />
					<OrderSuccessModal
						show={orderSuccess?.show}
						lang={lang}
						orderId={orderSuccess?.orderId}
						customerName={orderSuccess?.customerName}
						total={orderSuccess?.total || 0}
						onNewOrder={() => setOrderSuccess(null)}
					/>
									   {/* Toast Notification for PlaceOrderModal is now rendered inside PlaceOrderModal */}
				</>
			</Router>
		</div>
	);
}

export default App;
