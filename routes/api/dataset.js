const express = require('express');
const router = express.Router();

const datasetApiController = require('../../controllers/api/dataset.js');

router.post('/', datasetApiController.create);
router.get('/:id', datasetApiController.detail);
router.put('/:id', datasetApiController.update);
router.delete('/:id', datasetApiController.destroy);
router.post('/filter', datasetApiController.filter);
router.post('/delete-where', datasetApiController.destroyMany);

module.exports = router;
