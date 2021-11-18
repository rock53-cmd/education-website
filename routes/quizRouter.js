const express = require("express");

// controllers
const {
  getUserQuestionsOfQuiz,
  getUserUnknownQuestions,
  onCorrectAnswer,
  dontKnow,
  apCorrectAnswer,
  getQuizAssets,
} = require("../controllers/quizController");

const router = express.Router();

// for getting all the user questions under a course
router.get("/getUserQuestionsOfCourse/:courseId", getUserQuestionsOfQuiz);

// for getting questions for activation phrase. Only the questions the user doesn't know
router.get("/getUserUnknownQuestions/:courseId", getUserUnknownQuestions);

// for getting the quiz assets
router.get("/get_assets", getQuizAssets);

// for updating the user field after giving the correct answer of a question
router.post("/correctAnswer", onCorrectAnswer);

// for updating the user field after giving the correct answer of a question in activation phrase
router.post("/apCorrectAnswer", apCorrectAnswer);

// when the user will not know
router.post("/dontKnow", dontKnow);

module.exports = router;
