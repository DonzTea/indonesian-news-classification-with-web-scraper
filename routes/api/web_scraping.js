const express = require('express');
const router = express.Router();

const webScrapingApiController = require('../../controllers/api/web_scraping.js');

router.post('/run-bot', webScrapingApiController.run);
router.post('/', webScrapingApiController.create);
router.get('/:id', webScrapingApiController.detail);
router.delete('/:id', webScrapingApiController.destroy);
router.post('/delete-where', webScrapingApiController.destroyMany);

module.exports = router;
