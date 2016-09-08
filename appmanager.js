var fs = require('fs');
var approot = './app/';

//a global var that holds varies info about the
// app that were launched.
var APPINFO = {};

// a global var that holds live status of the 
// app that were currently running.
var LIVEAPPINFO = {};
module.exports = {
	//Tells if an apptype is a valid one or not
	IsAValidAppType : function(apptype) {
		var validapptypes = GetValidAppTypes(apptype);
		return  (validapptypes.indexOf(apptype) == -1) ? false : true;

	},
	//Tells if a particular app is an valid app of the apptype
	// it claims.
	IsAValidApp : function(apptype, appname) {
		var validapps = GetValidApps(apptype);
		return (validapps.indexOf(appname) == -1) ? false : true;
	},
	// Registers the app i.e initializes the appinfo for this
	// particualr app. Currently this won't allow duplicate
	// app copy run i.e the second request to launch an app with
	// the first request running was still in progress. In the
	// future we could incoporate logic to handle the parallel
	// requests. Foe now we avoid this to make things simpler.
	RegisterApp : function(apptype,appname) {
		if (!this.IsAValidAppType(apptype)){
			return {
				status : "failed",
				message: "'" + apptype + "' is not a valid apptype"
			};
		}
		if(!this.IsAValidApp(apptype,appname)){
			return {
				status:"failed",
				message: "'" + appname + "' is not a valid app of type '" + apptype + "'"
			};
		}
		if (! APPINFO[apptype]) {
			APPINFO[apptype] = {};
			LIVEAPPINFO[apptype] = {};
		}
		if (APPINFO[apptype][appname] && APPINFO[apptype][appname] == 'started') {
			return {
				status:"failed",
				message:"'" + appname + "' seems already running"
			};
		}
		else {
			APPINFO[apptype][appname] = {
				status: "started",
				result: '',
				starttime: new Date(),
				endtime:''
			};
			LIVEAPPINFO[apptype][appname] = {};
			return {
				status : "success",
				message : "'" + appname + "' was successfully registered!"
			};	 
		}

	},
	// Deregister an already registered app
	DeregisterApp : function(apptype,appname){
		delete APPINFO[apptype][appname];
		delete LIVEAPPINFO[apptype][appname];
	},
	// Update the live status of an app
	UpdateLiveAppStatus : function (apptype, appname, appstatus){
		LIVEAPPINFO[apptype][appname].status = appstatus;
		LIVEAPPINFO[apptype][appname].currenttime = new Date();
	},
	// To get the live status of an app
	GetLiveAppStatus : function (apptype,appname) {
		if (this.IsAppRegistered(apptype,appname)){
			return LIVEAPPINFO[apptype][appname];
		}
		else {
			return {
				status : "notrunning"
			};
		}
	},
	// Update the appinfo for the result once an app
	// completed its run.
	UpdateAppResult : function(apptype, appname, result) {
		APPINFO[apptype][appname].status = 'completed';
		APPINFO[apptype][appname].result = result;
		APPINFO[apptype][appname].endtime = new Date();
	},
	// Tells if a particular app is already registered or not
	IsAppRegistered : function(apptype,appname) {
		return APPINFO[apptype] ? (APPINFO[apptype][appname] ? true : false ) : false;
	},
	// Tells if a particular app was already running
	IsAppRunning : function(apptype,appname) {
		return this.IsAppRegistered(apptype,appname)
			? (APPINFO[apptype][appname].status == 'completed' ? false : true)
			: false
	},
	// Tells the appinfo of the required app
	GetAppInfo : function (apptype,appname){
		if (this.IsAppRegistered(apptype,appname)){
			return APPINFO[apptype][appname];
		}
		else {
			return {
				status : "notrunning"
			};
		}
	}
};

// Returns all valid apptypes i.e basically all folder names
// available under ./approot/
function GetValidAppTypes(apptype){
	return require('fs').readdirSync(approot);
}

// Returns all valid apps i.e all file names with their extensions
// removed under ./approot/apptype/
function GetValidApps(apptype) {
	var validapps = require('fs').readdirSync(approot + apptype);
	// app filenames will come along with '.js' extension. we
	// need to slice it to get the proper app name.
	validapps.forEach(function(filename,index,arr){
		arr[index] = filename.slice(0,-3);
	});
	return validapps;
}