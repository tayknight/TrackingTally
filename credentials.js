var credentials = {
  host: process.env['WILLCOUNT_HOST']
  , user: process.env['WILLCOUNT_USER']
  , password: process.env['WILLCOUNT_PASSWORD']
  , database: process.env['WILLCOUNT_DATABASE']
  , TWITTER_CONSUMER_KEY_LOCAL: process.env['TWITTER_CONSUMER_KEY_LOCAL']
  , TWITTER_CONSUMER_SECRET_LOCAL: process.env['TWITTER_CONSUMER_SECRET_LOCAL']
  , TWITTER_CONSUMER_KEY_DEV: process.env['TWITTER_CONSUMER_KEY']
  , TWITTER_CONSUMER_SECRET_DEV: process.env['TWITTER_CONSUMER_SECRET']
  , TWITTER_CONSUMER_KEY_PROD: process.env['TWITTER_CONSUMER_KEY']
  , TWITTER_CONSUMER_SECRET_PROD: process.env['TWITTER_CONSUMER_SECRET']
}
module.exports = credentials;