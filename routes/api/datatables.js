const express = require('express');
const router = express.Router();

const datatablesApiController = require('../../controllers/api/datatables.js');

router.post('/datasets', datatablesApiController.readDatasetsWhere);
router.get('/idf-model', datatablesApiController.readIdfModel);
router.get(
  '/tf-idf-model/fold-:foldNumber',
  datatablesApiController.readTfIdfModelWhere,
);
router.get(
  '/clasification-model/fold-:foldNumber/:label',
  datatablesApiController.readClassificationModelWhere,
);
router.get(
  '/gaussian-distribution/:slugProcessName/:docId/:label',
  datatablesApiController.readGaussianDistributionsWhere,
);
router.get(
  '/probability/:slugProcessName/fold-:foldNumber',
  datatablesApiController.readProbabilityOfDocumentWhere,
);
router.get(
  '/classification-result/:slugProcessName/fold-:foldNumber',
  datatablesApiController.readClassificationResultsWhere,
);
router.get(
  '/confusion-matrix/:slugProcessName/fold-:foldNumber',
  datatablesApiController.readConfusionMatrixWhere,
);
router.get('/web-scraping', datatablesApiController.readWebScrapingResults);

module.exports = router;
