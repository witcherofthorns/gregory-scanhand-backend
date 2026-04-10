import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
    paymentId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: String,
        required: true,
        index: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    amount: {
        type: Number,
        required: true
    },
    leftHandPhoto: String,
    rightHandPhoto: String,
    topic: String,
    prediction: String,
    requestCount: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date
}, { versionKey: false });

const Prediction = mongoose.model('Prediction', predictionSchema, 'predictions');
export default Prediction;