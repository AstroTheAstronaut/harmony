const express = require('express');
const router = express.Router();

router.use(express.urlencoded({ extended: true }));

let setupData = {
    currentStep: 1,
    language: "en",
    dbInfo: null,
    users: null,
    songs: null,
};

// GET request for login page
router.get('/', (req, res) => {
    res.render('setup', {currentStep: setupData.currentStep, language: setupData.language});
});

router.post('/', (res, req) => {
    const {step} = req.body;

    if(step == 1) {
        setupData.language = req.body.language;
        setupData.currentStep = 2;
    } else if (step == 2) {
        setupData.dbInfo = {
            dbname: req.body.dbname,
            username: req.body.username,
            password: req.body.password,
            host: req.body.host,
            port: req.body.port,
            table_prefix: req.body.table_prefix,
        };
        setupData.currentStep = 3;
    } else if (step == 3) {
        setupData.users = {
            username: req.body.username,
            password: req.body.password,
            email: req.body.email,
            role: "admin",
        };
        setupData.currentStep = 4;
    } else if (step == 4) {
        setupData.songs = null;
        setupData.currentStep = 5;
    }

    res.render('setup', {currentStep: setupData.currentStep, language: setupData.language});
});

module.exports = router;
