collections = []

@createTestCollection = (name) ->
  collection = new Mongo.Collection(name)
  collection.allow(Collections.allowAll())
  collections.push collection

  if Meteor.isServer
    Meteor.publish name, -> collection.find()
  else
    Meteor.subscribe name

  collection

if Meteor.isServer
  Meteor.methods
    removeAllCollections: -> _.each collections, (collection) -> collection.remove({})
