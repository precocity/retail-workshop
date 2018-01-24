"use strict";

var http = require('http'),
    express = require('express'),
    db = require('./app').createCosmosAdapter(),
    bodyparser = require('body-parser'),
    EventHubClient = require('azure-event-hubs').Client,
    Promise = require('bluebird');

var urlencodedparser = bodyparser.urlencoded({extended:false});

// web server, REST
var app = express();
var port = process.env.PORT || 8080;
var cachedCategories;

// db: azure cosmos db (see app.js)
var host = "reviewappprecocity.azurewebsites.net";

//Event Hub
var connectionString = 'Endpoint=sb://new-reviews.servicebus.windows.net/;SharedAccessKeyName=RootManageSharedAccessKey;SharedAccessKey=aoVRAW0YWk4C35MvjTVh2Y4ItADf4bbUN6OIm3iIU6k=';
var eventHubPath = 'new-review-event-hub';
//var eventHubClient; // = EventHubClient.fromConnectionString(connectionString, eventHubPath);
var receiveAfterTime = Date.now() - 5000;
var eventHubSender;

var sendEvent = function (data, client) {
  return function (sender) {
    sender.send(data)
    .then(function () {
    	client.close();
    });
  };
};

var printError = function (err) {
  if (err.message) {
    console.error(err.message);
  } else if (err.body) {
    console.error(JSON.parse(err.body).message);
  }
};

var printEvent = function (ehEvent) {
  console.log('Event Received: ');
  console.log(JSON.stringify(ehEvent.body));
  console.log('');
};

var putDataOnEventHub = function(data) {
  console.log('Sending Event: ' + data);
  var eventHubClient = EventHubClient.fromConnectionString(connectionString, eventHubPath);
  
//establish connection to Event Hub
  eventHubClient.open()
    .then(eventHubClient.getPartitionIds.bind(eventHubClient))
    .then(function() {
      return eventHubClient.createSender();
    })
    .then(sendEvent(data, eventHubClient))
    .catch(printError);
};

// Utility methods

//convert strings to numerics, fix arrays which come up with key 'arrayname[]'
var fixNumerics = function(data, numFields) {
  var numericFields = numFields || ['good_label', 'good_score', 'helpful', 'overall', 'unixReviewTime', '_ts'];
  for (var key in data) {
   if (Array.isArray(data[key])) {
     var arr = data[key];
     delete data[key];
     key = key.substr(0, key.length-2);
     data[key] = arr;
   }
     
   var idx = numericFields.indexOf(key);
   if (idx >= 0) {
     if (Array.isArray(data[key])) {
       for (var ndx in data[key]) {
         data[key][ndx] = parseInt(data[key][ndx]);
       }
     } else if (data[key].indexOf('.') >= 0) {
       data[key] = parseFloat(data[key]);
     } else {
       data[key] = parseInt(data[key]);
     }
   }
  }
  
  return data;
};

// Express setup
app.use(function(req, res, next) {
  // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', host);

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.get('/categories', function(req, res) {
  if (cachedCategories) {
	  res.send(cachedCategories);
  } else {
//	cachedCategories = {categories: [
//		{id: 'Amazon_Instant_Video', name: 'Amazon_Instant_Video'},
//		{id: 'Apps_for_Android', name: 'Apps_for_Android'},
//		{id: 'Electronics', name: 'Electronics'}	]};
	
    db.getProductCategories()
    .then(function(results) {
      //cachedCategories = results;
      res.send(results);
    })
    .catch(function(error) {
      printError(error);
      res.send({error: error});
    });
  }
});

app.get('/category/:categoryId/products', function(req, res) {
  db.getProductsInCategory(req.params.categoryId)
  .then(function(results) {
    res.send(results);
  })
  .catch(function(error) {
    printError(error);
    res.send({error: error});
  });
});

app.get('/reviews/:id/:sort', function(req, res) {
  var id = req.params.id;
  var sort = req.params.sort;
  var count = 10;
  
  if (req.params.count && parseInt(req.params.count)) {
    count = parseInt(req.params.count);
  }
  db.getReviewsForProduct(id, sort, count)
  .then(function(results) {
    res.send(results);
  })
  .catch(function(error) {
    printError(error);
    res.send({error: error});
  });
});

// post: add
app.post('/reviews', urlencodedparser, function(req, res, next) {
  var data = req.body,
      now = new Date();

  data = fixNumerics(data);
  
  data.unixReviewTime = Math.floor(now.getTime() / 1000);
  var month = now.getMonth() + 1;
  var reviewTime = "";
  if (month < 10) reviewTime = "0";
  data.reviewTime = reviewTime + month + " " + now.getDate() + ", " + now.getFullYear();
  
  putDataOnEventHub(JSON.stringify(data));
  res.send({status: 'success'});
});

// put: add or update, takes the ID
app.put('/reviews/:reviewId', urlencodedparser, function(req, res, next) {
  var data = req.body,
      reviewId = req.params.reviewId,
      now = new Date();

  data = fixNumerics(data);
  
  if (!data.unixReviewTime) {
    data.unixReviewTime = Math.floor(now.getTime() / 1000);
    var month = now.getMonth() + 1;
    var reviewTime = "";
    if (month < 10) reviewTime = "0";
    data.reviewTime = reviewTime + month + " " + now.getDate() + ", " + now.getFullYear();
  }
  
  db.updateReview(data)
  .then(function(result) {
    res.send(result);
  })
  .catch(function(error) {
    printError(error);
    res.status(500).send({error: error}); 
  });
});

app.put('/pipeline/addreview/:id', function(req, res) {
  var id = req.params.id;
});

app.use(express.static(__dirname + '/public'));
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.get('/', function(req, res) {
  res.render('index.html');
});

app.listen(port);