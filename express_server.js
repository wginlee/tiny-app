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
    username: req.cookies["username"],
    urls: urlDatabase
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    username: req.cookies["username"],
    shortURL: req.params.id ,urls: urlDatabase
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
  // res.send("Ok");         // Respond with 'Ok' (we will replace this)
  res.redirect("/urls");
});

app.post("/urls/:shortURL", (req, res) => {
  console.log(req.params.shortURL);  // debug statement to see POST parameters
  urlDatabase[req.params.shortURL] = req.body.longURL;
  res.redirect("/urls");         // Respond with 'Ok' (we will replace this)
});

app.post("/urls/:shortURL/delete", (req, res) => {
  console.log(req.params.shortURL);  // debug statement to see POST parameters
  delete urlDatabase[req.params.shortURL];
  res.redirect("/urls");         // Respond with 'Ok' (we will replace this)
});

app.post("/login", (req, res) => {
  //set cookie param 'username' to value submitted
  res.cookie('username', req.body.username);
  res.redirect("/");
});

app.post("/logout", (req, res) => {
  res.clearCookie('username');
  res.redirect("/");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

function generateRandomString() {
  return (100000*Math.random()).toString(36).replace(/[^a-z0-9]+/g, '').substr(0, 6);
}

// console.log(generateRandomString());
