require('dotenv').config();

const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express');
const favicon = require('serve-favicon');
const hbs = require('hbs');
const mongoose = require('mongoose');
const logger = require('morgan');
const path = require('path');

// ALWAYS REQUIRE APP IN THE BEGINNING
const app = express();


// REQUIREMENTS FOR SESSION/PASSPORT/COOKIES/BCRYPT
const session = require('express-session');
const bcrypt = require('bcrypt');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const MongoStore = require("connect-mongo")(session);
const User = require('./models/User.model')



const flash = require('connect-flash');
app.use(flash())


/// SET UP stores session in the detabase
app.use(session({
  secret: "passport-lab",
  cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 60 seconds
  store: new MongoStore({
    mongooseConnection: mongoose.connection,
    resave: true,
    saveUninitialized: false,
    ttl: 24 * 60 * 60 // 1 day
  })
}));






passport.serializeUser((user, callback) => {
  callback(null, user._id);
});


passport.deserializeUser((id, callback) => {
  User.findById(id)
    .then(user => {
      callback(null, user);
    })
    .catch(error => {
      callback(error);
    });
});



//// SETTING UP THE LOCAL STRATEGY TO LOG IN
//connected in auth-routes.js by posting strategy

passport.use(
  new LocalStrategy((username, password, callback) => {
    User.findOne({ username })
      .then(user => {
        if (!user) {
          return callback(null, false, { message: 'Incorrect username' });
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return callback(null, false, { message: 'Incorrect password' });
        }
        callback(null, user);
      })
      .catch(error => {
        callback(error);
      });
  })
);



///// Then, we have to initialize passport and passport session, both of them like a middleware:
//basic passport set up

app.use(passport.initialize());
app.use(passport.session());



mongoose
  .connect('mongodb://localhost/auth-with-passport', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })
  .then(x => console.log(`Connected to Mongo! Database name: "${x.connections[0].name}"`))
  .catch(err => console.error('Error connecting to mongo', err));

const app_name = require('./package.json').name;
const debug = require('debug')(`${app_name}:${path.basename(__filename).split('.')[0]}`);


// Middleware Setup
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Express View engine setup

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));

// default value for title local
app.locals.title = 'Express - Generated with IronGenerator';

// Routes middleware goes here
const index = require('./routes/index.routes');
app.use('/', index);
const authRoutes = require('./routes/auth.routes');
app.use('/', authRoutes);



module.exports = app;
