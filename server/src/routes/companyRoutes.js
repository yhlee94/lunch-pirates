// server/src/routes/companyRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/companyController');

router.get('/search', controller.searchCompany);
router.get('/rankings/:companyId', controller.getCompanyRankings);

module.exports = router;