const express = require('express');
const router = express.Router();

const menuController = require('../../controllers/public/menu.js');

router.get('/', menuController.classification);
router.get('/ekstraksi-fitur', menuController.featuresExtraction);
router.get('/10-fold-cross-validation', menuController.crossValidation);
router.get('/model-klasifikasi', menuController.classificationModel);
router.get('/seleksi-fitur', menuController.featuresSelection);
router.get('/web-scraping', menuController.webScraping);

module.exports = router;
