'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const routes = require('./routes');
const auth = require('./auth');

const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

fccTesting(app); //For FCC testing purposes
app.set('view engine', 'pug');
app.set('views', './views/pug');
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(passport.initialize());
app.use(passport.session());

myDB(async (client) => {
  try {
    const myDataBase = await client.db('advanced-node').collection('users');
    auth(app, myDataBase);
    routes(app, myDataBase);

    let currentUsers = 0;

    io.on('connection', (socket) => {
      ++currentUsers;
      io.emit('user count', currentUsers);
      console.log('A user has connected');
    });
  } catch (error) {
    app.route('/').get((req, res) => {
      res.render('index', { title: 'Error', message: error.message });
    });
  }
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
