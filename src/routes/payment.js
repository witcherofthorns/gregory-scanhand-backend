import { Router } from 'express';
import { authorizationUser } from '../middlewares/auth.js';
import { createPayment, getPaymentStatus } from '../services/yookassa.js';
import Payment from '../models/payment.js'

const router = Router();

router.get('/payment/status/:paymentId', authorizationUser, async (req, res) => {
    try {
        const { paymentId } = req.params;
        const user = req.user;
        
        // try find exis payment
        const payment = await Payment.findOne({
            paymentId: paymentId,
            userId: user.userId
        })

        // payment not found
        if(!payment){
            return res.sendStatus(404);
        }

        // if payment status success
        if(payment.status == 'succeeded'){
            return res.json(payment);
        }

        // try get original payment data
        const paymentYoo = await getPaymentStatus(paymentId);

        // bad or not found payment data
        if(!paymentYoo){
            return res.sendStatus(404);
        }

        // sync payment app status
        if(payment.status.toString() != paymentYoo.status.toString()){
            // update app payment status
            // if not updated
            payment.status = paymentYoo.status.toString();
            await payment.save();

            // if success payment status
            // add user balance
            if(payment.status == 'succeeded'){
                user.balance += payment.amount;
                await user.save();
            }
        }

        // return result
        return res.json({
            status: paymentYoo.status,
            id: paymentYoo.id,
            amount: paymentYoo.amount
        })
    } catch (error) {
        return res.sendStatus(500);
    }
});

router.get('/payment/waits', authorizationUser, async (req, res) => {
    try {
        const user = req.user;
        
        // try find all exist payments
        const payments = await Payment.find({
            userId: user.userId,
            status: 'pending'
        })

        // payment not found
        if(!payments || payments.length == 0){
            return res.sendStatus(204);
        }

        // return result
        return res.json(payments)
    } catch (error) {
        return res.sendStatus(500);
    }
});

router.post('/payment', authorizationUser, async (req, res) => {
    try {
        const amount = parseInt(req.query.amount) | null;
        const user = req.user;

        // check amount query exist
        if(!amount){
            console.error('payment: amount not found query')
            return res.sendStatus(400);
        }

        // validate amount values
        if(amount != 50 && amount != 100 && amount != 200){
            console.error('payment: bad amount -> ', amount)
            return res.sendStatus(400);
        }

        // create yookassa payment transaction
        const paymentYoo = await createPayment({
            amount,
            userId: user.userId
        });

        // failed create payment
        if(!paymentYoo){
            return res.sendStatus(500);
        }

        // create payment
        await Payment.create({
            paymentId: paymentYoo.id,
            userId: user.userId,
            status: paymentYoo.status,
            amount: amount,
            createdAt: Date.now()
        });

        // if payment already successed
        // update user balance
        if(paymentYoo.status == 'succeeded'){
            user.balacne += amount;
            await user.save();
        }

        // return result
        return res.json({
            status: paymentYoo.status,
            link: paymentYoo.confirmation.confirmation_url,
            amount: paymentYoo.amount
        })
    }
    catch (error) {
        return res.sendStatus(500);
    }
});

export default router;