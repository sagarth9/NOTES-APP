require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose");
mongoose.connect(config.connectionString);

const User = require("./models/user.model");
const Note = require("./models/note.model");

const express = require("express");
const cors = require("cors");
const app = express();

const jwt = require("jsonwebtoken");
const { authenticateToken } = require("./utilities");

app.use(express.json());

app.use(cors({
    origin: "*",
})
);

app.get("/", (req, res) => {
    res.json({data: "hello"});
});

//Create Account
app.post("/create-account", async (req, res) => {
// console.log("BODY:", req.body);
    const {fullName, email,password } = req.body;

    if (!fullName) {
        return res.status(400).json({ error: true, message: "Full Name is required"});
    }

    if (!email){
        return res.status(400).json({ error: true, message: "Email is required"});
    }

    if (!password){
        return res.status(400).json({ error: true, message: "Password is required"});
    }

    const isUser = await User.findOne({email: email});

    if (isUser) {
        return res.status(400).json({ error: true, message: "User already exists"});
    };

    const user = new User({
        fullName,
        email,
        password,
    });
    await user.save();

    const accessToken = jwt.sign({userId: user._id}, process.env.ACCESS_TOKEN_SECRET, {expiresIn: "3600m"});

    return res.json({
        error: false,
        user,
        accessToken,
        message: "Registration successful",
    });
});

// Login
app.post("/login", async (req, res) => {
    const {email, password} = req.body;

    if (!email){
        return res.status(400).json({ error: true, message: "Email is required"});
    }

    if (!password){
        return res.status(400).json({ error: true, message: "Password is required"});
    }

    const userInfo = await User.findOne({email: email});

    if (!userInfo) {
        return res.status(400).json({ error: true, message: "User does not exist"});
    }

    if (userInfo.email == email && userInfo.password == password) {
        const accessToken = jwt.sign({userId: userInfo._id}, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "3600m"
        });
        return res.json({
            error: false,
            message: "Login successful",
            email,
            accessToken,
        });
    } else {
        return res.status(400).json({
            error: true,
            message: "Invalid credentials"
        });
    }
});

// Get User
app.get("/get-user", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    const isUser = await User.findOne({_id: userId});

    if (!isUser) {
        return res.status(404).json({ error: true, message: "User not found"});
    }

    return res.json({
        error: false,
        user: {fullName: isUser.fullName, email: isUser.email, _id: isUser._id, createdOn: isUser.createdOn},

        message: "",
    });
});

// Add Note
app.post("/add-note", authenticateToken, async (req, res) => {
    //  console.log("BODY:", req.body);
const { title, content, tags } = req.body;
const userId = req.user.userId;
// console.log("DECODED USER:", req.user);

if (!title) {
    return res.status(400).json({ error: true, message: "Title is required" });
}

if (!content) {
    return res.status(400).json({ error: true, message: "Content is required" });
}

try {
    const note = new Note({
        title,
        content,
        tags: tags || [],
        userId: userId,
    });

    await note.save();

    return res.json({
        error: false,
        note,
        message: "Note added successfully",
    });
}
catch (error) {
    return res.status(500).json({
        error: true,
        message: "An error occurred while adding the note",
    });
}

});

// Edit Note
app.put("/edit-note/:id", authenticateToken, async (req, res) => {
    //  console.log("BODY:", req.body);
const { title, content, tags, isPinned } = req.body;
const userId = req.user.userId;
// console.log("DECODED USER:", req.user);
const noteId = req.params.id;

if (!title && !content && !tags) {
    return res.status(400).json({ error: true, message: "No changes provided" });
}

try {
    const note = await Note.findOne({
        _id: noteId,
        userId: userId,
    });

    if (!note){
        return res.status(404).json({error: true, message: "Note not found"});
    }

    if (title) note.title = title;
    if (content) note.content = content;
    if (tags) note.tags = tags;
    if (isPinned !== undefined) note.isPinned = isPinned;

    await note.save();

    return res.json({
        error: false,
        note,
        message: "Note updated successfully",
    });
}
catch (error) {
    return res.status(500).json({
        error: true,
        message: "Internal server error",
    });
} 

}); 

app.get("/get-all-notes/", authenticateToken, async (req, res) => {
    const userId = req.user.userId;

    try {
        const notes = await Note.find({ userId: userId }).sort({ isPinned: -1 });

        return res.json({
            error: false,
            notes,
            message: "Notes retrieved successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
        });
    }
        });

// Delete Note
app.delete("/delete-note/:id", authenticateToken, async (req, res) => {
    const noteId = req.params.id;
    const userId = req.user.userId;

    try {
        const note = await Note.findOne({_id: noteId, userId: userId});

        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found" });
        }

        await Note.deleteOne({ _id: noteId, userId: userId });

        return res.json({
            error: false,
            message: "Note deleted successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
        });

    }});

// Update isPinned Value
app.put("/update-note-pinned/:id", authenticateToken, async (req, res) => {
    const noteId = req.params.id;
    const {isPinned} = req.body;
    const userId = req.user.userId;


    try {
        const note = await Note.findOne({
            _id: noteId,
            userId: userId,
        });

        if (!note) {
            return res.status(404).json({ error: true, message: "Note not found" });
        }

        note.isPinned = isPinned;

        await note.save();

        return res.json({
            error: false,
            note,
            message: "Note pinned status updated successfully",
        });
    }
    catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
        });
    }

});

// Search Notes
app.get("/search-notes", authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: true, message: "Search query is required" });
    }

    try {
        const matchingNotes = await Note.find({
            userId: userId,
            $or: [
        {title: { $regex: new RegExp(query, "i")}},
        {content: { $regex: new RegExp(query, "i")}},
            ],
        });
        return res.json({
            error: false,
            notes: matchingNotes,
            message: "Notes retrieved successfully",
        });
    } catch (error) {
        return res.status(500).json({
            error: true,
            message: "Internal server error",
        });
    }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
