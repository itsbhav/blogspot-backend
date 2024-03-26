const express = require('express')
const router = express.Router()
const verifyController = require('../controllers/verifyController')


router.route('/').get(verifyController.verifyPassMail)

router.route('/')
    .post(verifyController.passMail)
    
router.route('/submit')
    .post(verifyController.verificationSuccess);

module.exports=router