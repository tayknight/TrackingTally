
/**
 * Module dependencies.
 */

//var credentials = require('./credentials.js');

var util = require('util')
  , fs = require('fs')
  , express = require('express')
  , routes = require('./routes')
  , model = require('./model.js')
  , moment = require('moment')
  //, everyauth = require('everyauth')
  , credentials = require('./credentials.js')
  , passport = require('passport')
  , TwitterStrategy = require('passport-twitter').Strategy
  , cons = require('consolidate')

var connect = require('connect')

var db = new model();

var defaultEntriesPageLength = 10;

var app = module.exports = express.createServer();

app.sharedPartials = [];
app.sharedHoganPartials = [];

passport.use(new TwitterStrategy({
  consumerKey: credentials.TWITTER_CONSUMER_KEY,
  consumerSecret: credentials.TWITTER_CONSUMER_SECRET,
  callbackURL: "http://local.host:1581/auth/twitter/callback"
  },
  function(token, tokenSecret, profile, done) {
  var provider = 'twitter';
  db.findOrCreateUserByProviderUsername(provider, profile, function(err, user) {
    if (err) {
      return done(err);
    }
    done(null, user);
    })
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
  done(null, obj);
});

/*everyauth.twitter
  .consumerKey('cVdVyEXIjetxWqTjcVcdWg')
  .consumerSecret('169LM6w2KHyU1PLlLHVSj2Bhdb2BnMiEEoy7a4hv9M8')
  .findOrCreateUser(function(session, accessToken, accessTokenSecret, twitterUserMetadata) {
    var provider = 'twitter';
    var promise = this.Promise();
    db.findOrCreateUserByProviderUsername(provider, twitterUserMetadata, function(err, user) {
      if (err) return promise.fulfill([err]);
      console.log('about to fulfill user promise');
      promise.fulfill(user);
    })
    return promise;
  })
  .redirectPath('/');
*/
// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(express.session({secret: "FtHCfm1r4f"}));
  app.use(express.methodOverride());
  app.use(require('stylus').middleware({ src: __dirname + '/public' }));
  app.use(express.static(__dirname + '/public'));
  // Initialize Passport!  Also use passport.session() middleware, to support
  // persistent login sessions (recommended).
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(app.router)
});

var routes = {};
routes.hoganCompiler = require('./app/hoganCompiler');

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});


/*everyauth.everymodule.findUserById( function(userId, callback) {
  console.log('in findUserById for user: ' + userId);
  db.dbFindUserById(userId, callback);
});  */

// Routes

app.get('/templates.json', function(req,res) {
  res.json(app.sharedPartials);
});

app.get('/hogan_templates.json', function(req,res) {
  res.json(app.sharedHoganPartials);
});

// Redirect the user to Twitter for authentication.  When complete, Twitter
// will redirect the user back to the application at
// /auth/twitter/callback
app.get('/auth/twitter', passport.authenticate('twitter'));

// Twitter will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/twitter/callback',
  passport.authenticate('twitter', { successRedirect: '/',
                   failureRedirect: '/users/login' }));

app.get('/', ensureAuthenticated, function(req, res) {
  //res.render('user', {user: req.user});
  res.redirect('/' + req.user['username']);
})

// Hogan precompile
app.get('/templates.js', routes.hoganCompiler.getAll);

app.get('/:username', ensureAuthenticated, function(req,res) {
  res.render('user', {user: req.user});
});

app.get('/settings/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/users/login', function(req, res){
  res.render('login', { user: req.user });
});

//app.get('/:user/entries/find/', ensureAuthenticated, function(req,res) {
app.get('/:user/entries/', ensureAuthenticated, function(req,res) {
  var user = req.query['user'];
  var u = req.user.id;
  var page = req.query['page'] || 1;
  var count = req.query['count'] || defaultEntriesPageLength;
  var verb = req.query['verb'] || '%';
  var quantifier = req.query['quantifier'] || '%';
  var adjective = req.query['adjective'] || '%';
  var noun = req.query['noun'] || '%';
  var comment = req.query['comment'] || '%';

  db.dbSearchEntries(req.user.id, verb, quantifier, adjective, noun, comment, page, count, true, function(err, theseEntries, totalCount) {
    if ( req.headers["x-requested-with"] === "XMLHttpRequest" ) {
      res.json({layout: false
        , entriesCount: totalCount
        , entries: theseEntries
        , requested: page
        , defaultEntriesPageLength: count
        , totalPages: Math.ceil(parseInt(totalCount) / parseInt(count))
      });
    } else {
      res.render('user', {user: req.user});
    }
    
      /*res.render('entries', {layout: false
          , entriesCount: 1
          , entries: theseEntries
          , requested: p
          , defaultEntriesPageLength: count
          , requestedDisplay: null
          , todayDisplay: null
          })*/

    })
});

/*app.get('/:user/entries/find/', function(req,res) {
  util.puts('matched: /:user/entries/find');
  var user = req.params.user;
  var u = req.user.id;
  var p = req.params.page || 1;
  var count = req.params.count || defaultEntriesPageLength;
  var verb = req.query.verb || '%';
  var quantifier = req.query.quantifier || '%';
  var adjective = req.query.adjective || '%';
  var noun = req.query.noun || '%';
  var comment = req.query.comment || '%';

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
*/
app.get( '/:user/entries/user/:id/:date', function( req, res ) {
  var today = new Date();
  u = req.user.id;
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

// update templates
app.get('/templates/update', ensureAuthenticated, function(req,res) {
  // only I can refresh
  if (req.user.username == 'tayknight') {
    err = null;
    recompileTemplates(err, function(err, next) {
      if (err) {
        res.json({status: 'error: ' + err});
      }
      else {
        res.json({status: 'success'});
      }
    });
  }
});

var port = process.env.PORT || 1581;
app.listen(port);
console.log("Express server listening on port %d in %s mode", port, app.settings.env);

app.on('listening', function(req, res) {
  recompileTemplates(null, function(err, next) {});
});


// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/users/login')
}

// recompile the templates
function recompileTemplates(err, next) {
  app.sharedPartials = [];
  app.sharedHoganPartials = [];
  
  // compile Hogan templates

  util.puts('recompiling templates');
  fs.readdir("./public/templates", function (err, filenames) {
    var i;

    for (i = 0; i < filenames.length; i++) {
      var functionName = filenames[i].substr(0, filenames[i].lastIndexOf("."))
      , fileContents = fs.readFileSync("./public/templates/" + filenames[i], "utf8");
      util.puts('recompiling template ' + functionName);
      app.sharedPartials.push({
        name: functionName
        , template: fileContents
      });
      app.sharedHoganPartials.push({
        name: functionName
        , template: fileContents.toString()
      });
    }
  });
  next();
}