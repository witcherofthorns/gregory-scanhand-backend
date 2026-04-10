import { YooCheckout  } from '@a2seven/yoo-checkout';
import { v4 as uuidv4 } from 'uuid';

const checkout = new YooCheckout({
    shopId: process.env.SCANHAND_YOO_SHOP_ID,
    secretKey: process.env.SCANHAND_YOO_SECRET_KEY
});

export const createPayment = async ({ amount, userId }) => {
    const idempotenceKey = uuidv4();
    const createPayload = {
        capture: true,
        amount: {
            value: `${amount}.00`,
            currency: 'RUB'
        },
        payment_method_data: {
            type: 'bank_card'
        },
        confirmation: {
            type: 'redirect',
            return_url: process.env.SCANHAND_YOO_REDIRECT
        },
        metadata: {
            userId
        }
    };

    try {
        const payment = await checkout.createPayment(createPayload, idempotenceKey);
        return payment;
    }
    catch (error) {
        console.error(error);
        return null
    }
};

export const deletePayment = async (paymentId) => {
    try {
        const reuslt = await checkout.cancelPayment(paymentId)
        return true;
    } catch (error) {
        return false;
    }
};

export const getPaymentStatus = async (paymentId) => {
    try {
        const payment = await checkout.getPayment(paymentId);
        return payment;
    } catch (error) {
        console.error(error);
        return null;
    }
};