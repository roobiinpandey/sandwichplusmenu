const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');


router.post('/', ordersController.createOrder);
router.get('/', ordersController.getOrders);
router.patch('/:id', ordersController.updateOrderStatus);

module.exports = router;
