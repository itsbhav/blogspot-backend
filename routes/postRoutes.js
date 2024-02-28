const express = require('express')
const router = express.Router()
const postsController = require('../controllers/postController')
const verifyJWT = require('../middleware/verifyJWT')

router.route("/public").get(postsController.randomPosts);
router.use(verifyJWT)

router.route('/')
    .patch(postsController.updatePost)
    .delete(postsController.deletePost)
    .post(postsController.createNewPost)
router.route('/reaction').patch(postsController.handleReactions)
router.route('/getAll').get(postsController.getAllPost)
router.route('/:id').get(postsController.getPostsByUserId)
module.exports = router