const mongoose = require("mongoose");
const { Schema } = mongoose;

const modeleSchema = new Schema({
  champ: String,
  matched: [String],
});

module.exports = mongoose.model("modele", modeleSchema);
