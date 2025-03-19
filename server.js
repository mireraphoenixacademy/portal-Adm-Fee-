const express = require('express');
const mongoose = require('mongoose');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(express.json());

// Debug: Log environment variables to ensure they're loaded
console.log('MONGODB_URI:', process.env.MONGODB_URI);
if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI is not defined in .env file');
    process.exit(1);
}

// MongoDB Connection
mongoose.set('strictQuery', false); // Suppress strictQuery warning
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });

// Twilio Setup
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Nodemailer Setup
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Schemas
const learnerSchema = new mongoose.Schema({
    admissionNo: String,
    fullName: String,
    gender: String,
    dob: String,
    grade: String,
    assessmentNumber: String,
    parentName: String,
    parentPhone: String,
    parentEmail: String
});

const feeSchema = new mongoose.Schema({
    admissionNo: String,
    term: String,
    amountPaid: Number,
    balance: Number
});

const bookSchema = new mongoose.Schema({
    admissionNo: String,
    subject: String,
    bookTitle: String
});

const classBookSchema = new mongoose.Schema({
    bookNumber: String,
    subject: String,
    description: String,
    totalBooks: Number
});

const feeStructureSchema = new mongoose.Schema({
    playgroup: Number,
    pp1: Number,
    pp2: Number,
    grade1: Number,
    grade2: Number,
    grade3: Number,
    grade4: Number,
    grade5: Number,
    grade6: Number,
    grade7: Number,
    grade8: Number,
    grade9: Number
});

const termSettingsSchema = new mongoose.Schema({
    currentTerm: String,
    currentYear: Number
});

const learnerArchiveSchema = new mongoose.Schema({
    year: Number,
    learners: [learnerSchema]
});

const Learner = mongoose.model('Learner', learnerSchema);
const Fee = mongoose.model('Fee', feeSchema);
const Book = mongoose.model('Book', bookSchema);
const ClassBook = mongoose.model('ClassBook', classBookSchema);
const FeeStructure = mongoose.model('FeeStructure', feeStructureSchema);
const TermSettings = mongoose.model('TermSettings', termSettingsSchema);
const LearnerArchive = mongoose.model('LearnerArchive', learnerArchiveSchema);

// Routes
app.get('/api/learners', async (req, res) => {
    const learners = await Learner.find();
    res.json(learners);
});

app.post('/api/learners', async (req, res) => {
    const learner = new Learner(req.body);
    await learner.save();
    res.json(learner);
});

app.put('/api/learners/:id', async (req, res) => {
    const learner = await Learner.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(learner);
});

app.delete('/api/learners/:id', async (req, res) => {
    await Learner.findByIdAndDelete(req.params.id);
    res.json({ message: 'Learner deleted' });
});

app.get('/api/fees', async (req, res) => {
    const fees = await Fee.find();
    res.json(fees);
});

app.post('/api/fees', async (req, res) => {
    const fee = new Fee(req.body);
    await fee.save();
    res.json(fee);
});

app.put('/api/fees/:id', async (req, res) => {
    const fee = await Fee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(fee);
});

app.delete('/api/fees/:id', async (req, res) => {
    await Fee.findByIdAndDelete(req.params.id);
    res.json({ message: 'Fee deleted' });
});

app.get('/api/books', async (req, res) => {
    const books = await Book.find();
    res.json(books);
});

app.post('/api/books', async (req, res) => {
    const book = new Book(req.body);
    await book.save();
    res.json(book);
});

app.put('/api/books/:id', async (req, res) => {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(book);
});

app.delete('/api/books/:id', async (req, res) => {
    await Book.findByIdAndDelete(req.params.id);
    res.json({ message: 'Book deleted' });
});

app.get('/api/classBooks', async (req, res) => {
    const classBooks = await ClassBook.find();
    res.json(classBooks);
});

app.post('/api/classBooks', async (req, res) => {
    const classBook = new ClassBook(req.body);
    await classBook.save();
    res.json(classBook);
});

app.put('/api/classBooks/:id', async (req, res) => {
    const classBook = await ClassBook.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(classBook);
});

app.delete('/api/classBooks/:id', async (req, res) => {
    await ClassBook.findByIdAndDelete(req.params.id);
    res.json({ message: 'Class book deleted' });
});

app.get('/api/feeStructure', async (req, res) => {
    const feeStructure = await FeeStructure.findOne();
    res.json(feeStructure);
});

app.post('/api/feeStructure', async (req, res) => {
    await FeeStructure.deleteMany();
    const feeStructure = new FeeStructure(req.body);
    await feeStructure.save();
    res.json(feeStructure);
});

app.get('/api/termSettings', async (req, res) => {
    const termSettings = await TermSettings.findOne();
    res.json(termSettings);
});

app.post('/api/termSettings', async (req, res) => {
    await TermSettings.deleteMany();
    const termSettings = new TermSettings(req.body);
    await termSettings.save();
    res.json(termSettings);
});

app.get('/api/learnerArchives/years', async (req, res) => {
    const archives = await LearnerArchive.find().select('year');
    const years = archives.map(archive => archive.year);
    res.json(years);
});

app.get('/api/learnerArchives/:year', async (req, res) => {
    const archive = await LearnerArchive.findOne({ year: req.params.year });
    res.json(archive ? archive.learners : []);
});

app.post('/api/newAcademicYear', async (req, res) => {
    const termSettings = await TermSettings.findOne();
    const currentYear = termSettings.currentYear;
    const learners = await Learner.find();

    const archive = new LearnerArchive({
        year: currentYear,
        learners
    });
    await archive.save();

    const gradeOrder = ['Playgroup', 'PP1', 'PP2', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];
    for (let learner of learners) {
        const currentGradeIndex = gradeOrder.indexOf(learner.grade);
        if (currentGradeIndex < gradeOrder.length - 1) {
            learner.grade = gradeOrder[currentGradeIndex + 1];
            await Learner.findByIdAndUpdate(learner._id, { grade: learner.grade });
        } else {
            await Learner.findByIdAndDelete(learner._id);
        }
    }

    await TermSettings.findOneAndUpdate({}, { currentYear: currentYear + 1, currentTerm: 'Term 1' }, { new: true });
    res.json({ message: 'New academic year started' });
});

// Send Notification Endpoint
app.post('/api/sendNotification', async (req, res) => {
    const { phone, email, message } = req.body;
    console.log('Received notification request:', { phone, email, message });

    // Validate phone number format (should be in E.164 format, e.g., +1234567890)
    if (!phone || !phone.startsWith('+')) {
        console.error('Invalid phone number format:', phone);
        return res.status(400).json({ error: 'Phone number must be in E.164 format (e.g., +1234567890)' });
    }

    try {
        // Send SMS via Twilio
        const smsResponse = await twilioClient.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phone
        });
        console.log('SMS sent successfully:', smsResponse.sid);

        // Send email via Nodemailer (if email is provided)
        if (email) {
            const mailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: 'Fee Balance Notification',
                text: message
            };
            const emailResponse = await transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', emailResponse.messageId);
        }

        res.status(200).json({ message: 'Notification sent successfully', smsSid: smsResponse.sid });
    } catch (err) {
        console.error('Error sending notification:', err.message);
        res.status(500).json({ error: 'Failed to send notification', details: err.message });
    }
});

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));