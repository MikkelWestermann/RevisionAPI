const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex')

const app = express();

app.use(bodyParser.json());
app.use(cors());

const users = [
  {
    id: 1,
    email: 'bob@gmail.com',
    username: 'bob',
  }
]

app.get('/', (req, res) => {
  res.send('Yooooooo biatch! Hello World!');
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`app is running on port ${PORT}`);
})
