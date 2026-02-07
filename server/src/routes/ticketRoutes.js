const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/status', verifyToken, ticketController.getTicketStatus);
router.post('/insert-coin', verifyToken, ticketController.insertCoin);
router.post('/pull-lever', verifyToken, ticketController.pullLever);
router.post('/push-button', verifyToken, ticketController.pushButton);

module.exports = router;
