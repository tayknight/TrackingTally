
/**
 * Module dependencies.
 */

//var credentials = require('./credentials.js');

var util = require('util')
  , express = require('express')
  , routes = require('./routes')
  , passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy
  , model = require('./model.js')
  , moment = require('moment')

var users = [
    { id: 1, username: 'bob', password: 'bob', email: 'bob@example.com' }
  , { id: 2, username: 'joe', password: 'birthday', email: 'joe@example.com' }
];

var db = new model();

var defaultEntriesPageLength = 10;

function findById(id, fn) {
  var idx = id - 1;
  if (users[idx]) {
    fn(null, users[idx]);
  } else {
    fn(new Error('User ' + id + ' does not exist'));
  }
}

function findByUsername(username, fn) {
  for (var i = 0, len = users.length; i < len; i++) {
    var user = users[i];
    if (user.username === username) {
      return fn(null, user);
    }
  }
  return fn(null, null);
}


// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});


// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // Find the user by username.  If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure.  Otherwise, return the authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (user.password != password) { return done(null, false); }
        return done(null, user);
      })
    });
  }
));

var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  //app.set('view options', { layout: false });
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({secret: "FtHCfm1r4f"}));
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

//app.get('/', routes.index);
app.get('/', ensureAuthenticated, function(req, res) {
    res.render('index', {user: req.user});
})

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

// POST /login
//   Use passport.authenticate() as route middleware to authenticate the
//   request.  If authentication fails, the user will be redirected back to the
//   login page.  Otherwise, the primary route function function will be called,
//   which, in this example, will redirect the user to the home page.
app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

/*app.get( '/entries/user/:id', function( req, res ) {
    var today = new Date();
    u = req.params.id;
    d = req.params.date;
    dummyDate = 'START';
    db.dbSelectEntries(u, dummyDate, function(theseEntries) {
        res.render('entries', {layout: false, entries: theseEntries, requested: 'All', today: today});
    });    
});*/



app.get('/entries/user/:id/page/:page', function(req,res) {
    var today = new Date();
    u = req.params.id;
    p = req.params.page;
    util.puts('user: ' + u + '. page: ' + p);
    
    // get the user's number of entries
    db.dbGetNumberOfEntries(u, function(entriesCount) {
        if (entriesCount > 0) {
          db.dbSelectEntriesPage(u, p, defaultEntriesPageLength, function(theseEntries) {
              res.render('entries', {layout: false
                  , entriesCount: entriesCount
                  , entries: theseEntries
                  , requested: p
                  , defaultEntriesPageLength: defaultEntriesPageLength
                  , today: today
                  , requestedDisplay: null
                  , todayDisplay: null
                  })
          })
        } else {
          res.render('entries', {layout:false
              , entriesCount: 0
              , entries: null
              , requested: p
              , defaultEntriesPageLength: defaultEntriesPageLength
              , today: today
              , requestedDisplay: null
              , todayDisplay: null
            })
        } 
    })
});

app.get( '/entries/user/:id/:date', function( req, res ) {
    var today = new Date();
    u = req.params.id;
    d = req.params.date;
    var thisDate = new Date(req.params.date);
    util.puts(thisDate);
    dateFormat = 'MMM DD, YYYY';
    db.dbSelectEntries(u, thisDate, function(theseEntries) {
        res.render('entries', {layout: false
            , entries: theseEntries
            , requested: thisDate
            , today: today
            , requestedDisplay: moment(new Date(thisDate)).format(dateFormat)
            , todayDisplay: moment(new Date(today)).format(dateFormat)
            });
    });    
});
 
// and for post data...
app.post('/update', ensureAuthenticated, function( req, res ) {
    console.log(req.user.id);
    if (req.body.verb) {
        var query = db.Person.find(parseInt(req.user.id));
        query.on('success', function(result) {
            var entry = db.Entry.build({
                person_id: req.user.id
                , verb: req.body.verb
                , quantifier: req.body.quantifier
                , adjective: req.body.adjective
                , noun: req.body.noun
                , comment: req.body.comment
                , latitude: req.body.latitude
                , longitude: req.body.longitude
            });
            entry.save().on('success', function() {
                util.puts('successfully saved');
                res.json({status:'success'}
                ).on('failure', function(error) {
                    util.puts('failure: ' + error);
                    res.send(error, 500);
                });
            })
        });
    }
});

var port = process.env.PORT || 1581;
app.listen(port);
console.log("Express server listening on port %d in %s mode", port, app.settings.env);


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/login')
}