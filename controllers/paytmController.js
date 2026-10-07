import https from 'https';
import PaytmChecksum from 'paytmchecksum';
import Payment from '../models/Payment.js';
import Plan from '../models/Plan.js';
import Subscription from '../models/Subscription.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiError.js';
import { ApiResponse } from '../utils/apiResponse.js';

// Setup Paytm Constants
const PAYTM_MID = process.env.PAYTM_MID || 'YOUR_TEST_MID';
const PAYTM_MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY || 'YOUR_TEST_KEY';
const PAYTM_ENVIRONMENT = process.env.NODE_ENV === 'production' 
    ? 'securegw.paytm.in' 
    : 'securegw-stage.paytm.in';
const PAYTM_WEBSITE = process.env.NODE_ENV === 'production' ? 'DEFAULT' : 'WEBSTAGING';

const handleSuccessfulPayment = async (orderId) => {
    const payment = await Payment.findOne({ orderId }).populate('plan');
    if (!payment) return null;
    
    if (payment.status === 'Success') return payment;

    payment.status = 'Success';

    if (payment.plan) {
        const plan = payment.plan;
        const programId = plan.program;
        
        let expiryDate = null;
        if (plan.durationInDays) {
            expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + plan.durationInDays);
        }

        let subscription = await Subscription.findOne({ user: payment.user, program: programId });
        
        if (subscription) {
            subscription.plan = plan._id;
            subscription.status = 'Active';
            if (subscription.expiryDate && subscription.expiryDate > new Date() && plan.durationInDays) {
                subscription.expiryDate = new Date(subscription.expiryDate.getTime() + plan.durationInDays * 24 * 60 * 60 * 1000);
            } else {
                subscription.expiryDate = expiryDate;
            }
            await subscription.save();
        } else {
            subscription = await Subscription.create({
                user: payment.user,
                program: programId,
                plan: plan._id,
                status: 'Active',
                startDate: new Date(),
                expiryDate: expiryDate
            });
        }
        
        payment.subscription = subscription._id;
    }
    if (payment.application) {
        const Application = (await import('../models/Application.js')).default;
        await Application.findByIdAndUpdate(payment.application, {
            status: 'Submitted',
            submittedAt: Date.now()
        });
    }

    await payment.save();
    return payment;
};

// @desc    Initiate a Paytm Transaction to get txnToken
// @route   POST /api/payments/paytm/initiate
// @access  Private
export const initiatePaytmPayment = asyncHandler(async (req, res) => {
    console.log(PAYTM_ENVIRONMENT, "initiate payment")
    return
    const { amount, programId, semester, type, planName, durationInDays, applicationId } = req.body;

    if (!amount) {
        throw new ApiError(400, 'Amount is required');
    }
    if (!programId) {
        throw new ApiError(400, 'Program ID is required for subscriptions');
    }
    
    let paymentType = type || `Tuition Fee - Sem ${semester || 1}`;
    
    // Find or create the plan based on static frontend data
    let plan = await Plan.findOne({ program: programId, name: planName || paymentType });
    if (!plan) {
        plan = await Plan.create({
            program: programId,
            name: planName || paymentType,
            price: amount,
            durationInDays: durationInDays !== undefined ? durationInDays : 180 // Default to ~6 months
        });
    }

    const orderId = `ORD_${Date.now()}_${req.user._id.toString().substring(0, 6)}`;
    const custId = req.user._id.toString();

    var paytmParams = {};

    paytmParams.body = {
        "requestType"   : "Payment",
        "mid"           : PAYTM_MID,
        "websiteName"   : PAYTM_WEBSITE,
        "orderId"       : orderId,
        "callbackUrl"   : `http://localhost:8000/api/payments/paytm/callback`,
        "txnAmount"     : {
            "value"     : Number(amount).toFixed(2),
            "currency"  : "INR",
        },
        "userInfo"      : {
            "custId"    : custId,
            "email"     : req.user.email || '',
            "firstName" : req.user.firstName || '',
            "mobile"    : req.user.phone || ''
        },
    };

    /*
    * Generate checksum by parameters we have in body
    * Find your Merchant Key in your Paytm Dashboard at https://dashboard.paytm.com/next/apikeys 
    */
    const checksum = await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), PAYTM_MERCHANT_KEY);
    
    paytmParams.head = {
        "signature"    : checksum,
        "channelId"    : "WEB" // Or WAP for mobile browsers
    };

    const post_data = JSON.stringify(paytmParams);

    const options = {
        hostname: PAYTM_ENVIRONMENT,
        port: 443,
        path: `/theia/api/v1/initiateTransaction?mid=${PAYTM_MID}&orderId=${orderId}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length
        }
    };

    let response = "";
    const post_req = https.request(options, function(post_res) {
        post_res.on('data', function (chunk) {
            response += chunk;
        });

        post_res.on('end', async function(){
            const parsedResponse = JSON.parse(response);
            
            if (parsedResponse.body.resultInfo.resultStatus === 'S') {
                const txnToken = parsedResponse.body.txnToken;
                
                // Pre-save the payment attempt in our database with 'Pending' status
                await Payment.create({
                    user: req.user._id,
                    application: req.body.applicationId || null,
                    plan: plan._id,
                    amount: amount,
                    type: paymentType,
                    orderId: orderId, // Reusing field or you can add paytmOrderId to model
                    status: 'Created'
                });

                res.status(200).json(new ApiResponse(200, {
                    txnToken,
                    orderId,
                    amount,
                    mid: PAYTM_MID
                }, "Transaction Token Generated Successfully"));
            } else {
                res.status(400).json(new ApiResponse(400, parsedResponse.body, "Failed to generate transaction token"));
            }
        });
    });

    post_req.on('error', (e) => {
        throw new ApiError(500, `Paytm Request Error: ${e.message}`);
    });

    post_req.write(post_data);
    post_req.end();
});

// @desc    Verify Paytm Transaction Status securely from S2S
// @route   POST /api/payments/paytm/verify
// @access  Private
export const verifyPaytmPayment = asyncHandler(async (req, res) => {
    const { orderId } = req.body;

    if (!orderId) {
        throw new ApiError(400, 'Order ID is required for verification');
    }

    var paytmParams = {};

    paytmParams.body = {
        "mid" : PAYTM_MID,
        "orderId" : orderId,
    };

    const checksum = await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), PAYTM_MERCHANT_KEY);
    
    paytmParams.head = {
        "signature"	: checksum
    };

    const post_data = JSON.stringify(paytmParams);

    const options = {
        hostname: PAYTM_ENVIRONMENT,
        port: 443,
        path: '/v3/order/status',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': post_data.length
        }
    };

    let response = "";
    const post_req = https.request(options, function(post_res) {
        post_res.on('data', function (chunk) {
            response += chunk;
        });

        post_res.on('end', async function(){
            const parsedResponse = JSON.parse(response);
            const resultStatus = parsedResponse.body.resultInfo.resultStatus;
            
            // Validate transaction status securely
            if (resultStatus === 'TXN_SUCCESS') {
                // Update payment record in database securely
                const payment = await handleSuccessfulPayment(orderId);

                res.status(200).json(new ApiResponse(200, { paytmResponse: parsedResponse.body, paymentId: payment?._id, status: 'Success' }, "Payment verified as successful"));
            } else if (resultStatus === 'PENDING') {
                const payment = await Payment.findOneAndUpdate(
                    { orderId: orderId },
                    { status: 'Pending' },
                    { new: true }
                );
                res.status(200).json(new ApiResponse(200, { paytmResponse: parsedResponse.body, paymentId: payment?._id, status: 'Pending' }, "Payment is pending"));
            } else {
                const payment = await Payment.findOneAndUpdate(
                    { orderId: orderId },
                    { status: 'Failed' },
                    { new: true }
                );
                res.status(400).json(new ApiResponse(400, { paytmResponse: parsedResponse.body, paymentId: payment?._id, status: 'Failed' }, "Payment verification failed"));
            }
        });
    });

    post_req.on('error', (e) => {
        throw new ApiError(500, `Paytm Verification Error: ${e.message}`);
    });

    post_req.write(post_data);
    post_req.end();
});

// @desc    Paytm S2S Webhook Callback
// @route   POST /api/payments/paytm/webhook
// @access  Public
export const paytmWebhook = asyncHandler(async (req, res) => {
    const paytmResponse = req.body;
    
    if (!paytmResponse || !paytmResponse.ORDERID) {
        return res.status(400).send("Bad Request");
    }

    const orderId = paytmResponse.ORDERID;
    const resultStatus = paytmResponse.STATUS;
    const checksum = paytmResponse.CHECKSUMHASH;

    // Remove CHECKSUMHASH from body to verify signature
    delete paytmResponse.CHECKSUMHASH;

    const isVerifySignature = PaytmChecksum.verifySignature(paytmResponse, PAYTM_MERCHANT_KEY, checksum);
    
    if (isVerifySignature) {
        if (resultStatus === 'TXN_SUCCESS') {
            await handleSuccessfulPayment(orderId);
        } else if (resultStatus === 'PENDING') {
            await Payment.findOneAndUpdate({ orderId }, { status: 'Pending' });
        } else {
            await Payment.findOneAndUpdate({ orderId }, { status: 'Failed' });
        }
        res.status(200).send("OK");
    } else {
        console.error("Paytm Webhook Signature Verification Failed");
        res.status(400).send("Checksum Mismatch");
    }
});


// @desc    Paytm Redirect Callback (Standard Form Redirect)
// @route   POST /api/payments/paytm/callback
// @access  Public
export const paytmCallback = asyncHandler(async (req, res) => {
    const paytmResponse = req.body;
    const frontendUrl = 'http://localhost:5173';
    
    if (!paytmResponse || !paytmResponse.ORDERID) {
        return res.redirect(`${frontendUrl}/dashboard/programs`);
    }

    const orderId = paytmResponse.ORDERID;
    const resultStatus = paytmResponse.STATUS;
    const checksum = paytmResponse.CHECKSUMHASH;

    delete paytmResponse.CHECKSUMHASH;

    const isVerifySignature = PaytmChecksum.verifySignature(paytmResponse, PAYTM_MERCHANT_KEY, checksum);
    
    if (isVerifySignature) {
        let updatedPayment = null;
        if (resultStatus === 'TXN_SUCCESS') {
            updatedPayment = await handleSuccessfulPayment(orderId);
            if (updatedPayment) {
                return res.redirect(`${frontendUrl}/dashboard/receipt/${updatedPayment._id}`);
            }
        } else if (resultStatus === 'PENDING') {
            await Payment.findOneAndUpdate({ orderId }, { status: 'Pending' });
        } else {
            await Payment.findOneAndUpdate({ orderId }, { status: 'Failed' });
        }
        return res.redirect(`${frontendUrl}/dashboard/payments`);
    } else {
        return res.redirect(`${frontendUrl}/dashboard/programs?error=checksum_mismatch`);
    }
});
