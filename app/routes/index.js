'use strict';

var http = require("http");
var validUrl = require("valid-url");
var mongodb = require('mongodb');
var mongoClient = mongodb.MongoClient;
var mongoUrl = 'mongodb://localhost/urls';

var myUrl = 'https://url-shortener-microservice-bogdinu.c9users.io/';
var dbCollection;
var output = {};

module.exports = function (app) {
	
	app.route('/:aNumber').get(function(req, res){; //should switch to * then check if a number §§§§§§§
	    createConnection(function(){ //connect to database
			findIndex(req, res, function(){ //find document
				sendAnswer(req, res, output); //send the answer
			});
		});
	})
	
	app.route('/new/*').get(function(req, res){
		
		//console.log("Path is: "+req.params[0]);
		if(validUrl.isHttpUri(req.params[0]) || validUrl.isHttpsUri(req.params[0])) { //if the param is a valid url, check if it exists
			createConnection(function(){ //connect to database
				findDocument(req, res, function(){ //find document
					sendAnswer(req, res, output); //send the answer
				});
			});
		}
		else { //if not a valid url, 
			output = {};
			output.error = "URL invalid";
			res.status(200).send(output);
		}
		
	});
};




function createConnection(onCreate){
 
    mongoClient.connect(mongoUrl, function(err, db) { //connect to database
        if(err){
            console.log('Error connecting to database');
            throw err;
        }
        //console.log("connected to the mongoDB !");
        dbCollection = db.collection('urlnames'); //set the collection
        
        onCreate(); //callback function
    });
}


function findDocument(request, response, onFinded){ 
    
    var cursor = dbCollection.findOne({"original_url": request.params[0]}, function(err, doc) { //try to find the path given as a parameter
        if(err)
            throw err;
        if(doc==null){ //path not found in the database
            //console.log("path " +request.params.aNumber+ "not found in db !");
            dbCollection.count(function(err, count) {
            	if (err) throw err;
            	output={};
            	output.index = count + 1;
            	output.original_url = request.params[0];
            	dbCollection.insert(output, function(err, result){
            		if (err) throw err;
            		onFinded();
            	});
          	});
        }
        else{ //path found, return the index in the output variable
        	//console.log("document find:");
        	//console.log(doc.path);
        	//console.log(doc.index);
        	output={};
        	output.original_url = doc.original_url;
        	output.index = myUrl+doc.index.toString();
        	onFinded();
        }
    });
}


function findIndex(request, response, onFinded){ 
    
    dbCollection.findOne({"index": parseInt(request.params.aNumber)}, function(err, doc) { //try to find the path given as a parameter
        if(err)
            throw err;
        if(doc==null){ //index not found in the database
            //console.log("index: " + request.params.aNumber + " not found in db !");
            output = {};
            output.error="No short url found for given input";
            onFinded();
        }
        else{ //index found, return the url in the output variable
        	//console.log("document found:");
        	//console.log(doc.original_url);
        	//console.log(doc.index);
        	response.redirect(doc.original_url);
        }
    });
}


function sendAnswer(request, response, answerObj){ //send the answer
	response.status(200).send(answerObj);
}