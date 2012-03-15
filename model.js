var credentials = require('./credentials.js');
var Sequelize = require("sequelize");

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

this.sequelize = new Sequelize(credentials.database, credentials.user, credentials.password, {
    host: credentials.host,
    port: 3306
})

this.Person = this.sequelize.define('tt_person', {
    firstname: Sequelize.STRING,
    lastname: Sequelize.STRING,
    email: Sequelize.STRING,
});

this.Entry = this.sequelize.define('tt_entries', {
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

module.exports = this;
//module.exports = Person;
//module.exports = Entry;