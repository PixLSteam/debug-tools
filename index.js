const path = require("path");
const fs = require("fs");
const PixLDebug = function PixLDebug(opts=PixLDebug.defaultOpts) {
	const accOptTypes = ["object", "function"];
	if (accOptTypes.indexOf((typeof opts).toLowerCase()) < 0) {
		opts = PixLDebug.defaultOpts;
	}
	let getOpt = function getOpt(key, check=null, defVal=undefined) {
		let check = typeof check === "function" ? check : x => ([undefined, null]).indexOf(x) < 0;
		let cCheck = check;
		check = x => {
			try {
				return cCheck(x);
			} catch (err) {
				//log?
				return false;
			}
		};
		if (check(opts[key])) {
			return opts[key];
		}
		return check(opts[key]) ? opts[key] : (check(PixLDebug.defaultOpts[key]) ? PixLDebug.defaultOpts[key] : defVal);
	};
	this.asyncMeasures = [];
	// this.debugLevel = (Number(opts.debugLevel) && !isNaN(Number(opts.debugLevel))) ? Number(opts.debugLevel) : PixLDebug.enums.ERROR_LEVEL.WARN;
	this.debugLevel = getOpt("debugLevel", x=>!isNaN(Number(x)), getOpt("errorLevel", x=>!isNaN(Number(x)), PixLDebug.enums.ERROR_LEVEL_WARN));
	this.fileLogging = getOpt("fileLogging"); //was: opts.fileLogging
	this.consoleLogging = getOpt("consoleLogging");
	this.logFile = getOpt("logFile");
	this.maxErrorDepth = getOpt("maxErrorDepth");
	this.logTimestamp = getOpt("logTimestamp");
};

PixLDebug.defaultOpts = {
	fileLogging: true,
	consoleLogging: true,
	logFile: path.dirname((module && module.parent) ? module.parent.filename : __filename)+"/debug.log",
	maxErrorDepth: 16,
	logTimestamp: 1
};

PixLDebug.ENUM = {};
PixLDebug.ENUMS = PixLDebug.ENUM;
PixLDebug.enums = PixLDebug.ENUM;

PixLDebug.ENUM.ERROR_LEVEL = {
	"FATAL": 5,
	"ERROR": 4,
	"WARN": 3,
	"INFO": 2,
	"DEBUG": 1,
	"ALL": 0,
	0: "ALL",
	1: "DEBUG",
	2: "INFO",
	3: "WARN",
	4: "ERROR",
	5: "FATAL"
};
PixLDebug.ENUM.DEBUG_LEVEL = PixLDebug.ENUM.ERROR_LEVEL;

PixLDebug.prototype.measure = function measure(func) {
	if (typeof func !== "function") {
		return;
	}
	const data = {};
	data.start = Date.now();
	try {
		func();
	} catch(err) {
		data.error = err;
	}
	data.end = Date.now();
	data.time = data.end - data.start;
	return data;
};
PixLDebug.prototype.asyncMeasures = [];
PixLDebug.prototype.startMeasure = function startMeasure() {
	const id = Object.create(null);
	const data = {};
	data.id = id;
	data.start = Date.now();
	this.asyncMeasures.push(data);
	return id;
};
PixLDebug.prototype.stopMeasure = function stopMeasure(id) {
	let data;
	for (let i = 0; i < this.asyncMeasures.length; i++) {
		if (this.asyncMeasures[i].id === id) {
			data = this.asyncMeasures[i];
			break;
		}
	}
	if (!data) {
		return;
	}
	data.end = Date.now();
	data.time = data.end - data.start;
	return data;
};

function toOutput(x) {
	if (x instanceof Error) {
		return x.stack || (x.name + ": " + x.message);
	}
	if (typeof x === "function") {
		return x.name ? "function "+x.name+"()" : "anonymous function";
	}
	if ((["string", "number", "object"]).indexOf(typeof x) >= 0) {
		return JSON.stringify(x);
	}
	try {
		return x.toString();
	} catch(err) {
		return typeof x;
	}
}

PixLDebug.prototype.log = function log(level, ...data) {
	if (level >= this.debugLevel) {
		if (this.consoleLogging) {
			console.log.apply(console, data);
		}
		if (this.fileLogging && this.logFile) {
			let dataStr = "";
			dataStr = data.map(toOutput).join(" ");
			fs.appendFileSync(this.logFile, dataStr);
		}
	}
};

function resolveCallStack(func, includeCur, opts={maxErrorDepth: 16}) {
	if (typeof func !== "function") {
		return [];
	}
	var calls = [];
	var anon = "Anonymous function";
	if (includeCur) {
		calls.push(func.name || anon);
	}
	try {
		var d = 0;
		while (true) {
			var f2 = func.caller;
			d++;
			if (d > opts.maxErrorDepth) {
				break;
			}
			calls.push(f2.name || anon);
			func = f2;
		}
	} catch(err) {
		
	}
	return calls;
};

PixLDebug.prototype.logError = function logError(level, err) {
	try {
		const e = {};
		e.err = err;
		e.where = logError.caller.name || "Anonymous function";
		e.calls = resolveCallStack(logError, true, {maxErrorDepth: this.maxErrorDepth});
		//do stuff
		let str = "";
		if (this.prependTime) {
			let date = new Date();
			let dd = x => x > 9 ? "" + x : "0" + x;
			str = date.getFullYear() + "-" + dd(date.getMonth()) + 1 + "-" + dd(date.getDate()) + " " + dd(date.getHours()) + ":" + dd(date.getMinutes()) + ":" + dd(date.getSeconds()) + " | ";
		}
		//add more info
		str += err.stack ? err.stack : err.name + ": " + err.message;
		this.log(level, str);
	} catch(error) {
		return false;
	}
};

module.exports = PixLDebug;