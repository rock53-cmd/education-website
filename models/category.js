const mongoose = require("mongoose");
const mongooseLeanDefaults = require("mongoose-lean-defaults").default;

const dataSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, required: true, trim: true },
  price: { type: Number, required: true },
  passPercentage: { type: Number, required: true },
  learningPhasePaid: { type: Boolean, required: true },
  checkingPhasePaid: { type: Boolean, required: true },
  quizIns: String,
  concertIns: String,
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Question" }],
  purchasedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "People" }],
  completedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "People" }],
});

dataSchema.plugin(mongooseLeanDefaults);

const Category = new mongoose.model("Category", dataSchema);

module.exports = Category;
