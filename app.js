
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
  
var connect = require('connect')

var db = new model();

var defaultEntriesPageLength = 10;

var app = module.exports = express.createServer();

everyauth.twitter
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

everyauth.everymodule.findUserById( function(userId, callback) {
    console.log('in findUserById for user: ' + userId);
    db.dbFindUserById(userId, callback);
});    

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
    console.log(req.user);
    res.redirect('/' + req.user.username);
})

app.get('/:username', ensureAuthenticated, function(req,res) {
    res.render('user', {user: req.user});
});

app.get('/settings/account', ensureAuthenticated, function(req, res){
  res.render('account', { user: req.user });
});

app.get('/users/login', function(req, res){
  res.render('login', { user: req.user });
});

app.get('/:user/entries/find/', ensureAuthenticated, function(req,res) {
    var user = req.query['user'];
    var u = req.user.id;
    var p = req.query['page'] || 1;
    var count = req.query['count'] || defaultEntriesPageLength;    
    var verb = req.query['verb'] || '%';
    var quantifier = req.query['quantifier'] || '%';
    var adjective = req.query['adjective'] || '%';
    var noun = req.query['noun'] || '%';
    var comment = req.query['comment'] || '%';
    
    db.dbSearchEntries(req.user.id, verb, quantifier, adjective, noun, comment, p, count, function(theseEntries) {
            res.render('entries', {layout: false
                  , entriesCount: 1
                  , entries: theseEntries
                  , requested: p
                  , defaultEntriesPageLength: count
                  , requestedDisplay: null
                  , todayDisplay: null
                  })
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

everyauth.helpExpress(app);

var port = process.env.PORT || 1581;
app.listen(port);
console.log("Express server listening on port %d in %s mode", port, app.settings.env);

function ensureAuthenticated (req, res, next) {
  if (!req.loggedIn) { /* `req.loggedIn` is a boolean that comes with `everyauth` */
    return res.redirect('/users/login');
  }
  next(); // Otherwise, pass control to your route handler
};