const express = require("express");
const bcrypt = require("bcrypt");
const session = require("express-session");
const flash = require("express-flash");

const db = require("./connection/db");
const upload = require("./middlewares/uploadFile");

const app = express();
const port = process.env.PORT || 5000;

// let isLogin = true;

const month = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

app.set("view engine", "hbs"); // set template engine

app.use("/public", express.static(__dirname + "/public")); // set folder to public
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    cookie: {
      maxAge: 2 * 60 * 60 * 1000,
      secure: false,
      httpOnly: true,
    },
    store: new session.MemoryStore(),
    saveUninitialized: true,
    resave: false,
    secret: "secretValue",
  })
);

app.use(flash());

app.get("/", (req, res) => {
  db.connect((err, client, done) => {
    if (err) throw err;

    client.query("SELECT * FROM experiences", (err, result) => {
      done();
      let data = result.rows;

      res.render("index", { data });
    });
  });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {
  const { email, name, password } = req.body;

  const hashedPassword = bcrypt.hashSync(password, 10);

  db.connect((err, client, done) => {
    if (err) throw err;

    client.query(
      `INSERT INTO tb_user(
      name, email, password)
      VALUES ( '${name}', '${email}', '${hashedPassword}' )`,
      (err, result) => {
        done();

        res.redirect("/login");
      }
    );
  });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  let query = `SELECT * FROM tb_user WHERE email = '${email}'`;

  db.connect(function (err, client, done) {
    if (err) throw err;

    client.query(query, function (err, result) {
      if (err) throw err;

      if (result.rows.length == 0) {
        req.flash("danger", "Email and password don't match!");
        return res.redirect("/login");
      }

      let isMatch = bcrypt.compareSync(password, result.rows[0].password);

      if (isMatch) {
        req.session.isLogin = true;
        req.session.user = {
          id: result.rows[0].id,
          name: result.rows[0].name,
          email: result.rows[0].email,
        };
        req.flash("success", "Login suceess");

        res.redirect("/blog");
      } else {
        req.flash("danger", "Email and password don't match!");

        res.redirect("/login");
      }
    });
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/blog");
});

app.get("/contact-me", (req, res) => {
  res.render("contact");
});

app.get("/blog", (req, res) => {
  let query = `SELECT blog.id, blog.title, blog.content, blog.image, tb_user.name AS author, blog.author_id, blog.post_at FROM blog LEFT JOIN tb_user ON blog.author_id = tb_user.id`;

  db.connect((err, client, done) => {
    if (err) throw err;

    client.query(query, (err, result) => {
      let data = result.rows||[]
      data = data.map(function (blog) {
        return {
          ...blog,
          post_at: getFullTime(blog.post_at),
          post_age: getDistanceTime(blog.post_at),
          isLogin: req.session.user,
          image: "/uploads/" + blog.image,
        };
      });

      res.render("blog", {
        isLogin: req.session.isLogin,
        blogs: data,
        user: req.session.user,
      });
    });
  });
});

app.get("/detail-blog/:id", (req, res) => {
  let id = req.params.id;

  db.connect((err, client, done) => {
    if (err) throw err;

    client.query(`SELECT * FROM blog WHERE id=${id}`, (err, result) => {
      done();

      let data = result.rows[0];

      res.render("blog-detail", { id: id, blogs: data });
    });
  });
});

app.get("/edit-blog/:id", (req, res) => {
  db.connect((err, client, done) => {
    if (err) throw err;

    client.query(
      `SELECT * FROM blog WHERE id=${req.params.id}`,
      (err, result) => {
        done();

        let data = result.rows[0];

        res.render("edit-blog", { data });
      }
    );
  });
});

app.post("/update-blog/:id", (req, res) => {
  let data = req.body;
  data.image = "demo.jpg";

  db.connect((err, client, done) => {
    if (err) throw err;

    client.query(
      `UPDATE blog
      SET title='${data.title}', image='${data.image}', content='${data.content}'
      WHERE id=${req.params.id}`,
      (err, result) => {
        done();

        res.redirect("/blog");
      }
    );
  });
});

app.get("/delete-blog/:id", (req, res) => {
  db.connect((err, client, done) => {
    if (err) throw err;

    client.query(
      `DELETE FROM blog WHERE id=${req.params.id}`,
      (err, result) => {
        done();

        res.redirect("/blog");
      }
    );
  });
});

app.get("/add-blog", (req, res) => {
  res.render("add-blog"); // render file add-blog
});

app.post("/blog", upload.single("image"), (req, res) => {
  let data = req.body;

  if (!req.session.isLogin) {
    req.flash("danger", "Please login");
    return res.redirect("/login");
  }

  let authorId = req.session.user.id;
  let image = req.file.filename;

  db.connect((err, client, done) => {
    if (err) throw err;

    client.query(
      `INSERT INTO blog(title, image, content, author_id)
      VALUES ( '${data.title}', '${image}', '${data.content}', '${authorId}' )`,
      (err, result) => {
        done();

        res.redirect("/blog");
      }
    );
  });
});

// To bind and listen the connections on the specified host and port
app.listen(port, () => {
  console.log(`Server starting on PORT: ${port}`);
});

function getFullTime(time) {
  let date = time.getDate();
  let monthIndex = time.getMonth();
  let year = time.getFullYear();

  let hours = time.getHours();
  let minutes = time.getMinutes();

  let result = `${date} ${month[monthIndex]} ${year} ${hours}:${minutes} WIB`;

  return result;
}

function getDistanceTime(time) {
  let timePost = time;
  let timeNow = new Date();

  let distance = timeNow - timePost; // Result in miliseconds

  let miliseconds = 1000; // miliseconds in 1 seconds
  let secondsInMinutes = 60; // seconds in 1 minutes
  let minutesInHours = 60; // minutes in 1 hours
  let hoursInDay = 23; // hours in 1 day

  let distanceDay = Math.floor(
    distance / (miliseconds * secondsInMinutes * minutesInHours * hoursInDay)
  );

  if (distanceDay >= 1) {
    return `${distanceDay} days ago`;
  } else {
    let distanceHours = Math.floor(
      distance / (miliseconds * secondsInMinutes * minutesInHours)
    );
    if (distanceHours >= 1) {
      return `${distanceHours} hours ago`;
    } else {
      let distanceMinutes = Math.floor(
        distance / (miliseconds * secondsInMinutes)
      );
      if (distanceMinutes >= 1) {
        return `${distanceMinutes} minutes ago`;
      } else {
        let distanceSeconds = Math.floor(distance / miliseconds);
        return `${distanceSeconds} seconds ago`;
      }
    }
  }
}
