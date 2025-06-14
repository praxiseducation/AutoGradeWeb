"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
// Import routes
const period_routes_1 = __importDefault(require("./routes/period.routes"));
const student_routes_1 = __importDefault(require("./routes/student.routes"));
const assignment_routes_1 = __importDefault(require("./routes/assignment.routes"));
const grade_routes_1 = __importDefault(require("./routes/grade.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'https://growwithpraxis.com',
    credentials: true
}));
app.use(express_1.default.json());
// API Routes
app.use('/api/periods', period_routes_1.default);
app.use('/api/students', student_routes_1.default);
app.use('/api/assignments', assignment_routes_1.default);
app.use('/api/grades', grade_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
// MongoDB connection
mongoose_1.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/autograde')
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
//# sourceMappingURL=server.js.map