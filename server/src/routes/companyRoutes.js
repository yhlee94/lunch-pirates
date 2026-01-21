// server/src/routes/companyRoutes.js
const express = require('express');
const router = express.Router();
const { searchCompany } = require('../controllers/companyController');

router.get('/search', searchCompany);

module.exports = router;