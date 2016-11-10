const express = require("express");
const cookieParser = require('cookie-parser');
const bodyParser = require("body-parser");

const PORT = process.env.PORT || 8080; // default port 8080

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

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

app.get("/urls", (req, res) => {
  let templateVars = {
    user_id: req.cookies["user_id"],
    users: users,
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    user_id: req.cookies["user_id"],
    users: users,
    shortURL: req.params.id ,
    urls: urlDatabase
  };
  res.render("urls_show", templateVars);
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

app.post("/urls", (req, res) => {
  console.log(req.body.longURL);  // debug statement to see POST parameters
  urlDatabase[generateRandomString()] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  console.log(req.params.shortURL);  // debug statement to see POST parameters
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");
});

app.post("/urls/:shortURL/delete", (req, res) => {
  console.log(req.params.shortURL);  // debug statement to see POST parameters
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  //value submitted: email, password
  //need to find user_id (key 'id' from 'users' obj) from email to pass into cookie
  //compare input password with pw on database

  let id = searchUserByEmail(users, req.body.email);

  if (!id){
    console.log("no id");
    res.status(403).end();
  } else if (users[id].password !== req.body.password){
    console.log("incorrect password");
    res.status(403).end();
  } else {

    res.cookie('user_id', id);
    res.redirect("/");
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
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
      password: req.body.password
    };
      res.cookie('user_id', id);
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

function searchUserByEmail (obj, query) {

  for (var key in obj) {
    var value = obj[key];

    if (typeof value !== 'object'){
      return null;
    }

    if (Object.keys(value).indexOf("email") === -1) {
      return null;
    }

    if (value.email === query) {
      return key;
    }

  }

  return null;

}

// console.log(generateRandomString());
