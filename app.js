'use strict';

const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const request = require('request');
const googleTTS = require('google-tts-api');
const socketio = require('socket.io');

const index = require('./routes/index');

const app = express();
const io = socketio();
app.io = io;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hjs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

io.on('connection', function(socket) {
    console.log('Got connection.');

    socket.on('query', function(q) {
        console.log(q);
        wolframQuery(q, socket);
    });
});

function wolframQuery(query, socket, url) {
    let completed = false;
    const timeout = 4; // How many seconds to wait before sending failure message
    const failedQueryResponse = 'Ignorant human. Next time ask me a question that actually makes sense.';
    const options = {
        url: 'https://api.wolframalpha.com/v1/result?appid=XVVT6H-237WH8JWQY&i=' + encodeURI(query),
        headers: {}
    };

    function callback(error, response, body) {

        // Handle successful response
        if (!error && response.statusCode == 200) {
            completed = true;
            getAudioURL(body).then(function(url) {
                socket.emit('message', {
                    stuff: body,
                    audioURL: url,
                    success: false
                });
                console.log(body);
            });
        }

        // Deal with failure
        setTimeout(function() {
            if (completed == false) {
                getAudioURL(failedQueryResponse).then(function(url) {
                    socket.emit('message', {
                        stuff: failedQueryResponse,
                        audioURL: url,
                        success: false
                    });
                    console.log(`Request failed. Sending: ${failedQueryResponse}`);
                });
            }
        }, timeout * 1000);
    }

    request(options, callback);
}

function getAudioURL(text) {
    return googleTTS(text, 'en', 1) // Speed = 1
        .then(function(url) {
            console.log(url);
            return Promise.resolve(url);
        })
        .catch(function(err) {
            console.error(err.stack);
            return Promise.reject('Could not retrieve audio URL.');
        });
}

module.exports = app;
