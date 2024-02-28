const express = require('express')
const router = express.Router()
const usersController = require('../controllers/userController')
const verifyJWT = require('../middleware/verifyJWT')


router.route('/create').post(usersController.createNewUser)

router.use(verifyJWT) 
 
router.route('/')
    .patch(usersController.updateUser)
    .delete(usersController.deleteUser)
router.route('/friend').patch(usersController.handleFriendReq)
router.route('/accept').patch(usersController.handleAcceptReq)
router.route('/other/:searchInput').get(usersController.getUsersBySearch)
router.route('/recommend').get(usersController.getRecommendations)
router.route('/:id').get(usersController.getUsersById)
module.exports = router