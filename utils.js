// Utilities


// checks if a req has all params
exports.checkParams = function(req, keysArray) {
  var idx = 0;
  for (idx; idx < keysArray.length; idx++) {
    if (! req.param(keysArray[idx])) { return keysArray[idx]; }
  }
  return null;
};


exports.sqlStr = {
  membersCount: 'select count(*) from members',
  insertMember: 'insert into members(username, email, password, email_updates) values("%s", "%s", "%s", true)',
  lookupMember: 'select * from members where username="%s" or email="%s" '
};


exports.ensureLoggedInFailFast = function ensureLoggedIn(req, res, next) {
  if (! req.user) { return res.status(403).json({message: "unauthenticated"}); }
  next();
}
