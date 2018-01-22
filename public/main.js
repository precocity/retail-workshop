var secure = false;
var host = 'reviewappprecocity.azurewebsites.net';
var scores = ['1.0', '2.0', '3.0', '4.0', '5.0'];

var id = 'A';  // if ?id=<something> is passed in, overwrite; used to distinguish clients
var productId;
var productCategory;
var reviews;

//default ID unless id=<something else> passed
var testid = getParameterByName('id');
if (testid != null) {
  id = testid; // any identifier
}

//asin is product id
testid = getParameterByName('asin');
if (testid != null) {
  productId = testid;
}

$('#asin').text(productId);

testid = getParameterByName('c');
if (testid != null) {
  productCategory = testid;
}

$('#category').text(productCategory);

for (i in scores) {
  $('#overall').append('<option>' + scores[i] + '</option>');
}

$('#refresh').click(function() {
  getReviews(productId, $('#sortBy').val());
});

$('#categories').change(function() {
  $('#productSelect').hide();
  $('#product').hide();
  $('#asinInput').val('');
  productCategory = $('#categories').val();
  getProducts(productCategory);
});

$('#products').change(function() {
  $('#product').hide();
  productId = $('#products').val();
  getReviews(productId, $('#sortBy').val());
});

$('#sortBy').change(function() {
  getReviews(productId, $('#sortBy').val());
});

$('#asinSubmit').click(function() {
  $('#productSelect').hide();
  $('#product').hide();
  productId = $('#asinInput').val().trim();
  getReviews(productId, $('#sortBy').val());
})

$('#submit').click(function() {
  var newReview = {
    asin: productId,
    category: productCategory,
    helpful: [0, 0],
    helpfulRatio: 0,
    reviewerID: $('#reviewerId').val(),
    reviewerName: $('#reviewerName').val(),
    overall: $('#overall').val(),
    summary: $('#summary').val(),
    reviewText: $('#review').val()
  };
  
  $('#overall').val(scores[0]);
  $('#reviewerId').val('');
  $('#reviewerName').val('');
  $('#summary').val('');
  $('#review').val('');
  
  $.post("http://" + host + "/reviews/", newReview, function(newReview, status) {
    if (status === 'success') {
      alert('Your new review has been accepted by the server');
      getReviews(productId, $('#sortBy').val());
    }
  }).catch(function(promise, status) {
    var foo = "";
  });
  
//  $.ajax({
//      type: "post",
//      url: "http://www.moonfish.com:3001/reviews/",
//      cache: false,
//      data: newReview
//  });
    
//  $.ajax("http://www.moonfish.com:3001/reviews/", {type: 'POST', contentType: 'application/json', data: JSON.stringify(newReview), success: function(a,b) {
//    var foo = "";
//  }, error: function(promise, errorMessage) {
//    var bar = "";
//  }});
});

function getProductCategories() {
  $('#categories').children().remove().end();
  $('#categories').append($("<option />").val('').text('Retrieving Product Categories...'));
  getProductCategoriesFromServer()
  .then((categories) => displayCategories(categories))
  .catch((error) => {
    var message = JSON.parse(error.error.body).message;
    console.error('getProductCategories returned error ' + error.error.code + ': ' + message);
  });
}

function getProducts(categoryId) {
  if (categoryId === '') {
	  
  } else {
    getProductsInCategoryFromServer(categoryId)
    .then((products) => displayProducts(products.products))
    .catch((error) => {
      var message = JSON.parse(error.error.body).message;
      console.error('getProducts returned error ' + error.error.code + ': ' + message);
    });
  }
}

function getReviews(productId, sort) {
  if (productId === '') {
	  
  } else {
	displayReviews([]);
    getProductReviewsFromServer(productId, sort)
    .then((reviews) => displayReviews(reviews))
    .catch((error) => {
      var message = JSON.parse(error.error.body).message;
      console.error('getReviews returned error ' + error.error.code + ': ' + message);
    });
  }
}

function getProductReviewsFromServer(id, sort) {
  return new Promise((resolve, reject) => {
    $.get("http://" + host + "/reviews/" + id + "/" + sort, function(result) {
      if (result.error) {
        reject(result);
      } else {
        resolve(result);
      }
    });
  });
}

function getProductCategoriesFromServer() {
  return new Promise((resolve, reject) => {
    $.get("http://" + host + "/categories", function(result) {
      if (result.error) {
        reject(result);
      } else {
        resolve(result.categories);
      }
    });
  });
}

function getProductsInCategoryFromServer(categoryId) {
  return new Promise((resolve, reject) => {
    $.get("http://" + host + "/category/" + categoryId + "/products", function(result) {
      if (result.error) {
        reject(result);
      } else {
        resolve(result);
      }
    });
  });
}

function displayCategories(categories) {
	$('#categories').children().remove().end();
	$('#categories').append($("<option />").val('').text('Select a Product Category'));
	$.each(categories, function() {
		$('#categories').append($("<option />").val(this.id).text(this.name));
	});
}

function displayProducts(products) {
	$('#productSelect').show();
	$('#products').children().remove().end();
	$('#products').append($("<option />").val('').text('Select a Product'));
	$.each(products, function() {
		$('#products').append($("<option />").val(this.asin).text(this.asin));
	});
}

function displayReviews(reviews) {
  this.reviews = reviews;
  $('#reviews').html("");
  
  $.each(reviews, function(i, review) {
	  productId = review.asin;
	  productCategory = review.category;
	  
	  $('#categories').val(productCategory);
	  $('#asinInput').val(productId);
	  
	  var reviewer = $("<div class='reviewer'></div>").appendTo('#reviews');
	    $("<span class='icon'></span>").appendTo(reviewer);
	    $("<span class='reviewerName'></span>").text(review.reviewerName).appendTo(reviewer);
	  var summary = $("<div class='reviewSummary'></div>").appendTo('#reviews');
	  
	    for (var i = 0; i < 5; i++) {
	    	if (review.overall > i) {
	    	    $("<span class='star filled'></span>").appendTo(summary);
	    	} else {
	    		$("<span class='star empty'></span>").appendTo(summary);
	    	}
	    }
	    
	    $("<span class='summary'></span>").text(review.summary).appendTo(summary);
	  $("<div class='reviewDetail'></div>").text(review.reviewText).appendTo('#reviews');
	  var helpful = $("<div class='reviewHelpful'></div>").appendTo('#reviews');
	    $("<span class='helpful'></span>").text(review.helpful[0] + " of " + review.helpful[1] + " found this helpful. Did you find it helpful?").appendTo(helpful);
	    $("<span class='vote up button' id='" + review.id + "'></span>").text('Yes').appendTo(helpful);
	    $("<span class='vote down button' id= '" + review.id + "'></span>").text('No').appendTo(helpful);
	    $("<span class='helpfulnessRating'></span>").text("(Helfulness rating: " + Math.ceil(parseFloat(review.good_score)*100) + "%)").appendTo(helpful);
  });
  
  $('#product').show();
  
  $('.vote').on("click", function() {
    handleVote($(this));
  });
}

function handleVote(ele) {
  var id = ele.attr('id');
  var isUpVote = ele.attr('class').indexOf('up') >= 0;
  
  $.each(reviews, function(i, review) {
    if (review.id == id) {
      if (isUpVote) {
        review.helpful[0]++;
      }
      review.helpful[1]++;
      
      review.helpfulRatio = review.helpful[0] / review.helpful[1];
      
      // submit to server
      $.ajax({
          type: "PUT",
          url: "http://" + host + "/reviews/" + id,
          cache: false,
          data: review
      });

    }
  });
  
  displayReviews(reviews);
}

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}

getProductCategories();
