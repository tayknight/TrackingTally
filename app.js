
/**
 * Module dependencies.
 */

//var credentials = require('./credentials.js');

var util = require('util')
  , express = require('express')
  , routes = require('./routes')  
  , model = require('./model.js')
  , moment = require('moment')
  , everyauth = require('everyauth')
  //, passport = require('passport')
  //, FacebookStrategy = require('passport-facebook').Strategy
  //, GoogleStrategy = require('passport-google').Strategy

//everyauth.debug = true;
  
var connect = require('connect')

everyauth.twitter
    .consumerKey('cVdVyEXIjetxWqTjcVcdWg')
    .consumerSecret('169LM6w2KHyU1PLlLHVSj2Bhdb2BnMiEEoy7a4hv9M8')
    .findOrCreateUser(function(session, accessToken, accessTokenSecret, twitterUserMetadata) {
        var provider = 'twitter';
        var promise = this.Promise();
        
        db.dbFindOrCreateUser(provider, twitterUserMetadata, function(err, user) {
            if (err) return promise.fulfill([err]);
            promise.fulfill(user);
        })
        return promise;
    })
    .redirectPath('/');

/*everyauth.password
    .getLoginPath('/login')
    .postLoginPath('/login')
    .loginView('login')
    .authenticate( function (login, password) {
        //var promise = this.Promise();
        var user = {};
        user.id = 1;
        //promise.fulfill(user);
        //return promise;
        return user;
    })
    .loginSuccessRedirect('/')
    .getRegisterPath('/register')
    .postRegisterPath('/register')
    .registerView('register')
    .validateRegistration(function(newUserAttributes) {
    
    })
    .registerUser(function( newUserAttributes ) {
    
    })
    .registerSuccessRedirect('/')
*/
everyauth.everymodule.findUserById( function(userId, callback) {
    db.dbFindUser(userId, callback);
});    

// everyauth.facebook
    // .appId('380922881926658')
    // .appSecret('3b3303e818306a9656fa2ccea7b7d0f5')
    // .handleAuthCallbackError(function(req,res) {
        // console.log('in handleAuthCallback Error');
    // })
    // .findOrCreateUser( function (session, accessToken, accessTokExtra, fbUserMetadata) {
        // console.log(fbUserMetadata);
        // //Verifies if user in database already
        // try{
            // var id = fbUserMetadata.id;
            // var promise = this.Promise();
            // /*User.findOne({ fbid: id}, function(err, result) {
                // var user;
                // if(!result) {
                    // user = new User();
                    // user.fbid = id;
                    // user.firstName = fbUserMetadata.first_name;
                    // user.lastName = fbUserMetadata.last_name;
                    // user.save();
                // } else 
                    // user = result;
                // }
                // promise.fulfill(user);
            // });*/
            // var user = {};
            // user.id = fbUserMetadata.id;
            // user.firstName = fbUserMetadata.first_name;
            // user.lastName = fbUserMetadata.last_name;
            // promise.fulfill(user);
            // return promise;
        // }
        // catch(err){
        // console.log(err);
        // }
    // })
    // .redirectPath('/')
    // //.entryPath('/auth/facebook')
    // //.callbackPath('/auth/facebook/callback')
    // //.scope('email')
    // //.fields('id,name,email');
  

/*passport.use(new GoogleStrategy({
    returnURL: 'http://localhost:1581/auth/google/return',
    realm: 'http://localhost:1581/'
    },
    function(identifier, profile, done) {
        console.log('got back:');
        console.log(identifier);
        console.log(profile);
        console.log('finding user.');
        user = {id: 2};
        //findOrCreate({ openId: identifier }, function (err, user) {
        return done(null, user);
        //});
    }
));

function findOrCreate(identifier, err, next) {
    console.log('here');
    next(err, identifier);
}
*/  
var db = new model();

var defaultEntriesPageLength = 10;

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
/*passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  //findById(id, function (err, user) {
    done(null, user);
  //});
});
*/

// Use the LocalStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a username and password), and invoke a callback
//   with a user object.  In the real world, this would query a database;
//   however, in this example we are using a baked-in set of users.
/*passport.use(new LocalStrategy(
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
));*/

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
  app.use(express.static(__dirname + '/public'));
  app.use(everyauth.middleware())
  app.use(app.router)
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', ensureAuthenticated, function(req, res) {
    //res.render('user', {user: req.user});
    res.redirect('/user/' + req.user.username);
})

app.get('/user/:username', ensureAuthenticated, function(req,res) {
    res.render('user', {user: req.user});
});

app.get('/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/login', function(req, res){
  res.render('login', { user: req.user });
});

app.get('/search', ensureAuthenticated, function(req,res) {
    console.log(req.query.verb);
    
    var verb = req.query.verb || '%';
    var quantifier = req.query.quantifier || '%';
    var adjective = req.query.adjective || '%';
    var noun = req.query.noun || '%';
    var comment = req.query.comment || '%';
    
    db.dbSearchEntries(req.user.id, verb, quantifier, adjective, noun, comment, 1, 10, function(theseEntries) {
            res.render('entries', {layout: false
                  , entriesCount: 1
                  , entries: theseEntries
                  , requested: p
                  , defaultEntriesPageLength: defaultEntriesPageLength
                  , requestedDisplay: null
                  , todayDisplay: null
                  })
        })
    
    res.redirect('/user/' + req.user.username);
});
/*
// Redirect the user to Google for authentication.  When complete, Google
// will redirect the user back to the application at
// /auth/google/return
app.get('/auth/google', passport.authenticate('google'));

// Google will redirect the user to this URL after authentication.  Finish
// the process by verifying the assertion.  If valid, the user will be
// logged in.  Otherwise, authentication has failed.
app.get('/auth/google/return', 
  passport.authenticate('google', { successRedirect: '/',
                                    successFlash: 'Welcome',
                                    failureRedirect: '/login',
                                    failureFlash: true}));
*/
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

everyauth.helpExpress(app);

var port = process.env.PORT || 1581;
app.listen(port);
console.log("Express server listening on port %d in %s mode", port, app.settings.env);

function ensureAuthenticated (req, res, next) {
  if (!req.loggedIn) { /* `req.loggedIn` is a boolean that comes with `everyauth` */
    return res.redirect('/login');
  }
  next(); // Otherwise, pass control to your route handler
};