const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass

const orderExists = (req, res, next) => {
    const orderId = req.params.orderId                                          // it extracts the orderId parameter from the URL. For example, if the URL is /orders/12345, then req.params.orderId would be '12345'.
    res.locals.orderId = orderId
    const foundOrder = orders.find((order) => order.id === orderId);            // res.locals is an object where you can store data specific to the request-response cycle. it's storing the orderId for potential use in subsequent middleware or handler functions
    if (!foundOrder) {
        return next({                                                           // If no matching order is found in the orders array, foundOrder will be undefined, making this condition true
            status: 404, 
            message: `Order not found: ${orderId}`                              // If the order wasn't found, it invokes the next function with an error object. This essentially skips any subsequent middleware or handler functions and goes straight to error handling in your Express app. 
        })
    }
    res.locals.order = foundOrder                                               // If the order was found, it's stored in res.locals.order so that it can be accessed by subsequent middleware or handler functions without having to search for it again.
}

/* It checks if the requested order exists, and if it doesn't, it sends a 404 error response.
If the order does exist, it attaches the order to the response object for easy access in subsequent parts of the request-response cycle */

const orderValidDeliverTo = (req, res, next) => {
    const { data = null } = req.body                                            // Example somewhere below! Using destructuring to get the data property from req.body. If req.body doesn't have a data property, it defaults to null.
    res.locals.newOD = data                                                     // It saves the extracted data (from the request body) to res.locals.newOD
    const orderdeliverTo = data.deliverTo                                       // From the data object, it extracts the deliverTo property, which is presumably a field representing the delivery address or destination.
    if (!orderdeliverTo || orderdeliverTo.length === 0) {                       /* The condition checks two things: 1. If the orderdeliverTo exists (i.e., it's not undefined or null). 2. If it's not an empty string (i.e., its length is greater than 0). */
        return next({
            status: 400,
            message: "Order must include a deliverTo"                           // If the condition in (4) is true, meaning the deliverTo field is either missing or empty, the middleware function will call the next function with an error object.
        })
    }
}

/* In essence, orderValidDeliverTo checks that the order data has a valid deliverTo field (not missing and not an empty string). If the field is invalid, it interrupts the flow, preventing any subsequent handlers or middleware from running, and signals an error. If the field is valid, it does nothing, allowing the next middleware or handler to execute. */


const orderHasValidMobileNumber = (req, res, next) => {
    const orderMobileNumber = res.locals.newOD.mobileNumber                     // we're accessing the mobileNumber data from newOD data object we extracted earlier. This line extracts the mobileNumber from res.locals.newOD which we got from orderValidDeliverTo function. Stored the data in res.locals.newOD.
    if (!orderMobileNumber || orderMobileNumber.length === 0) {
        return next({
            status: 400, 
            message: "Order must include a mobileNumber"
        })
    }
}

/* In summary, this middleware checks if the order has a valid mobile number. If it doesn't, it calls the next middleware or route handler with an error. Otherwise, it does nothing and allows the next middleware in line to handle the request.*/

const orderHasDishes = (req, res, next) => {
    const orderDishes = res.locals.newOD.dishes                                             // Essentially, you're getting the array of dishes from the order object and storing it in the orderDishes constant. This makes it easier to work with the dishes array in subsequent lines, as you can just refer to orderDishes instead of the longer res.locals.newOD.dishes.
    if (!orderDishes || !Array.isArray(orderDishes) ||orderDishes.length === 0) {           // If orderDishes is not an array (using the Array.isArray() method).
        return next({
            status: 400,
            message: "Order must include at least one dish"
        })
                                             // Here, after having validated that orderDishes is a valid array with content, you're storing it directly under the res.locals with the key dishes.
    } 
    res.locals.dishes = orderDishes                                                                      // In other words, you're creating a shortcut. Rather than having later functions fetch the dishes via res.locals.newOD.dishes, they can now fetch it directly via res.locals.dishes.
}                                                                           // so basically, after orderDishes get's verified and we're successfully able to extract the dishes data from newOD, we store orderDishes data into the res.locals and call it dishes

/* In essence, the orderHasDishes middleware ensures that the incoming order (from the request) has a dishes property that is an array and contains at least one dish. */


const orderHasValidDishes = (req, res, next) => {
    const orderDishes = res.locals.dishes                              // This line retrieves the dishes array that was previously stored in res.locals by the orderHasDishes middleware. This array contains the individual dishes for the order.                                                 
    orderDishes.forEach((dish) => {                                     // This forEach loop goes through each dish in the dishes array to perform validation on them.
        const dishQuantity = dish.quantity;                              // for each dish, the code checks the quantity
        if (!dishQuantity || typeof dishQuantity != "number" || dishQuantity <= 0) {   
            return next({
                status: 400,
                message: `Dish ${orderDishes.indexOf(dish)} must have a quantity that is an integer greater than 0`
            
            })
        }
    })
}

 /*
                It must exist (!dishQuantity).
                It must be a number (typeof dishQuantity != "number").
                dishQuantity <= 0 indeed checks if dishQuantity is less than or equal to ≤ 0. In the context of this middleware, it's ensuring that the quantity of a dish is not zero or negative */

/* By having this middleware, you can catch any erroneous data early and provide feedback to whoever is sending the request (e.g., a frontend application or another system), ensuring that only valid data gets processed further. */


const orderIdMatches = (req, res, next) => {
    const paramId = res.locals.orderId                              // This line extracts the order ID from the route parameter. This ID is usually obtained from the URL. For example, if you have an endpoint like /orders/:orderId, the orderId value from the URL is stored in res.locals.orderId by the orderExists middleware that runs before this.
    const { id = null } = res.locals.newOD                          // This line extracts the id property from the order data (newOD) sent in the request body. If id is not provided in the request body, it defaults to null.
    if (!id || id === null) {                                       // This checks if there's no id in the request body (!id) or if the id is explicitly set to null (id === null). If either of the above conditions is true, then the next line of code is executed:
        res.locals.newOD.id = res.locals.orderId                    // What this does is it sets the id of the newOD (which is the new order data from the request body stored in res.locals) to the orderId from the URL. So, in essence, if the client does not provide an id in the request body or provides an id of null, the middleware ensures that the id of the newOD will be the same as the orderId in the URL. This is a way of normalizing the data and ensuring that the order being updated corresponds to the correct orderId in the URL
    } else if (paramId != id) {
        return next({
            status: 400, 
            message: `Order id does not match route id. Order: ${id}, Route: ${paramId}`
        })                                                          // If the id from the request body does exist and is not null, this block checks if it matches the ID from the URL parameters. If they don't match, a validation error is raised. This is a consistency check to ensure that the client isn't trying to update one order (based on the URL) with the data of another order (based on the request body).
    }

}

/* Summary: 
The orderIdMatches middleware checks the consistency between the order ID given in the URL and the order ID provided in the request body. If they're inconsistent, it throws an error; otherwise, it ensures that the order being updated has the right ID attached to it. */

const incomingStatusIsValid = (req, res, next) => {
    const { status = null } = res.locals.newOD                                                      // We're extracting the status property from res.locals.newOD. If status does not exist, it defaults to null
    if (!status || status.length === 0 || status === "invalid") {                                   // If any of these conditions are met, we execute the code inside the if block.
        return next({
            status: 400, 
            message: "Order must have a status of pending, preparing, out-for-delivery, delivered"  // If any of the conditions mentioned above are true, we trigger the next middleware with an error. The error has a status code of 400 (Bad Request) and a message indicating the required statuses.
        })
    }
}

/* This middleware checks the validity of the status of an incoming order, i.e., an order that a client is trying to create or update. */


const extantStatusIsValid = (req, res, next) => {
    const { status = null } = res.locals.order                                                      // res.locals.order we got this from orderExist function at the beginning. We're extracting the status property from res.locals.order (the current order in the system). If status does not exist, it defaults to null.
    if (status === "delivered") {
        return next({
            status: 400,
            message: "A delivered order cannot be changed"
        })
    }
}
/* This middleware checks the status of an existing order. Specifically, it ensures that orders with a status of "delivered" are not modified. */
/* Why is it needed? Once an order is marked as "delivered", it shouldn't be modified further for data consistency and logical reasons. If someone tries to modify a "delivered" order, they might be trying to change historical records, which should be disallowed in this system */


const extantStatusIsPending = (req, res, next) => {
    const { status = null } = res.locals.order
    if (status !== "pending") {                                                                    // We're checking if the current status of the order is NOT "pending". If it's not, we don't allow the order to be deleted.
        return next({
            status: 400,
            message: "An order cannot be deleted unless it is pending"
        })
    }
}
/* Why is it needed? The logic here is that only "pending" orders (orders that haven't been acted upon) can be deleted. If an order is already being prepared or is out for delivery, it shouldn't be allowed to be deleted as this would disrupt the business process. */


// Clarity Middleware Functions

const createValidation = (req, res, next) => {
    orderValidDeliverTo(req, res, next)
    orderHasValidMobileNumber(req, res, next)
    orderHasDishes(req, res, next)
    orderHasValidDishes(req, res, next)
    next()
}


const readValidation = (req, res, next) => {
    orderExists(req, res, next)                         // Before reading an order, the server should check if the order with the given ID actually exists in the data.
    next()                                              // If orderExists doesn't trigger an error, then the next() function is called, forwarding the request to the actual route handler to send back the order's details
}
/* For reading an order, the only crucial check is to ensure that the order exists. This validation function consolidates that check */


const updateValidation = (req, res, next) => {
    orderExists(req, res, next)
    orderValidDeliverTo(req, res, next)
    orderHasValidMobileNumber(req, res, next)
    orderHasDishes(req, res, next)
    orderHasValidDishes(req, res, next)
    orderIdMatches(req, res, next)
    incomingStatusIsValid(req, res, next)               // Check the status of the order, ensuring it adheres to business logic (for example, a delivered order shouldn't be updated).
    extantStatusIsValid(req, res, next)                 // Once an order is marked as "delivered", it shouldn't be modified further for data consistency and logical reasons. If someone tries to modify a "delivered" order, they might be trying to change historical records, which should be disallowed in this system */
    next()
}
/* When updating an order, multiple fields need to be validated. Consolidating these checks makes it easier to manage and less prone to errors. */


const deleteValidation = (req, res, next) => {
    orderExists(req, res, next)
    extantStatusIsPending(req, res, next)               // Before deleting an order, validate if its status is 'pending'. Orders with different statuses should not be deleted, following business logic.
    next()
}

// Handlers

function create(req, res) {
    const newOrderData = res.locals.newOD                   // we're extracting the order data stored in res.locals.newOD.
    newOrderData.id = nextId()                              // A new unique ID is generated for the order using the nextId() function. This new ID is then assigned to the id property of the newOrderData object
    orders.push(newOrderData)                               // The updated newOrderData (which now has an ID) is added to the orders array. In a real-world application, this might be equivalent to inserting a new record into a database.
    res.status(201).json({ data: newOrderData })            // The status code 201 is typically used in web APIs to indicate that a new resource has been created successfully in response to the client's request. It's a more specific code than the generic 200 OK  The JSON response sent to the client will contain the newOrderData, which includes all the details of the order along with its newly assigned ID.
}
/* The main purpose of this function is to take new order data, assign a unique ID to it, store it (in this case, in an array called orders), and then send a response back to the client to confirm the successful creation of the order */


function read(req, res) {
    res.status(200).json({ data: res.locals.order })        // res.locals.order is a property on that object. Before the read function gets called, a middleware (in your provided code, specifically orderExists) would have stored the order details associated with the incoming request in this res.locals.order property. So when you reference res.locals.order, you're accessing the order details that were found and stored by a previous middleware function.
}
/* The read function is designed to send back a specific order's details as a JSON response to the client. This order has previously been identified and stored in res.locals.order by another middleware function (orderExists). The status code 200 indicates to the client that the request was successful, and the actual order data is nested inside a data property in the returned JSON object*/


function update(req, res) {
    const newData = res.locals.newOD                        // This extracts the new order data from res.locals.newOD, which was set by a previous middleware function. This represents the new details that should replace the current order data.
    const oldData = res.locals.order                        // Similarly, this extracts the existing order data (the one you want to modify) from res.locals.order, which was also set by another middleware (orderExists).
    const index = orders.indexOf(oldData)                   // will search through the orders array to find an element that matches (references the same object as) oldData. Once it locates a match, it returns the position (or index) where this match was found in the array. This position is then stored in the index constant 
    for (const key in newData) {                                
        orders[index][key] = newData[key]                   // In essence, the for...in loop in your code efficiently updates the properties of the targeted order (found by index) with the new data provided in newData.
    }                                                       // Example below.
    res.status(200).json({ data: orders[index] })           // This sends a JSON response to the client containing the updated order of that index. The order is wrapped inside an object with the key data for a structured response.
}
/* The update function is designed to modify an existing order with new details. It first identifies the order to be modified from the orders array and then overwrites its properties with the new data provided. Finally, it sends back the updated order as a JSON response to the client. */

/* Let's consider a simple example to better visualize this. Suppose:

    let orders = [
    { id: '1', name: 'Pizza', price: 10 },
    { id: '2', name: 'Burger', price: 5 },
    // ... other orders ...
];

let oldData = { id: '2', name: 'Burger', price: 5 };
let newData = { id: '2', name: 'Cheeseburger', price: 6 };

const index = orders.indexOf(oldData); // This would return 1 since oldData matches the second item in the orders array.

When the for...in loop runs:

For the first property in newData, key would be 'id'. The loop would effectively do:

orders[1]['id'] = newData['id']

Since newData['id'] is '2', and orders[1]['id'] is already '2', this property remains unchanged.

On the next iteration, key would be 'name'. The loop would then do:

orders[1]['name'] = newData['name']

This updates the 'name' property of the order at index 1 from 'Burger' to 'Cheeseburger'.

Finally, for the 'price' key, the loop updates the price from 5 to 6.

*/


function list(req, res) {
    res.status(200).json({ data: orders })                      // The .json() method is used to send a JSON response to the client. Inside the method, there's an object { data: orders }. This object has a property data, which is assigned the entire orders array. By doing this, you're structuring your response in a way where all the orders are nested under a data key
}

/* This is useful, for example, if you have a front-end application that needs to fetch and display all the orders from the back end. */

function destroy(req, res) {
    const index = orders.indexOf(res.locals.order)   // The function attempts to find the index (or position) of an order within the orders array.The indexOf method returns the first index at which the provided order can be found in the orders array. If the order is not found, it returns -1.
    orders.splice(index, 1)                          // If the order is found in the orders array (i.e., index is not -1), this line will remove it. splice is an array method that changes the contents of an array by removing or replacing existing elements. In this case, it's used to remove 1 element starting at the position specified by index.
    res.sendStatus(204)                              // In the HTTP specification, a 204 status code means "No Content." It's commonly used to indicate that a request has been successfully processed, but there's no additional content to send in the response. This is suitable for delete operations since once the order is deleted, there's no more data regarding that order to send back.
}
/* In summary, this destroy function:

Locates an order in the orders array.
Removes that order from the array.
Sends a confirmation of successful deletion to the client with no additional content */




module.exports = {
    create: [createValidation, create],             /* This line is defining a key create with a value of an array. The array contains two functions: createValidation and create.
                                                    When the create route is triggered, Express will first execute the createValidation function (which probably validates the incoming request data) and then proceed to the create function which likely handles the logic for creating an entity (e.g., an order).
                                                    This is a way to chain multiple middleware functions together. Express will execute them in the order they appear in the array */
    read: [readValidation, read],                   // Similar to the create line, the read route will first pass through readValidation to ensure the request is valid, and then will move to the read function to fetch and return the requested data.  
    update: [updateValidation, update],             // The update route has a longer middleware chain. Before reaching the core logic in the update function, it first goes through updateValidation which may contain a series of checks and validations specific to updating.
    delete: [deleteValidation, destroy],            // For the delete operation, it first runs deleteValidation (ensuring the deletion request is valid) and then proceeds to the destroy function to handle the actual deletion.
    list,                                           // This line is a shorthand notation. It's equivalent to writing list: list,. This means there's a function named list in the module that can be triggered when this route is accessed. There's no preceding validation or middleware array here, indicating that when the list route is accessed, it will immediately execute the list function
}
















/* 
Example of const { data = null } = req.body

In Express.js, req.body contains parsed data from the body of the incoming HTTP request. The shape and content of req.body depend on the client's request, specifically the body content and the Content-Type header.

For example, if a client sends an HTTP POST request with a body containing JSON data and specifies the Content-Type as application/json, and if you're using middleware like express.json(), then req.body will contain the parsed JavaScript object from the JSON string sent by the client.

Here's a simple example:

Client sends this HTTP request:

POST /orders HTTP/1.1
Host: yourwebsite.com
Content-Type: application/json

{
  "data": {
    "deliverTo": "123 Main St.",
    "mobileNumber": "555-555-5555",
    "dishes": [
      {
        "id": "d1",
        "name": "Spaghetti",
        "quantity": 2
      }
    ]
  }
}

In your Express server, the content of req.body would then be:

{
  data: {
    deliverTo: "123 Main St.",
    mobileNumber: "555-555-5555",
    dishes: [
      {
        id: "d1",
        name: "Spaghetti",
        quantity: 2
      }
    ]
  }
}
Keep in mind that for req.body to work properly in Express and have the content parsed, you need to use appropriate middleware. For JSON data, it's common to use:

const express = require('express');
const app = express(); (This is already included in the app.js in this project.)

app.use(express.json()); // This middleware parses incoming JSON payloads.

Without such middleware, req.body would be undefined because the body wouldn't get parsed. Other body-parsing middleware exist for different types of data, such as express.urlencoded() for form data
*/