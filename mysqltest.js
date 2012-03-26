var mysql = require('mysql');

var WILLCOUNT_HOST='mysql.willwyatt.com';
var WILLCOUNT_USER='coredbu1';
var WILLCOUNT_PASSWORD='3HR2vWOaRxVIcUj7umjv';
var WILLCOUNT_DATABASE='trackingtally';

var client = mysql.createClient({
  host: WILLCOUNT_HOST,
  user: WILLCOUNT_USER,
  password: WILLCOUNT_PASSWORD,
  port: 3306,
  debug: false
});

client.query('USE '+WILLCOUNT_DATABASE);

client.query(
  'SELECT E.* FROM tt_entries E INNER JOIN tt_persons P ON E.person_id = P.id where P.username = ?'
  , ['betsdesigns']
  , function selectCb(err, results, fields) {
    if (err) {
      throw err;
    }

    console.log(results);
//    console.log(fields);
    //client.end();
  }
);

client.query(
  'SELECT COUNT(*) FROM tt_entries E INNER JOIN tt_persons P ON E.person_id = P.id where P.username = ?'
  , ['tayknight']
  , function selectCb(err, results, fields) {
    if (err) {
      throw err;
    }

    console.log(results);
//    console.log(fields);
    client.end();
  }
);