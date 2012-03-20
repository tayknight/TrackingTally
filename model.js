var util = require('util');
var credentials = require('./credentials.js');
var Sequelize = require("sequelize");
var moment = require('moment')

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
    sequelize = new Sequelize(credentials.database, credentials.user, credentials.password, {
        host: credentials.host,
        port: 3306
    })

    this.Person = sequelize.define('tt_person', {
        firstname: Sequelize.STRING,
        lastname: Sequelize.STRING,
        email: Sequelize.STRING,
        provider: Sequelize.STRING,
        identifier: Sequelize.STRING
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
    
    this.dbSelectOrCreatePerson = function(provider, identifier, next) {
        entities.person.find({where: {provider: provider, identifier: identifier}}).success(function(thisPerson) {
            console.log(thisPerson);
            next();
        }).error(function(err) {
            util.puts(err);
            next();
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
                for (var i = 0; i < theseEntries.length; i++) {
                    theseEntries[i].createdAt = moment(new Date(theseEntries[i].createdAt)).format('MMM DD, YYYY hh:mm a');
                    theseEntries[i].updatedAt = moment(new Date(theseEntries[i].updatedAt)).format('MMM DD, YYYY hh:mm a');
                }
                util.puts('found');            
                next(theseEntries);
                })
             .error(function(error, next) {
                util.puts('error: ' + error);
                next();
                })
        });
    }
}
module.exports = Model;