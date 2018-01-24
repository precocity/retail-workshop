/*
 * Copyright (C) 2018 Precocity LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

var documentClient = require("documentdb").DocumentClient,
    config = require("./config"),
    url = require('url');

var options = {}; //{ partitionKey: ['asin']};

var HttpStatusCodes = { NOTFOUND: 404 };
var databaseUrl = `dbs/${config.database.id}`;
var collectionUrl = `${databaseUrl}/colls/${config.collection.id}`;

module.exports = {

  createCosmosAdapter() {
	var client = new documentClient(config.endpoint, { "masterKey": config.primaryKey });

    /**
     * Get the database by ID, or create if it doesn't exist.
     * @param {string} database - The database to get or create
     */
    function getDatabase() {
        console.log(`Getting database:\n${config.database.id}\n`);
    
        return new Promise((resolve, reject) => {
            client.readDatabase(databaseUrl, (err, result) => {
                if (err) {
                    if (err.code == HttpStatusCodes.NOTFOUND) {
                        client.createDatabase(config.database, (err, created) => {
                            if (err) reject(err)
                            else resolve(created);
                        });
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(result);
                }
            });
        });
    };
    
    /**
     * Get the collection by ID, or create if it doesn't exist.
     */
    function getCollection() {
        console.log(`Getting collection:\n${config.collection.id}\n`);
    
        return new Promise((resolve, reject) => {
            client.readCollection(collectionUrl, options, (err, result) => {
                if (err) {
                    if (err.code == HttpStatusCodes.NOTFOUND) {
                      var createCollectionOptions = options;
                      createCollectionOptions.offerThroughput = 400;
                        client.createCollection(databaseUrl, config.collection, createCollectionOptions, (err, created) => {
                            if (err) reject(err)
                            else resolve(created);
                        });
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(result);
                }
            });
        });
    };
    
    /**
     * Get the document by ID, or create if it doesn't exist.
     * @param {function} callback - The callback function on completion
     */
    function addProductReview(document, count) {
    	if (count) document.id = document.asin + '.' + count;
        let documentUrl = `${collectionUrl}/docs/${document.id}`;
        console.log(`Getting document:\n${document.id}\n`);
    
        return new Promise((resolve, reject) => {
            client.readDocument(documentUrl, options, (err, result) => {
                if (err) {
                    if (err.code == HttpStatusCodes.NOTFOUND) {
                        client.createDocument(collectionUrl, document, options, (err, created) => {
                            if (err) reject(err)
                            else resolve(created);
                        });
                    } else {
                        reject(err);
                    }
                } else {
                    resolve(result);
                }
            });
        });
    };
    
    /**
     * Query the collection using SQL
     */
    function getProductReviews(id, sort_input, count) {
        console.log(`Querying collection through index:\n${config.collection.id}`);
        
        if (count) {
        	// select top count
        }
        
        // good_score, unixReviewTime, 'helpfulRatio, helpful[1]'
        var primarySort = 'good_score',
        	secondarySort,
        	secondarySortIndex;
        if (sort_input) {
        	primarySort = sort_input.split(',')[0];
        	if (sort_input.split(',').length > 1) {
        		secondarySort = sort_input.split(',')[1];
        		var secondarySortSplit = secondarySort.split('[');
        		if (secondarySortSplit[0] != secondarySort) {
        			secondarySort = secondarySortSplit[0];
        			secondarySortIndex = secondarySortSplit[1].substr(0,1);
        		}
        	}
        }
    
        return new Promise((resolve, reject) => {
            client.queryDocuments(
                collectionUrl,
                'SELECT * FROM root r WHERE r.asin = "' + id + '" order by r.' + primarySort + ' desc',
                options
            ).toArray((err, results) => {
                if (err) reject(err)
                else {
                	if (secondarySort) {
                		results.sort(function(a,b) {
                			if (a[primarySort] == b[primarySort]) {
                				if (secondarySortIndex) {
                					return b[secondarySort][secondarySortIndex]-a[secondarySort][secondarySortIndex];
                				} else {
                					return b[secondarySort]-a[secondarySort];
                				}
                			} else {
                				return b[primarySort]-a[primarySort];
                			}
                		});
                	}
//                    for (var queryResult of results) {
//                        let resultString = JSON.stringify(queryResult);
//                        console.log(`\tQuery returned ${resultString}`);
//                    }
                	console.log(`\tQuery returned ` + results.length + ` reviews`);
                    console.log();
                    resolve(results);
                }
            });
        });
    };
    
    /**
     * Query the collection using SQL
     */
    function getProductCategoriesFromDB() {
        console.log(`Querying product categories`);

        return new Promise((resolve, reject) => {
        	if (true) {
        		options.enableCrossPartitionQuery = true;
	            client.queryDocuments(
	                collectionUrl,
	                'SELECT top 100 * from root r order by r.category',
	                options
	            ).toArray((err, results) => {
	                if (err) reject(err)
	                else {
	                	var distinctCategories = [],
	                		thisCategory;
	                    for (var queryResult of results) {
	                    	if (queryResult.category != thisCategory) {
	                    		thisCategory = queryResult.category;
	                    		distinctCategories.push({id: queryResult.category, name: queryResult.category});
	                    	}
	                    }
	                    console.log(`\tQuery returned ` + distinctCategories.length + ` categories`);
	                    console.log();
	                    resolve({categories: distinctCategories});
	                }
	            });
            } else {
            	resolve({categories: [{id: 'Amazon_Instant_Video', name: 'Amazon_Instant_Video'}]});
            }
        });
    };
    
    /**
     * Query the collection using SQL
     */
    function getProductsInCategory(categoryId) {
        console.log(`Querying for products in category ` + categoryId);
    
        return new Promise((resolve, reject) => {
            if (true) {
            	options.enableCrossPartitionQuery = true; 
	            client.queryDocuments(
	                collectionUrl,
	                'SELECT top 200 * from root r where r.category = "' + categoryId + '" order by r.asin',
	                options
	            ).toArray((err, results) => {
	                if (err) reject(err)
	                else {
	                	var distinctProducts = [],
	                		thisAsin;
	                    for (var queryResult of results) {
	                    	if (queryResult.asin != thisAsin) {
	                    		thisAsin = queryResult.asin;
	                    		distinctProducts.push({id: queryResult.asin, asin: queryResult.asin, name: queryResult.asin});
	                    	}
	                    }
//	                    for (var queryResult of results) {
//	                        let resultString = JSON.stringify(queryResult);
//	                        console.log(`\tQuery returned ${resultString}`);
//	                    }
	                    console.log(`\tQuery returned ` + distinctProducts.length + ` products`);
	                    console.log();
	                    resolve({products: distinctProducts});
	                }
	            });
            } else {
            	resolve({products: [{asin: 'B0002GXV3A', name: 'B0002GXV3A'}]});
            }
        });
    };
    
    /**
     * Replace the document by ID.
     */
    function updateProductReview(document) {
        let documentUrl = `${collectionUrl}/docs/${document.id}`;
        console.log(`Replacing document:\n${document.id}\n`);
    
        return new Promise((resolve, reject) => {
            client.replaceDocument(documentUrl, document, (err, result) => {
                if (err) reject(err);
                else {
                    resolve(result);
                }
            });
        });
    };
    
    /**
     * Delete the document by ID.
     */
    function deleteFamilyDocument(document) {
        let documentUrl = `${collectionUrl}/docs/${document.id}`;
        console.log(`Deleting document:\n${document.id}\n`);
    
        return new Promise((resolve, reject) => {
            client.deleteDocument(documentUrl, options, (err, result) => {
                if (err) reject(err);
                else {
                    resolve(result);
                }
            });
        });
    };
    
    /**
     * Cleanup the database and collection on completion
     */
    function cleanup() {
        console.log(`Cleaning up by deleting database ${config.database.id}`);
    
        return new Promise((resolve, reject) => {
            client.deleteDatabase(databaseUrl, options, (err) => {
                if (err) reject(err)
                else resolve(null);
            });
        });
    };
    
    /**
     * Exit the app with a prompt
     * @param {message} message - The message to display
     */
    function exit(message) {
        console.log(message);
        console.log('Press any key to exit');
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.on('data', process.exit.bind(process, 0));
    };
    
    function getReviewsForProduct(id, sort, count) {
  	  
        return new Promise((resolve, reject) => {
      	  getDatabase()
            .then(() => getCollection())
            .then(() => getProductReviews(id, sort, count))
            .then((result) => {
              resolve(result);
            })
            .catch((error) => {
              reject(error);
            });
        });
    };
    
    function addReview(review) {
    	  
      return new Promise((resolve, reject) => {
    	getDatabase()
          .then(() => getCollection())
          .then(() => getProductReviews(review.asin))
          .then((reviews) => addProductReview(review, reviews.length+1))
          .then((result) => {
            resolve(result);
          })
          .catch((error) => {
            reject(error);
          });
      });
    };
    
    function updateReview(review) {
  	  
      return new Promise((resolve, reject) => {
        getDatabase()
          .then(() => getCollection())
          .then(() => updateProductReview(review))
          .then((result) => {
            resolve(result);
          })
          .catch((error) => {
            reject(error);
          });
      });
    };
        
    function getProductCategories() {
    	  
        return new Promise((resolve, reject) => {
          getDatabase()
            .then(() => getCollection())
        	.then(() => getProductCategoriesFromDB())
            .then((result) => {
              resolve(result);
            })
            .catch((error) => {
              reject(error);
            });
        });
    };
    
    function getProductCategoriesViaStoredProcedure() {
    	  
        return new Promise((resolve, reject) => {
          createStoredProcedures()
        	.then(() => executeProductCategoryStoredProcedure())
            .then((result) => {
              resolve(result);
            })
            .catch((error) => {
              reject(error);
            });
        });
    };
    
    function foo() {
      getDatabase()
        .then(() => getCollection())
        .then(() => addProductReview(config.documents.B000H00VBQ_1))
        .then(() => addProductReview(config.documents.B000H00VBQ_2))
        .then(() => addProductReview(config.documents.B000H00VBQ_3))
        .then(() => addProductReview(config.documents.B000H0X79O_1))
        .then(() => addProductReview(config.documents.B000H0X79O_2))
        .then(() => addProductReview(config.documents.B000H0X79O_3))
        .then(() => getProductReviews())
    //    .then(() => updateProductReview(config.documents.Andersen))
    //    .then(() => getProductReviews())
    //    .then(() => deleteFamilyDocument(config.documents.Andersen))
    //    .then(() => cleanup())
        .then(() => { exit(`Completed successfully`); })
        .catch((error) => { exit(`Completed with error ${JSON.stringify(error)}`) });
    };
    
    // stored procedure
    var helloWorldStoredProc = {
	    id: "helloWorld",
	    serverScript: function () {
	        var context = getContext();
	        var response = context.getResponse();
	        response.setBody("Hello, World");
	    }
	};
    
    var firstReviewForCategoryStoredProc = {
    	id: "firstReviewForCategoryAlt", 
    	serverScript: function(prefix, categoryId) {
	        var collection = getContext().getCollection();
	
	        // Query documents and take 1st item.
	        var isAccepted = collection.queryDocuments(
	            collection.getSelfLink(),
	            'SELECT * FROM root r where r.category = "' + categoryId + '"',
	        function (err, feed, options) {
	            if (err) throw err;
	
	            // Check the feed and if empty, set the body to 'no docs found', 
	            // else take 1st element from feed
	            if (!feed || !feed.length) {
	                var response = getContext().getResponse();
	                response.setBody('no docs found');
	            }
	            else {
	                var response = getContext().getResponse();
	                var body = { prefix: prefix, count: feed.length, first: feed[0] };
	                response.setBody(JSON.stringify(body));
	            }
	        });
	
	        if (!isAccepted) throw new Error('The query was not accepted by the server.');
	    }
    };
    
    var productCategoriesStoredProc = {
    	id: "productCategoriesAlt", 
    	serverScript: function(continuationToken, filterQuery) {
	        var collection = getContext().getCollection();
	        var maxResult = 1000; // MAX number of docs to process in one batch, when reached, return to client/request continuation. 
	                            // intentionally set low to demonstrate the concept. This can be much higher. Try experimenting.
	                            // We've had it in to the high thousands before seeing the stored procedure timing out.
	
	        var result = {};
	
	        tryQuery(continuationToken);
	
	        // Helper method to check for max result and call query.
	        function tryQuery(nextContinuationToken) {
	            var responseOptions = { continuation: nextContinuationToken, pageSize : maxResult };
	
	            // In case the server is running this script for long time/near timeout, it would return false,
	            // in this case we set the response to current continuation token, 
	            // and the client will run this script again starting from this continuation.
	            // When the client calls this script 1st time, is passes empty continuation token.
	            if (result >= maxResult || !query(responseOptions)) {
	                setBody(nextContinuationToken);
	            }
	        }
	
	        function query(responseOptions) {
	            // For empty query string, use readDocuments rather than queryDocuments -- it's faster as doesn't need to process the query.
	            return (filterQuery && filterQuery.length) ?
	                collection.queryDocuments(collection.getSelfLink(), filterQuery, responseOptions, onReadDocuments) :
	                collection.readDocuments(collection.getSelfLink(), responseOptions, onReadDocuments);
	        }
	
	        // This is callback is called from collection.queryDocuments/readDocuments.
	        function onReadDocuments(err, docFeed, responseOptions) {
	            if (err) {
	                throw 'Error while reading document: ' + err;
	            }
	            
	            result[docFeed[0].category] = {id: docFeed[0].category, name: docFeed[0].category, category: docFeed[0].category};
	            result[docFeed[docFeed.length-1].category] = {id: docFeed[docFeed.length-1].category, name: docFeed[docFeed.length-1].category, category: docFeed[docFeed.length-1].category};
	
	            // If there is continuation, call query again with it, 
	            // otherwise we are done, in which case set continuation to null.
	            if (responseOptions.continuation) {
	                tryQuery(responseOptions.continuation);
	            } else {
	                setBody(null);
	            }
	        }
	
	        // Set response body: use an object the client is expecting (2 properties: result and continuationToken).
	        function setBody(continuationToken) {
	            var body = { productCategories: result, continuationToken: continuationToken };
	            getContext().getResponse().setBody(body);
	        }
	    }
    };
    
    function createStoredProcedures() {
    	return new Promise((resolve, reject) => {
	        client.createStoredProcedure('dbs/reviews/colls/reviewColl', helloWorldStoredProc, options, 
	        	function (response) {
	        		if (response.code === 409) {} else {console.log("Successfully created hello world stored procedure");}
		            client.createStoredProcedure('dbs/reviews/colls/reviewColl', productCategoriesStoredProc, options,
	    	        	function (response) {
		            		if (response.code === 409) {} else {console.log("Successfully created prod cats stored procedure");}
	    	    	        client.createStoredProcedure('dbs/reviews/colls/reviewColl', firstReviewForCategoryStoredProc, options,
    	    		        	function (response) {
	    	    	        		if (response.code === 409) {} else {console.log("Successfully created review stored procedure");}
    	    		            	resolve();
    	    		        });
	    	        });
	        });
    	});
    };
    
    function executeProductCategoryStoredProcedure() {
    	options.enableCrossPartitionQuery = true;
    	options.partitionKey = 'B008QTTGGG';
    	return new Promise((resolve, reject) => {
            client.executeStoredProcedure('dbs/reviews/colls/reviewColl/sprocs/productCategories', options, function(response) {
            	console.log(response);
            	if (response.code) {
            		reject(response);
            	} else {
            		resolve(response);
            	}
            });
    	});
    };
    
    function executeFirstReviewStoredProcedure(categoryId) {
    	options.enableCrossPartitionQuery = true;
    	options.partitionKey = 'B008QTTGGG';
    	return new Promise((resolve, reject) => {
            client.executeStoredProcedure('dbs/reviews/colls/reviewColl/sprocs/firstReviewForCategory', ['foo', categoryId], options, function(response) {
            	console.log(response);
            	if (response.code) {
            		reject(response);
            	} else {
            		resolve(response);
            	}
            });    		
    	});
    };
    
    return {
      getReviewsForProduct : getReviewsForProduct,
      addReview : addReview,
      updateReview: updateReview,
      getProductCategories: getProductCategories,
      getProductsInCategory: getProductsInCategory,
      createStoredProcedures: createStoredProcedures,
      executeProductCategoryStoredProcedure: executeProductCategoryStoredProcedure, 
      executeFirstReviewStoredProcedure: executeFirstReviewStoredProcedure
    };
  }
}