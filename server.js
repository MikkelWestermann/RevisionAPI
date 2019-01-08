const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex')

const app = express();

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'mikkelwestermann',
    password : '',
    database : 'revision'
  }
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const users = [
  {
    id: 1,
    email: 'bob@gmail.com',
    username: 'bob',
    password: '123'
  }
]

app.post('/signin', (req, res) => {
  const { accountName, password } = req.body;
  if (!accountName || !password) {
    return res.status(400).json('Incorrect Form Submission');
  }
  db.select('email', 'username', 'hash').from('users').where('email', '=', accountName).orWhere('username', '=', accountName)
    .then(data => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return res.json({
          email: data[0].email,
          username: data[0].username
        });
      } else {
        res.status(400).json('Wrong Credentials');
      }
    })
    .catch(error => res.status(400).json('Wrong Credentials'));
})

app.post('/register', (req, res) => {
  const { email, password, username } = req.body;
  if(!email || !password || !username) {
    return res.status(400).json('incorrect form submission');
  }
  const hash = bcrypt.hashSync(password);
  db.transaction(trx => {
    trx.insert({
      hash: hash,
      email: email,
      username: username
    })
    .into('users')
    .returning('*')
    .then(data => {
      res.json({
        email: data[0].email,
        username: data[0].username
      })})
    .then(trx.commit)
    .catch(trx.rollback)
  })
  .catch(err => res.status(400).json(err));
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`app is running on port ${PORT}`);
})
