# Resource service

The Resource Service is a RESTful API responsible for managing resources in the system. It should follow the API documentation. While it is possible to extend the API, the endpoints described in the documentation must still work and provide at least the data specified.

There are a few things to note when implementing the Resource Service:

- The default maximum payload size for the body-parser JSON in Express is 100kb. However, your application should be able to handle larger images, so the limit should be extended to 500kb using the following code:

  ```javascript
  app.use(express.json({ limit: "500kb" }))
  ```

- In a microservice architecture, it is recommended that each service runs its instance of MongoDB, even if it is possible to use the same one or an existing one on the production server. This helps to decouple services and make them easier to develop, deploy, and scale independently. 

