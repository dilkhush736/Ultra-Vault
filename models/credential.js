const mongoose = require("mongoose");
const { Schema } = mongoose;

const credentialSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  platform: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Credential", credentialSchema);