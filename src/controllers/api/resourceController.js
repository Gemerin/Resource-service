import https from 'node:https'
import { imageModel } from '../../models/imageModel.js'
import { ImageController } from './imageController.js'

const imageControllerInstance = new ImageController()

export function handle403(res) {
    return res.status(403).json({
        status_code: 403,
        message: "The request contained valid data and was understood by the server, but the server is refusing action due to the authenticated user not having the necessary permissions for the resource."
    })
}

export function handle404(res) {
    return res.status(404).json({
        status_code: 404,
        message: "The requested resource was not found."
    })
}

export function handle400(res) {
    return res.status(400).json({
        status_code: 400,
        message: "The request cannot or will not be processed due to something that is perceived to be a client error (for example, validation error)."
    })
}

export class ResourceController {

    /** Provide req.doc to the route if: id is present.
     *
     * @param { object } req - Express request object.
     * @param { object } res - Express response object.
     * @param { Function } next - Express next middleware function.
     * @param { string } id - The value of the id for the task to load.
     */
    async loadImageDocument(req, res, next, id) {
        try {
            logger.silly('Loading task document', { id })
            const imageDocument = await imageModel.findById(id)
            if (!imageDocument) {
                return handle404(res)
            }
            req.doc = imageDocument
            logger.silly('Loaded task document', { id })
            next()
        } catch (error) {
            next(error)
        }
    }

    /**
     * List all images for the authenticated user. // save data
     *
     * @param {object} req - Express request object.
     * @param {object} res - Express response object.
     * @param {Function} next - Express next middleware function.
     */
    async listImageData(req, res, next) {
        try {
            const TOKEN = req.headers.authorization.split(' ')[1]
            const externalImages = await imageControllerInstance.listImages(TOKEN)

            const savedImages = []
            for (const imageData of externalImages) {
                let image = await imageModel.findOne({ id: imageData.id })
                if (image) {
                    // Update existing image
                    image.imageUrl = imageData.imageUrl
                    image.description = imageData.description || 'No description provided'
                    image.location = imageData.location || 'No location provided'
                    image.createdAt = imageData.createdAt
                    image.updatedAt = imageData.updatedAt
                } else {
                    image = new imageModel({
                        imageUrl: imageData.imageUrl,
                        description: imageData.description || 'No description provided',
                        location: imageData.location || 'No location provided',
                        createdAt: imageData.createdAt,
                        updatedAt: imageData.updatedAt,
                        id: imageData.id
                    })
                }
                const savedImage = await image.save()
                savedImages.push(savedImage)
            }

            res.status(200).json(savedImages)
        } catch (error) {
            next(error)
        }
    }

    /**
     * Asynchronously creates a new image.
     * 
     * This function encodes the image data to base64 format, creates a new image payload with the base64 data and the mimetype of the file, and sends a POST request to an external API to create the image.
     * If the necessary image data is not provided in the request, it sends a 400 status code response.
     * If the necessary metadata (description and location) is not provided in the request, it sends a 400 status code response.
     * If the image is successfully created, it saves the image metadata in the database and sends a 201 status code response with the new image data.
     * If an error occurs during the request to the external API or during the saving of the image metadata, it passes the error to the next middleware function.
     * 
     * @async
     * @param {Object} req - The request object.
     * @param {Object} res - The response object.
     * @param {Function} next - The next middleware function.
     * @returns {Promise<void>} - A Promise that resolves when the function has completed.
     */
    async createImageData(req, res, next) {
        try {
            // Check if necessary data is provided
            if (!req.body.description || !req.body.location || !req.body.data || !req.body.contentType) {
                return handle400(res)
            }

            const TOKEN = req.headers.authorization.split(' ')[1]
            const imagePayload = {
                data: req.body.data, // Base64 encoded image data
                contentType: req.body.contentType,
            }
            try {
                const responseData = await imageControllerInstance.createImage(imagePayload, TOKEN)

                // create new image metadata
                const newImage = {
                    imageUrl: responseData.imageUrl,
                    location: req.body.location,
                    description: req.body.description,
                    id: responseData.id
                }
                // save metadata in database
                try {
                    const createdImage = await imageModel.create(newImage)
                    res.status(201).json(createdImage)
                } catch (error) {
                    next(error)
                }
            } catch (error) {
                res.status(error.status_code).json({
                    status_code: error.status_code,
                    message: error.message
                })
            }
        } catch (error) {
            next(error)
        }
    }

    /**
     * Makes a get request to external api 
     * Collects the response data in parts, once all data recieved it updates the resource api
     * snds received data back to client
     * @param {*} req 
     * @param {*} res 
     * @param {*} next 
     */
    async getImageData(req, res, next) {
        try {
            const { id } = req.params
            const TOKEN = req.headers.authorization.split(' ')[1]

            try {
                const externalData = await imageControllerInstance.getImage(id, TOKEN)
                // Update the metadata in your current API based on externalData
                await getImage(id, {
                    createdAt: externalData.createdAt,
                    updatedAt: externalData.updatedAt,
                    imageUrl: `https://courselab.lnu.se/picture-it/images/public/${id}`

                })
                res.status(200).json({
                    imageUrl: `https://courselab.lnu.se/picture-it/images/public/${id}`,
                    description: externalData.description,
                    location: externalData.location,
                    createdAt: externalData.createdAt,
                    updatedAt: externalData.updatedAt,
                    id: id
                })
            } catch (error) {
                if (error.status_code === 403) {
                    return handle403(res)
                }
                if (error.status_code === 404) {
                    return handle404(res)
                }
                next(error)
            }
        } catch (error) {
            next(error)
        }
    }

    /**
     * Asynchronously edits an existing image.
     * 
     * This function extracts the necessary data from the request, including the token from the headers and the image data, contentType, description, and location from the body. It sends a PUT request to an external API to update the contentType of the image. If the necessary data is not provided in the request, it sends a 400 status code response.
     * If the image is successfully updated, it updates the image metadata in the database and sends a 201 status code response with the updated image data.
     * If an error occurs during the request to the external API or during the updating of the image metadata, it passes the error to the next middleware function.
     * 
     * @async
     * @param {Object} req - The request object.
     * @param {Object} res - The response object.
     * @param {Function} next - The next middleware function.
     * @returns {Promise<void>} - A Promise that resolves when the function has completed.
     */
    async editImageData(req, res, next) {
        try {
            const { id } = req.params
            // Check if necessary data is provided
            if (!req.body.data || !req.body.contentType) {
                return handle400(res)
            }
            // create new image payload
            const updatedImagePayload = {
                data: req.body.data,
                contentType: req.body.contentType
            }
            const TOKEN = req.headers.authorization.split(' ')[1]

            await imageControllerInstance.updateImage(id, updatedImagePayload, TOKEN)
            // store metadata
            const resourceMetadata = {
                id: id,
                data: req.body.data,
                contentType: req.body.contentType,
                description: req.body.description,
                location: req.body.location
            }
            try {
                await imageModel.findByIdAndUpdate(id, resourceMetadata, { new: true });
                res.status(201).json(resourceMetadata)
            } catch (error) {
                if (error.status_code === 400) {
                    // Handle 400 error
                    return handle400(res)
                } else if (error.status_code === 403) {
                    // Handle 403 error
                    return handle403(res)
                } else if (error.status_code === 404) {
                    // Handle 404 error
                    return handle404(res)
                } else {
                    // Handle other errors
                    next(error)
                }
            }
        } catch (error) {
            next(error)
        }
    }


    async partialEditData(req, res, next) {
        try {
            const { id } = req.params
            // Check if necessary data is provided
            if (!req.body.description) {
                return handle400(res)
            }
            // Find image by id
            const image = await imageModel.findById(id);

            // If image is not found, return a 404 error
            if (!image) {
                return handle404(res)
            }
            // update description in RS
            image.description = req.body.description
            image.contentType = req.body.contentType
            await image.save()

            // patch image in Image service
            const TOKEN = req.headers.authorization.split(' ')[1]
            await imageControllerInstance.patchImage(id, req.body.contentType, TOKEN)
        } catch (error) {
            if (error.message === 'Forbidden') {
                handle403(res)
            } else {
                next(error)
            }
        }
    }

    async deleteImageData(req, res, next) {
        try {
            const { id } = req.params

            const image = await imageModel.findById(id)
            if (!image) {
                return handle404(res)
            }

            const TOKEN = req.headers.authorization.split(' ')[1]

            await deleteImage(id, TOKEN)

            await imageModel.findByIdAndDelete(id)

            res.status(204).end()
        } catch (error) {
            if (error.status) {
                if (error.status === 403) {
                    handle403(res);
                } else if (error.status === 404) {
                    handle404(res);
                } else {
                    res.status(error.status).json(error)
                }
            } else {
                next(error)
            }
        }

    }
}