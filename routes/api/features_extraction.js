const express = require('express');
const router = express.Router();

const featuresExtractionApiController = require('../../controllers/api/features_extraction.js');

router.post('/', featuresExtractionApiController.run);
router.get('/is-ready', featuresExtractionApiController.checkIsReady);

module.exports = router;
