const express = require("express");
// connect to database
const db = require("./database/connect");
const insert = require("./database/initscript");
// import database
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
app.use(cors());

const port = 3000;
const uploadAPI = require("./routes/uploadfichier");

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.use("/uploads", express.static("uploads"));

app.use("/upload", uploadAPI);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
module.exports = app;
