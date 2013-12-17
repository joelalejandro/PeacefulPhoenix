module.exports = function(nano, timed) {
  var restoreDoc = function(doc, newRevisionId, callback) {
    timed.reset();
    doc._rev = newRevisionId;
    nano.insert(doc, doc._id, function(err, body) {
      if (err) {
        console.log(JSON.stringify(err));
        throw new Error("Unable to recover document");
      }
     
      var result = {status: "Document restored"};
      result.elapsed = timed.rounded();
      callback(result);
    });
  };

  var getRevisionHistory = function(options, callback) {
    timed.reset();
    nano.get(options.documentId, { revs: true, open_revs: "all" }, function(err, body) {
      var result = {};
      result.status = "OK";
      var history = body[0].ok;

      if (!history._deleted)
        throw new Error("Document must be deleted in order to fetch revision history");

      result.revisions = [];
      for (var z = 0; z < history._revisions.ids.length; z++) {
        var _r = history._revisions.ids[z];
        var idx = history._revisions.ids.length;
        result.revisions.push((idx - z) + "-" + _r);
      }

      result.elapsed = timed.rounded();
      callback(result);
    });
  };

  var getLastAlive = function(options, callback) {
    timed.reset();
    var result = {};

    if (!options.documentId) {
      getDeleted({}, function(list) {
        var alives = [];
        var s = 0;
        for (var i = 0; i < list.length; i++) {
          phoenix.getLastAlive({
            documentId: list[i].id
          }, function(alive) {
            alives.push(alive);
            s++;
            if (s == list.length - 1) {
              result.aliveDocs = alives;
              result.elapsed = timed.rounded();
              callback(result);
            }
          });
        }
      });
    } else {
      getRevisionHistory({ documentId: options.documentId }, function(revisionsList) {
        result.currentRevision = revisionsList.revisions[0];
        result.lastAliveRevision = options.startRevId || revisionsList.revisions[1];
        
        if (options.startRevId)
          result.lastAliveRevisionForced = true;

        nano.get(options.documentId, { rev: result.lastAliveRevision }, function(err, body) {
          if (err) {
             result.docId = options.documentId;
             result.error = "Unable to recover revision " + result.lastAliveRevision + ". "
                + "Use <list-deleted with-id=" + options.documentId + " with-all-revisions=true> to list "
                + "the entire revision history and then retry with "
                + "<fetch-last-alive doc-id=" + options.documentId + " start-rev-id=REVISION>."; 
          } else {
            result.lastAliveDoc = body;
          }
          result.elapsed = timed.rounded();
          callback(result);
        });
      });    
    }
  }
    
  var getDeleted = function(options, callback) {
    timed.reset();
    nano.changes(function(err, body) {
      var result = {};
      result.status = "OK";
      result.deletedDocuments = [];
      result.count = 0;

      for (var x = 0, y = body.results.length; x < y; x++) {
        var change = body.results[x];
        var condition = change.deleted;
        if (options.filterId) {
          condition = condition && change.id.indexOf(options.filterId) > -1;
        }
        if (condition) {
          result.deletedDocuments.push({id: change.id, rev: change.changes[change.changes.length - 1].rev});
          result.count++;
        }
      }

      result.elapsed = timed.since();

      if (options.withAllRevisions) {
        getRevisionHistory({ documentId: options.filterId }, function(revisions) {
          result.revisionsResult = revisions;
          callback(result);
        });
      } else {
        callback(result);
      }
    })
  }
  
  return {
    getDeleted: getDeleted,
    getRevisionHistory: getRevisionHistory,
    getLastAlive: getLastAlive,
    restoreDoc: restoreDoc
  };
}