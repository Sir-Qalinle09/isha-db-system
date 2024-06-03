//app.js

const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const multer = require('multer');

const app = express();
const port = 9990;

// Database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'database_isha'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connected to MySQL database');
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

// Set views file
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Middleware to check authentication
function checkAuthentication(req, res, next) {
  if (req.session.loggedin) {
    next();
  } else {
    res.redirect('/login');
  }
}

// Routes
app.get('/welcome', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login', { error: req.session.error });
  delete req.session.error;  // Clear the error message after displaying it
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username && password) {
    db.query('SELECT * FROM login WHERE username = ? AND password = ?', [username, password], (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
        req.session.loggedin = true;
        req.session.user = results[0];
        res.redirect('/dashboard');
      } else {
        req.session.error = 'Incorrect Username and/or Password!';
        res.redirect('/login');
      }
    });
  } else {
    req.session.error = 'Please enter Username and Password!';
    res.redirect('/login');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;
    res.redirect('/login');
  });
});

app.get('/dashboard', checkAuthentication, (req, res) => {
  res.render('dashboard', { user: req.session.user });
});

app.get('/add', checkAuthentication, (req, res) => {
  res.render('register', {
    title: 'CRUD Operation using NodeJS / ExpressJS / MySQL'
  });
});

app.post('/save', checkAuthentication, (req, res) => { 
  let data = {
    Name: req.body.Name,
    Gender: req.body.Gender,
    Phone: req.body.Phone,
    Courses: req.body.Courses,
    City: req.body.City,
    Address: req.body.Address,
    Email: req.body.Email,
    Date: req.body.Date
  };
  let sql = "INSERT INTO register SET ?";
  let query = db.query(sql, data, (err, results) => {
    if (err) throw err;
    res.redirect('/select');
  });
});

app.get('/select', checkAuthentication, (req, res) => {
  const hel = "SELECT * FROM register";
  db.query(hel, (err, result) => {
    if (err) {
      res.render('user_index', { users: '' });
    } else {
      res.render('user_index', { users: result });
    }
  });
});

app.get('/edit/:id', checkAuthentication, (req, res) => {
  const userId = req.params.id;
  const sql = "SELECT * FROM register WHERE id = ?";
  db.query(sql, userId, (err, result) => {
    if (err) throw err;
    res.render('user_edit', { user: result[0] });
  });
});

app.post('/update', checkAuthentication, (req, res) => {
  const userId = req.body.id;
  const updatedData = {
    Name: req.body.Name,
    Gender: req.body.Gender,
    Phone: req.body.Phone,
    Courses: req.body.Courses,
    City: req.body.City,
    Address: req.body.Address,
    Email: req.body.Email,
    Date: req.body.Date
  };
  const sql = "UPDATE register SET ? WHERE id = ?";
  db.query(sql, [updatedData, userId], (err, result) => {
    if (err) throw err;
    res.redirect('/select');
  });
});

app.get('/delete/:id', checkAuthentication, (req, res) => {
  const userId = req.params.id;
  const sql = "DELETE FROM register WHERE id = ?";
  db.query(sql, userId, (err, result) => {
    if (err) throw err;
    res.redirect('/select');
  });
});






// Course Routes

app.get('/IT-Courses', (req, res) => {
    const sql = "SELECT * FROM courses";
    db.query(sql, (err, results) => {
      if (err) throw err;
      res.render('IT-Courses', { courses: results });
    });
  });
  app.get('/view-it-courses', checkAuthentication, (req, res) => {
    const sql = "SELECT * FROM courses";
    db.query(sql, (err, results) => {
      if (err) throw err;
      res.render('view-it-courses', { courses: results });
    });
  });
  
  app.get('/course/:id', (req, res) => {
    const courseId = req.params.id;
    const sql = "SELECT * FROM courses WHERE id = ?";
    db.query(sql, [courseId], (err, results) => {
      if (err) throw err;
      if (results.length > 0) {
        res.render('course_detail', { course: results[0] });
      } else {
        res.status(404).send('Course not found');
      }
    });
  });
  
  app.get('/add-course', checkAuthentication, (req, res) => {
    res.render('add-course');
  });
  
  
  
  app.post('/save-course', upload.fields([{ name: 'image' }, { name: 'instructor_image' }]), checkAuthentication, (req, res) => {
    const courseData = {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      post_date: req.body.post_date,
      close_date: req.body.close_date,
      image: req.files['image'][0].filename,
      instructor_name: req.body.instructor_name,
      instructor_image: req.files['instructor_image'][0].filename,
      rating: req.body.rating,
      what_you_learn: req.body.what_you_learn,
      duration_weeks: req.body.duration_weeks
    };
    const sql = "INSERT INTO courses SET ?";
    db.query(sql, courseData, (err) => {
      if (err) throw err;
      res.redirect('/view-it-courses');
    });
  });
  
  
  
  // Delete course
  app.post('/delete-course/:id', checkAuthentication, (req, res) => {
    const courseId = req.params.id;
    // Perform deletion operation in the database
    db.query('DELETE FROM courses WHERE id = ?', courseId, (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error deleting course");
      } else {
        console.log("Course deleted successfully");
        res.redirect('/view-it-courses');
      }
    });
  });
  
  // Edit course
  app.get('/edit-course/:id', checkAuthentication, (req, res) => {
    const courseId = req.params.id;
    // Fetch course details from the database
    db.query('SELECT * FROM courses WHERE id = ?', courseId, (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error fetching course details");
      } else {
        res.render('edit-course', { course: result[0] });
      }
    });
  });
  
  // Update course
  app.post('/update-course/:id', checkAuthentication, (req, res) => {
    const courseId = req.params.id;
    const { title, description, price, post_date, close_date, image, instructor_name, instructor_image, rating, what_you_learn, duration_weeks } = req.body;
    // Perform update operation in the database
    db.query('UPDATE courses SET title = ?, description = ?, price = ?, post_date = ?, close_date = ?, image = ?, instructor_name = ?, instructor_image = ?, rating = ?, what_you_learn = ?, duration_weeks = ? WHERE id = ?', 
      [title, description, price, post_date, close_date, image, instructor_name, instructor_image, rating, what_you_learn, duration_weeks, courseId], 
      (err, result) => {
        if (err) {
          console.log(err);
          res.status(500).send("Error updating course");
        } else {
          console.log("Course updated successfully");
          res.redirect('/view-it-courses');
        }
      }
    );
  });
  
  

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
