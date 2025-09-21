const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  customer: String,
  phone: String,
  notes: String,
  items: Array,
  total: Number,
  time: Date,
  orderDate: String,
  orderNumber: String,
  orderSeq: Number,
  status: String
});

module.exports = mongoose.model('Order', OrderSchema);
