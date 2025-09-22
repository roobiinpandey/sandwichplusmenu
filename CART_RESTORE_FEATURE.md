# Cart History & Restore Feature

## Overview
This feature allows users to restore their shopping cart to any previous state, enabling them to undo cart additions or revert to specific points in time.

## How It Works

### Cart History Tracking
- **Automatic Tracking**: Every cart action (add, remove, increase quantity, decrease quantity, clear) is automatically tracked with a timestamp
- **Local Storage**: History is persisted in browser's localStorage for session persistence
- **Memory Management**: Only the last 20 cart states are kept to prevent memory bloat

### Restore Interface
- **Restore Button**: Appears in the order summary area when cart history exists (🕒 Restore Cart)
- **History Modal**: Shows chronological list of all cart states with:
  - Timestamp of each action
  - Action type (color-coded badges)
  - Total items and price for each state
  - Preview of items in that cart state
- **One-Click Restore**: Click any history entry to instantly restore the cart to that state

## Data Structure

Each history entry contains:
```javascript
{
  id: 1758581812913,                    // Unique timestamp ID
  timestamp: "2025-09-22T22:56:52.913Z", // ISO timestamp
  cart: [...],                          // Complete cart state
  action: "add",                        // Action type
  totalItems: 1,                        // Total quantity
  totalPrice: 25                        // Total price
}
```

## Action Types
- `initial` - Empty cart on app load
- `add` - Item added to cart
- `remove` - Item removed from cart  
- `increase` - Quantity increased
- `decrease` - Quantity decreased
- `clear` - Cart cleared
- `restore` - Cart restored to previous state

## Usage Instructions

### For Users
1. Add items to your cart as normal
2. If you need to undo changes, click "🕒 Restore Cart" in the order summary
3. Select any previous cart state from the history list
4. Your cart will instantly revert to that state

### For Developers
The feature integrates seamlessly with existing cart functionality:

**Key Functions:**
- `saveCartToHistory(cart, action)` - Saves cart state to history
- `restoreCartToTime(historyEntry)` - Restores cart to specific state
- `RestoreCartModal` - UI component for selecting restore points

**Integration Points:**
- `App.js` - Main cart logic and history management
- `MenuPage.js` - Restore button in cart actions
- `RestoreCartModal.js` - History selection interface

## Bilingual Support
The interface supports both English and Arabic:
- English: "🕒 Restore Cart" 
- Arabic: "🕒 استعادة العربة"

## Browser Compatibility
Works in all modern browsers that support:
- localStorage API
- ES6 JavaScript features
- React 16.8+ (hooks)