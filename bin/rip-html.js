#! /usr/bin/env node
var download = function(domain, whitelist, callback) {
	var fs = require('node-fs'), url = require('url'), path = require('path'), Crawler = require('simplecrawler').Crawler;

	var crawl = new Crawler(domain);
	crawl.interval = 3000;
	crawl.maxConcurrency = 1;
	crawl.respectRobotsTxt = false;
	crawl.domainWhitelist = whitelist || [];

	crawl.on('fetchstart', function(queueItem) {
		console.log("Starting request for:", queueItem.url);
	});

	crawl.on('fetchcomplete', function(queueItem, responseBuffer, response) {

		var parsed = url.parse(queueItem.url);

		// Rename / to index.html
		if (parsed.path === "/") {
			parsed.path = "/index.html";
		}

		// Where to save downloaded data
		var outputDirectory = path.join(__dirname, domain);

		// Get directory name in order to create any nested dirs
		var dirname = outputDirectory + parsed.path.replace(/\/[^\/]+$/, "");

		// Path to save file
		var filepath = outputDirectory + parsed.path;

		//detect extension
		var type = response.headers['content-type'];
		if (type.match('text/html')) {
			if (parsed.path.indexOf('.htm') < 0) {
				filepath += '.html';
			}
		} else if (type.match('application/pdf')) {
			if (parsed.path.indexOf('.pdf') < 0) {
				filepath += '.pdf';
			}
		}

		// Check if DIR exists
		fs.exists(dirname, function(exists) {

			// If DIR exists, write file
			if (exists) {
				fs.writeFile(filepath, responseBuffer, function() {});
			} else {
				// Else, recursively create dir using node-fs, then write file
				fs.mkdir(dirname, 0755, true, function() {
					fs.writeFile(filepath, responseBuffer, function() {});
				});
			}

		});

		console.log("Saving to %s (%d bytes)", filepath, responseBuffer.length);
		console.log("It was a resource of type %s", type);

	});

	crawl.on('complete', function() {
		callback();
	});

	crawl.addFetchCondition(function(parsedURL, queueItem) {
		return !parsedURL.path.match(/\.(css|js|gif|png|jpeg|jpg|axd|ico)$/i);
	});

	crawl.start();
};


if (process.argv.length < 3) {
	console.log('Usage: rip-html example.com www.example.com other-alias-for-example.com');
	process.exit(1);
}

download(process.argv[2], process.argv.slice(3), function() {
	console.log('Done!');
});
