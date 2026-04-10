import { Router } from 'express';
import User from '../models/user.js';

const router = Router();

router.get('/auth', async (req, res) => {
    try {
        const userId = req.get('User');
        
        // if not authorized
        if(!userId){
            return res.sendStatus(401);
        }

        // try find exist user
        const user = await User.findOne({ userId });

        // if not authorized
        if(!user) {
            return res.sendStatus(401);
        }

        // update lastSeenAt time
        // its ok behavior
        user.lastSeenAt = new Date();
        await user.save();
        return res.sendStatus(204);
    }
    catch (error) {
        return res.sendStatus(500);
    }
});

router.post('/auth', async (req, res) => {
    try {
        const { finger, device } = req.body;

        if(!finger){
            return res.status(400).json({ error: 'fingerprint required' });
        }

        // hasing user finger print
        const hash = User.hashFingerprint(finger);

        // search exist user auth
        let user = await User.findOne({ hash });

        if(user){
            // update
            user.lastSeenAt = new Date();
            if(device){
                user.device = device;
            }
            await user.save();
            return res.json({
                id: user.userId,
                new: false,
                balance: user.balance
            });
        }

        // user not found
        // creating new
        user = await User.create({
            hash,
            device,
            balance: 0,
            lastSeenAt: new Date()
        });

        // return info
        return res.status(201).json({
            id: user.userId,
            new: true,
            balance: user.balance
        });
    }
    catch(error) {
        return res.sendStatus(500);
    }
});

export default router;