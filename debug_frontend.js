// Add this to your frontend order submission code to debug the 500 error

// In MenuPage.js or wherever you handle order submission, replace the current logging with:

console.log('[DEBUG] Detailed order payload:');
console.log('Customer:', orderData.customer, 'Type:', typeof orderData.customer);
console.log('Items:', JSON.stringify(orderData.items, null, 2));
console.log('Total:', orderData.total, 'Type:', typeof orderData.total);
console.log('Phone:', orderData.phone, 'Type:', typeof orderData.phone);
console.log('Notes:', orderData.notes, 'Type:', typeof orderData.notes);
console.log('Full payload:', JSON.stringify(orderData, null, 2));

// Then in your fetch call, add detailed error handling:
fetch(`${API_BASE_URL}/orders`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(orderData)
})
.then(async response => {
  console.log('Response status:', response.status);
  console.log('Response status text:', response.statusText);
  
  const responseText = await response.text();
  console.log('Response body (raw):', responseText);
  
  if (!response.ok) {
    console.error('HTTP Error Details:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    });
    throw new Error(`HTTP ${response.status}: ${responseText}`);
  }
  
  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    console.error('JSON Parse Error:', parseError);
    throw new Error('Invalid JSON response from server');
  }
})
.then(result => {
  console.log('Order success:', result);
  // Handle success
})
.catch(error => {
  console.error('Order submission failed:', error);
  console.error('Error stack:', error.stack);
  // Handle error
});
