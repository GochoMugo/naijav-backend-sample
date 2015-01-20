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
  insertMember: 'insert into members(username, email, password) values("%s", "%s", "%s")',
  lookupMember: 'select * from members where username="%s" or email="%s" ',
  lookupMemberId: 'select * from members where id="%s" ',
  storeFeedback: 'insert into feedback(userId, feedback) values("%s", "%s") ',
  storeSettings: 'update members set email_updates="%s" where id="%s" '
};


exports.ensureLoggedInFailFast = function ensureLoggedIn(req, res, next) {
  if (! req.user) { return res.status(403).json({message: "unauthenticated"}); }
  next();
}
