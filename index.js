const path = require("path");
const fs = require("fs");
const PixLDebug = function PixLDebug(opts=PixLDebug.defaultOpts) {
	const accOptTypes = ["object", "function"];
	if (accOptTypes.indexOf((typeof opts).toLowerCase()) < 0) {
		opts = PixLDebug.defaultOpts;
	}
	this.asyncMeasures = [];
	this.debugLevel = (Number(opts.debugLevel) && !isNaN(Number(opts.debugLevel))) ? Number(opts.errorLevel) : PixLDebug.enums.ERROR_LEVEL.WARN;
	this.fileLogging = opts.fileLogging;
	this.consoleLogging = opts.consoleLogging;
	this.logFile = opts
};

PixLDebug.defaultOpts = {
	fileLogging: true,
	consoleLogging: true,
	logFile: path.dirname((module && module.parent) ? module.parent.filename : __filename)+"/debug.log"
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

PixLDebug.prototype.log = function log(level, ...data) {
	if (level >= this.debugLevel) {
		if (this.consoleLogging) {
			console.log.apply(console, data);
		}
		if (this.fileLogging && this.logFile) {
			let dataStr = "";
			dataStr = data.map(x => JSON.stringify(x)).join(" ");
			fs.appendFileSync(this.logFile, dataStr);
		}
	}
};

module.exports = PixLDebug;