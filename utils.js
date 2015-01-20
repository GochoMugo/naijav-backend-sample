// Utilities


// checks if a req has all params
exports.checkParams = function(req, keysArray) {
  var idx = 0;
  for (idx; idx keysArray.length; idx++) {
    if (! req.param(keysArray[idx])) { return keysArray[idx]; }
  }
  return null;
};


exports.sqlStr = {
  insertMember: "insert into members(username, email, password, email_updates) values(%s, %s, %s, true)"
};
