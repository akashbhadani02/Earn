const express = require("express");
const router = express.Router();

const Question = require("../models/Question");
const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");
const seedQuestions = require("../questions.json");

let seedPromise = null;

async function ensureQuestionsSeeded() {
    if (seedPromise) return seedPromise;

    seedPromise = (async () => {
        const count = await Question.countDocuments();

        if (count === 0 && seedQuestions.length) {
            const docs = seedQuestions.map(item => ({
                q: String(item.q || "").trim(),
                options: Array.isArray(item.options) ? item.options.map(String) : [],
                correct: Number(item.correct)
            })).filter(item =>
                item.q &&
                item.options.length >= 2 &&
                item.correct >= 0 &&
                item.correct < item.options.length
            );

            if (docs.length) {
                await Question.insertMany(docs, { ordered: false });
            }
        }
    })().catch(err => {
        seedPromise = null;
        throw err;
    });

    return seedPromise;
}

// Student quiz question bank.
router.get("/", auth, async (req, res) => {
    try {
        await ensureQuestionsSeeded();

        const questions = await Question.find()
            .select("q options correct")
            .lean();

        return res.json({
            success: true,
            totalQuestions: questions.length,
            questions
        });
    } catch (err) {
        console.error("Load Questions Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Admin question list with optional search + pagination.
router.get("/admin", adminAuth, async (req, res) => {
    try {
        await ensureQuestionsSeeded();

        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
        const search = String(req.query.search || "").trim();
        const filter = search ? { q: { $regex: search, $options: "i" } } : {};

        const [questions, total] = await Promise.all([
            Question.find(filter)
                .select("q options correct")
                .sort({ _id: 1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Question.countDocuments(filter)
        ]);

        return res.json({
            success: true,
            questions,
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit))
        });
    } catch (err) {
        console.error("Admin Questions Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Admin can create a new question.
router.post("/admin", adminAuth, async (req, res) => {
    try {
        const { q, options, correct } = req.body;
        const cleanOptions = Array.isArray(options)
            ? options.map(value => String(value || "").trim())
            : [];
        const correctIndex = Number(correct);

        if (!String(q || "").trim() || cleanOptions.length < 2 ||
            cleanOptions.some(option => !option) ||
            !Number.isInteger(correctIndex) ||
            correctIndex < 0 || correctIndex >= cleanOptions.length) {
            return res.status(400).json({
                success: false,
                message: "Question, at least 2 options and a valid correct option are required."
            });
        }

        const question = await Question.create({
            q: String(q).trim(),
            options: cleanOptions,
            correct: correctIndex
        });

        return res.json({ success: true, message: "Question Added", question });
    } catch (err) {
        console.error("Add Question Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Admin can edit a question.
router.put("/admin/:id", adminAuth, async (req, res) => {
    try {
        const { q, options, correct } = req.body;
        const cleanOptions = Array.isArray(options)
            ? options.map(value => String(value || "").trim())
            : [];
        const correctIndex = Number(correct);

        if (!String(q || "").trim() || cleanOptions.length < 2 ||
            cleanOptions.some(option => !option) ||
            !Number.isInteger(correctIndex) ||
            correctIndex < 0 || correctIndex >= cleanOptions.length) {
            return res.status(400).json({
                success: false,
                message: "Question, at least 2 options and a valid correct option are required."
            });
        }

        const question = await Question.findByIdAndUpdate(
            req.params.id,
            {
                q: String(q).trim(),
                options: cleanOptions,
                correct: correctIndex
            },
            { new: true, runValidators: true }
        );

        if (!question) {
            return res.status(404).json({ success: false, message: "Question Not Found" });
        }

        return res.json({ success: true, message: "Question Updated", question });
    } catch (err) {
        console.error("Update Question Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

// Admin can delete a question.
router.delete("/admin/:id", adminAuth, async (req, res) => {
    try {
        const question = await Question.findByIdAndDelete(req.params.id);

        if (!question) {
            return res.status(404).json({ success: false, message: "Question Not Found" });
        }

        return res.json({ success: true, message: "Question Deleted" });
    } catch (err) {
        console.error("Delete Question Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = { router, ensureQuestionsSeeded };
