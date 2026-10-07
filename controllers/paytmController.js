import https from 'https';
import PaytmChecksum from 'paytmchecksum';
import Payment from '../models/Payment.js';
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

// @desc    Initiate a Paytm Transaction to get txnToken
// @route   POST /api/payments/paytm/initiate
// @access  Private
export const initiatePaytmPayment = asyncHandler(async (req, res) => {
    const { amount, programId, semester, type } = req.body;

    if (!amount) {
        throw new ApiError(400, 'Amount is required');
    }
    
    let paymentType = type || `Tuition Fee - Sem ${semester || 1}`;

    const orderId = `ORD_${Date.now()}_${req.user._id.toString().substring(0, 6)}`;
    const custId = req.user._id.toString();

    var paytmParams = {};

    paytmParams.body = {
        "requestType"   : "Payment",
        "mid"           : PAYTM_MID,
        "websiteName"   : PAYTM_WEBSITE,
        "orderId"       : orderId,
        "callbackUrl"   : `http://localhost:5173/dashboard/programs`, // Using frontend URL for JS Checkout fallback
        "txnAmount"     : {
            "value"     : amount.toString(),
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
                const payment = await Payment.findOneAndUpdate(
                    { orderId: orderId }, // Assume orderId is saved here for now
                    { status: 'Success' },
                    { new: true }
                );

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
            await Payment.findOneAndUpdate({ orderId }, { status: 'Success' });
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
