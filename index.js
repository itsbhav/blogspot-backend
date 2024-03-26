require('dotenv').config()
require('express-async-errors')
const express = require('express')
const app = express()
const path = require('path')
const cookieParser = require('cookie-parser')
const cors = require('cors')
const corsOptions = require('./config/corsOptions.js')
const connectDB = require('./config/dbConn')
const mongoose = require('mongoose')
const PORT = process.env.PORT || 3500

connectDB()

app.use(cors(corsOptions))

app.use(express.json({limit:"5mb"}))

app.use(cookieParser())
app.use(express.urlencoded({ extended: true }));
app.use(express.json())

app.set("view engine", "ejs");

app.use('/', express.static(path.join(__dirname, 'public')))

app.use('/',require('./routes/root'))
app.use('/auth', require('./routes/authRoutes'))
app.use('/users', require('./routes/userRoutes'))
app.use('/posts', require('./routes/postRoutes'))
app.use('/verify', require("./routes/verify"))
app.use('/secure', require('./routes/secure'));
app.all('*', (req, res) => {
    res.status(404)
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'views', '404.html'))
    } else if (req.accepts('json')) {
        res.json({ message: '404 Not Found' })
    } else {
        res.type('txt').send('404 Not Found')
    }
})

mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
})