import User from '../models/user.js';

export const authorizationUser = async (req, res, next) => {
    try {
        // get header user value
        const userId = req.get('User');

        // no user payload
        if(!userId) return res.sendStatus(401);

        // try find user
        const user = await User.findOne({ userId });

        // user not found
        if(!user){
            return res.status(401).json({
                error: 'Invalid or expired user session'
            });
        }

        // update user last seen
        user.lastSeenAt = new Date();
        await user.save();

        // set global user object
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};