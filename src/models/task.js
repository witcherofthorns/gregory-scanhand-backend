import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    theme: { type: String, required: true },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed'],
        default: 'pending'
    },
    files: {
        left: {
            uploaded: { type: Boolean, default: false },
            key: String
        },
        right: {
            uploaded: { type: Boolean, default: false },
            key: String
        }
    },
    error: String,
    createdAt: { type: Date, default: Date.now, expires: 300 } // 5 min
}, { versionKey: false });

const Task = mongoose.model('Task', taskSchema, 'tasks');
export default Task;