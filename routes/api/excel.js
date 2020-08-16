const express = require('express');
const router = express.Router();

const excelApiController = require('../../controllers/api/excel.js');

router.get('/label-template', excelApiController.downloadLabelTemplateFile);
router.get('/label', excelApiController.downloadLabelFile);
router.post('/label', excelApiController.uploadLabelFile);
router.get(
  '/stopword-template',
  excelApiController.downloadStopwordTemplateFile,
);
router.get('/stopword', excelApiController.downloadStopwordFile);
router.post('/stopword', excelApiController.uploadStopwordFile);
router.get('/dataset-template', excelApiController.downloadDatasetTemplateFile);
router.get(
  '/dataset/:slugDocType',
  excelApiController.downloadDatasetFileWhereType,
);
router.post('/dataset', excelApiController.uploadDatasetFileWhereType);
router.get('/term/:slugSource', excelApiController.downloadTermFileWhereSource);
router.get('/tf/:slugSource', excelApiController.downloadTfFileWhereSource);
router.get('/idf', excelApiController.downloadIdfFile);
router.get(
  '/tf-idf/:slugSource',
  excelApiController.downloadTfIdfFileWhereSource,
);
router.get('/scraped-data', excelApiController.downloadScrapedDataFile);

module.exports = router;
