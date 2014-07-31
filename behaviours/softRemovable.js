CollectionBehaviours.defineBehaviour('softRemovable', function(getTransform, args){
  var self = this;
  self.before.remove(function (userId, doc) {
    self.update({_id: doc._id}, {$set: {removed: true, removedAt: Date.now()}});
    return false;
  });
  self.before.find(function (userId, selector, options) {
    selector.removed = {$exists: false};
  });
  self.before.findOne(function (userId, selector, options) {
    selector.removed = {$exists: false};
  });
  self.unRemove = function(selector){
    //TODO
    self.update(selector, {$set: {removed: false, unRemovedAt: Date.now()}});
  };
});

CollectionBehaviours.defineBehaviour('softRemovable', function(getTransform, args){
  var self = this, method = "softRemovable_"+this._name;
  // server method to by-pass "can only remove by ID" on the client
  if (Meteor.isServer) {
    var m = {};
    m[method] = function(selector) { 
	    self.unRemove(selector); 
	  }
    Meteor.methods(m);
  }
  self.before.remove(function (userId, doc) {
    self.update({_id: doc._id}, {$set: {removed: true, removedAt: Date.now()}});
    //check if after remove hooks exist
    _.each(self._hookAspects.remove.after, function(after){
      if(after.aspect)
        after.aspect.call(self, userId, doc);
    });
    return false;
  });
  self.before.find(function (userId, selector, options) {
	if(typeof selector.removed === 'undefined')
		selector.removed = {$exists: false};
  });
  self.before.findOne(function (userId, selector, options) {
	if(typeof selector.removed === 'undefined')
		selector.removed = {$exists: false};
  });
  self.unRemove = function(selector){
  	// self.update(selector, {$unset: {removed: true}}) does not work because it will trigger a 
  	// call to findOne method to retrieve the "doc" for other hooks, but it will return null because the document has the removed flag set
  	// solution: call the update with { _id: "<id>", removed: true } (see impl of find and findOne above.)
  	// but: Meteor only permits removes by ID on the client
    // thus, we have to send the request to the server via a RPC when then will do the update with the removed: true flag set
    if (Meteor.isClient) {
	    Meteor.call(method, selector);
  	} else {
      if (_.isString(selector)) selector = { _id: selector }
      selector.removed = true
      self.update(selector, { $unset: { removed: true }, $set: { unRemovedAt: Date.now() } });
	  }
  };
});
