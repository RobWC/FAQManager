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
  "css/main.css",
  "css/smoothness/jquery-ui-1.8.9.custom.css"
]);

couchapp_load([
  "/_utils/script/sha1.js",
  "/_utils/script/json2.js",
  "/_utils/script/jquery.js",
  "/_utils/script/jquery.couch.js",
  "js/jquery-ui-1.8.9.custom.min.js",
  "vendor/couchapp/jquery.couch.app.js",
  "vendor/couchapp/jquery.couch.app.util.js",
  "vendor/couchapp/jquery.evently.js"
]);
