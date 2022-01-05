const mongoose = require("mongoose");
const csvJson = require("csvtojson/v2");
const request = require("request");
const { unlink } = require("fs");
const path = require("path");

const Category = require("../models/category");
const Question = require("../models/question");
const User = require("../models/people");
const Alc = require("../models/alc");
const Org = require("../models/org");
const QuizAsset = require("../models/quizAsset");
const File = require("../models/files");

const transporter = require("../utils/emailTransporter");
module.exports = {
  getCategories: async function (_req, res, next) {
    try {
      const categories =
        (await Category.find({}).lean({ defaults: true }).populate("questions prerequisites")) ||
        [];

      res.status(201).json({ categories });
    } catch (err) {
      next(err);
    }
  },

  getUsers: async function (_req, res, next) {
    try {
      const users = await User.find({}).lean({ defaults: true }).populate("referer");
      res.status(200).json({ users });
    } catch (err) {
      next(err);
    }
  },

  getOrganizations: async function (_req, res, next) {
    try {
      const organizations = await Org.find({}).lean({ defaults: true });

      res.status(200).json({ organizations });
    } catch (err) {
      next(err);
    }
  },

  sendMails: async function (req, res, next) {
    try {
      const { subject, email } = req.body;
      const orgs = await Org.find({ subscribed: true }).lean({ defaults: true });

      // list all the emails of subscribed organizations
      let listOfMails = orgs.map((org) => org.email);

      if (listOfMails.length === 0) {
        res.status(400).json({ msg: "There are no subscribed organizations" });
      }

      // send the mail
      await transporter.sendMail({
        from: `${process.env.EMAIL}`,
        to: listOfMails,
        subject,
        text: email,
      });

      res
        .status(200)
        .json({ msg: `The message was successfully sent to ${listOfMails.length} organizations` });
    } catch (err) {
      next(err);
    }
  },

  postCategory: async function (req, res, next) {
    try {
      const { title, description, price, passPercentage, prerequisites, askForPaymentIn } =
        req.body;

      const categoryExist =
        (await Category.findOne({ name: title }).lean({ defaults: true })) || null;

      if (categoryExist) {
        res.status(400).json({ msg: "This category already exists" });
      } else {
        const newCategory = new Category({
          name: title,
          description,
          price,
          prerequisites,
          passPercentage,
          askForPaymentIn,
        });

        await newCategory.save();
        await newCategory.populate("prerequisites");

        res
          .status(201)
          .json({ msg: `"${newCategory.name}" has been created`, category: newCategory });
      }
    } catch (err) {
      next(err);
    }
  },

  deleteCategory: async function (req, res, next) {
    try {
      const { id } = req.params;

      const doc = await Category.findOne({ _id: id });

      // if any alc is existing in this category,
      // the admin will have to delete them first
      const alcsInThisCategory = await Alc.find({ category: doc._id });

      if (alcsInThisCategory.length > 0) {
        res.status(400).json({
          msg: `This Category is containing learning concerts. Please delete ${alcsInThisCategory.length} learning concerts in this category first and try again.`,
        });
      } else {
        await Category.deleteOne({ _id: doc._id });
        await Question.deleteMany({ category: id });

        res.status(201).json({ msg: `"${doc.name}" has been deleted`, category: doc });
      }
    } catch (err) {
      next(err);
    }
  },

  uploadQuizAssets: async function (req, res, next) {
    try {
      const { positive_sound, negative_sound } = req.files;
      const domain = req.protocol + "://" + req.get("host") + "/";

      const asset = new QuizAsset({
        positive_sound: {
          name: positive_sound[0].filename,
          url: domain + "uploads/quiz-assets/" + positive_sound[0].filename,
        },
        negative_sound: {
          name: negative_sound[0].filename,
          url: domain + "uploads/quiz-assets/" + negative_sound[0].filename,
        },
      });

      await asset.save();

      res.status(200).json({ msg: "Uploaded And Saved Successfully", asset });
    } catch (err) {
      next(err);
    }
  },

  uploadFiles: async function (req, res, next) {
    try {
      const files = req.files;

      const fileData = files.map((file) => ({
        name: file.filename,
        url: req.protocol + "://" + req.get("host") + "/" + "uploads/" + "files/" + file.filename,
      }));

      const uploadedFiles = await File.insertMany(fileData);

      res.status(201).json({ msg: "Files were uploaded successfully", files: uploadedFiles });
    } catch (err) {
      next(err);
    }
  },

  getFiles: async function (req, res, next) {
    try {
      const files = await File.find({});
      res.status(200).json({ files });
    } catch (err) {
      next(err);
    }
  },

  getQuizAssets: async function (_req, res, next) {
    try {
      const asset = (await QuizAsset.find({}))[0] || null;
      res.status(200).json({ asset });
    } catch (err) {
      next(err);
    }
  },

  deleteQuizAssets: async function (_req, res, next) {
    try {
      const asset = (await QuizAsset.find({}))[0];
      unlink(
        path.join(__dirname, `../public/uploads/quiz-assets/${asset.positive_sound.name}`),
        (err) => (err ? err : null)
      );
      unlink(
        path.join(__dirname, `../public/uploads/quiz-assets/${asset.negative_sound.name}`),
        (err) => (err ? err : null)
      );
      await QuizAsset.deleteOne({ _id: asset._id });
      res.status(201).json({ msg: "Deleted" });
    } catch (err) {
      next(err);
    }
  },

  addQuestion: async function (req, res, next) {
    try {
      const { categoryId } = req.params;
      const { question, options, answer, type, concert, timeLimit, answers } = req.body;
      const { activeLearningVoice, passiveLearningVoice, passiveLearningMaleVoice } = req.files;

      let newQuestion;

      if (type === "mcq") {
        newQuestion = new Question({
          question,
          options,
          concert,
          answers: [answer],
          category: categoryId,
          type,
          timeLimit,
        });
      } else {
        newQuestion = new Question({
          question,
          answers,
          category: categoryId,
          type,
          timeLimit,
          concert,
        });
      }

      const url = req.protocol + "://" + req.get("host") + "/uploads/question-audios/";

      newQuestion.activeLearningVoice = url + activeLearningVoice[0].filename;
      newQuestion.passiveLearningVoice = url + passiveLearningVoice[0].filename;
      newQuestion.passiveLearningMaleVoice = url + passiveLearningMaleVoice[0].filename;

      await newQuestion.populate("concert");
      await newQuestion.save();

      await Category.updateOne({ _id: categoryId }, { $push: { questions: newQuestion } });

      res
        .status(201)
        .json({ msg: "Question has been added to the category", question: newQuestion });
    } catch (err) {
      next(err);
    }
  },

  updateQuestion: async function (req, res, next) {
    try {
      const { questionId } = req.params;
      const { question, options, answers, timeLimit } = req.body;

      const updatedQuestion = await Question.findOneAndUpdate(
        { _id: questionId },
        { question, options, answers, timeLimit },
        { new: true }
      );

      res.status(201).json({ msg: "Question Updated Successfully", question: updatedQuestion });
    } catch (err) {
      next(err);
    }
  },

  updateQuestions: async function (req, res, next) {
    try {
      const { categoryId } = req.params;
      const body = req.body;

      await Question.updateMany({ category: categoryId }, { ...body });

      res.status(201).json({ msg: "Updated Successfully" });
    } catch (err) {
      next(err);
    }
  },

  addQuestionsFromCsv: async function (req, res, next) {
    try {
      const file = req.file;
      const { category } = req.body;
      const filePath =
        req.protocol + "://" + req.get("host") + `/uploads/question-csv-files/${file.filename}`;
      // all the json data parsed from the csv file is here (parsed)
      const jsonData = await csvJson().fromStream(request.get(filePath));

      // now let's convert the options field from string to array, if it exists
      for (let i = 0; i < jsonData.length; i++) {
        const question = jsonData[i];
        question.category = category;
        // if the admin hasn't added a concert
        question.concert = question.concert
          ? await Alc.findOne({ name: { $regex: question.concert, $options: "gi" } })
          : res.status(400).json({
              msg: `Please add a concert where this question will be taught, check Q no: [${
                i + 1
              }]`,
            });
        // if the concert doesn't exists
        if (!question.concert)
          res.status(400).json({
            msg: `The concert was not found. please make sure you have entered the correct name. Check Q no: [${
              i + 1
            }]`,
          });
        if (question.type === "mcq") {
          question.options = question.options.split("/ ");
          question.answers = question.answers.split(" ");
        } else {
          question.options = [];
          question.answers = question.answers.split("/ ");
        }
      }

      // now let's see if valid or required properties are added in the json data
      // if it isn't then throw error! and also delete the previous file
      for (let i = 0; i < jsonData.length; i++) {
        const question = jsonData[i];
        if (
          !question.question ||
          !question.type ||
          !question.timeLimit ||
          (question.type === "mcq" && question.options.length === 0) ||
          (question.type === "text" && question.answers.length === 0)
        ) {
          res.status(400).json({
            msg: "Some required properties are missing in your csv file! or some of the values may be invalid",
          });
          unlink(
            path.join(__dirname, `/../public/uploads/question-csv-files/${file.filename}`),
            (err) => (err ? err : null)
          );
        }
      }

      // now time to save them!
      const uploadedDocs = await Question.insertMany(jsonData);

      // now update the fields of the category
      await Category.updateOne({ _id: category }, { $push: { questions: uploadedDocs } }).lean({
        defaults: true,
      });

      // once everything is done, delete the file. Cause we don't need that
      unlink(
        path.join(__dirname, `/../public/uploads/question-csv-files/${file.filename}`),
        (err) => (err ? err : null)
      );

      res.status(200).json({
        msg: "The set of questions were uploaded from your csv file!",
        questions: uploadedDocs,
      });
    } catch (err) {
      next(err);
    }
  },

  getQuestions: async function (req, res, next) {
    try {
      const { categoryId } = req.params;

      if (mongoose.isValidObjectId(categoryId)) {
        const category =
          (await Category.findOne({ _id: categoryId })
            .lean({ defaults: true })
            .populate("questions")
            .populate({ path: "questions", populate: "concert" })) || null;

        if (category) {
          res.status(200).json({ questions: category.questions, category });
        } else {
          res.status(404).json({ msg: "No category found" });
        }
      } else {
        res.status(404).json({ msg: "Invalid Category" });
      }
    } catch (err) {
      next(err);
    }
  },

  deleteQuestion: async function (req, res, next) {
    try {
      const { questionId, categoryId } = req.params;

      const deletedQuestion = await Question.findByIdAndDelete({ _id: questionId });

      deletedQuestion.activeLearningVoice =
        deletedQuestion.activeLearningVoice.split("question-audios/")[1];
      deletedQuestion.passiveLearningVoice =
        deletedQuestion.passiveLearningVoice.split("question-audios/")[1];
      deletedQuestion.passiveLearningMaleVoice =
        deletedQuestion.passiveLearningMaleVoice.split("question-audios/")[1];

      unlink(
        __dirname + `/../public/uploads/question-audios/${deletedQuestion.activeLearningVoice}`,
        (err) => {
          if (err) console.log(err);
        }
      );
      unlink(
        __dirname + `/../public/uploads/question-audios/${deletedQuestion.passiveLearningVoice}`,
        (err) => {
          if (err) console.log(err);
        }
      );
      unlink(
        __dirname +
          `/../public/uploads/question-audios/${deletedQuestion.passiveLearningMaleVoice}`,
        (err) => {
          if (err) console.log(err);
        }
      );

      await Category.findOneAndUpdate({ _id: categoryId }, { $pull: { questions: questionId } });

      res.status(201).json({
        msg: `"${deletedQuestion.question}" has been removed`,
        question: deletedQuestion,
      });
    } catch (err) {
      next(err);
    }
  },
};
