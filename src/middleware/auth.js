/**
 * Authentication and authorization middlewares.
 */

import fs from 'fs'
import { JsonWebToken } from '../lib/JsonWebToken.js'
const key = fs.readFileSync('./keys/public.pem')
//('/var/www/auth-service/keys/public.pem', 'utf8')


/**
 * Authenticates a request based on a JSON Web Token (JWT).
 *
 * This middleware checks the authorization header of the request, verifies the authentication scheme,
 * decodes the JWT using the provided secret key, and attaches the decoded user object to the `req.user` property.
 * If the authentication fails, an unauthorized response with a 401 Unauthorized status code is sent.
 *
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
export const authenticateJWT = async (req, res, next) => {
  try {
    const [authenticationScheme, token] = req.headers.authorization?.split(' ')

    if (authenticationScheme !== 'Bearer') {
      throw new Error('Invalid authentication scheme.')
    }

    req.user = await JsonWebToken.decodeUser(token, key) // public nyckel

    next()
  } catch (error) {
    console.log(error.message)
    // Authentication failed.
    const err = new Error('Access token invalid or not provided.')
    err.status = 401

    next(err)
  }
}
