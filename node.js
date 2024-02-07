const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'manish',
    database: 'QuizDatabase',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});


app.post('/registration', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        if (name === undefined || email === undefined || password === undefined) {
            throw new Error('Invalid request body. Make sure all required fields are provided.');
        }

        const connection = await pool.promise().getConnection();

        // Check if the user with the provided email already exists
        const [existingUsers] = await connection.execute('SELECT * FROM test WHERE email = ?', [email]);

        if (existingUsers.length > 0) {
            // User already exists, send a response to the client
            res.status(409).json({ success: false, message: 'User already exists. Please sign in.' });
            connection.release();
            return;
        }

        // User doesn't exist, proceed with the signup
        const [result] = await connection.execute('INSERT INTO test (name, email, password) VALUES (?, ?, ?)', [name, email, password]);
        connection.release();

        res.redirect('/quiz.html');
        return;
    } catch (error) {
        console.error("Error signing up user:", error);
        res.status(500).json({ success: false, message: `Error signing up user: ${error.message}` });
    }
});



app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const connection = await pool.promise().getConnection();


        const [rows] = await connection.execute('SELECT * FROM test WHERE email = ?', [email]);

        connection.release();


        if (rows.length > 0) {
            const test = rows[0];


            if (test.password === password) {

                res.redirect('/quiz.html');
                return;
            } else {

                res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
        } else {

            res.status(401).json({ success: false, message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error("Error signing in user:", error);
        res.status(500).json({ success: false, message: `Error signing in user: ${error.message}` });
    }
});


app.get('/quiz.html', (req, res) => {
    res.sendFile(__dirname + '/quiz.html');
});

app.get('/quiz.css', (req, res) => {
    res.setHeader('Content-Type', '/quiz.css');
    res.sendFile(__dirname + '/quiz.css');
});

app.get('/quiz.js', (req, res) => {
    res.setHeader('Content-Type', '/quiz.js');
    res.sendFile(__dirname + '/quiz.js');
});

app.get('/index', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});