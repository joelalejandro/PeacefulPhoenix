module.exports = {
  command: function(cli, args){
    var v = "v" + cli.version.number + ", released " + cli.version.dateReleased;
    cli.log(cli.repeat("-", 80));
    cli.log(v);
    cli.log(cli.repeat("-", 80));
    cli.prompt();
  },
  help: function(cli){
    cli.log(cli.tabulation + "Prints the Phoenix's version.");
  },
  settings: {
    usage: "version",
    description: "Prints the Phoenix's version.",
    arguments: []
  }
}