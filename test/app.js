var supertest = require('supertest');
var should = require('should');
var app = require('../example/server.js');

var server;

describe('node-express-php', function () {

    before(function(done) {
        server = app.listen(3003,'127.0.0.1',511, function(){
            done();
        });
    });

    after(function(done) {
        server.close(function(){
            done();
        });
    });


    it('should responded with html and status code 200', function (done) {
        supertest(server)
            .get('/php/hello.php')
            .expect('Content-Type', /text\/html/)
            .expect(200, done);
    });

    it('should serve "Hello World" content', function (done) {
        supertest(server)
            .get('/php/hello.php')
            .end(function (err, res) {
                if (err) return done(err);
                res.text.should.match(/Hello World/);
                done();
            });
    });
});
