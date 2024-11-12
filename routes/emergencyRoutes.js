const express = require("express");
const router = express.Router();
router.get("/emergencyform",(req,res)=>{
    res.render('emergencyform')
})
const Accident = require('../models/accidentSchema');

router.get("/emergencyform",(req,res)=>{
    res.render("emergencyform");
})
// Route to handle form submission after payment
router.post('/emergencyform', async (req, res) => {
    try {
        const { paymentAmount, cardNumber, ...formDetails } = req.body;

        // Simulate successful payment (You can add real payment logic here)
        const newAccident = new Accident({
            ...formDetails,
            paymentAmount: paymentAmount,
            cardNumber: cardNumber,
            paymentStatus: 'Completed',
            bedBooked: true, // Set bed booking status
        });

        await newAccident.save();
        res.render('/bedbooked');
    } catch (err) {
        console.log(err);
        res.status(500).send("Error in processing your form.");
    }
});

module.exports=router