const express = require('express')
const router = express.Router()
const verifyController = require('../controllers/verifyController')
const loginLimiter = require('../middleware/loginLimiter')

router.route('/').get(verifyController.verifyPassMail)

router.route('/')
    .post(loginLimiter,verifyController.passMail)
    
router.route('/submit')
    .post(verifyController.verificationSuccess);

module.exports=router