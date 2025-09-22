// PATCH /orders/:id - update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: 'Missing status in request body' });
    const updated = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    if (!updated) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status', details: err.message });
  }
};
const Order = require('../models/Order');
const Counter = require('../models/Counter');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');

exports.createOrder = [
  body('customer').isLength({ min: 1 }).withMessage('Customer name is required'),
  body('items').isArray({ min: 1 }).withMessage('Items must be a non-empty array'),
  body('total').isNumeric().withMessage('Total must be a number'),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const now = new Date();
      const orderDate = now.toISOString().slice(0,10).replace(/-/g,''); // YYYYMMDD
      const formattedDate = now.toLocaleDateString('en-GB'); // DD/MM/YYYY for display
      const adminDb = mongoose.connection.db;
      const counterId = `orders-${orderDate}`;
      const retentionMs = 90 * 24 * 60 * 60 * 1000; // 90 days
      const expireAt = new Date(Date.now() + retentionMs);
      let seqNum;
      try {
        const seqDoc = await Counter.findOneAndUpdate(
          { _id: counterId },
          { $inc: { seq: 1 }, $setOnInsert: { createdAt: new Date(), expireAt } },
          { new: true, upsert: true }
        );
        seqNum = seqDoc ? seqDoc.seq : null;
      } catch (errFind) {
        seqNum = 1;
      }
      if (typeof seqNum !== 'number') {
        try {
          await Counter.updateOne(
            { _id: counterId },
            { $inc: { seq: 1 }, $setOnInsert: { createdAt: new Date(), expireAt } },
            { upsert: true }
          );
          const fetched = await Counter.findOne({ _id: counterId });
          seqNum = (fetched && typeof fetched.seq === 'number') ? fetched.seq : 1;
        } catch (errFallback) {
          seqNum = 1;
        }
      }
      const orderSeq = seqNum;
      const seq = String(orderSeq).padStart(3, '0');
      const orderNumber = `${seq}-${formattedDate}`; // Display as NNN-DD/MM/YYYY
      const newOrderData = {
        customer: req.body.customer,
        phone: req.body.phone || '',
        notes: req.body.notes || '',
        items: req.body.items,
        total: req.body.total,
        time: new Date(),
        orderDate, // YYYYMMDD for querying
        orderNumber, // Display format
        orderSeq,
        status: req.body.status || 'pending'
      };
      const MAX_SAVE_RETRIES = 3;
      let saveErr = null;
      let savedOrder = null;
      for (let attempt = 1; attempt <= MAX_SAVE_RETRIES; attempt++) {
        try {
          const newOrder = new Order(newOrderData);
          savedOrder = await newOrder.save();
          saveErr = null;
          break;
        } catch (errSave) {
          saveErr = errSave;
          if (errSave && errSave.code === 11000) {
            const seqDocRetry = await adminDb.collection('counters').findOneAndUpdate(
              { _id: counterId },
              { $inc: { seq: 1 } },
              { returnDocument: 'after', returnOriginal: false }
            );
            let retrySeq = (seqDocRetry && seqDocRetry.value && typeof seqDocRetry.value.seq === 'number') ? seqDocRetry.value.seq : (seqDocRetry && typeof seqDocRetry.seq === 'number' ? seqDocRetry.seq : null);
            if (retrySeq) {
              newOrderData.orderSeq = retrySeq;
              newOrderData.orderNumber = `${String(retrySeq).padStart(3,'0')}-${formattedDate}`;
              continue;
            }
          }
          break;
        }
      }
      if (saveErr) {
        return res.status(500).json({ error: 'Failed to save order', details: saveErr.message });
      }
      res.json({ success: true, receivedBody: req.body, order: savedOrder });
    } catch (err) {
      res.status(500).json({ error: 'Failed to save order' });
    }
  }
];

exports.getOrders = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Default 50 orders per page
    const skip = (page - 1) * limit;
    
    // Date filtering
    const { date, status, all } = req.query;
    let query = {};
    
    if (all !== 'true') {
      // Default to today's orders if no specific date provided
      const targetDate = date || new Date().toISOString().slice(0,10).replace(/-/g,'');
      query.orderDate = targetDate;
    }
    
    // Status filtering
    if (status && status !== 'all') {
      query.status = status.toLowerCase();
    }
    
    // Build aggregation pipeline for better performance
    const pipeline = [
      { $match: query },
      { $sort: { time: -1 } }, // Most recent first
      { 
        $facet: {
          orders: [
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                customer: 1,
                phone: 1,
                items: 1,
                total: 1,
                time: 1,
                orderDate: 1,
                orderNumber: 1,
                orderSeq: 1,
                status: 1,
                notes: 1,
                createdAt: 1
              }
            }
          ],
          totalCount: [{ $count: "count" }]
        }
      }
    ];
    
    const result = await Order.aggregate(pipeline);
    const orders = result[0].orders;
    const totalCount = result[0].totalCount[0]?.count || 0;
    const totalPages = Math.ceil(totalCount / limit);
    
    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    console.error('Failed to fetch orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders', details: err.message });
  }
};
