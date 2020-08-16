const express = require('express');
const router = express.Router();

const featuresSelectionApiController = require('../../controllers/api/features_selection.js');

router.post('/', featuresSelectionApiController.run);
router.post('/update-model', featuresSelectionApiController.updateModel);

module.exports = router;
