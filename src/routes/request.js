import express from 'express'
import multer from 'multer'
import Task from '../models/task.js'
import Request from '../models/request.js'
import { authorizationUser } from '../middlewares/auth.js';
import { S3FilePut } from '../services/s3.js';
import { randomUUID } from 'crypto';

const router = express.Router()

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 mb
    }
});

router.get('/request', authorizationUser, async (req, res) => {
    const user = req.user;

    // try find request
    const result = await Request
        .findOne({ userId: user.userId})
        .sort({ createdAt: -1 });

    if(!result){
        // try find active task
        const task = await Task.findOne({ 
            userId: user.userId,
            status: 'processing'
        });

        // task no exist
        if(!task) return res.sendStatus(204);

        // return active task in processing
        return res.status(200).json({
            id: null,
            status: 'processing',
            theme: '',
            task: null,
            result: null
        });
    }
    
    // request user result
    return res.status(200).json({
        id: result._id,
        status: 'completed',
        theme: result.theme,
        task: result.task,
        result: result.result
    });
});

router.post('/request', authorizationUser, async (req, res) => {
    try {
        const { theme } = req.body;
        const user = req.user;
        
        // check user credist
        if(user.balance <= 0){
            return res.status(200).json({
                status: 'no credits'
            });
        }

        // check exist task already created
        // blocking create more/multi tasks
        const exist = await Task.findOne({ userId: user.userId });
        if(exist){
            return res.status(200).json({
                status: 'processing'
            });
        }

        // creating new task
        const task = await Task.create({
            userId: user.userId,
            theme: theme,
            status: 'pending'
        });

        // send created result task
        return res.status(201).json({ 
            id: task._id
        });
    }
    catch (error) {
        return res.sendStatus(400);
    }
});

router.post('/request/upload/:taskId/:side', [authorizationUser, upload.single('file')], async (req, res) => {
    try {
        const { taskId, side } = req.params;
        const user = req.user;
        
        // check side
        if (!['left', 'right'].includes(side)) {
            return res.status(400).json({ error: 'Invalid side' });
        }

        // try find current task
        const task = await Task.findOne({
            _id: taskId,
            userId: user.userId
        });

        // task not found
        if (!task) {
            return res.status(400).json({ error: 'Task not found' });
        }

        // key-name
        const key = randomUUID();

        // upload file to s3
        const s3Result = await S3FilePut('scanhand-images',
            key,
            req.file.buffer,
            req.file.mimetype
        );

        // check result uploading
        if(!s3Result){
            return res.sendStatus(400);
        }

        // set new uploaded file
        task.files[side] = {
            uploaded: true,
            key: key
        };

        // save and return response
        await task.save();
        return res.sendStatus(201);
    }
    catch (error){
        return res.sendStatus(400);
    }
});

export default router;