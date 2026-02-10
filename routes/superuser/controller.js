const {getRegistrationCodes, getCode, createRegistrationCode, markCodeAsExpired, getUsers, updateUserStatus, deleteUsers, deleteRegistrationCode, disableCode} = require('./services');

function formatCustomDate(str) {
  if (!/^\d{12}$/.test(str)) return new Date(NaN);

  const year = str.slice(0, 4);
  const month = str.slice(4, 6);
  const day = str.slice(6, 8);
  const hour = str.slice(8, 10);
  const minute = str.slice(10, 12);

  return new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`);
}

const validCharacters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

async function renderSuperUserPage (req, res) {
    try {
        await deleteUsers();
        let activeAccounts = [];
        let inactiveAccounts = [];
        const users = await getUsers();
        for (const user of users) {
            if (user.status.toLowerCase() === 'active') activeAccounts.push (user);
            else if (user.status.toLowerCase() === 'inactive' || user.status.toLowerCase() === 'banned' || user.status.toLowerCase() === 'suspended' || user.status.toLowerCase() === 'deleted') inactiveAccounts.push(user);
        }

        const registrationCodes = await getRegistrationCodes();
        const now = new Date();
        const expiredCodes = [];
        const activeCodes = [];

        const purgeThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        const codesToPurge = registrationCodes.filter(code => (code.isExpired || code.isUsed) && new Date(code.createdAt) < purgeThreshold);
        
        // Delete the mongodb documents that fit this criteria
        if (codesToPurge.length > 0) {
            for (const code of codesToPurge) {
                await deleteRegistrationCode(code.code);
            }
        }

        for (const code of registrationCodes) {
        // Auto-mark as expired in DB if needed
            if (!code.isExpired && !code.isUsed && code.expiryDate < now) {
                await markCodeAsExpired(code.code);
                code.isExpired = true;
            }

            // Separate active and expired codes
            if (!code.isUsed && !code.isExpired && !code.isDisabled && code.expiryDate > now) {
                activeCodes.push(code);
            } else {
                expiredCodes.push(code);
            }
        }

        res.render('superuser', {
            query: req.query,
            activePage: 'superuser',
            session: req.session,
            activeCodes,
            expiredCodes,
            activeAccounts,
            inactiveAccounts
        });
    } catch (err) {
    console.error('Error loading registration codes:', err);
    res.status(500).send('Internal Server Error');
    }
}

async function handleCreateRegistrationCode(req, res) {
    try {
        const codes = JSON.parse(req.body.registrationCodes);
        console.log('Received registration codes:', codes);

        const prepared = codes.map(c => ({
            code: c.code,
            email: c.email || null,
            role: c.role,
            expiryDate: formatCustomDate(c.expiration_date)
        }));

        for (const c of prepared) {
            await createRegistrationCode(c.code, c.expiryDate, c.email, c.role);
        }
        res.redirect('/superuser');
    } catch (error) {
        console.error('Error creating registration codes:', error);
        res.status(500).send('Internal Server Error');
    }
}

async function handleUserAction (req, res) {
    try {
        const { action } = req.params;
        action.toLowerCase();

        const { userId, reason, durationDays } = req.body;

        if (!userId) {
            return res.status(400).send('User ID is required');
        }

        // Validate durationDays if action requires it
        if ((action === 'suspend' || action === 'ban') && (!durationDays || isNaN(durationDays))) {
            return res.status(400).send('Valid punishment duration is required');
        }

        if (action==='unsuspend' || action==='unban' || action==='undelete') {
            if (action === 'undelete') {
                await updateUserStatus(userId, 'active', null, null);
            } else {
                await updateUserStatus(userId, 'active', null, null);
            }
        }

        await updateUserStatus(userId, action, reason, durationDays ? Number(durationDays) : null);

        res.status(200).send('Success');
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

async function handleDisableCode (req, res) {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).send('Code is required');
        }

        // Find the registration code in the database
        const registrationCode = await getCode(code);
        
        if (!registrationCode) {
            return res.status(404).send('Registration code not found');
        }

        // Disable the registration code
        registrationCode.isDisabled = true;
        await registrationCode.save();

        res.status(200).send('Registration code disabled successfully');
    } catch (err) {
        console.error('Error disabling registration code:', err);
        res.status(500).send('Internal Server Error');
    }
}

// async function purgeOldCodes(req, res) {
//     try {
//         // Purge expired and used registration codes older than 7 days
//         const purgeThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
//         const codes = await getRegistrationCodes();
//         const codesToPurge = codes.filter(code => (code.isExpired || code.isUsed) && new Date(code.createdAt) < purgeThreshold);
//         if (codesToPurge.length === 0) {
//             // Do nothing
//             return res.status(204).send('No old registration codes to purge');
//         }
//         // Delete the mongodb documnets that fit this
//         for (const code of codesToPurge) {
//             await deleteRegistrationCode(code.code);
//         }
//         res.status(200).send('Old registration codes purged successfully');
//     } catch (err) {
//         console.error('Error purging old registration codes:', err);
//         res.status(500).send('Internal Server Error');
//     }
// }

module.exports = {
    renderSuperUserPage,
    handleCreateRegistrationCode,
    handleUserAction,
    handleDisableCode
}