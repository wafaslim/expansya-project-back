const mongoose = require("mongoose");
const { Schema } = mongoose;

const importedDataSchema = new Schema({
  item: String,
  lastname: String,
  firstname: String,
  email: String,
  address: String,
});

module.exports = mongoose.model("imported_data", importedDataSchema);
