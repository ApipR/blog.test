const bcrypt = require('bcrypt');
const readline = require('readline');
const { runQuery, initDatabase, getDb } = require('./database');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise(resolve => rl.question(query, resolve));

const setupAdmin = async () => {
  try {
    await initDatabase();
    console.log('\n=== Blog Admin Setup ===\n');

    const password = await question('Enter admin password: ');
    const confirmPassword = await question('Confirm password: ');

    if (password !== confirmPassword) {
      console.log('\n✗ Passwords do not match');
      rl.close();
      process.exit(1);
    }

    if (password.length < 6) {
      console.log('\n✗ Password must be at least 6 characters');
      rl.close();
      process.exit(1);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const db = getDb();

    db.run('DELETE FROM admin'); // Clear existing
    db.run(
      'INSERT INTO admin (id, password_hash) VALUES (1, ?)',
      [hashedPassword],
      (err) => {
        if (err) {
          console.log('\n✗ Error setting password:', err.message);
          process.exit(1);
        }
        console.log('\n✓ Admin password set successfully!');
        console.log('\nYou can now log in at: http://localhost:3000/admin/login\n');
        rl.close();
        process.exit(0);
      }
    );
  } catch (error) {
    console.error('Setup error:', error);
    rl.close();
    process.exit(1);
  }
};

setupAdmin();
