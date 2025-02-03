
import mongoose from 'mongoose'
import validator from 'validator'
import { BASE_SCHEMA } from './baseModel.js'

const { isURL } = validator

const imageSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: true,
        validate: {
            validator: (v) => {
                // Simple URL validation
                return isURL(v)
            },
            message: props => `${props.value} is not a valid URL!`
        }
    },
    location: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    id: {
        type: String,
        required: true,
        unique: true
    }
})

imageSchema.add(BASE_SCHEMA)

const imagePayloadSchema = new mongoose.Schema({
    data: {
        type: String,
        required: true
    },
    contentType: {
        type: String,
        required: true,
        enum: ['image/gif', 'image/jpeg', 'image/png']
    },
    description: {
        type: String
    },
    location: {
        type: String
    }
})
imagePayloadSchema.add(BASE_SCHEMA)

export const imagePayloadModel = mongoose.model('Pyaload', imagePayloadSchema)
export const imageModel = mongoose.model('Image', imageSchema)