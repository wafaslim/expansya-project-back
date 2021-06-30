const Modele = require("../schemas/modele");

// create an array of documents to insert
const tab = [
  { champ: "item", matched: ["item"] },
  { champ: "firstname", matched: ["firstname", "prenom", "prénom"] },
  { champ: "lastname", matched: ["lastname", "nom", "nom de famille"] },
  { champ: "email", matched: ["email", "mail"] },
  { champ: "address", matched: ["address", "adresse"] },
];

if (false) {
  Modele.insertMany(tab).then(created => {
    console.log("Inserted data successfully");
  });
}
