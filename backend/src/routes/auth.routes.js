const router = require('express').Router();
const { login, logout, me } = require('../controllers/auth.controller');
const auth = require('../middlewares/auth');

router.post('/login',  login);
router.post('/logout', logout);
router.get('/me',      auth, me);

module.exports = router;
