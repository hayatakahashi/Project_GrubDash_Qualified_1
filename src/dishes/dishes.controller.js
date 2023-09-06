const path = require("path"); 
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data")); // //So, in essence, path.resolve gives you the absolute path based on where your application is currently running, ensuring you always get a consistent and absolute location regardless of your relative reference point.
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId"); // generates the next unique ID for a new dish. When a new dish is added, it's given an ID to distinguish it from other dishes, and this function helps in generating that ID.

// TODO: Implement the /dishes handlers needed to make the tests pass

//First we'll create the Functional Middlware functions:

const dishExists = (req, res, next) => {
    const dishId = req.params.dishId // Retrieves "dishId" from requests
    res.locals.dishId = dishId // Stores "dishId" in "res.locals". Think of res.locals as a way to store temporary data that's only relevant for the duration of the request
    const foundDish = dishes.find((dish) => dish.id === dishId) // Find the Dish in the "dishes" array in the dishes-data.js
    if (!foundDish) {
        return next({
            status: 404,
            message: `Dish not found: ${dishId}` // This block checks if foundDish is undefined (i.e., no matching dish was found). If that's the case, we call the next function with an error object that has a 404 status code and a message indicating that the dish wasn't found.
        })
    }
    res.locals.dish = foundDish // If a matching dish is found, we store it in res.locals to make it available for subsequent middleware or handlers. This allows us to avoid searching for the dish again in the following steps of our application.
}

/* When the middleware completes, the application will either move on to the next middleware/handler or handle the error (if the dish wasn't found). This dishExists middleware ensures that by the time you reach your handler, you already know that the dish exists and can proceed with other operations, such as reading, updating, or deleting. */

const dishValidName = (req, res, next) => {
    const { data = null } = req.body  // Get the data property from req.body and store it in a constant called data. If req.body doesn't have a data property, set data to null."
    res.locals.newDD = data          // storing the retrieved data object in res.locals under the name newDD (stands for "new dish data"). Storing data in res.locals makes it available for later middleware functions or handlers
    const dishName = data.name       // we are extracting the name property from the data object and storing it in the dishName constant.
    if (!dishName || dishName.length === 0 ) {
        return next({
            status: 400, 
            message: "Dish must include a name" // If dishName is either non-existent or an empty string, the middleware function sends an error to the next middleware or error handling function. The error has a 400 status code (which typically means "Bad Request") and a message indicating that a valid name must be provided for the dish.
        })
    }
}

/* It essentially ensures that any request passing through it provides a valid name for the dish. If the request doesn't meet this criteria, the middleware stops the request from moving forward and returns a relevant error. If the name is valid, the middleware does nothing, allowing the request to proceed to the next middleware or handler in line. */

const dishHasValidDescription = (req, res, next) => {
    const dishDescription = res.locals.newDD.description  //you're extracting the description attribute from res.locals.newDD. res.locals.newDD.description is essentially fetching the description attribute of the dish data the client sent.
    if (!dishDescription || dishDescription.length === 0) {   // Basically if it doesn't have any description or the length of description is 0
        return next({
            status: 400,
            message: "Dish must include a description"        // Then send this error message.
        })
    }
}

/* To summarize, dishHasValidDescription is a middleware that checks if the dish data sent by the client contains a valid description. If it does, it does nothing and lets the request proceed. If it doesn't, it interrupts the flow, signaling that an error has occurred, and a valid description is required. */

const dishHasValidPrice = (req, res, next) => {
    const dishPrice = res.locals.newDD.price
    if (!dishPrice || typeof dishPrice != "number" || dishPrice <= 0) { //!dishPrice: This checks if dishPrice is "falsy". This would catch values like undefined, null, or 0. typeof dishPrice != "number": This checks if the type of the dish price is not a number. If the client sends a string, object, or anything that's not a number as the price, this condition will be true. || dishPrice <= 0: This condition ensures that the dish price is a positive number. It's not enough to just be a number; it has to be greater than 0.
        return next({
            status: 400,
            message: "Dish must have a price that is an integer greater than 0"
        })
    }
}

/* In summary, the dishHasValidPrice middleware is a filter that checks the validity of the dish price sent by the client. If the price is valid, the request continues its journey through the middleware chain. If it's not, the middleware interrupts the flow and signals the presence of an error. */

const dishHasValidImage = (req, res, next) => {
    const dishImage = res.locals.newDD.image_url  // extracting the image_url attribute from the data previously stored in res.locals.newDD
    if (!dishImage || dishImage.length === 0) {   // Checks if dishImage is falsy - undefined or null or empty string. Other one is an extra check to ensure a non-empty string was provided.
        return next({
            status: 400, 
            message: "Dish must include an image_url" // Activate the next() with an error message inside. 
        })
    }
}

/* In essence, the dishHasValidImage middleware acts as a gatekeeper, ensuring that any incoming request contains a valid image URL for a dish. If this condition isn't met, the request doesn't proceed any further in its intended flow. */

const dishIdMatches = (req, res, next) => {
    const paramId = res.locals.dishId       // retrieves the dishId from res.locals,(e.g., dishExists). This dishId represents the ID in the route parameter (e.g., if you have a route like /dishes/:dishId, and a request comes in for /dishes/1234, 1234 would be the dishId).
    const { id = null } = res.locals.newDD  // we're extracting the id attribute from the data previously saved in res.locals.newDD. This ID should represent the ID of the dish that the client has sent in the request body. If no ID is found, it defaults to null.
    if (paramId != id && id) {              // Look below for example. But primary purpose is to ensure consistency and data integrity when updating a dish in the system. It confirms that the dish ID provided in the request URL matches the dish ID inside the request body.
        return next({
            status: 400,
            message: `Dish ID does not match route id. Dish: ${id}, Route: ${paramId}`
        })
    }
}

/* In summary, dishIdMatches acts as a validation layer, ensuring that if a client provides an ID in the request body, it must match the ID in the route parameter. This is useful for operations like "update" where you want to make sure the ID specified in the URL matches the ID of the item the client wants to update */

// Now onto the Clarity Middleware Functions

/* Purpose:
The createValidation middleware's purpose is to validate the data sent in the request body when a client tries to create a new dish. If the data is valid and meets all requirements, the process will continue to the next middleware or handler. If there's any issue with the data, the validation functions will trigger an error response. */

const createValidation = (req, res, next) => {
    dishValidName(req, res, next)              // Invoke dishValidName: This function checks if the dish has a valid name. If the dish's name is missing or invalid, this function will trigger an error response and won't proceed to the next steps.
    dishHasValidDescription(req, res, next)    // it validates if the dish has a proper description. Just like with the name, if the description is missing or invalid, an error will be thrown
    dishHasValidPrice(req, res, next)          // This function checks whether the price of the dish is valid. If not, it stops the process and returns an error.
    dishHasValidImage(req, res, next)          // It checks if the dish includes a valid image URL. If the image URL is missing or invalid, an error will be generated.
    next()                                     // If all the validation functions pass without any issues, the next() function is called. This means the request data is valid and the process can proceed to the next middleware or handler in the chain.
}

/* createValidation middleware is a consolidated validation layer that ensures all necessary data attributes for creating a dish are valid. Instead of cramming all the validation logic into one function, it smartly delegates each validation task to individual functions (dishValidName, dishHasValidDescription, etc.). This modular approach makes the code cleaner, easier to maintain, and allows for more straightforward debugging if an issue arises. */

/* Purpose:
The primary purpose of the readValidation middleware is to verify that the dish with the specified ID exists in your data storage before attempting to read and send that data to the client. If the dish doesn't exist, an error is raised; otherwise, it moves on to the actual reading logic. */

const readValidation = (req, res, next) => {
    dishExists(req, res, next)                // Literally "activates" the dishExists middleware and if it's successful it'll retrieve the dish ID from the request parameters.
    next()                                    // Once the dishExists function is complete, it'll call the next()
}

/* The readValidation middleware serves as a gatekeeper for reading dish data. It ensures that we're trying to read data for a dish that actually exists. */

/* Purpose:
The purpose of the updateValidation middleware is to perform a comprehensive validation check when attempting to update a dish. Before applying changes, it ensures */

const updateValidation = (req, res, next) => {
    dishExists(req, res, next)              // This checks if a dish with the provided ID exists in your data. If it does, it attaches the dish to res.locals. If not, it triggers an error response
    dishValidName(req, res, next)           // It validates that the dish name in the update request is both present and has a non-zero length.
    dishHasValidDescription(req, res, next)
    dishHasValidPrice(req, res, next)
    dishHasValidImage(req, res, next)
    dishIdMatches(req, res, next)
    next()
}

/* he updateValidation middleware is a series of gatekeepers ensuring that update operations on dishes meet the required criteria for consistency and data integrity */

// Now time to work on the Handlers
/* What are Handlers?
In the context of Express.js (or other web frameworks), a handler is a function that processes incoming HTTP requests, manipulates data, and sends back an HTTP response. Handlers (sometimes referred to as "route handlers" or "controller functions") are the core of your application, acting on the actual logic that your API or web app should perform when a specific endpoint is accessed. */
/*  the handler can be thought of as the "Controller." It's the mediator that handles the data coming from the user (via HTTP requests), interacts with the model (the data), and sends a response back to the user (often using views, though in API contexts, this might be JSON data). */

function create(req, res) {
    const newDishData = res.locals.newDD            //retrieves the new dish data from res.locals. This data has been previously stored there by the middleware functions we discussed earlier
    newDishData.id = nextId()                       // the nextId function is called to generate a unique ID for our new dish. This ID is then assigned to the id property of our new dish data.    
    dishes.push(newDishData)                        // This line simply adds the new dish (with its unique ID) to the dishes array, which represents our database or storage in this example.
    res.status(201).json({ data: newDishData })     // sends back a response with a 201 HTTP status code (which represents successful creation of a resource). It then sends the newly created dish as a JSON object in the response body. In this case, the dish data is nested inside a data property in the response JSON.
}

/* SUMMARY : 
The create handler processes the request to add a new dish. It assigns a unique ID to this dish, adds it to our storage (in this case, an array), and sends back a confirmation response with the newly created dish's data. Handlers, in general, handle specific actions related to HTTP requests and responses, acting as intermediaries between the client and your application's data. */

function read(req, res) {
    res.status(200).json({ data: res.locals.dish})  // res.status(200): This sets the HTTP status code of the response to 200. The 200 status code means "OK", signaling a successful HTTP request
/* Remember, res.locals is an object in Express that allows middleware and handlers to store and access local variables across the request-response lifecycle. In our case, prior middleware (specifically dishExists from our earlier discussions) has already identified the dish corresponding to the provided dishId and stored it in res.locals.dish. */
}

/* SUMMARY: 
The read handler's main purpose is to send back the previously identified dish (found by the dishExists middleware) to the client in JSON format. It's a straightforward function that leverages the work done by prior middleware to efficiently deliver the desired data with minimal overhead. */

function update(req, res) {
    const newData = res.locals.newDD                //  retrieving the new dish data from res.locals.newDD. This data is populated by previous middleware, specifically from the request body (req.body.data).
    const oldData = res.locals.dish                 // retrieves the existing dish data from res.locals.dish. This was populated by the dishExists middleware.
    const index = dishes.indexOf(oldData)           // we're finding the position or index of the existing dish in our dishes array. This is done so we can replace it with the updated data.
    for (const key in newData) {
        dishes[index][key] = newData[key]           // Look below for example. 
    }
    res.status(200).json({ data: dishes[index] })
}

/* Summary:
The update function serves to update an existing dish with new data provided in the request body. After updating the dish, it sends the updated data back to the client as a response. The actual update is done by directly modifying the dishes array, which represents our in-memory storage of dishes in this example */

function list(req, res) {
    res.status(200).json({ data: dishes})           //  Sends back a JSON response. The response will be an object with a key named data and the value being the dishes array. The dishes array holds all the dish data in the application.
}

// Purpose: The purpose of the list function is to retrieve all dishes currently stored in the application and send them back as a response.
//It's typically used when a client wants to view all available dishes, e.g., to populate a menu on a website



// exporting an object with four properties: create, read, update, and list.
module.exports = {                                  // This is a special object in Node.js modules. Anything you attach to this object will be available to other files that require (import) this file.
    create: [createValidation, create],              // These arrays contain middleware functions and a final handler function. This structure means that when a route uses, for instance, the create handler, it'll first go through the createValidation middleware and then the create function.
    read: [readValidation, read],                    // Look below for example.
    update: [updateValidation, update],
    list,                                           // Notice that you didn’t specify a key-value pair like the other properties. This is a shorthand in JavaScript for when the property name and the variable name are the same. So, list, is equivalent to list: list,.
}




/* For example:
create: [createValidation, create]: Here, if a request comes in that uses the create handler,
it will first run the createValidation function, and after that, the create function. 
The idea is that the validation checks if the incoming data is correct, and if everything is fine, 
it passes the control to the next function in the array (in this case, the create function) to handle the actual creation logic. */


/* How it's used:

When another file in your Node.js application wants to use the functionalities provided in this file, it will use the require function to import them. Given the structure of your module.exports, the importing file can access each of the handlers individually and use them as needed.

For instance, in a hypothetical routes.js file, you might have something like:

const dishesController = require('./dishes.controller.js');

// Then, you might set up routes like this:

app.post('/dishes', dishesController.create);
app.get('/dishes/:dishId', dishesController.read);
// ... and so on

*/






/* Example of function update specifically for (const key in newData) part

Imagine that our dishes array contains a dish that looks like this:

{
  id: "12345",
  name: "Pasta",
  price: 10,
  description: "Delicious spaghetti with tomato sauce.",
  image_url: "http://example.com/pasta.jpg"
}

And let's say that the client sends new data for updating this dish, and it looks like this:

{
  name: "Spaghetti",
  price: 12
}

The for...in loop's purpose is to iterate over the properties (or "keys") of the newData object, and update the corresponding properties in our original dish (dishes[index]).

Let's walk through the loop:

First Iteration:
key will be "name".
The loop will then replace the name of the dish in our dishes array (dishes[index].name) with the name from newData (newData.name).
So, "Pasta" will be replaced by "Spaghetti".

Second Iteration:
key will be "price".
It will replace the price of the dish in our dishes array (dishes[index].price) with the price from newData (newData.price).
So, 10 will be replaced by 12.

After the loop finishes, our dish in the dishes array will look like this:

{
  id: "12345",
  name: "Spaghetti",
  price: 12,
  description: "Delicious spaghetti with tomato sauce.",
  image_url: "http://example.com/pasta.jpg"
}

As you can see, only the name and price properties were updated, since those were the only properties present in newData.

In simpler terms, the loop's job is to go over each property in newData and use it to update the corresponding property in our existing dish. This allows partial updates, meaning that the client can choose to update only specific parts of the dish, without affecting the other parts.

*/














/* Example of dishIdMatches specifically the if (paramId != id && id) part.

Setup:
We have an endpoint defined as PUT /dishes/:dishId.
The intent of this endpoint is to update the dish with the specified dishId.
The client is supposed to send the updated dish information in the request body.
Scenario 1: IDs match and are valid
Client sends a PUT request to /dishes/1234.
So, paramId = 1234 (from the URL).
In the request body, the client sends:
{
  "id": "1234",
  "name": "Updated Spaghetti",
  "price": 15
  // ... other dish details ...
}
So, id from the request body = 1234.

Condition check:

paramId != id becomes 1234 != 1234 → false.
Since the first part of the condition is false, the entire condition is false, and the middleware does not throw an error.

Scenario 2: IDs do not match
Client sends a PUT request to /dishes/1234.
So, paramId = 1234.
In the request body, the client sends:
{
  "id": "5678",
  "name": "Updated Spaghetti",
  "price": 15
  // ... other dish details ...
}
So, id from the request body = 5678.

Condition check:
paramId != id becomes 1234 != 5678 → true.
id is truthy (because it's provided and is not a falsy value) → true.
Both parts are true, so the entire condition is true. The middleware detects the mismatch and throws an error.

*/