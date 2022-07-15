const express = require('express');
const app = express();
const cors = require('cors');
const port = process.env.PORT || 4995;
const twilio = require('twilio');
const { MongoClient, ServerApiVersion } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const { response } = require('express');
require('dotenv').config();

app.use(cors());
app.use(express.json());



//setup mondo db connection 
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverApi: ServerApiVersion.v1,
});


async function run() {
    try {

        //connect to mongo db
        await client.connect();
        console.log('Connected to MongoDB');

        /************************************************************
                        Mongo DB Database Stucture Start
        ********************************************************* */

        const dbName = 'smsApiDatabase';
        const database = client.db(dbName); // create database
        const twilioApiCollection = database.collection('smsApi');
        const userCollection = database.collection('users');
        const subscriptionCollection = database.collection('subscription');
        const campaignCollection = database.collection('campaign');
        const smsLogCollection = database.collection('smsLog');
        const messageTemplateCollection = database.collection('messageTemplate');

        /************************************************************
                            Mongo DB Database End
        ********************************************************* */

        /************************************************************
                ////////////// Twilio API START ////////////////
        ********************************************************* */


        //function to get twilio api from twilioApiCollection in mongo db
        const getTwilioApi = async () => {
            const twilioApi = await twilioApiCollection.findOne({});
            return twilioApi;
        };

        //fuction to initialize twilio api with twilioApiCollection in mongo db and set it to global variable twilioApi to use it in other functions.
        const initTwilioApi = async () => {
            const twilioApi = await getTwilioApi();
            if (twilioApi) {
                return twilioApi;
            } else {
                const twilioApi = {
                    accountSID: process.env.TWILIO_ACCOUNT_SID,
                    authToken: process.env.TWILIO_AUTH_TOKEN,
                    twilioNumbers: [process.env.TWILIO_NUMBER],
                };
                // insert twilio api to mongo db from env variables 
                await twilioApiCollection.insertOne(twilioApi);
                return twilioApi;
            }
        };

        //run initTwilioApi function to initialize twilio api
        const twilioApi = await initTwilioApi();
        console.log('Twilio api initialized');
        console.log(twilioApi);

        // twilio api credentials
        const accountSID = twilioApi.accountSID;
        const authToken = twilioApi.authToken;
        const twilioNumbers = twilioApi.twilioNumbers;

        // create twilio client
        const twilioClient = new twilio(accountSID, authToken);
        console.log('Twilio client initialized');

        /* ************************************************************
            Initializing Database Collections and Inserting Data Start 
        ************************************************************** */

        /////////////// user ////////////////
        const user = await userCollection.findOne({}); // get user
        if (user) {
            console.log('User initialized');
            console.log(user);
        }
        else {
            const user = {
                userName: 'admin',
                displayName: 'Sohan',
                subscription: 'free',
                password: 'admin',
                email: 'admin@gmail.com',
                mobileNumber: '+917001234567',
                address: 'Kathmandu, Nepal',
                city: 'Kathmandu',
                country: 'Nepal',
                zipCode: '44600',
                userType: 'admin',
                userStatus: 'active',
                userCreated: new Date(),
                userUpdated: new Date(),
                twilioNumber: twilioNumbers[0],
                contactLists: [
                    {
                        contactListName: 'contactListName', //replace with  listname
                        contactListDiscription: 'contactListDiscription', //replace with list discription
                        contactListContacts: [
                            {
                                contactName: 'contactName',
                                contactNumber: '+917001234567',
                            },
                        ], // replace with array
                    },
                ],
                campaigns: [
                    {
                        campaignId: 'campaignId',
                        campaignName: 'campaignName',
                    },
                ],
                messageTemplates: [
                    {
                        messageTemplateId: 'messageTemplateId', //replace _id with messageTemplateId
                        messageTemplateName: 'messageTemplateName', //replace titel with messageTemplateName
                        messageTemplateContent: 'messageTemplateContent', //replace message with messageTemplateContent
                    },
                ],
                smsLogs: [
                    // {
                    //     smsId: 'smsId',
                    //     smsLogName: 'smsLogName',
                    // },
                ],
            };
            await userCollection.insertOne(user); // insert user to mongo db
            console.log('User initialized');
            console.log(user);
        }

        /////////////// subscription ////////////////
        const subscription = await subscriptionCollection.findOne({}); // get subscription
        if (subscription) {
            console.log('Subscription initialized');
            console.log(subscription);
        }
        else {
            const subscription = {
                subscriptionId: 'subscriptionId',
                subscriptionName: 'subscriptionName',
                subscriptionStatus: 'active',
                subscriptionCreated: new Date(),
                subscriptionUpdated: new Date(),
            };
            await subscriptionCollection.insertOne(subscription); // insert subscription to mongo db
            console.log('Subscription initialized');
            console.log(subscription);
        }

        /////////////// campaign ////////////////
        const campaign = await campaignCollection.findOne({}); // get campaign
        if (campaign) {
            console.log('Campaign initialized');
            console.log(campaign);
        }
        else {
            const campaign = {
                campaignId: 'campaignId',
                campaignName: 'campaignName',
                campaignStatus: 'active',
                campaignCreated: new Date(),
                campaignUpdated: new Date(),
            };
            await campaignCollection.insertOne(campaign); // insert campaign to mongo db
            console.log('Campaign initialized');
            console.log(campaign);
        }

        /////////////// message template ////////////////
        const messageTemplate = await messageTemplateCollection.findOne({}); // get message template
        if (messageTemplate) {
            console.log('Message template initialized');
            console.log(messageTemplate);
        }
        else {
            const messageTemplate = {
                messageTemplateId: 'messageTemplateId',
                messageTemplateName: 'messageTemplateName',
                messageTemplateStatus: 'active',
                messageTemplateCreated: new Date(),
                messageTemplateUpdated: new Date(),
                messageTemplateContent: 'messageTemplateContent',
            };
            await messageTemplateCollection.insertOne(messageTemplate); // insert message template to mongo db
            console.log('Message template initialized');
            console.log(messageTemplate);
        }

        /////////////// sms log ////////////////
        const smsLog = await smsLogCollection.findOne({}); // get sms log
        if (smsLog) {
            console.log('Sms log initialized');
            console.log(smsLog);
        }
        else {
            const smsLog = {
                smsId: 'twilioMessage.sid',
                smsStatus: 'active',
                smsMessage: 'twilioMessage.body',
                smsFrom: twilioApiCollection.twilioNumbers[0],
                smsTo: userCollection.findOne().mobileNumber,
                smsLogCreated: new Date(),
                smsLogUpdated: new Date(),
                userName: userCollection.findOne({}).userName,
            };
            await smsLogCollection.insertOne(smsLog); // insert sms log to mongo db
            console.log('Sms log initialized');
            console.log(smsLog);
        }


        /* ************************************************************
            Initializing Database Collections and Inserting Data End 
        ************************************************************** */

        /* *****************************************
                     USERS SECTION START
        ******************************************* */

        /////////////// Common functions for User ////////////////

        // get user by user name
        const getUser = async (userName) => {
            const user = await userCollection.findOne({ userName: userName });
            return user;
        };

        // get all users from mongo db
        const getAllUsers = async () => {
            const users = await userCollection.find({}).toArray();
            return users;
        };

        // create user with unique userName
        const createUser = async (user) => {
            const userName = user.userName;
            // check if userName already exists in mongo db
            const userNameExists = await getUser(userName);
            // check if email already exists in mongo db
            const emailExists = await userCollection.findOne({ email: user.email });
            // check if mobileNumber already exists in mongo db
            const phoneNumberExists = await userCollection.findOne({ mobileNumber: user.mobileNumber });

            if (userNameExists) {
                return {
                    status: 'error',
                    message: 'User already exists',
                };
            } else if (emailExists) {
                return {
                    status: 'error',
                    message: 'Email already exists',
                };
            } else if (phoneNumberExists) {
                return {
                    status: 'error',
                    message: 'Phone number already exists',
                };
            }
            else {
                await userCollection.insertOne(user);
                return {
                    status: 'success',
                    message: 'User created',
                };
            }
        };

        // update user by user name
        const updateUser = async (user) => {
            const userName = user.userName;

            //check if user exists in mongo db by user name and update user if exists
            const userExists = await getUser(userName);
            if (userExists) {
                await userCollection.updateOne({ userName: userName }, { $set: user });
                return {
                    status: 'success',
                    message: 'User updated',
                };
            }
            else {
                return {
                    status: 'error',
                    message: 'User does not exist',
                };
            }
        };

        // delete user by user name
        const deleteUser = async (userName) => {
            const userExists = await getUser(userName);
            if (userExists) {
                await userCollection.deleteOne({ userName: userName });
                return {
                    status: 'success',
                    message: 'User deleted',
                };
            }
            else {
                return {
                    status: 'error',
                    message: 'User does not exist',
                };
            }
        };

        // get user by email address
        const getUserByEmail = async (email) => {
            const user = await userCollection.findOne({ email: email });
            return user;
        };
        // get user by mobileNumber
        const getUserByMobileNumber = async (mobileNumber) => {
            const user = await userCollection.findOne({ mobileNumber: mobileNumber });
            return user;
        };

        // get user by role 
        const getUserByRole = async (userType) => {
            const user = await userCollection.findOne({ userType: userType });
            return user;
        };

        //update user role by user name
        const updateUserRole = async (userName, userType) => {
            const user = await getUser(userName);
            if (user) {
                await userCollection.updateOne({ userName: userName }, { $set: { userType: userType } });
                return {
                    status: 'success',
                    message: 'User role updated',
                };
            }
            else {
                return {
                    status: 'error',
                    message: 'User does not exist',
                };
            }
        };

        //update user subscription by user name
        const updateUserSubscription = async (userName, subscriptionId) => {
            const user = await getUser(userName);
            if (user) {
                await userCollection.updateOne({ userName: userName }, { $set: { subscription: subscriptionId } });
                return {
                    status: 'success',
                    message: 'User subscription updated',
                };
            }
            else {
                return {
                    status: 'error',
                    message: 'User does not exist',
                };
            }
        };


        //add data to message templates array of user by user name
        const addMessageTemplateToUser = async (userName, messageTemplate) => {
            const user = await getUser(userName);
            if (user) {
                user.messageTemplates.push(messageTemplate);
                await updateUser(user);
                return {
                    status: 'success',
                    message: 'Message template added to user',
                };
            }
            else {
                return {
                    status: 'error',
                    message: 'User does not exist',
                };
            }
        };

        //remove data from message templates array of user by user name (BETA)
        const removeMessageTemplateFromUser = async (userName, messageTemplate) => {
            const user = await getUser(userName);
            if (user) {
                user.messageTemplates.splice(user.messageTemplates.indexOf(messageTemplate), 1);
                await updateUser(user);
                return {
                    status: 'success',
                    message: 'Message template removed from user',
                };
            }
            else {
                return {
                    status: 'error',
                    message: 'User does not exist',
                };
            }
        };

        //add data to contact lists array of user by user name (BETA)
        const addContactListToUser = async (userName, contactList) => {
            const user = await getUser(userName);
            if (user) {
                user.contactLists.push(contactList);
                await updateUser(user);
                return {
                    status: 'success',
                    message: 'Contact list added to user',
                };
            }
            else {
                return {
                    status: 'error',
                    message: 'User does not exist',
                };
            }
        };

        //remove data from contact lists array of user by user name (BETA)
        const removeContactListFromUser = async (userName, contactList) => {
            const user = await getUser(userName);
            if (user) {
                user.contactLists.splice(user.contactLists.indexOf(contactList), 1);
                await updateUser(user);
                return {
                    status: 'success',
                    message: 'Contact list removed from user',
                };
            }
            else {
                return {
                    status: 'error',
                    message: 'User does not exist',
                };
            }
        };


        //curd operations for user 
        const userCurd = {
            getUser: getUser, // get user by user name 
            getAllUsers: getAllUsers, // get all users from mongo db and return as array
            createUser: createUser, // create user with unique userName 
            updateUser: updateUser, // update user by user name 
            deleteUser: deleteUser, // delete user by user name 
            getUserByEmail: getUserByEmail, // get user by email address 
            getUserByMobileNumber: getUserByMobileNumber, // get user by mobileNumber 
            getUserByRole: getUserByRole, // get user by role 
            updateUserRole: updateUserRole, //update user role by user name
            updateUserSubscription: updateUserSubscription, //update user subscription by user name
            addMessageTemplateToUser: addMessageTemplateToUser, //add data to message templates array of user by user name (BETA)
            removeMessageTemplateFromUser: removeMessageTemplateFromUser, //remove data from message templates array of user by user name (BETA)
            addContactListToUser: addContactListToUser, //add data to contact lists array of user by user name (BETA)
            removeContactListFromUser: removeContactListFromUser, //remove data from contact lists array of user by user name (BETA)
        };

        //post user using userCurd
        app.post('/api/user', async (req, res) => {
            const user = req.body;
            //create user with unique userName and get user as response
            const result = await userCurd.createUser(user);
            res.send(result);
        }
        );

        //get user using userCurd
        app.get('/api/user', async (req, res) => {
            // get all users from mongo db as array
            const result = await userCurd.getAllUsers();
            res.send(result);
        }
        );

        //get user by userName using userCurd
        app.get('/api/user/:userName', async (req, res) => {
            const userName = req.params.userName;
            const result = await userCurd.getUser(userName);
            res.send(result);
        }
        );

        //update user using userCurd
        app.put('/api/user/:userName', async (req, res) => {
            const user = req.body;
            const userName = req.params.userName;
            const result = await userCurd.updateUser(user);
            res.send(result);
        }
        );

        //delete user using userCurd
        app.delete('/api/user/:userName', async (req, res) => {
            const userName = req.params.userName;
            const result = await userCurd.deleteUser(userName);
            res.send(result);
        }
        );

        //get user by email using userCurd
        app.get('/api/user/email/:email', async (req, res) => {
            const email = req.params.email;
            const result = await userCurd.getUserByEmail(email);
            res.send(result);
        }
        );

        //get user by mobileNumber using userCurd
        app.get('/api/user/mobileNumber/:mobileNumber', async (req, res) => {
            const mobileNumber = req.params.mobileNumber;
            const result = await userCurd.getUserByMobileNumber(mobileNumber);
            res.send(result);
        }
        );

        //get user by role using userCurd
        app.get('/api/user/role/:userType', async (req, res) => {
            const userType = req.params.userType;
            const result = await userCurd.getUserByRole(userType);
            res.send(result);
        }
        );

        //update user role using userCurd
        app.put('/api/user/role/:userName', async (req, res) => {
            const userName = req.params.userName;
            const userType = req.body.userType;
            const result = await userCurd.updateUserRole(userName, userType);
            res.send(result);
        }
        );

        /* *****************************************
                     USERS SECTION END
        ******************************************* */


        /* *****************************************
                      SMS SECTION START
        ******************************************* */

        /////////////// Common functions for SMS ////////////////

        // get sms
        const getSms = async (smsId) => {
            const sms = await smsLogCollection.findOne({ smsId: smsId });
            return sms;
        };

        // get all sms
        const getAllSms = async () => {
            const sms = await smsLogCollection.find({}).toArray();
            return sms;
        };

        // create sms
        const createSms = async (sms) => {
            await smsLogCollection.insertOne(sms);

            //also create smsId and smsLogName in user collection smslog array

            const user = await getUser(sms.userName);
            const smsId = sms.smsId;
            const smsLogName = sms.smsName;
            const smsLogArray = user.smsLog;
            smsLogArray.push({ smsId: smsId, smsLogName: smsLogName });

            await userCollection.updateOne({ userName: user.userName }, { $set: { smsLog: smsLogArray } });
            return {
                status: 'success',
                message: 'SMS created',
            };

        };

        // update sms
        const updateSms = async (sms) => {
            const smsId = sms.smsId;
            const smsExists = await getSms(smsId);
            if (smsExists) {
                await smsLogCollection.updateOne({ smsId: smsId }, { $set: sms });
                return {
                    status: 'success',
                    message: 'SMS updated',
                };
            }
            else {
                return {
                    status: 'error',
                    message: 'SMS does not exist',
                };
            }
        };

        // delete sms log older than 3 months
        const deleteSms = async () => {
            const sms = await smsLogCollection.find({}).toArray();
            for (let i = 0; i < sms.length; i++) {
                const smsDate = sms[i].smsDate;
                const smsDateTime = new Date(smsDate);
                const currentDateTime = new Date();
                const diffTime = Math.abs(currentDateTime - smsDateTime);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 90) {
                    await smsLogCollection.deleteOne({ smsId: sms[i].smsId });

                    //also delete from users collection smslog
                    const user = await userCollection.findOne({ userName: sms[i].userName });
                    const userSmsLog = user.smsLog;
                    const index = userSmsLog.indexOf(sms[i].smsId);
                    if (index > -1) {
                        userSmsLog.splice(index, 1);
                        await userCollection.updateOne({ userName: sms[i].userName }, { $set: { smsLog: userSmsLog } });
                    }

                    // also delete from twilio api and use (BETA)
                    // twilioClient.deleteSms(sms[i].smsId);

                }
            }
        };

        // get sms by userName
        const getSmsByUserName = async (userName) => {
            const sms = await smsLogCollection.find({ userName: userName }).toArray();
            return sms;
        };

        //count sms by userName and set sms count in user
        const countSmsByUserName = async (userName) => { //userName is userId
            const sms = await smsLogCollection.find({ userName: userName }).toArray();
            const user = await getUser(userName);
            user.smsCount = sms.length;
            await updateUser(user);
        };

        // get sms by smsId
        const getSmsBySmsId = async (smsId) => {
            const sms = await smsLogCollection.findOne({ smsId: smsId });
            return sms;
        };

        // get sms by current date
        const getSmsByCurrentDate = async (date) => {
            const sms = await smsLogCollection.find({ smsDate: date }).toArray();
            return sms;
        };

        // get sms by current date and userName
        const getSmsByCurrentDateAndUserName = async (date, userName) => {
            const sms = await smsLogCollection.find({ smsDate: date, userName: userName }).toArray();
            return sms;
        };

        // get all sms logs from twillio api
        const getAllSmsLogs = async () => {
            //use twilio api to get all sms logs
            const smsLogs = await twilioClient.messages.list();
            return smsLogs;
        };

        // send sms using twilio api
        const sendSms = async (sms) => {
            const twilioMessage = await twilioClient.messages.create({
                body: sms.message,
                from: sms.twilioNumber,
                to: sms.phoneNumber
            });
            console.log(twilioMessage);
            // create sms log using smsCurd
            const smsLog = await createSms({
                smsId: twilioMessage.sid,
                userName: sms.userName,
                smsStatus: twilioMessage.status,
                smsMessage: twilioMessage.body,
                smsFrom: twilioMessage.from,
                smsTo: twilioMessage.to,
                smsId: 'smsId',
                smsLogCreated: new Date(),
                smsLogUpdated: new Date(),
            });
            console.log(smsLog);
            return twilioMessage;
        };

        // sendMultipleSms using twilio api
        const sendMultipleSms = async (sms) => {
            // crate an array and store twilio messages
            const twilioMessages = [];
            //use loop to send sms to each receiver
            for (let i = 0; i < sms.receiver.length; i++) {
                const twilioMessage = await smsCurd.sendSms({
                    phoneNumber: sms.phoneNumber[i],
                    twilioNumber: sms.twilioNumber,
                    message: sms.message,
                    userName: sms.userName,
                });

                twilioMessages.push(twilioMessage); // push twilio message to array
            }
            return twilioMessages;
        };

        //curd operations for sms
        const smsCurd = {
            getSms: getSms, //get sms by smsId
            getAllSms: getAllSms, //get all sms logs
            createSms: createSms, //create sms and add to user smslog
            updateSms: updateSms, //update sms by smsId
            deleteSms: deleteSms, //delete sms older than 3 months and from users collection smslog array
            getSmsByUserName: getSmsByUserName, //get sms by userName and set sms count in user collection smslog array (userName is userId) and return sms array (userName is userId)
            countSmsByUserName: countSmsByUserName, //count sms by userName and set sms count in user collection smslog array (userName is userId)
            getSmsBySmsId: getSmsBySmsId, //get sms by smsId and return sms object
            getSmsByCurrentDate: getSmsByCurrentDate, //get sms by current date and return sms array
            getSmsByCurrentDateAndUserName: getSmsByCurrentDateAndUserName, //get sms by current date and userName and return sms array
            getAllSmsLogs: getAllSmsLogs, //get all sms logs from twillio api
            sendSms: sendSms, //send sms using twilio api
            sendMultipleSms: sendMultipleSms, //sendMultipleSms using twilio api
        };

        // get sms by userName using smsCurd
        app.get('/api/sms/userName/:userName', async (req, res) => {
            const userName = req.params.userName;
            const result = await smsCurd.getSmsByUserName(userName);
            res.send(result);
        }
        );

        // get sms by smsId using smsCurd
        app.get('/api/sms/smsId/:smsId', async (req, res) => {
            const smsId = req.params.smsId;
            const result = await smsCurd.getSmsBySmsId(smsId);
            res.send(result);
        }
        );

        // get sms by current date using smsCurd
        app.get('/api/sms/date/:date', async (req, res) => {
            const date = req.params.date;
            const result = await smsCurd.getSmsByCurrentDate(date);
            res.send(result);
        }
        );

        // get sms by current date and userName using smsCurd
        app.get('/api/sms/date/:date/userName/:userName', async (req, res) => {
            const date = req.params.date;
            const userName = req.params.userName;
            const result = await smsCurd.getSmsByCurrentDateAndUserName(date, userName);
            res.send(result);
        }
        );

        // get all sms using smsCurd
        app.get('/api/sms/all', async (req, res) => {
            const result = await smsCurd.getAllSms();
            res.send(result);
        }
        );

        ////////////// twilio sms sending fuctions /////////////////

        // send a single sms
        app.post('/sms/single', async (req, res) => {
            const { body } = req;
            const twilioMessage = await smsCurd.sendSms({
                phoneNumber: body.receiver,
                twilioNumber: body.sender,
                message: body.message,
                userName: body.userName,
            });
            res.send(twilioMessage);
        }
        );

        // send sms to array of receivers and save sms log using smsCurd
        app.post('/sms/multiple', async (req, res) => {
            const { body } = req; // get body
            const twilioMessages = await smsCurd.sendMultipleSms({
                phoneNumber: body.receiver,
                twilioNumber: body.sender,
                message: body.message,
                userName: body.userName,
            });

            res.send(twilioMessages);
        }
        );


        //get request for twilio api
        app.get('/twilio/api', async (req, res) => {
            const twilioApi = await getTwilioApi();
            res.send(twilioApi);
        }
        );

        // Get all SMS logs from twilio api sms curd operations
        app.get('/api/sms/logs', async (req, res) => {
            const smsLogs = await smsCurd.getAllSmsLogs();
            res.send(smsLogs);
        }
        );

        /* *****************************************
                        SMS SECTION END
        ******************************************* */

    }
    finally {
        await client.close(); // close mongo db connection when app is closed and stop listening to port and wait for next request 
    }
}
run().catch(console.error); // run app and catch error if any and print it to console and stop app if error occurs and wait for next request 


// test app
app.get('/', (req, res) => {
    res.send('Hello World! SMS Sender Application Server');
}
);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}
);