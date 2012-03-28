var util = require('util');
var credentials = require('./credentials.js');
var Sequelize = require("sequelize");
var moment = require('moment');
var mysql = require('mysql');

/**
   * @type {Object}
   * Map all attributes of the registry
   * (Instance method useful to every sequelize Table)
   * @this {SequelizeRegistry}
   * @return {Object} All attributes in a Object.
   */
var map_attributes = function() {
  var obj = new Object(),
  ctx = this;
  ctx.attributes.forEach(
  function(attr) {
  obj[attr] = ctx[attr];
  }
  );
  return obj;
};


var Model = function() {
  console.log("Host: " + credentials.host + ". User: " + credentials.user + ". Database: " + credentials.database);

  var client = mysql.createClient({
  host: credentials.host,
  user: credentials.user,
  password: credentials.password,
  port: 3306,
  debug: false
  });

  client.query('USE '+credentials.database);
  
  /*this.dbFindUser = function(id, next) {
  entities.person.find(id).success(function(thisPerson) {
    if (thisPerson) {
    next(null, thisPerson);
    }
    else {
    next(null, null);
    }
  }).failure(function(err) {
    next (err, null);
  });
  }*/

  this.dbFindUserById = function(id, next) {
  util.puts('finding: ' + id);
  var sql = "SELECT P.id \
    , P.firstname \
    , P.lastname \
    , P.email \
    , P.createdAt \
    , P.updatedAt \
    , P.provider \
    , P.identifier \
    , P.username \
    FROM tt_persons P \
    WHERE P.id = ? \
    LIMIT 1";
  client.query(
    sql
    , [id]
    , function (err, results, fields) {
    if (err) {
      //throw err;
      util.puts(err);
      return next(err, null);
    }
    //console.log(results);
    util.puts(results);
    return next(null, results[0]);
    })
  }

  this.findUserByProviderUsername = function(provider, username, next) {
  var sql = "SELECT P.firstname \
    , P.lastname \
    , P.email \
    , P.id \
    , P.createdAt \
    , P.updatedAt \
    , P.provider \
    , P.identifier \
    , P.username \
    FROM tt_persons P  \
    WHERE P.provider = ? \
    AND P.username= ?";
  client.query(
    sql
    , [provider, username]
    , function (err, results, fields) {
    if (err) {
      throw err;
    }
    return next(results);
    })
  }

  sequelize = new Sequelize(credentials.database, credentials.user, credentials.password, {
  host: credentials.host,
  port: 3306
  })

  this.Person = sequelize.define('tt_person', {
  firstname: Sequelize.STRING,
  lastname: Sequelize.STRING,
  email: Sequelize.STRING,
  provider: Sequelize.STRING,
  identifier: Sequelize.STRING,
  username: Sequelize.STRING
  });

  this.Entry = sequelize.define('tt_entries', {
  person_id: Sequelize.INTEGER,
  verb: Sequelize.STRING,
  quantifier: Sequelize.STRING,
  adjective: Sequelize.STRING,
  noun: Sequelize.STRING,
  latitude: Sequelize.FLOAT,
  longitude: Sequelize.FLOAT,
  public: Sequelize.BOOLEAN,
  comment: Sequelize.TEXT
  }
  , {instanceMethods: {mapAttributes: map_attributes}})

  this.Person.hasMany(this.Entry)
  this.Entry.belongsTo(this.Person)

  var entities = {};
  entities.person = this.Person;
  entities.entry = this.Entry;

  

  this.findOrCreateUserByProviderUsername = function(provider, twitterMetadata, next) {
  identifier = twitterMetadata.id;
  var sql = "SELECT P.id \
    , P.firstname \
    , P.lastname \
    , P.email \
    , P.createdAt \
    , P.updatedAt \
    , P.provider \
    , P.identifier \
    , P.username \
    FROM tt_persons P  \
    WHERE P.provider = ? \
    AND P.identifier = ? \
    LIMIT 1";
  client.query(
    sql
    , [provider, identifier]
    , function (err, results, fields) {
    if (err) {
      //throw err;
      console.log('findOrCreateUserByProviderUsername: error in initial fetch');
      
      next(err, null);
    }
    
    if (results.length > 0) {
      // found a user, return
      //console.log(results);
      if (provider == 'twitter') {
      console.log('findOrCreateUserByProviderUsername: inferring twitter username');
      }else
      {
      results.username = results.username;
      }
      console.log('findOrCreateUserByProviderUsername: user found');
      return next(null, results[0]);
    }
    else {
      insertSql = "INSERT INTO tt_persons \
      (firstname \
      , lastname \
      , email \
      , createdAt \
      , updatedAt \
      , provider \
      , identifier \
      , username) \
      VALUES ( \
      ?, ?, ?, NOW(), NOW(), 'twitter', ?, ?);";
      client.query(
      insertSql
      , [
        twitterMetadata.firstname
      , twitterMetadata.lastname
      , twitterMetadata.email
      , 'twitter'
      , twitterMetadata.identifier
      , twitterMetadata.username
      ],
      function(err, results, fields) {
        if (err) {
        //throw err;
        console.log('findOrCreateUserByProviderUsername: error in new user insert');
        next(err, null);
        }
        
        console.log('findOrCreateUserByProviderUsername: found inserted');
        return next(null, results[0]);
      }
      )
    }        
    })
  }

  this.dbFindOrCreateUser = function(provider, twitterMetadata, next) {
  entities.person.find({where: {provider: provider, identifier: twitterMetadata.id}}).success(function(thisPerson) {
    var user = {};
    if (thisPerson) {
    next(null, thisPerson);
    }
    else {
    var newPerson = entities.person.build({
      provider: provider
      , identifier: twitterMetadata.id
      , username: twitterMetadata.screen_name
    });
    newPerson.save().on('success', function(thisNewPerson) {
      next(null, thisNewPerson);
    }).on('failure', function(err) {
      util.puts(err);
      next(err, null);
    })
    }
  }).error(function(err) {
    util.puts(err);
    next(err, null);
  })
  }

  this.dbSelectEntries = function(userId, thisDate, next) {
  entities.person.find(parseInt(userId)).success(function(thisPerson) {
    if (thisDate == 'START') {
    whereClause = ['person_id=?', thisPerson.id, thisDate, '9999-01-01']
    }
    else {
    whereClause = ['person_id=? AND createdAt >= ? AND createdAt < ? + INTERVAL 1 DAY', thisPerson.id, thisDate, thisDate]
    }
    entities.entry.all({
    where: whereClause,
    limit: 1000
    }
    ).success(function(theseEntries) {
    util.puts('found');
    next(theseEntries);
    })
     .error(function(error, next) {
    util.puts('error: ' + error);
    next();
    })
  });
  }

  this.dbGetNumberOfEntries = function(userId, next) {
  entities.person.find(parseInt(userId)).success(function(thisPerson) {
    whereClause = ['person_id=?', thisPerson.id];
    entities.entry.count({
    where: whereClause
    }
    ).success(function(entriesCount) {
    util.puts('found');
    next(entriesCount);
    })
     .error(function(error, next) {
    util.puts('error: ' + error);
    next();
    })
  });
  }

  this.dbSelectEntriesPage = function(userId, page, pageLength, next) {
  entities.person.find(parseInt(userId)).success(function(thisPerson) {
    whereClause = ['person_id=?', thisPerson.id];
    entities.entry.all({
    where: whereClause
    , offset: pageLength*(parseInt(page)-1)
    , limit: pageLength
    , order: 'createdAt DESC'
    }
    ).success(function(theseEntries) {
    if (theseEntries) {
      for (var i = 0; i < theseEntries.length; i++) {
      theseEntries[i].createdAt = moment(new Date(theseEntries[i].createdAt)).format('hh:mm A. MM/DD/YYYY');
      theseEntries[i].updatedAt = moment(new Date(theseEntries[i].updatedAt)).format('MM/DD/YYYY hh:mm a');
      }
      next(theseEntries);
    }
    else {
     theseEntries = [];
     next(theseEntries);
    }
    })
     .error(function(error, next) {
    util.puts('error: ' + error);
    next();
    })
  });
  }

  this.dbSearchEntries = function(userId, verb, quantifier, adjective, noun, comment, page, pageLength, getCount, next) {
  console.log('limit ' + parseInt(pageLength*(parseInt(page)-1)) + ', ' + parseInt(pageLength));
  
  var totalCount = 0;
  if (getCount) {
    var countSql = "SELECT COUNT(*) as totalRecords \
      FROM tt_entries E \
      INNER JOIN tt_persons P on E.person_id = P.id \
      WHERE P.id = ? \
      AND verb LIKE ?  \
      AND quantifier LIKE ?  \
      AND adjective LIKE ?  \
      AND noun LIKE ?  \
      AND comment LIKE ?";
    client.query(
      countSql
      , [userId
    , verb
    , quantifier
    , adjective
    , noun
    , comment
    ]
    , function(err, results, fields) {
      if (err) {
        console.log('dbSearchEntries: error counting records');
        next(err, null);
      }
      if (results.length > 0) {
        totalCount = results[0].totalRecords;
      }
    })
  }
  
  var sql = "SELECT E.verb \
        , E.quantifier \
        , E.adjective \
        , E.noun \
        , E.latitude \
        , E.longitude \
        , E.public \
        , E.comment \
        , E.id as entry_id \
        , E.createdAt \
        , E.updatedAt \
        FROM tt_entries E \
        INNER JOIN tt_persons P on E.person_id = P.id \
        WHERE P.id = ? \
        AND verb LIKE ?  \
        AND quantifier LIKE ?  \
        AND adjective LIKE ?  \
        AND noun LIKE ?  \
        AND comment LIKE ? \
        ORDER BY createdAt DESC \
        LIMIT ?,? ";
  client.query(
    sql
    , [userId
    , verb
    , quantifier
    , adjective
    , noun
    , comment
    , parseInt(pageLength*(parseInt(page)-1))
    , parseInt(pageLength)
    ]
    , function(err, results, fields) {
      if (err) {
        //throw err;
        console.log('dbSearchEntries: error in entries select: ' + err);
        next(err, null);
      }
      
      for (var i = 0; i < results.length; i++) {
        if (results[i].public == 1) {
          results[i].isPublic = true;
        } 
        else {
          results[i].isNotPublic = true;
        }
        if (results[i].latitude && results[i].longitude) {
          results[i].hasLocation = true;  
        }
        else {
          results[i].hasNoLocation = true;
        }
      }
      
      ;
      return next(null, results, totalCount);
      
      }
    )
  };
  
  /*this.dbSearchEntries = function(userId, verb, quantifier, adjective, noun, comment, page, pageLength, next) {
  util.puts('pageLength: ' + pageLength);
  entities.person.find(parseInt(userId)).success(function(thisPerson) {
    whereClause = ['person_id=? AND verb LIKE ? AND quantifier LIKE ? AND adjective LIKE ? AND noun LIKE ? AND comment LIKE ?'
    , thisPerson.id
    , verb
    , quantifier
    , adjective
    , noun
    , comment];
    entities.entry.all({
    where: whereClause
    , offset: pageLength*(parseInt(page)-1)
    , limit: pageLength
    , order: 'createdAt DESC'
    }).success(function(theseEntries) {
    if (theseEntries) {
      for (var i = 0; i < theseEntries.length; i++) {
      theseEntries[i].createdAt = moment(new Date(theseEntries[i].createdAt)).format('hh:mm A. MM/DD/YYYY');
      theseEntries[i].updatedAt = moment(new Date(theseEntries[i].updatedAt)).format('MM/DD/YYYY hh:mm a');
      }
      next(theseEntries);
    }
    else {
      theseEntries = [];
      next(theseEntries);
    }
    })
    .error(function(error, next) {
    util.puts('error: ' + error);
    next();
    })
  });
  }*/
}
module.exports = Model;