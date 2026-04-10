import express from 'express'
import multer from 'multer'
import { authorizationUser } from '../middlewares/auth.js';
import { createAiRequest } from '../services/openai.js';

const router = express.Router()

const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 mb
    }
});

const uploadMiddleware = upload.fields([
    { name: 'left', maxCount: 1 },
    { name: 'right', maxCount: 1 }
])

router.post('/request', authorizationUser, uploadMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const theme = req.body.theme;
        const leftHand = req.files['left'][0];
        const rightHand = req.files['right'][0];

        // no credist
        if(user.balance <= 0){
            return res.status(204).json({
                error: 'no credits'
            });
        }

        // bad request variables
        if(!theme || !leftHand || !rightHand){
            return res.sendStatus(400);
        }

        // send openai request
        // convert images to base64 string
        const result = await createAiRequest(
            leftHand.buffer.toString('base64'),
            rightHand.buffer.toString('base64'),
            theme
        );

        // failed request
        if(!result){
            return res.sendStatus(400);
        }

        // check valid ai response
        // and sub user credits balance  
        if(result.status == 'ok'){
            user.balance -= 1;
            await user.save();
        }

        // final response
        return res.json(result);
    } catch(error) {
        console.log(error)
        return res.sendStatus(400);
    }
})

export default router;