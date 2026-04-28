const router = require('express').Router();
const ctrl  = require('../controllers/usuarios.controller');
const auth  = require('../middlewares/auth');
const roles = require('../middlewares/roles');

router.get('/',                       auth, roles('admin'), ctrl.getAll);
router.get('/admins',                 auth, roles('admin'), ctrl.getAdmins);
router.post('/',                      auth, roles('admin'), ctrl.create);
router.put('/me/password',            auth,                 ctrl.changePassword);
router.put('/:id/toggle',             auth, roles('admin'), ctrl.toggle);
router.put('/:id/reset-password',     auth, roles('admin'), ctrl.resetPassword);
router.put('/:id',                    auth, roles('admin'), ctrl.update);

module.exports = router;
