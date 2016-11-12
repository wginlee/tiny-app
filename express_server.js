const express = require("express");
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');


const PORT = process.env.PORT || 3000; // default port 3000

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'fhasdflkaj',
  secret: 'secret'}));

var urlDatabase = {
  "b2xVn2": {
    "shortURL": "b2xVn2",
    "longURL": "http://www.lighthouselabs.ca",
    "user": "someone",
    "date": "some date",
    "visits": 0,
    "uniques": 0
  },
  "9sm5xK": {
    "shortURL": "9sm5xK",
    "longURL": "http://www.google.com",
    "user": "someone",
    "date": "some date",
    "visits": 0,
    "uniques": 0
  }
};
var users = {};

app.get("/", (req, res) => {
  let userID = req.session.user_id;

  if (userID){
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }

});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.end("<html><body>Hello <b>World</b></body></html>\n");
});

//get and render list of urls
app.get("/urls", (req, res) => {
  let userID = req.session.user_id;

  if (!userID){
    res.status(401).end("<html><body><a href=\'/login\'>Y\'all need ta log yoself in</a></body></html>\n");
    return;
  }

  let userKey = searchUserByProperty(users, "id", userID);
  let user = users[userKey]; //user object

  let templateVars = {

    user: user,
    urls: urlDatabase
  };
  res.status(200).render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let userID = req.session.user_id;

  if (!userID){
    res.status(401).end("<html><body><a href=\"/login\">Y\'all need ta log yoself in</a></body></html>\n");
    return;
  }

  let userKey = searchUserByProperty(users, "id", userID);
  let user = users[userKey]; //user object

  let templateVars = {
    user: user,
    urls: urlDatabase
  };

  res.status(200).render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {

  let userID = req.session.user_id;
  let shortURL = req.params.id;

  if (!urlDatabase[shortURL]) {
    res.sendStatus(400);
    return;
  }

  if (!userID){
    res.status(401).end("<html><body><a href=\"/login\">Y\'all need ta log yoself in</a></body></html>\n");
    return;
  }

  if (urlDatabase[shortURL].user !== userID){
    res.sendStatus(403);
    return;
  }

  let userKey = searchUserByProperty(users, "id", userID);
  let user = users[userKey]; //user object


  let templateVars = {
    user: user,
    shortURL: shortURL,
    urls: urlDatabase
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;

  if (!urlDatabase[shortURL]){
    res.sendStatus(404);
    return;
  }

  let longURL = urlDatabase[shortURL].longURL;
  res.redirect(longURL);
});

//create short url
app.post("/urls", (req, res) => {
  console.log(req.body.longURL);  // debug statement to see POST parameters

  let userID = req.session.user_id;
  if (!userID) {
    res.status(403).end();
    return;
  }

  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    shortURL: shortURL,
    longURL: req.body.longURL,
    user: userID,
    date: new Date().toDateString(),
    visits: 0,
    uniques: 0
  };

  res.redirect("/urls");

});

//edit short url
app.post("/urls/:shortURL", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {

  let shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];

  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  let userID = req.session.user_id;
  if (!userID) {
    res.status(200).render("login");
  } else {
    res.redirect("/");
  }
});

app.post("/login", (req, res) => {
  let id = searchUserByProperty(users, "email", req.body.email);

  if (!id){
    res.status(401).send("no account associated with that email");
    return;
  }

  //hashed password in users
  if (!bcrypt.compareSync(req.body.password, users[id].password)){
    res.status(401).send("incorrect password");
  } else {

    req.session.user_id = id;
    res.redirect("/");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

app.get("/register", (req, res) => {
  let userID = req.session.user_id;

  if (userID){
    res.redirect("/");
  } else {
    res.status(200).render("register");

  }

});

app.post("/register", (req, res) => {

  if (!req.body.email || !req.body.password){
    res.sendStatus(400).send("email or password missing");
  }
  else {
    var arrayOfEmails = [];

    for (let user in users) {
      arrayOfEmails.push( users[user].email );
    };

    if (arrayOfEmails.indexOf(req.body.email) > -1){
      res.status(400).send("An account associated with this email exists already");
      return;
    }

    let id = generateRandomString();
    users[id] = {
      id: id,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    };
      req.session.user_id = id;
      res.redirect("/");
  }

});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  return (100000*Math.random()).toString(36).replace(/[^a-z0-9]+/g, '').substr(0, 6);
}

//find the user id from a given email and return it as a string, return null if user object not correctly formatted or email not found

function searchUserByProperty (obj, prop, query) {

  for (var key in obj) {
    var value = obj[key];

    if (typeof value !== 'object'){
      return null;
    }

    if (Object.keys(value).indexOf(prop) === -1) {
      return null;
    }

    if (value[prop] === query) {
      return key;
    }
  }
  return null;
}

