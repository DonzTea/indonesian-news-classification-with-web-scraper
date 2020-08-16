const express = require('express');
const router = express.Router();

const performanceMeasureApiController = require('../../controllers/api/performance_measure.js');

router.get(
  '/fold-:foldNumber',
  performanceMeasureApiController.readPerformanceWhere,
);

module.exports = router;
