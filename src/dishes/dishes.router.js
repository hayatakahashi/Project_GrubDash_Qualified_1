const router = require("express").Router();
const controller = require("./dishes.controller")                 // This module contains the route handler functions for the dishes, as you showed previously. These handlers execute the main logic when a route is hit.
const methodNotAllowed = require("../errors/methodNotAllowed")    // This is a middleware that will respond with an error if an HTTP method (GET, POST, PUT, etc.) is used on a route that doesn't support it.

// TODO: Implement the /dishes routes needed to make the tests pass


router
    .route("/")                        // In app.js, there is: app.use("/dishes", dishesRouter); SO you're telling your Express application that any requests that start with the path /dishes should be handled by the router.
    .get(controller.list)              // attaches a GET request handler to the "/" path. Specifically, when a GET request is made to this path, the controller.list function will be executed. The controller.list function sends back a list of all dishes to the client.
    .post(controller.create)           // attaches a POST request handler to the "/" path. When a POST request is made to this path, the controller.create function will be executed.
    .all(methodNotAllowed);            // attaches a catch-all handler for all other HTTP methods (like PUT, DELETE, etc.) for the "/" path that haven't been explicitly defined. When a request with any other method (not GET or POST in this case) is made to this path, the methodNotAllowed function will be executed


router
    .route("/:dishId")                 // This colon (:) denotes that it's a variable part of the URL, often referred to as a route parameter. When a user makes a request to an actual URL, whatever value is in the place of :dishId will be captured and stored in req.params.dishId. For instance, if someone accesses the path /dishes/123, then inside any of your route's middleware or handlers, req.params.dishId will be "123".
    .get(controller.read)              // This means that when a client sends a GET request to /dishes/:dishId (like /dishes/123), the function controller.read will be executed. This function is expected to return the details of the dish with the ID 123 in our example.
    .put(controller.update)            // When a client sends a PUT request to /dishes/:dishId (e.g., /dishes/123), it indicates they want to update the resource with ID 123. In response, the controller.update function will be executed. This function is responsible for updating the details of the dish with the given ID and returning the updated data.
    .all(methodNotAllowed);            // his is a catch-all for any other HTTP methods sent to /dishes/:dishId that aren't GET or PUT. For instance, if someone tries to send a DELETE request to /dishes/123, the methodNotAllowed function will be triggered. It's a way of explicitly handling and notifying the client that certain methods aren't allowed on this route.

/* In a nutshell:

The route /:dishId lets you target a specific dish by its ID.
Different operations (like reading or updating the dish) are handled by different HTTP methods (GET and PUT, respectively).
Any unsupported methods will trigger an error, helping maintain the application's robustness and security. */



module.exports = router;
