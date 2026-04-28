const router = require('express').Router();
const ctrl = require('../controllers/reservas.controller');
const auth = require('../middlewares/auth');

router.get('/',                  auth, ctrl.getAll);
router.get('/disponibilidad',    auth, ctrl.disponibilidad);
router.post('/',                 auth, ctrl.create);
router.put('/:id/cancelar',      auth, ctrl.cancel);

module.exports = router;
