const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const app = express();
const port = 3070;

// Create SQLite database and table if not exists
const db = new sqlite3.Database('wallets.db');
db.run('CREATE TABLE IF NOT EXISTS wallet_links (discord_id TEXT, wallet_address TEXT)');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Link Discord account to a wallet
app.post('/link', (req, res) => {
    const { discord, wallet } = req.query;
  
    if (!discord || !wallet) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    // Check if the wallet address is already linked to a Discord account
    db.get('SELECT * FROM wallet_links WHERE wallet_address = ?', [wallet], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      if (row) {
        // Wallet is already linked, return an error
        return(`This wallet is already linked to ${row.discord_id}`);
      }
  
      // Wallet is not linked, proceed to insert the new link
      db.run('INSERT INTO wallet_links (discord_id, wallet_address) VALUES (?, ?)', [discord, wallet], (err) => {
        if (err) {
          return res.status(500).json({ error: 'Internal server error' });
        }
  
        res.json({ success: true, message: 'Wallet linked successfully' });
      });
    });
  });
  

// Get linked wallets for a Discord account
app.get('/wallets/:discord', (req, res) => {
  const { discord } = req.params;

  db.all('SELECT wallet_address FROM wallet_links WHERE discord_id = ?', [discord], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.json({ wallets: rows.map((row) => row.wallet_address) });
  });
});

// Delete a linked wallet for a Discord account
app.delete('/unlink', (req, res) => {
  const { discord, wallet } = req.query;

  if (!discord || !wallet) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  db.run('DELETE FROM wallet_links WHERE discord_id = ? AND wallet_address = ?', [discord, wallet], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    res.json({ success: true, message: 'Wallet unlinked successfully' });
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
