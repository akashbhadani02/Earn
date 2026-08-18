const express = require("express");
const router = express.Router();

const Question = require("../models/Question");
const User = require("../models/User");
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

// Secure quiz endpoints. The correct answer never goes to the browser.
router.get("/next", auth, async (req, res) => {
    try {
        await ensureQuestionsSeeded();
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success:false, message:"User not found" });

        let question = user.activeQuizQuestionId
            ? await Question.findById(user.activeQuizQuestionId).select("_id q options").lean()
            : null;

        let rewardBlocked = false;
        if (!question) {
            const picked = await Question.aggregate([
                { $match:{ q:{ $type:"string" }, options:{ $type:"array" } } },
                { $sample:{ size:1 } },
                { $project:{ _id:1, q:1, options:1 } }
            ]);
            question = picked[0];
            if (!question) return res.status(404).json({ success:false, message:"No questions available" });
            user.activeQuizQuestionId = question._id;
            user.activeQuizStartedAt = new Date();
            rewardBlocked = Boolean(user.quizTabViolation);
            user.activeQuizRewardBlocked = rewardBlocked;
            user.quizTabViolation = false;
            await user.save();
        } else {
            rewardBlocked = Boolean(user.activeQuizRewardBlocked);
        }
        return res.json({ success:true, question, rewardBlocked });
    } catch(err) {
        console.error("Next Question Error:",err);
        return res.status(500).json({ success:false, message:err.message });
    }
});

router.post("/answer", auth, async (req,res) => {
    try {
        const { questionId, answerIndex } = req.body || {};
        const index = Number(answerIndex);
        if (!questionId || !Number.isInteger(index) || index < 0)
            return res.status(400).json({ success:false, message:"Invalid answer" });

        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success:false, message:"User not found" });
        if (!user.activeQuizQuestionId || String(user.activeQuizQuestionId)!==String(questionId))
            return res.status(409).json({ success:false, message:"This question is no longer active." });

        const question = await Question.findById(questionId).select("options correct").lean();
        if (!question || index >= question.options.length)
            return res.status(400).json({ success:false, message:"Invalid question or answer" });

        const correct = index === Number(question.correct);
        const rewardBlocked = Boolean(user.activeQuizRewardBlocked);
        user.quizRewardPending = !rewardBlocked;
        user.quizRewardCorrect = correct;
        user.activeQuizQuestionId = null;
        user.activeQuizStartedAt = null;
        user.activeQuizRewardBlocked = false;
        await user.save();

        return res.json({ success:true, correct, correctIndex:Number(question.correct), rewardBlocked });
    } catch(err) {
        console.error("Answer Check Error:",err);
        return res.status(500).json({ success:false, message:err.message });
    }
});

router.post("/abandon", auth, async (req,res) => {
    try {
        await User.findByIdAndUpdate(req.user.id, {$set:{activeQuizQuestionId:null,activeQuizStartedAt:null,activeQuizRewardBlocked:false,quizRewardPending:false,quizRewardCorrect:false}});
        return res.json({success:true});
    } catch(err) {
        return res.status(500).json({success:false,message:err.message});
    }
});

// Fast student quiz endpoint: return a small random batch instead of the full question bank.
router.get("/random", auth, async (req, res) => {
    try {
        const count = Math.min(20, Math.max(1, Number(req.query.count) || 10));
        await ensureQuestionsSeeded();
        const questions = await Question.aggregate([
            { $match: { q: { $type: "string" }, options: { $type: "array" } } },
            { $sample: { size: count } },
            { $project: { q: 1, options: 1, _id: 0 } }
        ]);
        return res.json({
            success:true,
            totalQuestions:questions.length,
            questions:questions.map(q => ({q:q.q, options:q.options}))
        });
    } catch(err) {
        console.error("Random Questions Error:",err);
        return res.status(500).json({success:false,message:err.message});
    }
});

// Student quiz question bank.
router.get("/", auth, async (req, res) => {
    try {
        await ensureQuestionsSeeded();

        const questions = await Question.find()
            .select("q options")
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

// Admin: find repeated questions by normalized question text.
router.get("/admin/repeated", adminAuth, async (req, res) => {
    try {
        await ensureQuestionsSeeded();

        const questions = await Question.find()
            .select("q options correct")
            .sort({ _id: 1 })
            .lean();

        const normalize = value => String(value || "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

        const groups = new Map();
        for (const question of questions) {
            const key = normalize(question.q);
            if (!key) continue;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key).push(question);
        }

        const repeatedGroups = [...groups.values()]
            .filter(group => group.length > 1)
            .map(group => ({
                question: group[0].q,
                count: group.length,
                questions: group
            }));

        const repeatedQuestions = repeatedGroups.flatMap(group => group.questions);

        return res.json({
            success: true,
            repeatedCount: repeatedQuestions.length,
            duplicateGroups: repeatedGroups.length,
            groups: repeatedGroups,
            questions: repeatedQuestions
        });
    } catch (err) {
        console.error("Repeated Questions Error:", err);
        return res.status(500).json({ success: false, message: err.message });
    }
});

router.get("/download", async (req, res) => {
    try {
        const questions = await Question.find().lean();

        const jsonData = questions.map(q => ({
            q: q.q,
            options: q.options,
            correct: q.correct
        }));

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=questions.json"
        );
        res.setHeader("Content-Type", "application/json");

        res.send(JSON.stringify(jsonData, null, 2));

    } catch (err) {
        res.status(500).json({
            success: false,
            message: "Download failed"
        });
    }
});
// Admin: remove repeated questions and keep the first copy of each question.
router.delete("/admin/repeated/remove", adminAuth, async (req, res) => {
    try {
        await ensureQuestionsSeeded();

        const questions = await Question.find()
            .select("_id q")
            .sort({ _id: 1 })
            .lean();

        const normalize = value => String(value || "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

        const seen = new Set();
        const duplicateIds = [];

        for (const question of questions) {
            const key = normalize(question.q);
            if (!key) continue;
            if (seen.has(key)) duplicateIds.push(question._id);
            else seen.add(key);
        }

        let deleted = 0;
        if (duplicateIds.length) {
            const result = await Question.deleteMany({ _id: { $in: duplicateIds } });
            deleted = Number(result.deletedCount || 0);
        }

        return res.json({
            success: true,
            deleted,
            remaining: questions.length - deleted,
            message: deleted
                ? `${deleted} repeated question(s) removed. One copy of each question was kept.`
                : "No repeated questions found."
        });
    } catch (err) {
        console.error("Remove Repeated Questions Error:", err);
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

// Admin: Delete ALL Questions
router.delete("/admin/all", adminAuth, async (req, res) => {
    try {
        const result = await Question.deleteMany({});

        return res.json({
            success: true,
            deleted: Number(result.deletedCount || 0),
            message: `${result.deletedCount || 0} question(s) deleted successfully.`
        });

    } catch (err) {
        console.error("Delete All Questions Error:", err);

        return res.status(500).json({
            success: false,
            message: err.message || "Could not delete all questions"
        });
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

// Admin: import questions from the project's questions.json file.
// Existing questions are detected by normalized question text, so duplicates are skipped.
router.post("/admin/import-json", adminAuth, async (req, res) => {
    try {
        const fs = require("fs");
        const path = require("path");

        const candidates = [
            path.join(__dirname, "..", "questions.json"),
            path.join(__dirname, "..", "question.json")
        ];

        const jsonPath = candidates.find(file => fs.existsSync(file));
        if (!jsonPath) {
            return res.status(404).json({
                success: false,
                message: "questions.json file not found."
            });
        }

        const raw = fs.readFileSync(jsonPath, "utf8");
        const source = JSON.parse(raw);

        if (!Array.isArray(source)) {
            return res.status(400).json({
                success: false,
                message: "JSON must contain an array of questions."
            });
        }

        const normalize = value => String(value || "")
            .toLowerCase()
            .replace(/\s+/g, " ")
            .trim();

        const existing = await Question.find().select("q").lean();
        const existingKeys = new Set(existing.map(item => normalize(item.q)));

        const docs = [];
        const seenInFile = new Set();
        let skipped = 0;

        for (const item of source) {
            const q = String(item.q || "").trim();
            const options = Array.isArray(item.options)
                ? item.options.map(value => String(value || "").trim())
                : [];
            const correct = Number(item.correct);
            const key = normalize(q);

            if (!q || options.length < 2 ||
                options.some(option => !option) ||
                !Number.isInteger(correct) ||
                correct < 0 || correct >= options.length ||
                !key || existingKeys.has(key) || seenInFile.has(key)) {
                skipped++;
                continue;
            }

            seenInFile.add(key);
            docs.push({ q, options, correct });
        }

        if (docs.length) {
            await Question.insertMany(docs, { ordered: false });
        }

        const total = await Question.countDocuments();

        return res.json({
            success: true,
            added: docs.length,
            skipped,
            total,
            message: `${docs.length} new question(s) imported from questions.json. ${skipped} duplicate/invalid question(s) skipped.`
        });
    } catch (err) {
        console.error("Import JSON Questions Error:", err);
        return res.status(500).json({
            success: false,
            message: err.message || "Could not import questions.json"
        });
    }
});

module.exports = { router, ensureQuestionsSeeded };
