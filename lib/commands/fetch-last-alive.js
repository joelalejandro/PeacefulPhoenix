module.exports = function(prettyjson, phoenix, fs) {
  return {
    command: function(cli, args) {
      var doc_id;
      if (!(doc_id = args.getParameterValue("doc-id"))) {
        throw new Error("a document ID must be specified");
      }

      phoenix.getLastAlive({
        documentId: doc_id, 
        startRevId: args.getParameterValue("start-rev-id")
      }, function(result) {
        cli.log(prettyjson.render(result));
        cli.prompt();
      });
    },
    settings: {
      arguments: [
        {name: "doc-id", description: "Document ID"},
        {name: "start-rev-id", description: "Starting Revision ID"}
      ]
    }
  }
}