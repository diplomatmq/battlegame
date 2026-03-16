-- PostgreSQL table creation for game
CREATE TABLE players (
    id SERIAL PRIMARY KEY,
    telegram_id VARCHAR(64) UNIQUE,
    username VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    player1_id INTEGER REFERENCES players(id),
    player2_id INTEGER REFERENCES players(id),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32)
);
