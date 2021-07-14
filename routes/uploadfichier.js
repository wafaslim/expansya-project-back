const express = require("express");
var router = express.Router();
const multer = require("multer");
const fileSchema = require("../schemas/fichier");
const path = require("path");
// // require csvtojson
var csv = require("csvtojson");
const fuzz = require("fuzzball");
const translate = require("@vitalets/google-translate-api");
const parser = require("simple-excel-to-json");
const Modele = require("../schemas/modele");
const ImportedData = require("../schemas/importedData");

// Multer Upload Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./upload/");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString().replace(/:/g, "-") + file.originalname);
  },
});

// Filter for csv,xls and xlsx files

const extFilter = (req, file, cb) => {
  const extentionsFilter = [".csv", ".xls", ".xlsx"];
  const extentionFile = path.extname(file.originalname);
  if (extentionsFilter.includes(extentionFile)) {
    cb(null, true);
  } else {
    cb("Please upload only csv,xls and xlsx files ", false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: extFilter,
});
router.post("/uploadfichier", upload.single("fichier"), async (req, res) => {
  // get model  array
  const matched = await Modele.find({});
  // console.log("matched", matched);
  var matchedstring = matched.map(element => element.matched);
  // console.log("Model", model);
  var model = [];
  for (i = 0; i < matchedstring.length; i++) {
    var model = model.concat(matchedstring[i]);
  }
  // console.log(model);

  // console.log(req.file);
  const fichierUp = new fileSchema({
    path: req.file.path,
  });
  // console.log(fichierUp);
  await fichierUp.save();

  const ext = path.extname(req.file.originalname);

  if (ext == ".csv") {
    // // Convert a csv file with csvtojson
    var jsonArrayObj = await csv().fromFile(req.file.path);
    var arrayHeaders = Object.keys(jsonArrayObj[0]);
  } else if (ext == ".xls" || ext == ".xlsx") {
    var jsonArrayObj = await parser.parseXls2Json(req.file.path);
    var arrayHeaders = Object.keys(jsonArrayObj[0][0]);
  }
  //when parse finished, result will be emitted here.

  // console.log("arraysheaders", arrayHeaders);
  var matching = [];
  var notmatching = [];
  var similarkeys = [];

  for (i = 0; i < arrayHeaders.length; i++) {
    if (model.includes(arrayHeaders[i].toLocaleLowerCase())) {
      matching.push(arrayHeaders[i]);
    } else {
      notmatching.push(arrayHeaders[i]);
    }
  }
  // console.log("matching", matching);
  // console.log("notmatch", notmatching);

  for (i = 0; i < notmatching.length; i++) {
    try {
      var trans = await translate(notmatching[i], { to: "en" });
      const fuzz_extract = await fuzz.extract(trans.text, model, {
        returnObjects: true,
      });
      // console.log("comparaison", fuzz_extract);
      // console.log(i);
      similarkeys.push({
        key: notmatching[i],
        similarkey: fuzz_extract,
      });
      // console.log("similarkeys", similarkeys);
    } catch (error) {
      console.log(error);
    }
  }

  res.json({
    fichierUp,
    matching,
    similarkeys,
    message: "fichier importé avec succés",
  });
});

router.put("/saveData/:fileid", async (req, res) => {
  const fichier = await fileSchema.findById(req.params.fileid);

  const ext = path.extname(fichier.path);
  let arrayHeaders = [];
  let jsonArrayObj;
  if (ext == ".csv") {
    // read csv here
    jsonArrayObj = await csv().fromFile(fichier.path);
    arrayHeaders = Object.keys(jsonArrayObj[0]);
  } else {
    // read xls here
    const allSheets = await parser.parseXls2Json(fichier.path);
    jsonArrayObj = allSheets[0];
    arrayHeaders = Object.keys(jsonArrayObj[0]);
  }
  // console.log(jsonArrayObj);
  // console.log(req.body);
  // console.log(arrayHeaders);
  await Promise.all(
    arrayHeaders.map(async element => {
      const exist = req.body.notmatchedHeader.find(
        obj => obj.key.toLocaleLowerCase() == element.toLocaleLowerCase()
      );
      // console.log(exist);
      if (exist == undefined) {
        // if this element exist in matched
        const foundModele = await Modele.findOne({
          matched: element.toLocaleLowerCase(),
        });
        if (foundModele) {
          // 2.0 update this element in all objects
          jsonArrayObj.map(obj => {
            obj[foundModele.champ] = obj[element];
            delete obj[element];
          });
        }
      } else {
        // if this element exist in notmatched
        //  1.0 add this element in matched
        const foundModele = await Modele.findOneAndUpdate(
          {
            matched: exist.value.toLocaleLowerCase(),
          },
          {
            $addToSet: { matched: exist.key.toLocaleLowerCase() },
          }
        );
        // console.log(foundModele);
        if (foundModele) {
          // 2.0 update this element in all objects
          jsonArrayObj.map(obj => {
            obj[foundModele.champ] = obj[exist.key];
            delete obj[exist.key];
          });
        }
      }
    })
  );

  // console.log(jsonArrayObj);
  await ImportedData.insertMany(jsonArrayObj);
  res.json({ message: "fichier importé avec succés" });
});

module.exports = router;
