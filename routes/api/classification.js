const express = require('express');
const router = express.Router();

const classificationApiController = require('../../controllers/api/classification.js');

router.post('/', classificationApiController.classify);
router.get('/is-ready', classificationApiController.checkIsReady);

module.exports = router;
