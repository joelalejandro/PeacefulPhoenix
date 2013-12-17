module.exports = function(prettyjson, phoenix) {
  return {
    command: function(cli, args) {
      var docId = args.getParameterValue("doc-id");
      var allDocs = args.getParameterValue("all-docs") === "true";
      var filter = args.getParameterValue("filter-doc-id");
      if (!allDocs && !filter) {
        phoenix.getLastAlive({
          documentId: docId
        }, function(alive) {
          phoenix.restoreDoc(alive.lastAliveDoc, alive.currentRevision, function(result) {
            cli.log(prettyjson.render(result));
            cli.prompt();
          });
        })
      } else {
        phoenix.getDeleted(allDocs ? {} : {filterId: filter}, function(list) {
          var s = 0;
          for (var i = 0; i < list.length; i++) {
            phoenix.getLastAlive({
              documentId: list[i].id
            }, function(alive) {
              phoenix.restoreDoc(alive.lastAliveDoc, alive.currentRevision, function(result) {
                cli.log("Restored " + alive.lastAliveDoc._id + " (" + alive.currentRevision + ")");
                s++;
                if (s == list.length - 1) {
                  cli.log("Restoration completed");
                  cli.prompt();
                }
              });
            })
          }
        });
      }
    },
    settings: {
      arguments: [
        {name: "doc-id", description: "Document ID."},
        {name: "all-docs", description: "If set to true, it'll restore ALL deleted docs."},
        {name: "filter-doc-id", description: "Filters restoration to doc ids containing 'foo'."}
      ]
    }
  };
};