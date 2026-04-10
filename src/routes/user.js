import { Router } from 'express';
import { authorizationUser } from '../middlewares/auth.js';

const router = Router();

router.get('/user', authorizationUser, async (req, res) => {
    try {
        const user = req.user;
        return res.json({
            id: user.userId,
            balance: user.balance
        });
    } catch (error) {
        return res.sendStatus(204);
    }
});

export default router;