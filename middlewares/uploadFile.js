const multer = require("multer");

// initialization multer diskstorage
// make destination file for upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads"); // file storage location
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname); // rename filename by => date now + original filename
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
