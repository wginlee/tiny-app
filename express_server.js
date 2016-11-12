const express = require("express");
// const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');

const PORT = process.env.PORT || 8080; // default port 8080

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'fhasdflkaj',
  secret: 'secret'}));

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};
var users = {};

app.get("/", (req, res) => {
  res.end("Hello!");
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


  let userKey = searchUserByProperty(users, "id", userID);
  let user = users[userKey]; //user object


  let templateVars = {

    user: user,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {

  let userID = req.session.user_id;
  let userKey = searchUserByProperty(users, "id", userID);
  let user = users[userKey]; //user object

  let templateVars = {
    user: user,
    shortURL: req.params.id ,
    urls: urlDatabase
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

//create short url
app.post("/urls", (req, res) => {
  console.log(req.body.longURL);  // debug statement to see POST parameters
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;

  let userID = req.session.user_id;
  if (!userID) {
    res.status(403).end();
  }
  else{
    users[userID].urls.push(shortURL); //need to be an array of unique shortURLs
    res.redirect("/urls");
  }
});

//edit short url
app.put("/urls/:shortURL", (req, res) => {
  console.log(req.params.shortURL);  // debug statement to see POST parameters
  urlDatabase[req.params.shortURL] = req.body.longURL;
  //no need to do anything to the user db
  res.redirect("/urls");
});

app.delete("/urls/:shortURL", (req, res) => {

  let shortURL = req.params.shortURL;
  console.log(shortURL);  // debug statement to see POST parameters
  delete urlDatabase[shortURL];

  let userURLs = users[req.session.user_id].urls;
  userURLs.splice(userURLs.indexOf(shortURL), 1);

  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  //value submitted: email, password
  //need to find user_id (key 'id' from 'users' obj) from email to pass into cookie
  //compare input password with pw on database

  let id = searchUserByProperty(users, "email", req.body.email);

  if (!id){
    console.log("no account associated with that email");
    res.status(403).end();
    return;
  }

  //hashed password in users
  if (!bcrypt.compareSync(req.body.password, users[id].password)){
  // if (users[id].password !== req.body.password){
    console.log("incorrect password");
    res.status(403).end();
  } else {

    req.session.user_id = id;
    // res.cookie('user_id', id);
    res.redirect("/");
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  // res.clearCookie('user_id');
  res.redirect("/");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {

  if (!req.body.email || !req.body.password){
    console.log("email or password missing");
    res.status(400).end();
  }
  else {
    var arrayOfEmails = [];

    for (let user in users) {
      arrayOfEmails.push( users[user].email );
    };

    if (arrayOfEmails.indexOf(req.body.email) > -1){
      console.log("an account associated with this email exists already");
      res.status(400).end();
      return;
    }

    let id = generateRandomString();
    users[id] = {
      id: id,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10),
      urls: []
    };
      req.session.user_id = id;
      // res.cookie('user_id', id);
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

// console.log(generateRandomString());
