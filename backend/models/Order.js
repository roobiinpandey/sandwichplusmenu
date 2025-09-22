const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  customer: { type: String, required: true, maxlength: 100 },
  phone: { type: String, maxlength: 20 },
  notes: { type: String, maxlength: 500 },
  items: [{
    id: String,
    name_en: String,
    name_ar: String,
    price: Number,
    quantity: Number,
    size: String,
    breadDisplay: String,
    bread: mongoose.Schema.Types.Mixed,
    category: String
  }],
  total: { type: Number, required: true, min: 0 },
  time: { type: Date, default: Date.now },
  orderDate: { type: String, required: true }, // YYYYMMDD format
  orderNumber: { type: String, required: true },
  orderSeq: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'cancelled'], 
    default: 'pending',
    lowercase: true
  }
}, {
  timestamps: true // Auto createdAt/updatedAt
});

// Critical Performance Indexes
OrderSchema.index({ orderDate: 1, status: 1 }); // Dashboard filtering by date and status
OrderSchema.index({ time: -1 }); // Latest orders first (most common query)
OrderSchema.index({ status: 1, time: -1 }); // Filter by status, sort by time
OrderSchema.index({ customer: 1 }); // Customer lookup
OrderSchema.index({ orderSeq: 1 }); // Order sequence lookup
OrderSchema.index({ orderNumber: 1 }); // Order number lookup (unique identifier)

// Compound index for dashboard queries
OrderSchema.index({ orderDate: 1, status: 1, time: -1 });

module.exports = mongoose.model('Order', OrderSchema);
