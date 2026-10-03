// Central error handler: internal details client ko leak nahi hote
module.exports = (err, req, res, next) => {
  console.error(err && err.stack ? err.stack : err);

  // body-parser errors (invalid JSON / payload too large) me err.status 4xx hota hai
  const status = err.status || err.statusCode || 500;
  const error = err.expose || status < 500 ? err.message : 'Internal server error';

  res.status(status).json({ ok: false, error });
};
