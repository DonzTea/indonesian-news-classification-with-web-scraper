const express = require('express');
const router = express.Router();

const stopwordApiController = require('../../controllers/api/stopword.js');

router.post('/', stopwordApiController.create);
router.get('/', stopwordApiController.read);
router.get('/is-empty', stopwordApiController.checkIsEmpty);
router.get('/:id', stopwordApiController.detail);
router.put('/:id', stopwordApiController.update);
router.delete('/:id', stopwordApiController.destroy);
router.post('/search', stopwordApiController.search);
router.post('/delete-where', stopwordApiController.destroyMany);

module.exports = router;
