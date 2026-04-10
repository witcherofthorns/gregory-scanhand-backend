import User from "../models/user.js";
import Payment from "../models/payment.js";
import { getPaymentStatus, deletePayment } from "../services/yookassa.js";

const TIMEOUT_SECONDS = 10
let timeoutLoop = null

function workerRestart(){
    timeoutLoop = setTimeout(workerLoop, TIMEOUT_SECONDS * 1000)
}

async function workerLoop() {
    try {
        const payment = await Payment
            .findOne({ status: 'pending' })
            .sort({ createdAt: 1 })
        
        if(!payment){
            workerRestart()
            return;
        }

        const user = await User.findOne({ userId: payment.userId });

        if(!user){
            await payment.deleteOne();
            workerRestart();
            return;
        }

        const paymentYoo = await getPaymentStatus(payment.paymentId);

        if(!paymentYoo){
            await payment.deleteOne();
            workerRestart();
            return;
        }

        if(paymentYoo.status == 'canceled'){
            await payment.deleteOne();
            workerRestart();
            return;
        }

        if(paymentYoo.status == 'succeeded'){
            payment.status = 'succeeded'
            user.balance += 1;
            await user.save();
            await payment.save();
            workerRestart();
            return;
        }

    } catch (error) {
        console.error('worker: error in main loop ->', error);
        workerRestart();
    }

    workerRestart();
}

export async function workerStart() {
    try {
        console.log(`worker: runed interval loop ${TIMEOUT_SECONDS} seconds`);
        workerLoop();
    } catch (error) {
        console.error('worker: error -> ', error);
        process.exit(1);
    }
}

export function workerStop() {
    clearTimeout(timeoutLoop)
    timeoutLoop = null
    console.log('worker: stoped');
}