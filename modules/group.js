// @wolfram77
// GROUP - maintains info sharing with multiple devices
// () - 


// required modules
var EventEmitter = require('events').EventEmitter;
var http = require('http');
var _ = require('lodash');
var z = require('./zed')();



// initialize
module.exports = function(c, storage) {
  var o = new EventEmitter();

  // init
  var qsync = [], esync = [];


  // get request data for storage
  var reqd  = function() {
    var r = {}, now = _.now();
    console.log('[group:reqd] '+new Date(now));
    for(var p in c.points)
      r[p] = {'start': c.points[p].tsync+1, 'end': now};
    return r;
  };


  // update sync time
  var updatetsync = function(vs) {
    console.log('[group:updatetsync]');
    for(var p in vs)
      if(vs[p].time.length > 0) c.points[p].tsync = _.last(vs[p].time);
  };


  // request options
  var reqopt = function(p, len) {
    console.log('[group:reqopt] . '+p+' ('+len+')');
    return {
      'method': 'GET',
      'path': '/api/storage/get',
      'host': c.points[p].host,
      'port': c.points[p].port,
      'headers': {
        'Content-Type': 'application/json',
        'Content-Length': len
      }
    };
  };


  // sync (one point)
  var sync = function(p, fn) {
    console.log('[group:sync] . '+p);
    var sreq = JSON.stringify(reqd());
    var options = reqopt(p, sreq.length);
    var req = http.request(options, function(res) {
      z.httpbody(res, function(sres) {
        var resd = JSON.parse(sres);
        updatetsync(resd);
        storage.put(resd, function() {
          if(fn) fn(true);
        });
      });
    });
    req.on('error', function(err) {
      if(fn) fn(false, err);
    });
    req.write(sreq);
    req.end();
  };


  // get next point to sync
  var nextsync = function(ps, all) {
    console.log('[group:nextsync] . ('+ps.length+')');
    if(all && ps.length>0) return ps.shift();
    while(ps.length > 0) {
      var p = ps.shift();
      var v = c.points[p];
      if(v.tsync+v.gsync > _.now()) return p;
    }
  };


  // sync loop
  // ps = points, es = errors, all = do all
  var syncloop = function(ps, es, all, fn) {
    console.log('[group:syncloop]');
    var p = nextsync(ps, all);
    if(!p) {
      if(fn) fn(es);
      return;
    }
    sync(p, function(ok, err) {
      if(!ok) es.push([p, err]);
      process.nextTick(function() {
        syncloop(ps, es, all, fn);
      });
    });
  };


  // add point to sync list in intervals
  var syncadd = function(p) {
    console.log('[group:syncadd] . '+p);
    setInterval(function() {
      if(_.indexOf(qsync, p) < 0) qsync.push(p);
      if(qsync.length === 1) syncloop(qsync, esync, true);
    }, c.points[p].gsync);
  };


  // run sync in background
  var syncrun = function() {
    console.log('[group:syncrun]');
    setInterval(function() {
      esync.length = 0;
    }, c.derr);
    for(var p in c.points)
      syncadd(p);
  };



  // get name of this
  o.point = function() {
    console.log('[group.point]');
    return c.point;
  };


  // get names of points (including self)
  // ret = [name]
  o.points = function() {
    console.log('[group.points]');
    var ps = _.keys(c.points);
    ps.push(c.point);
    return ps;
  };


  // get point details
  // ret = {name:{host, port}}, ps = [name]
  o.get = function(ps) {
    console.log('[group.get]');
    return _.pick(c.points, ps);
  };


  // set point details
  // pds = {name:{host, port}}
  o.set = function(pds) {
    console.log('[group.set]');
    var now = _.now();
    for(var p in pds)
      c.points[p] = _.assign(c.points[p] || {'tsync': 0}, pds[p]);
  };


  // clear point
  // ps = [name]
  o.clear = function(ps) {
    console.log('[group.clear]');
    for(var i=0; i<ps.length; i++)
      delete c.points[ps[i]];
  };


  // sync data
  o.sync = function(fn) {
    console.log('[group.sync]');
    var ps = _.keys(c.points), es = [];
    syncloop(ps, es, false, fn);
  };



  // sync in background
  syncrun();


  // ready!
  console.log('group ready!');
  return o;
};
