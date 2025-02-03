import jwt from 'jsonwebtoken'

/**
 * Exposes methods for working with JSON Web Tokens (JWTs).
 */
export class JsonWebToken {
    /**
     * Decodes a JWT and returns the user object extracted from the payload.
     *
     * @param {string} token - The JWT to decode.
     * @param {string} key - The secret key used for verifying the JWT.
     * @returns {Promise<object>} A Promise that resolves to the user object extracted from the JWT payload.
     */
    static async decodeUser(token, key) {
        return new Promise((resolve, reject) => {
            jwt.verify(token, key, { algorithms: ['RS256'] }, (error, decoded) => {
                if (error) {
                    reject(error)
                    return
                }

                const user = {
                    id: decoded.sub,
                    firstName: decoded.firstName,
                    lastName: decoded.lastName,
                    email: decoded.email,
                    username: decoded.username
                }

                resolve(user)
            })
        })
    }
}