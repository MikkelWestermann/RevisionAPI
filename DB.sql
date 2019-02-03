CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL
  joined TIMESTAMP DEFAULT NOW(),
  hash VARCHAR(255) NOT NULL
);

CREATE TABLE card_groups (
  id SERIAL PRIMARY KEY,
  title VARCHAR(80) NOT NULL,
  user_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  username VARCHAR(100) NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE cards (
  id SERIAL PRIMARY KEY,
  question VARCHAR(255) NOT NULL,
  answer VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL,
  options VARCHAR(255),
  card_group_id INT NOT NULL,
  FOREIGN KEY(card_group_id) REFERENCES card_groups(id)
);

CREATE TABLE adds (
  user_id INT NOT NULL,
  card_group_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(card_group_id) REFERENCES card_groups(id),
  PRIMARY KEY(user_id, card_group_id)
);


CREATE TABLE tags (
  id SERIAL PRIMARY KEY,
  tag_name VARCHAR(50) UNIQUE
);

CREATE TABLE group_tags (
  card_group_id INT NOT NULL,
  tag_id INT NOT NULL,
  FOREIGN KEY(card_group_id) REFERENCES card_groups(id),
  FOREIGN KEY(tag_id) REFERENCES tags(id)
);
