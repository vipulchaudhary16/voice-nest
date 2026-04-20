const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');
const { protect } = require('../middleware/authMiddleware');

router.get('/exotel/press/:keypad_no', callController.exotelWebhook); // Exotel Webhook mapping (no JWT)

// getCalls needs auth; do not use router.use(protect) here — same router is mounted at "/" for Exotel
router.get('/', protect, callController.getCalls);

module.exports = router;

/*
Here is what happened:
Call attempt from 09737565473 The number 09513886363 received a call from Vipul Chaudhary(09737565473) at Tue, 14 Apr 2026 22:41:29 At the menu, the user selected 1. An HTTP Call was made on the url: https://09c7-2409-40c1-1019-74a9-c5a8-6a88-646-8506.ngrok-free.app/exotel/press/1?CallSid=2e5cdaccfa89fd025de4ac76a63e1a4e&CallFrom=09737565473&CallTo=08047113155&Direction=outbound-dial&Created=Tue%2C+14+Apr+2026+22%3A41%3A29&DialCallDuration=0&StartTime=2026-04-14+22%3A41%3A29&EndTime=1970-01-01+05%3A30%3A00&CallType=call-attempt&DialWhomNumber=&flow_id=1215501&tenant_id=424020&From=09737565473&To=09513886363&CurrentTime=2026-04-14+22%3A42%3A03&digits=%221%22
*/
