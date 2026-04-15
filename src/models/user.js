import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        default: () => uuidv4()
    },
    hash: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    balance: {
        type: Number,
        default: 0,
        min: 0
    },
    device: {
        agent: String,
        platform: String,
        language: String,
        screen: String,
        timezone: String
    },
    firstSeenAt: {
        type: Date,
        default: Date.now
    },
    lastSeenAt: {
        type: Date,
        default: Date.now
    },
    totalPayments: {
        type: Number,
        default: 0
    }
}, { versionKey: false });

userSchema.index(
    { lastSeenAt: 1 },
    { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

userSchema.statics.hashFingerprint = function (fingerprint) {
    const salt = 'scanhand1775749854';
    return crypto
        .createHash('sha256')
        .update(fingerprint + salt)
        .digest('hex');
};

const User = mongoose.model('User', userSchema, 'users');
export default User;