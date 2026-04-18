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
            type: 'sbp'
        },
        confirmation: {
            type: 'redirect',
            return_url: process.env.SCANHAND_YOO_REDIRECT
        },
        metadata: {
            userId
        },
        receipt: {
            customer: {
                email: "gv.yatcunov@gmail.com"
            },
            items: [
                {
                    description: "Пополнение кредитов",
                    quantity: 1.000,
                    amount: {
                        value: `${amount}.00`,
                        currency: "RUB"
                    },
                    vat_code: 1,
                    payment_mode: "full_prepayment",
                    payment_subject: "commodity"
                }
            ],
            internet: true,
            timezone: 2
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

export const createPaymentTest = async ({ amount, userId }) => {
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
        return null;
    }
};