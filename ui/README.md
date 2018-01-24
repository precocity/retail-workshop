# Node.js Review app using Azure Cosmos DB and Azure Event Hub
Azure Cosmos DB is a globally distributed multi-model database. One of the supported APIs is the DocumentDB API, which provides a JSON document model with SQL querying and JavaScript procedural logic. This Node.js server exposes several REST endpoints (as well as a simple HTTP server) for getting product reviews and posting a new product review, in a fashion similar to amazon.com or any retailer product page.

New reviews are posted to Azure Event Hub, where a ML-trained pipeline picks them up and processes them for "helpfulness".

The point of the exercise is to predict a review's helpfulness rather than wait for the traditional method, whereby
other people vote each review up or down via buttons attached to the review. If we can predict each new review as helpful
in comparison to other new reviews, we can bubble it to the top rather than let it bubble down in a glut of new reviews.

## Running the app: Prerequisites
* Before you can run this app, you must have the following prerequisites:
	* An active Azure DocumentDB account - If you don't have an account, refer to the [Create a DocumentDB account](https://azure.microsoft.com/en-us/documentation/articles/documentdb-create-account/) article.
	* [Node.js](https://nodejs.org/en/) version v0.10.29 or higher.
	* [Git](http://git-scm.com/).
	* The Event Hub connection information for new reviews
	
## App Architecture
The Node.js app exposes a web server that serves a static HTML form page containing a table of reviews and fields to
submit a new review. Clients to the static web page can vote any review up or down (note that nothing prevents a user from
making more than one vote on any product). The Node.js app is a client to both the Azure Cosmos DB and the Azure Event Hub via
tokens in the app, previously established in portal.azure.com. Creating the Azure Cosmos DB data store and the Azure Event
Hub are outside the scope of this document, but they must exist for the full featureset to work.

The web page uses three REST calls on the server:
1. GET reviews: get the reviews for a product ID (asin). Example: GET /reviews/{asin}/{count}. Makes a call to Azure Cosmos DB for documents representing reviews.
2. PUT reviews: updates a review, e.g., from a reviews upvote or downvote. Example: PUT /reviews/{reviewId}. Updates a document in Azure Cosmos DB.
3. POST review: add a new review. Put the review on Event Hub.

Because putting the review on Event Hub to be processed by the pipeline is asynchronous there is a refresh button in the UI 
that simply calls GET reviews. A more sophisticated client might have a background polling process to see if the data has
changed, such as if a particularly helpful review has been added.

Elements of the architecture:
1. the client UI, which uses the Node.js server's web server to render the single, simple form page, and invoke the REST calls to get, update and add reviews
2. the Node.js server, which acts as a client to Azure Cosmos DB and Azure Event Hub
3. Azure Cosmos DB as the document (e.g. product review) data store
4. Azure Event Hub which is the event broker to the pipeline
5. the ML pipeline, a trained pipeline which ingests the review, scores it's helpfulness, and posts the new review to the Azure Cosmos DB data store

## Running the app
This app is an amalgamation of the nodejs-docs-hello-world Azure sample repo and the 
azure-cosmos-db-documentdb-nodejs-getting-started Azure sample repo, provided on the Azure docs website. 
1. Clone this repository using `git clone https://github.com/precocity/retail-workshop.git`

2. Change directories to the repo using `cd retail-workshop`

3. Next, substitute the endpoint and primary key in `config.js` with your Cosmos DB account's values.
Substitute the database and collection.

	```
	config.endpoint = "~your DocumentDB endpoint here~";
	config.primaryKey = "~your auth key here~";
	
	config.database = {"id": "reviews"};

	config.collection = {"id": "reviewColl"};
	```

4. Substitute the Event Hub information in server.js.

	```
	var connectionString = 'Endpoint=sb://new-reviews.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=aoVRAW0YWk4C35MvjTVh2Y4ItADf4bbUN6OIm3iIU6k=';
	var eventHubPath = 'new-review-event-hub';
	```

5. Run `npm install` in a terminal to install required npm modules

6. Configure the web server. Choose a domain, and edit your hosts file to point that domain to your localhost.
Edit the host variable in server.js.

	```
	var host = "www.yourdomain.com:" + port;
	```
 
7. Run `node server.js` in a terminal to start your start your node application.

8. Visit the site using a web browser and the URL e.g. http://www.yourdomain.com:{port}
The default port is 8080.

## More information

- [Azure Cosmos DB](https://docs.microsoft.com/azure/cosmos-db/introduction)
- [Azure Cosmos DB : DocumentDB API](https://docs.microsoft.com/azure/documentdb/documentdb-introduction)
- [Azure DocumentDB Node.js SDK](https://docs.microsoft.com/azure/documentdb/documentdb-sdk-node)
- [Azure DocumentDB Node.js SDK Reference Documentation](http://azure.github.io/azure-documentdb-node/)
