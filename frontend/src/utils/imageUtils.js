// Image utility functions
const API_BASE_URL = 'https://swp-backend-x36i.onrender.com';

/**
 * Constructs a full image URL from a relative path
 * @param {string} imagePath - The image path from the backend (e.g., "/images/filename.jpg")
 * @returns {string} - The full image URL or a placeholder if no image
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return 'https://via.placeholder.com/300x200?text=No+Image';
  }
  
  // If it's already a full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it starts with a slash, it's a relative path from the backend
  if (imagePath.startsWith('/')) {
    return API_BASE_URL + imagePath;
  }
  
  // Otherwise, assume it's just a filename and prepend the images path
  return `${API_BASE_URL}/images/${imagePath}`;
};

/**
 * Gets the image URL from an item's images array
 * @param {object} item - The menu item with images array
 * @param {string} placeholder - Custom placeholder URL (optional)
 * @returns {string} - The full image URL or placeholder
 */
export const getItemImageUrl = (item, placeholder) => {
  const defaultPlaceholder = placeholder || 'https://via.placeholder.com/300x200?text=No+Image';
  
  if (!item || !item.images || !Array.isArray(item.images) || item.images.length === 0) {
    return defaultPlaceholder;
  }
  
  return getImageUrl(item.images[0]);
};
