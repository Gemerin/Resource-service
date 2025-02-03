import http from 'node:http'
import { handle403, handle404, handle400 } from './resourceController.js'

export class ImageController {

    async createImage(imagePayload, TOKEN) {
        const options = {
            hostname: 'courselab.lnu.se',
            path: '/picture-it/images/api/v1/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`,
                'Accept': 'application/json'
            }
        }

        const data = JSON.stringify(imagePayload)

        const response = await this.makeRequest(options, data)
        return JSON.parse(response)
    }

    makeRequest(options, data) {
        return new Promise((resolve, reject) => {
            const req = http.request(options, res => {
                let responseBody = ''

                res.on('data', chunk => {
                    responseBody += chunk
                })

                res.on('end', () => {
                    if (res.statusCode === 201) {
                        resolve(responseBody)
                    } else {
                        reject({
                            status_code: res.statusCode,
                            message: responseBody
                        })
                    }
                })
            })

            req.on('error', err => {
                reject(err)
            })

            req.write(data)
            req.end()
        })
    }

    async listImages(TOKEN) {
        return new Promise((resolve, reject) => {
            const getOptions = {
                host: 'courselab.lnu.se',
                path: '/picture-it/images/api/v1/images',
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Private-Token': TOKEN,
                    'Accept': 'application/json'
                }
            }

            const getReq = http.request(getOptions, function (response) {
                response.setEncoding('utf8')
                let rawData = ''
                response.on('data', function (part) {
                    rawData += part
                })
                response.on('end', () => {
                    try {
                        if (response.headers['content-type'].includes('application/json')) {
                        const parsedData = JSON.parse(rawData)
                        resolve(parsedData)
                        } else {
                            console.log('Content-Type:', response.headers['content-type']);
                            console.log('Raw data:', rawData)
                            reject(new Error('Content Error'))
                        }
                    } catch (e) {
                        reject(e)
                    }
                })
            })

            getReq.on('error', function (e) {
                reject(e)
            })

            getReq.end()
        })
    }

    async getImage(id, TOKEN) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'courselab.lnu.se',
                path: `/picture-it/images/public/${id}`,
                headers: {
                    'X-API-Private-Token': TOKEN,
                },
            }
            http.get(options, (apiRes) => {
                let data = ''
                apiRes.on('data', (part) => {
                    data += part
                })
                apiRes.on('end', () => {
                    if (apiRes.statusCode === 403) {
                        handle403(res)
                    } else if (apiRes.statusCode === 404) {
                        handle404(res)
                    } else {
                        resolve(JSON.parse(data))
                    }
                })
            }).on('error', (error) => {
                reject(error)
            })
        })
    }

    async updateImage(id, updatedImagePayload, TOKEN) {
        return new Promise((resolve, reject) => {
            const patchOptions = {
                host: 'courselab.lnu.se',
                path: `picture-it/images/api/v1/${id}`,
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Private-Token': TOKEN,
                    'Accept': 'application/json'
                }
            }

            const patchReq = http.request(patchOptions, (response) => {
                if (response.statusCode === 204) {
                    resolve()
                } else {
                    let errorMessage = '';
                    switch (response.statusCode) {
                        case 400:
                            handle400(res)
                            break;
                        case 403:
                            handle403(res)
                            break;
                        case 404:
                            handle404(res)
                            break;
                        default:
                            errorMessage = response.statusMessage;
                            break;
                    }
                    reject({
                        status_code: response.statusCode,
                        message: response.statusMessage
                    })
                }
            })

            patchReq.on('error', (e) => {
                reject(e)
            })

            patchReq.write(JSON.stringify(updatedImagePayload))
            patchReq.end()
        })
    }

    patchImage(id, contentType, TOKEN) {
        return new Promise((resolve, reject) => {
            const patchOptionsContentType = {
                host: 'courselab.lnu.se',
                path: `picture-it/images/api/v1/${id}`,
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Private-Token': TOKEN,
                    'Accept': 'application/json'
                }
            }
            // Create the request for the contentType
            const reqContentType = https.request(patchOptionsContentType, (apiRes) => {
                if (apiRes.statusCode === 204) {
                    resolve()
                } else if (apiRes.statusCode === 400) {
                    handle400(res);
                } else if (apiRes.statusCode === 403) {
                    handle403(res);
                } else if (apiRes.statusCode === 404) {
                } else {
                    reject(new Error(`Failed to patch image: ${apiRes.statusCode}`))
                }
            })
            // Write the new image metadata to the request body
            reqContentType.write(JSON.stringify({
                contentType: contentType
            }))
            reqContentType.end()
        })
    }

    async deleteImage(id, TOKEN) {
        return new Promise((resolve, reject) => {
            const deleteOptions = {
                host: 'courselab.lnu.se',
                path: `/picture-it/images/api/v1/${id}`,
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Private-Token': TOKEN,
                    'Accept': 'application/json'
                }
            }
            const deleteReq = http.request(deleteOptions, (apiRes) => {
                if (apiRes.statusCode === 204) {
                    resolve();
                } else if (apiRes.statusCode === 403) {
                    handle403(res)
                } else if (apiRes.statusCode === 404) {
                    handle404(res)
                } else {
                    let data = ''
                    apiRes.on('data', (part) => {
                        data += part;
                    });
                    apiRes.on('end', () => {
                        reject(JSON.parse(data))
                    })
                }
            })

            deleteReq.on('error', (e) => {
                reject(e)
            })

            deleteReq.end()
        })
    }
}