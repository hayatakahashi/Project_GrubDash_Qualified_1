
// TODO: Implement the /orders routes needed to make the tests pass

const router = require("express").Router();
const controller = require("./orders.controller")
const methodNotAllowed = require("../errors/methodNotAllowed")

router
    .route("/")                     // We're defining a route for the base path (e.g., "/orders" if this router is used for orders in the main application file).
    .get(controller.list)           // When a GET request is made to this route, the list function from the controller will be executed
    .post(controller.create)        // When a POST request is made to this route, the create function from the controller will be executed.
    .all(methodNotAllowed)          // If any other HTTP method (like PUT or DELETE) is used on this route, the methodNotAllowed middleware will be executed, likely sending a "Method Not Allowed" response

router
    .route("/:orderId")             // We're defining another route that expects an orderId parameter in the URL (e.g., "/orders/123" where "123" is the orderId)
    .get(controller.read)           // This will "READ" to the clients the order for that specific ID. For a GET request on this route, the read function from the controller will be executed.
    .put(controller.update)         // This will UPDATE the order for that specific order ID. For a PUT request on this route, the update function from the controller will be executed.
    .delete(controller.delete)      // This will DELETE the order for that specific ID. For a DELETE request on this route, the delete function from the controller will be executed.
    .all(methodNotAllowed)          //As with the base route, if any other HTTP method not defined above is used on this route, the methodNotAllowed middleware will execute.

module.exports = router;                
