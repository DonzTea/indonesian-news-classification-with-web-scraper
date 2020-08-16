const express = require('express');
const router = express.Router();

const labelApiController = require('../../controllers/api/label.js');

router.post('/', labelApiController.create);
router.get('/', labelApiController.read);
router.get('/is-empty', labelApiController.checkIsEmpty);
router.get('/:id', labelApiController.detail);
router.put('/:id', labelApiController.update);
router.delete('/:id', labelApiController.destroy);
router.post('/delete-where', labelApiController.destroyWhere);

module.exports = router;
