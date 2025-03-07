const express = require("express");
const router = express.Router();
const Exam = require("../models/examModel");
const Question = require("../models/questionModel");
const authMiddleware = require("../middlewares/authMiddleware");
const axios = require("axios");
require("dotenv").config();

// Initialize OpenAI API


// add exam
router.post("/add", authMiddleware, async (req, res) => {
  try {
    // check if exam already exists
    const examExists = await Exam.findOne({ name: req.body.name });
    if (examExists) {
      return res
        .status(200)
        .send({ message: "Exam already exists", success: false });
    }
    req.body.questions = [];
    const newExam = new Exam(req.body);
    await newExam.save();
    res.send({
      message: "Exam added successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      data: error,
      success: false,
    });
  }
});

// get all exams
router.post("/get-all-exams", authMiddleware, async (req, res) => {
  try {
    const exams = await Exam.find({});
    res.send({
      message: "Exams fetched successfully",
      data: exams,
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      data: error,
      success: false,
    });
  }
});

// get exam by id
router.post("/get-exam-by-id", authMiddleware, async (req, res) => {
  try {
    const exam = await Exam.findById(req.body.examId).populate("questions");
    res.send({
      message: "Exam fetched successfully",
      data: exam,
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      data: error,
      success: false,
    });
  }
});

// edit exam by id
router.post("/edit-exam-by-id", authMiddleware, async (req, res) => {
  try {
    await Exam.findByIdAndUpdate(req.body.examId, req.body);
    res.send({
      message: "Exam edited successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      data: error,
      success: false,
    });
  }
});

// delete exam by id
router.post("/delete-exam-by-id", authMiddleware, async (req, res) => {
  try {
    await Exam.findByIdAndDelete(req.body.examId);
    res.send({
      message: "Exam deleted successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      data: error,
      success: false,
    });
  }
});

// add question to exam
router.post("/add-question-to-exam", authMiddleware, async (req, res) => {
  try {
    const newQuestion = new Question(req.body);
    const question = await newQuestion.save();
    const exam = await Exam.findById(req.body.exam);
    exam.questions.push(question._id);
    await exam.save();
    res.send({
      message: "Question added successfully",
      success: true,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message,
      data: error,
      success: false,
    });
  }
});

//GenWithAI

router.post("/generate-quiz", authMiddleware, async (req, res) => {
  try {
    const { text, difficulty, examId, numberOfQuestions, examName } = req.body;

    // Validate request payload
    if (!text || !numberOfQuestions) {
      return res.status(400).send({
        message: "Text and Number of Questions are required",
        success: false,
      });
    }

    // Cohere API prompt
    const prompt = `Generate ${numberOfQuestions} ${difficulty || "medium"}-level multiple-choice quiz questions based on the following text:
    "${text}"
    Format each question as follows:
    {
      "name": "<question>",
      "options": {
        "A": "<option1>",
        "B": "<option2>",
        "C": "<option3>",
        "D": "<option4>"
      },
      "correctOption": "<correct option letter (A, B, C, or D)>"
    }
    Ensure that only one option is correct for each question.`;

    console.log("Prompt:", prompt);

    // Cohere API request
    const cohereResponse = await axios.post(
      "https://api.cohere.ai/v1/generate",
      {
        model: "command",
        prompt: prompt,
        max_tokens: 1000,
        temperature: 0.7,
        k: 0,
        stop_sequences: [],
        return_likelihoods: "NONE",
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    const cohereData = cohereResponse.data;
    const generatedText = cohereData.generations[0].text;
    console.log("Generated Text:", generatedText);

    // Parse the generated text into structured questions
    const generatedQuestions = parseGeneratedText(generatedText);

    if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
      return res.status(400).send({
        message: "Failed to generate valid questions.",
        success: false,
      });
    }

    // Check if exam already exists
    let exam;
    if (examId) {
      exam = await Exam.findById(examId);
      if (!exam) {
        return res.status(404).send({
          message: "Exam not found",
          success: false,
        });
      }
    } else {
      // Create a new exam if examId is not provided
      if (!examName) {
        return res.status(400).send({
          message: "Exam name is required to create a new exam",
          success: false,
        });
      }

      const examExists = await Exam.findOne({ name: examName });
      if (examExists) {
        return res.status(200).send({
          message: "Exam already exists",
          success: false,
        });
      }

      exam = new Exam({
        name: examName,
        questions: [],
      });
      await exam.save();
    }

    // Save questions to the database and add them to the exam
    const savedQuestions = await Promise.all(
      generatedQuestions.map(async (q) => {
        const newQuestion = new Question({
          name: q.name,
          options: q.options,
          correctOption: q.correctOption,
          exam: exam._id,
        });
        return await newQuestion.save();
      })
    );

    // Add question IDs to the exam
    savedQuestions.forEach((q) => exam.questions.push(q._id));
    await exam.save();

    res.send({
      message: "Quiz questions generated and saved successfully",
      success: true,
      data: {
        exam: exam,
        questions: savedQuestions,
      },
    });
  } catch (error) {
    console.error("Error generating quiz:", error.response?.data || error.message);
    res.status(500).send({
      message: "Error generating quiz",
      success: false,
      data: error.response?.data || error.message,
    });
  }
});

// Function to parse generated text into structured JSON
function parseGeneratedText(text) {
  const questions = [];
  const questionBlocks = text.split(/\d+\./).filter(Boolean); // Split by question numbers

  questionBlocks.forEach((block) => {
    const lines = block.split("\n").filter((line) => line.trim() !== "");
    const question = {
      name: lines[0].trim().replace(/"/g, ""), // Remove extra quotes
      options: {},
      correctOption: "",
    };

    let isOptionsSection = false;
    lines.slice(1).forEach((line) => {
      if (line.includes("options")) {
        isOptionsSection = true;
      } else if (line.includes("correctOption")) {
        question.correctOption = line.split(":")[1].trim().replace(/"/g, ""); // Remove extra quotes
      } else if (isOptionsSection) {
        const [option, value] = line.split(":").map((s) => s.trim().replace(/"/g, "")); // Remove extra quotes
        if (option && value) {
          question.options[option] = value;
        }
      }
    });

    questions.push(question);
  });

  return questions;
}

module.exports = router;