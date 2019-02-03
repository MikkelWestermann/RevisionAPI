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

// const db = knex({
//   client: 'pg',
//   connection: {
//     connectionString: process.env.DATABASE_URL,
//     ssl: true
//   }
// });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

// ACCOUNT ------------------------------------------------------------------

// WORKS
app.post('/signin', (req, res) => {
  const { accountName, password } = req.body;
  if (!accountName || !password) {
    return res.status(400).json('Incorrect Form Submission');
  }
  db.select('*').from('users').where('email', '=', accountName).orWhere('username', '=', accountName)
    .then(data => {
      const isValid = bcrypt.compareSync(password, data[0].hash);
      if (isValid) {
        return res.json({ data });
      } else {
        res.status(400).json('Wrong Credentials');
      }
    })
    .catch(error => res.status(400).json('Wrong Credentials'));
})


// WORKS
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
    .then(data => res.json({ data }))
    .then(trx.commit)
    .catch(trx.rollback)
  })
  .catch(err => res.status(400).json(err));
})

// CARD GROUP ----------------------------------------------------------------

// WORKS
app.post('/addcardgroup', (req, res) => {
  const { title, userId, username } = req.body;
  if(!title || !userId || !username) {
    return res.status(400).json('incorrect form submission');
  }
  db.transaction(trx => {
    trx.insert({
      title,
      user_id: userId,
      username
    })
    .into('card_groups')
    .returning('*')
    .then(data => {
      res.json({ data })
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
  .catch(err => res.status(400).json(err))
})

// WORKS
app.get('/usercardgroups/:id', (req, res) => {
  const userId = req.params.id;
  db.select('*').from('card_groups').where('user_id', '=', userId)
    .map(async group => {
      const tags = await db.select('tag_name').from('tags').innerJoin('group_tags', 'tags.id', 'group_tags.tag_id').where('group_tags.card_group_id', '=', group.id);
      const groupWithTags = Object.assign({}, group, { tags })
      return groupWithTags;
    })
    .then(data => {
      res.json(data);
    })
    .catch(err => res.status(400).json(err))
})

// WORKS
app.put('/updatecardgroup', (req, res) => {
  const { groupId, title } = req.body;
  db('card_groups')
    .where('id', '=', groupId)
    .update({ title: title })
    .then(data => res.json('Success'))
    .catch(err => res.status(400).json(err))
})

app.delete('/removecardgroup', (req, res) => {
  const { id } = req.body;
  // db('cards')
  //   .where('card_group_id', '=', id)
  //   .del()
  //   .then(
  //     db('card_groups')
  //       .where('id', '=', id)
  //       .del()
  //   )
    db('card_groups')
      .where('id', '=', id)
      .del()
      .then(data => res.json('success'))
      .catch(err => res.status(400).json(err))

      // needs to remove card group + subgroups: cards and group tags
})

// CARDS ---------------------------------------------------------------------

// WORKS
app.post('/addcard', (req, res) => {
  const { question, answer, type, options, groupId } = req.body;
  if (!question || !answer || !type || !groupId) {
    return res.status(400).json('incorrect form submission');
  }
  db.transaction(trx => {
    trx.insert({
      question,
      answer,
      type,
      options,
      card_group_id: groupId
    })
    .into('cards')
    .returning('*')
    .then(data => {
      res.json(data)
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
  .catch(err => res.status(400).json(err));
})

// WORKS
app.get('/getcards/:groupId', (req, res) => {
  const { groupId } = req.params;
  db.select('*').from('cards').where('card_group_id', '=', groupId)
    .then(data => {
      res.json(data)
    })
    .catch(err => res.status(400).json(err));
})


// WORKS
app.put('/updatecard', (req, res) => {
  const { question, answer, type, options, cardId } = req.body;
  db('cards').where('id', '=', cardId)
    .update({
      question,
      answer,
      type,
      options
    })
    .then(data => res.json('Success'))
    .catch(err => res.status(400).json(err))
})

// WORKS
app.delete('/removecard', (req, res) => {
  const { cardId } = req.body;
  db('cards')
    .where('id', '=', cardId)
    .del()
    .limit(1)
    .then(res.json('success'))
    .catch(err => res.status(400).json(err))
})

// ADDS ---------------------------------------------------------------------

// WORKS
app.post('/newadd', (req, res) => {
  const { userId, groupId, username } = req.body;
  if (!userId || !groupId || !username) {
    return res.status(400).json('incorrect form submission');
  }
  db.transaction(trx => {
    trx.insert({
      user_id: userId,
      card_group_id: groupId,
      username
    })
    .into('adds')
    .returning('*')
    .then(data => {
      res.json(data)
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
  .catch(err => res.status(400).json(err));
})

// WORKS
app.get('/getadds/:id', (req, res) => {
  const userId = req.params.id;
  db.select('card_group_id').from('adds').where('user_id', '=', userId)
    .map(async group => {
      const cardGroup = await db.select('*').from('card_groups').where('id', '=', group.card_group_id);
      const tags = await db.select('tag_name').from('tags').innerJoin('group_tags', 'tags.id', 'group_tags.tag_id').where('group_tags.card_group_id', '=', cardGroup[0].id);
      const groupWithTags = Object.assign({}, cardGroup[0], { tags })
      return groupWithTags;
      })
    .then(data => res.json(data))
    .catch(err => res.status(400).json(err));
})

// WORKS
app.delete('/removeadd', (req, res) => {
  const { userId, groupId } = req.body;
  db('adds').where('user_id', '=', userId).andWhere('card_group_id', '=', groupId)
    .limit(1)
    .del()
    .then(data => res.json('success'))
    .catch(err => res.status(400).json(err));
})

// TAGS ---------------------------------------------------------------------

// WORKS
app.post('/newtag', (req, res) => {
  const { tagName } = req.body;
  if (!tagName) {
    return res.status(400).json('incorrect form submission');
  }
  db.transaction(trx => {
    trx.insert({
      tag_name: tagName
    })
    .into('tags')
    .returning('*')
    .then(data => {
      res.json(data)
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
  .catch(err => res.status(400).json(err));
})

// WORKS
app.get('/tags', (req, res) => {
  db.select('tag_name').from('tags')
    .then(data => res.json(data))
    .catch(err => res.status(400).json(err));
})

// GROUP TAGS ----------------------------------------------------------------

// WORKS
app.post('/addtagtogroup', (req, res) => {
  const { tagId, groupId } = req.body;
  if (!tagId || !groupId) {
    return res.status(400).json('incorrect form submission');
  }
  db.transaction(trx => {
    trx.insert({
      tag_id: tagId,
      card_group_id: groupId
    })
    .into('group_tags')
    .returning('*')
    .then(data => {
      res.json(data)
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
  .catch(err => res.status(400).json(err));
})

// WORKS
app.delete('/removetagfromgroup', (req, res) => {
  const { tagId, groupId } = req.body;
  db('group_tags')
    .where('tag_id', '=', tagId)
    .andWhere('card_group_id', '=', groupId)
    .limit(1)
    .del()
    .then(res.json('success'));
})



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`app is running on port ${PORT}`);
})
