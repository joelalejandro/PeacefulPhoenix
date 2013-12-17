module.exports = function(prettyjson, phoenix, fs, xlse, flat) {
  return {
    command: function(cli, args) {
      cli.log(cli.repeat("-", 80));
      cli.log("Fetching deleted documents in database...");
      if (filterId = args.getParameterValue("with-id")) {
        cli.log(cli.text_color("Notice:", "yellow") + " filtering with ID '" + filterId + "'.");
      };
      var lastRev = args.getParameterValue("last-rev") || "deleted";

      if (lastRev == "deleted") {
        phoenix.getDeleted({ 
          filterId: filterId, 
          withAllRevisions: args.getParameterValue("with-all-revisions") === "true"
        }, function(data) {
          if (output = args.getParameterValue("output-file")) {
            var outputFormat = args.getParameterValue("output-format") || "txt";
            switch (outputFormat) {
              case "txt":
                cli.log("Outputting as Text");
                var alives = [];
                var s = 0;
                for (var i = 0; i < data.deletedDocuments.length; i++) {
                  phoenix.getLastAlive({
                    documentId: data.deletedDocuments[i].id
                  }, function(alive) {
                    if (alive.error) {
                      cli.log("Unable to fetch " + alive.docId);
                      s++;
                      return;
                    }

                    cli.log("Fetched " + alive.lastAliveDoc._id);
                    alives.push(alive);
                    s++;
                    if (s == data.deletedDocuments.length - 1) {
                      var hash = flat(alives[0].lastAliveDoc);
                      var cols = [];
                      var rows = [];
                      for (k in hash) { cols.push({ caption: k , type: "string" }); }
                      for (var r = 0; r < alives.length; r++) {
                        rows.push(flat(alives[r].lastAliveDoc));
                      } 
                      var stream = fs.createWriteStream(output);
                      stream.write(cols.map(function(c) { return c.caption; }).join("\t") + "\r\n");
                      stream.write(rows.map(function(r) { 
                        var x = [];
                        for (k in r) {
                          x.push(r[k]);
                        }; 
                        return x.join("\t"); 
                      }).join("\r\n"));
                      stream.end();
                      cli.log("OK!");
                      cli.prompt();
                    }
                  });
                }
                break;
              case "xls":
                cli.log("Outputting as Excel");
                var alives = [];
                var s = 0;
                for (var i = 0; i < data.deletedDocuments.length; i++) {
                  phoenix.getLastAlive({
                    documentId: data.deletedDocuments[i].id
                  }, function(alive) {
                    cli.log("Fetched " + alive.lastAliveDoc._id);
                    alives.push(alive);
                    s++;
                    if (s == data.deletedDocuments.length - 1) {
                      var hash = flat(alives[0].lastAliveDoc);
                      var cols = [];
                      var rows = [];
                      for (k in hash) { cols.push({ caption: k , type: "string" }); }
                      for (var r = 0; r < alives.length; r++) {
                        rows.push(flat(alives[r].lastAliveDoc));
                      } 
                      var xlsBinary = xlse.execute({
                        cols: cols,
                        rows: rows
                      });
                      fs.createWriteStream(output).end(xlsBinary);
                      cli.log("OK!");
                      cli.prompt();
                    }
                  });
                }
                break;
            };
          } else {
            cli.log(prettyjson.render(data));
            cli.prompt();
          }
        });
      } else if (lastRev == "alive") {
        throw new Error("last-rev=alive still not implemented");
      }
    },
    help: function(cli) {
      
    },
    settings: {
      arguments: [
        {name: "output-file", description: "Sends document list to a file."},
        {name: "output-format", descirption: "Specifies file format (txt or xls)."},
        {name: "with-id", description: "Filters documents that contain a matching ID."},
        {name: "with-all-revisions", description: "If true, adds the revision history for the document."},
        {name: "last-rev", description: "Determines which is the last rev to show (options: deleted, alive; default = deleted)."}
      ]
    }
  }
};