var express = require('express');
var expressapp = express();
var appmanager = require('./appmanager.js');

// app run request handler
expressapp.get('/app/:apptype?/:appname?', function (req, res) {
	console.log(req.ip + " incoming request(app launch): " + req.originalUrl);
	var apptype = req.params.apptype;
	var appname = req.params.appname;
	var appoptions = req.query;
	// check if the requested apptype was valid
	if (appmanager.IsAValidAppType(apptype)) {
		if (appmanager.IsAValidApp(apptype,appname)){
			if (appmanager.IsAppRunning(apptype,appname)) {
				postError("The app '" + appname + "' was already running", res);
			}
			else {
				var regresult = appmanager.RegisterApp(apptype,appname);
				if (regresult.status == 'success'){
					var apptoload = './app/' + apptype + '/' + appname + '.js';
					var app = require(apptoload);
					var assertfailure = app.AssertOptions(appoptions);
					if (assertfailure){
						appmanager.DeregisterApp(apptype,appname);
						postError(assertfailure, res);
					}
					else {
						appoptions.name = appname;
						appoptions.type = apptype;
						app.Run(appoptions, appmanager, function(result) {
							appmanager.UpdateAppResult(apptype,appname,result);
							console.log(req.ip + " result of the app (" + appname + "):-");
							console.log(result);
						});
						postResult("'" + appname + "' app of type '" + apptype + "' was started",res);
					}
				}
				else {
					postError(regresult.message,res);
				}
			}
		}
		else {
			postError("'" + appname + "' is not a valid app of type '" + apptype + "'", res);
		}
	}
	else {
		postError("'" + apptype + "' is not a valid apptype", res);
	}
});

// app query request handler
expressapp.get('/appquery/:querytype', function (req, res) {
	console.log(req.ip + " incoming request(app query): " + req.originalUrl);
	var query = req.query;
	var querytype = req.params.querytype;
	var appname = query.appname;
	var apptype = query.apptype;
	if (appname && apptype) {
		if (appmanager.IsAValidAppType(apptype)) {
			if (appmanager.IsAValidApp(apptype,appname)){
				var appinfo;
				if (querytype == 'finalresult'){
					appinfo = appmanager.GetAppInfo(apptype,appname);
				}
				else if (querytype == 'currentstatus'){
					appinfo = appmanager.GetLiveAppStatus(apptype,appname);
				} 
				postResult(appinfo,res);
			}
			else {
				postError("'" + appname + "' is not a valid app of type '" + apptype + "'", res);
			}
		}
		else {
			postError("'" + apptype + "' is not a valid apptype", res);
		}
	}
	else {
		postError("the parameters apptype,appname are required!", res);
	}
});



// Kickoff the webservice server. 3333 is just some random port
// for our webservice server
var server = expressapp.listen(3333, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("Webservice server listening at http://%s:%s", host, port)
});

//////////////////////////////////////////////////////
// postResult
//    To post a successful result to the requesting
//    client.
// Parameters
//    result - result obj/string
//    response - response object
// Returns
//    none, just post the result back.
/////////////////////////////////////////////////////
function postResult (result,response) {
	response.json({
		status:"ok",
		result: result
	});
	response.end();
}

//////////////////////////////////////////////////
// postError
//    To post an error we got.
//
// Parameters
//    error - error msg
//    response - response object
//
// Returns
//    none the post the error detail.
//////////////////////////////////////////////////
function postError (error,response) {
	response.json({
		status:"notok",
		error:error

	});
	response.end();
}
