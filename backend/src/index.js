/**
 * npm i body-parser cors express helmet morgan
 * use above to add necessary backend libraries
 *
 * use node src to start the server
 */

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const jwt = require("express-jwt");
const jwksRsa = require("jwks-rsa");

// auth0 details
const auth0ClientId = "T6R3CbsBhHgQkPztCk69l3j1j4tnIIkM";
const auth0Domain = "dev-rfdifhkz.au.auth0.com";

// create backend server
const app = express();

// 'database' for questions, each q has an array of answers
const questions = [];

questions.push({
  id: 1,
  title: "Is this a question?",
  description: "I want to know if this is indeed a question or not?",
  answers: [],
  author: "Roland Littlehales",
});

// helmet adds http headers
// like its wearing a helmet ;)
app.use(helmet());
// Parses all the returns into JSON
app.use(bodyParser.json());
// allows cors
app.use(cors());
// log http requests
app.use(morgan("combined"));

/**
 * Api endpoints  from here down
 */

// get all questions
app.get("/", (req, res) => {
  const _questions = questions.map((q) => ({
    id: q.id,
    title: q.title,
    description: q.description,
    answers: q.answers.length,
  }));
  res.send(_questions);
});

// get specific question
app.get("/:id", (req, res) => {
  const question = questions.filter((q) => q.id === parseInt(req.params.id));
  if (question.length > 1) return res.status(500).send();
  if (question.length === 0) return res.status(404).send();
  res.send(question[0]);
});

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
  }),

  // Validate the audience and the issuer.
  audience: auth0ClientId,
  issuer: `https://${auth0Domain}/`,
  algorithms: ["RS256"],
});

// add a question, validate user first
app.post("/", checkJwt, (req, res) => {
  const { title, description } = req.body;
  const newQuestion = {
    id: questions.length + 1,
    title,
    description,
    answers: [],
    author: req.user.name,
  };
  questions.push(newQuestion);
  res.status(200).send();
});

// add an answer validate user first
app.post("/answer/:id", checkJwt, (req, res) => {
  const { answer } = req.body;

  const question = questions.filter((q) => q.id === parseInt(req.params.id));
  if (question.length > 1) return res.status(500).send();
  if (question.length === 0) return res.status(404).send();

  question[0].answers.push({
    answer,
    author: req.user.name,
  });

  res.status(200).send();
});

// start the server
app.listen(8081, () => {
  console.log("listening on port 8081");
});
