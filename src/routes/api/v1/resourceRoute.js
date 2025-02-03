import express from 'express'
import { authenticateJWT } from '../../../middleware/auth.js'
import { ResourceController } from '../../../controllers/api/resourceController.js'

export const router = express.Router()

const resourceController = new ResourceController

// Provide req.image to the route if :id is present in the route path.
//router.param('id', resourceController.loadImageDocument)

// GET /images
router.get('/',
    authenticateJWT,
    (req, res, next) => resourceController.listImageData(req, res, next)
)

router.post('/',
    authenticateJWT,
    (req, res, next) => resourceController.createImageData(req, res, next)
)

// GET /images/:id
router.get('/:id',
    authenticateJWT,
    (req, res, next) => resourceController.getImageData(req, res, next)
)

// PUT /images/:id
router.put('/:id',
    authenticateJWT,
    (req, res, next) => resourceController.editImageData(req, res, next)
)
// PATCH /images/:id
router.patch('/:id',
    authenticateJWT,
    (req, res, next) => resourceController.partiallyEditImageData(req, res, next)
)

// DELETE /images/:id
router.delete('/:id',
    authenticateJWT,
    (req, res, next) => resourceController.deleteImageData(req, res, next)
)