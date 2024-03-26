const express = require('express')
const router = express.Router()
const verifyController = require('../controllers/verifyController')
const verifyJWT = require('../middleware/verifyJWT')


router.route('/').get(verifyController.verifyMail)

router.use(verifyJWT) 
 
router.route('/')
    .post(verifyController.mail)


module.exports=router