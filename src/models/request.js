import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    theme: String,
    task: String,
    result: mongoose.Schema.Types.Mixed,
    createdAt: { type: Date, default: Date.now, expires: 300 } // 5 min
}, { versionKey: false });

const Task = mongoose.model('Request', requestSchema, 'requests');
export default Task;