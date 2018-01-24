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

var config = {}

config.endpoint = "https://reviewappprecocity.documents.azure.com:443/";
config.primaryKey = "E7M0E8EOQr1vI3Ks1RgMfZaIt3nYPMNILRZ1oQ7PGX86PaiGxjVZWZu1EEqUwAogGlWRrvgpLt7eW80tKnLifw==";

config.database = {
    "id": "reviews"
};

config.collection = {
    "id": "scoredReviews"   //"id": "reviewColl"
};

config.documents = {
    "B000H00VBQ_1": {
    	"asin": "B000H00VBQ",
        "id": "B000H00VBQ.1",
        "upVotes": "0",
        "totalVotes": "0",
        "overall": "2.0",
        "reviewText": "I had big expectations",
        "reviewTime": "05 3, 2014",
        "reviewerId": "A11N155CW1UV02",
        "reviewerName": "AdrianaM",
        "summary": "A little bit bori...",
        "unixReviewTime": 1399075200,
        "category": "Amazon_Instant_Video"
    },
	"B000H00VBQ_2": {
    	"asin": "B000H00VBQ",
        "id": "B000H00VBQ.2",
        "upVotes": "0",
        "totalVotes": "0",
        "overall": "5.0",
        "reviewText": "I highly recommen...",
        "reviewTime": "09 3, 2012",
        "reviewerId": "A3BC8O2KCL29V2",
        "reviewerName": "Carol T",
        "summary": "Excellent Grown U...",
        "unixReviewTime": 1346630400,
        "category": "Amazon_Instant_Video"
    },
    "B000H00VBQ_3": {
    	"asin": "B000H00VBQ",
        "id": "B000H00VBQ.3",
        "upVotes": "0",
        "totalVotes": "1",
        "overall": "1.0",
        "reviewText": "This one is a rea...",
        "reviewTime": "10 16, 2013",
        "reviewerId": "A60D5HQFOTSOM",
        "reviewerName": "Daniel Cooper \"da...",
        "summary": "Way too boring fo...",
        "unixReviewTime": 1381881600,
        "category": "Amazon_Instant_Video"
    },
    "B000H0X79O_1": {
    	"asin": "B000H0X79O", 
        "id": "B000H0X79O.1",
        "upVotes": "0",
        "totalVotes": "0",
        "overall": "3.0",
        "reviewText": "It beats watching...",
        "reviewTime": "10 15, 2013",
        "reviewerId": "A1PG2VV4W1WRPL",
        "reviewerName": "Jimmy C. Saunders...",
        "summary": "It takes up your ...",
        "unixReviewTime": 1381795200,
        "category": "Amazon_Instant_Video"
    },
    "B000H0X79O_2": {
    	"asin": "B000H0X79O", 
        "id": "B000H0X79O.2",
        "upVotes": "0",
        "totalVotes": "0",
        "overall": "3.0",
        "reviewText": "There are many ep...",
        "reviewTime": "12 29, 2013",
        "reviewerId": "ATASGS8HZHGIB",
        "reviewerName": "JohnnyC",
        "summary": "A reasonable way ...",
        "unixReviewTime": 1388275200,
        "category": "Amazon_Instant_Video"
    },
    "B000H0X79O_3": {
    	"asin": "B000H0X79O", 
        "id": "B000H0X79O.3",
        "upVotes": "0",
        "totalVotes": "1",
        "overall": "5.0",
        "reviewText": "This is the best ...",
        "reviewTime": "02 26, 2014",
        "reviewerId": "A3RXD7Z44T9DHW",
        "reviewerName": "Kansas",
        "summary": "kansas001",
        "unixReviewTime": 1393372800,
        "category": "Amazon_Instant_Video"
    }
};

module.exports = config;