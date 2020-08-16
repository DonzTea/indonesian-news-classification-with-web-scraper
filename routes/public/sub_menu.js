const express = require('express');
const router = express.Router();

const subMenuController = require('../../controllers/public/sub_menu.js');

router.get('/label-dan-stopword', subMenuController.labelAndStopword);
router.get('/dokumen/:slugDocType', subMenuController.datasets);
router.get('/dataset-detail/:id', subMenuController.documentDetail);
router.get('/:slugProcessName/fold-:foldNumber', subMenuController.foldDetail);

module.exports = router;
