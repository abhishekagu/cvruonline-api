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
    const { amount, programId, semester } = req.body;

    if (!amount || !programId || !semester) {
        throw new ApiError(400, 'Amount, programId, and semester are required');
    }

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
                    application: null, // Depending on if an application exists yet
                    amount: amount,
                    type: `Tuition Fee - Sem ${semester}`,
                    razorpayOrderId: orderId, // Reusing field or you can add paytmOrderId to model
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
            
            // Validate transaction status securely
            if (parsedResponse.body.resultInfo.resultStatus === 'TXN_SUCCESS') {
                // Update payment record in database securely
                await Payment.findOneAndUpdate(
                    { razorpayOrderId: orderId }, // Assume orderId is saved here for now
                    { status: 'Success' }
                );

                res.status(200).json(new ApiResponse(200, parsedResponse.body, "Payment verified as successful"));
            } else {
                await Payment.findOneAndUpdate(
                    { razorpayOrderId: orderId },
                    { status: 'Failed' }
                );
                res.status(400).json(new ApiResponse(400, parsedResponse.body, "Payment verification failed or pending"));
            }
        });
    });

    post_req.on('error', (e) => {
        throw new ApiError(500, `Paytm Verification Error: ${e.message}`);
    });

    post_req.write(post_data);
    post_req.end();
});
