var nano       = require("nano")(process.argv[2] + "/" + process.argv[3])
  , fs         = require("fs")
  , xlse       = require("excel-export")
  , flat       = require("flat").flatten
  , timed      = require("timed")
  , prettyjson = require("prettyjson")
  , cli        = require("plank")({
                   name: "Peaceful Phoenix",
                   header: function(cli) {
                     cli.log(cli.colors.red);
                     cli.log(".:· Peaceful Phoenix ·:.");
                     cli.log(cli.colors.reset);
                     cli.log("Connected to " + cli.text_color(nano.config.db, "yellow"));
                   },
                   autoPrompt: false
                 });

var phoenix    = require("./lib/phoenix.js")(nano, timed);

cli.version    = { number: "0.0.1", dateReleased: "2013-12-16" };
cli.debug      = false;

cli.setCommands({
  "version":              require("./lib/commands/version.js"),
  "fetch-last-alive":     require("./lib/commands/fetch-last-alive.js")
                          (prettyjson, phoenix),
  "restore-last-alive":   require("./lib/commands/restore-last-alive.js")
                          (prettyjson, phoenix),
  "list-deleted":         require("./lib/commands/list-deleted.js")
                          (prettyjson, phoenix, fs, xlse, flat)
});

cli.run();
