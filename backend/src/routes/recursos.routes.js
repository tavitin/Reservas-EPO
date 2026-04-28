const router = require('express').Router();
const ctrl  = require('../controllers/recursos.controller');
const auth  = require('../middlewares/auth');
const roles = require('../middlewares/roles');

router.get('/',     auth, ctrl.getAll);
router.post('/',    auth, roles('admin'), ctrl.create);
router.put('/:id',  auth, roles('admin'), ctrl.update);
router.delete('/:id', auth, roles('admin'), ctrl.remove);

module.exports = router;
