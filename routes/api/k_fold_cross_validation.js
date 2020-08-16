const express = require('express');
const router = express.Router();

const crossValidationApiController = require('../../controllers/api/k_fold_cross_validation.js');

router.post('/', crossValidationApiController.run);
router.post('/multi-testing', crossValidationApiController.multiTesting);
router.post('/save-model', crossValidationApiController.saveModel);
router.get('/is-ready', crossValidationApiController.checkIsReady);

module.exports = router;
