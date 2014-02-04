var RemoteObjects = require('../');
var express = require('express');
var request = require('supertest');
var fs = require('fs');

describe('strong-remoting', function () {
  var app, remotes, objects;

  beforeEach(function(){
    objects = RemoteObjects.create();
    remotes = objects.exports;
    app = express();

    app.use(function (req, res, next) {
      objects.handler('rest').apply(objects, arguments);
    });
  });
  
  function json(method, url) {
    return request(app)[method](url)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/json')
      .expect(200)
      .expect('Content-Type', /json/);
  }

  it('should stream the file output', function (done) {
    remotes.fs = fs;
    fs.createReadStream.shared = true;
    fs.createReadStream.accepts = [{arg: 'path', type: 'string'}];
    fs.createReadStream.returns = {arg: 'res', type: 'stream'};
    fs.createReadStream.http = {
      verb: 'get',
      // path: '/fs/createReadStream', 
      pipe: {
        dest: 'res'
      }
    };

    json('get', '/fs/createReadStream?path=' + __dirname + '/data/foo.json')
      .expect({bar: 'baz'}, done);
  });
});
