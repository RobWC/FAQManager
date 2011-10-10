function couchapp_load_css(css) {
  for (var i=0; i < css.length; i++) {
    document.write('<link rel="stylesheet" href="'+ css[i]+'"><\/script>')
  };
};

function couchapp_load(scripts) {
  for (var i=0; i < scripts.length; i++) {
    document.write('<script src="'+scripts[i]+'"><\/script>')
  };
};

couchapp_load_css([
  "css/smoothness/jquery-ui-1.8.16.custom.css",
  "css/main.css"
]);

couchapp_load([
  "/_utils/script/sha1.js",
  "/_utils/script/json2.js",
  "js/jquery-1.6.4.min.js",	
  "js/jquery.couch.js", //fixed version
  "js/jquery-ui-1.8.16.custom.min.js",
  //"vendor/couchapp/jquery.couch.app.js",
  //"vendor/couchapp/jquery.couch.app.util.js",
  //"vendor/couchapp/jquery.evently.js"
]);
