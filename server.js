const express = require("express");
const app = express();
const jwt = require('jsonwebtoken');
const cors = require("cors");
const port = process.env.PORT || 4000;
const twilio = require("twilio");
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const { response } = require("express");
require("dotenv").config();

app.use(cors());
app.use(express.json());
//use uuidv4 to generate unique id
const { v4: uuidv4 } = require('uuid');

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});

//date
const today = new Date();
const date =
	today.getFullYear() + "-0" + (today.getMonth() + 1) + "-0" + today.getDate();
//time
const time =
	today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
const dateTime = date + " " + time;
// console.log(dateTime);

//date and time to number
const dateToNumber = new Date(dateTime);
const dateNumber = dateToNumber.getTime();
// console.log(dateNumber);



// JWT token verification function
function verifyJWT(req, res, next) {
	const authHeader = req.headers.authorization;
	// console.log(authHeader);
	if (!authHeader) {
		return res.status(401).send({ message: 'UnAuthorized access' });
	}
	const token = authHeader.split(' ')[1];
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
		if (err) {
			return res.status(403).send({ message: 'Forbidden access' });
		}
		req.decoded = decoded;
		next();
	});
}

// MongoDB database
async function run() {
	try {
		await client.connect();
		const database = client.db("smsApiDatabase");
		const smsApiDataCollection = database.collection("smsApi");
		const mobileNumberDataCollection = database.collection("mobileNumberData");
		const csvFileDataCollection = database.collection("csvFileData");
		const contactsCollection = database.collection("uploadExcelFile");
		const campaignCollection = database.collection("campaignListData");
		const usersDataCollections = database.collection("users");
		const subscriptionListCollection = database.collection("subscriptionList");
		const adminDataCollection = database.collection("adminList");
		const MessageTemplates = database.collection("templates");
		const userCollection = database.collection("users");


		// setting JWT
		app.put('/user/jwt/:email', async (req, res) => {
			const email = req.params.email;
			const user = req.body;
			const filter = { email: email };
			const options = { upsert: true };
			const updateDoc = {
				$set: user,
			};
			const result = await userCollection.updateOne(filter, updateDoc, options);
			const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET);
			res.send({ result, token });
		});


		/* **********************************************************
		* ********************** Start SMS API *****************
		*********************************************************** */

		//Send SMS
		app.post("/sms/send", async (req, res) => {
			try {
				const { sender, receiver, message } = req.body;
				const cursor = smsApiDataCollection.find({});
				const smsApiData = await cursor.toArray();
				const client = new twilio(
					smsApiData[0].accountSID,
					smsApiData[0].authToken
				);
				const message_id = [];
				for (number of receiver) {
					await client.messages
						.create({
							body: message,
							to: number,
							from: sender,
						})
						.then((message) => {
							// console.log(message);
							if (message.sid) {
								message_id.push(message.sid);
							}
						});
				}
				res.json({
					status: 200,
					message: "Message Sent Successfully",
					messageIds: message_id,
				});
			} catch (error) {
				// console.log(error);
				res.json({
					status: 400,
					message: "Message Sent Failed!" + " " + error.message,
					code: error.code,
				});
			}
		});


		// Get all SMS logs from twailio	
		app.get("/sms/logs", verifyJWT, async (req, res) => {
			try {
				const smsApiData = await smsApiDataCollection.find({}).toArray();
				const client = new twilio(
					smsApiData[0].accountSID,
					smsApiData[0].authToken
				);
				const messages = await client.messages.list();
				res.json({
					status: 200,
					message: "Message Sent Successfully",
					messages: messages,
				});
			} catch (error) {
				// console.log(error);
				res.json({
					status: 400,
					message: "Message Sent Failed!" + " " + error.message,
					code: error.code,
				});
			}
		});

		// get message templates
		app.get('/templates', verifyJWT, async (req, res) => {
			const templates = await MessageTemplates.find({}).toArray();
			res.send(templates);
		});

		//post  message templates
		app.post('/templates', async (req, res) => {
			const data = req.body;
			const result = await MessageTemplates.insertOne(data);
			res.json(result);
		});

		//update message templates

		app.put('/templates/:id', async (req, res) => {
			const id = req.params.id;
			const updatedMessage = req.body;
			const filter = { _id: ObjectId(id) };
			const options = { upsert: true };
			const updateDoc = {
				$set: {
					title: updatedMessage.title,
					message: updatedMessage.message
				},
			};
			const result = await MessageTemplates.updateOne(filter, updateDoc, options);
			if (result) {
				const cursor = MessageTemplates.find({});
				const template = await cursor.toArray();
				res.json({ ...result, data: template });
			}
		});

		// delete message templates

		app.delete('/templates/:id', async (req, res) => {
			const id = req.params.id;
			// console.log(id);
			const query = { _id: ObjectId(id) };
			const result = await MessageTemplates.deleteOne(query);
			res.json(result);
		});

		// get all mobile number data
		app.get("/smsApi/numbers", verifyJWT, async (req, res) => {
			const log = {
				rawHeaders: req.rawHeaders,
				method: req.method,
				url: req.url,
				statusCode: req.statusCode,
				statusMessage: req.statusMessage,
			};

			const cursor = mobileNumberDataCollection.find({});
			const mobileNumberData = await cursor.toArray();
			res.send(mobileNumberData);

		});

		// update mobile number data
		app.put("/smsApi/numbers/:id", async (req, res) => {
			const log = {
				rawHeaders: req.rawHeaders,
				method: req.method,
				url: req.url,
				statusCode: req.statusCode,
				statusMessage: req.statusMessage,
			};

			const id = req.params.id;
			const updatedNumber = req.body;
			const filter = { _id: ObjectId(id) };
			const options = { upsert: true };
			// console.log(updatedNumber);
			const updateDoc = {
				$set: {
					number: updatedNumber.number,
				},
			};
			const result = await mobileNumberDataCollection.updateOne(
				filter,
				updateDoc,
				options
			);
			if (result) {
				const cursor = mobileNumberDataCollection.find({});
				const mobileNumberData = await cursor.toArray();
				res.json({ ...result, data: mobileNumberData });
			}

		});

		// delete mobile number data
		app.delete("/smsApi/numbers/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await mobileNumberDataCollection.deleteOne(query);
			res.json(result);
		});

		// post sms api from client site
		// app.post("/smsApi", async (req, res) => {
		// 	const data = req.body;
		// 	const apiData = await smsApiDataCollection.insertOne(data);
		// 	res.json(apiData);
		// });

		// get sms api data data from database
		app.get("/smsApi", verifyJWT, async (req, res) => {
			const cursor = smsApiDataCollection.find({});
			const smsApiData = await cursor.toArray();
			res.send(smsApiData);
		});

		// put sms api data to database
		app.put("/smsApi/:id", async (req, res) => {
			const id = req.params.id;
			const updatedSmsApiData = req.body;
			delete updatedSmsApiData._id;
			const filter = { _id: ObjectId(id) };
			const options = { upsert: true };
			const updateDoc = {
				$set: {
					...updatedSmsApiData,
				},
			};
			const result = await smsApiDataCollection.updateOne(
				filter,
				updateDoc,
				options
			);
			if (result) {
				const cursor = smsApiDataCollection.find({});
				const latestSmsApiData = await cursor.toArray();
				res.json({ ...result, data: latestSmsApiData });
			}
		});

		// post mobile number data api from client site
		app.post("/smsApi/numbers", async (req, res) => {
			const data = req.body;
			const numbers = data.twilioNumbers;
			const response = [];

			for (let index = 0; index < numbers.length; index++) {
				const element = numbers[index];

				const data = {
					number: element,
				};


				const numberData = await mobileNumberDataCollection.insertOne(data);
				response.push(numberData);
			}

			res.json(response);
		});

		/* **********************************************************
		* ********************** End SMS API *****************
		*********************************************************** */

		/* ***********************************************
		* ************* START CONTACTS DATA ***************
		************************************************ */


		// Get all contacts data from database
		app.get("/contacts/", verifyJWT, async (req, res) => {
			const query = {};
			const cursor = contactsCollection.find(query);
			const uploadExcelFileData = await cursor.toArray();
			res.send(uploadExcelFileData);
		});

		// Get all mobile number data from a contacts
		app.get("/contacts/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const cursor = contactsCollection.find(query);
			const result = await cursor.toArray();
			res.send(result);
		});

		// Post contacts data from client site
		app.post("/contacts", async (req, res) => {
			const data = req.body;
			const uploadExcelFileData = await contactsCollection.insertOne(
				data
			);
			res.json(uploadExcelFileData);
		});

		// Delete contacts data from database
		app.delete("/contacts:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await contactsCollection.deleteOne(query);
			res.json(result);
		});

		/* ***********************************************
		* ************* END CONTACTS DATA ***************
		************************************************ */

		/* ***********************************************************
		* ****************** Start Campaigns Route *******************
		* *********************************************************** */

		//campaign corn jobs

		app.get("/corns/campaign", verifyJWT, async (req, res) => {
			try {
				const campaigns = await campaignCollection.find({}).toArray();
				const smsApiData = await smsApiDataCollection.find({}).toArray();
				const client = new twilio(
					smsApiData[0].accountSID,
					smsApiData[0].authToken
				);
				const message_id = [];
				for (campaignData of campaigns) {
					const {
						number: sender,
						messageBody: message,
						contactList,
						startDate,
					} = campaignData;
					startDate = new Date(startDate); //convert startDate to date
					const currentDate = new Date(); //get current date
					if (currentDate >= startDate) { //if current date is greater than start date
						const receiver = await contactsCollection
							.find({ _id: ObjectId(contactList) })
							.toArray();
						for (const r of receiver) {
							for (const number of r?.array) {
								// console.log("number", number.mobile);
								await client.messages
									.create({
										body: message,
										to: "+" + number.mobile,
										from: sender,
									})
									.then((message) => {
										// console.log(message);
										if (message.sid) {
											message_id.push(message.sid);
										}
									});
							}
						}
					} else {
						// console.log("not toady", startDate, date);
					}
				}
				res.json({
					status: 200,
					message: "Message Sent Successfully",
					messageIds: message_id,
				});
			} catch (error) {
				// console.log(error);
				res.json({
					status: 400,
					message: "Message Sent Failed!" + " " + error.message,
					code: error.code,
				});
			}
		});

		// count active, inactive, draft campaigns
		app.get("/campaigns/count", verifyJWT, async (req, res) => {
			const cursor = campaignCollection.find({});
			const campaignData = await cursor.toArray();
			const activeCampaigns = campaignData.filter(
				(campaign) => campaign.status === "Active"
			);
			const inactiveCampaigns = campaignData.filter(
				(campaign) => campaign.status === "Scheduled"
			);
			const draftCampaigns = campaignData.filter(
				(campaign) => campaign.status === "Draft"
			);
			res.json({
				activeCampaigns: activeCampaigns.length,
				scheduledCampaigns: inactiveCampaigns.length,
				draftCampaigns: draftCampaigns.length,
			});
		}
		);

		// Get single campaign details
		app.get("/campaigns/:id", verifyJWT, async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			// console.log(query);
			const cursor = campaignCollection.find(query);
			const result = await cursor.toArray();
			res.send(result);
		});

		// Update single campaign details
		app.put("/campaigns/:id", async (req, res) => {
			const id = req.params.id;
			const updateStatus = req.body;
			const filter = { _id: ObjectId(id) };
			const options = { upsert: true };
			const updateDoc = {
				$set: {
					status: updateStatus.status,
				},
			};
			const result = await campaignCollection.updateOne(
				filter,
				updateDoc,
				options
			);
			if (result) {
				const cursor = campaignCollection.find({});
				const campaignData = await cursor.toArray();
				res.json({ ...result, data: campaignData });
			}
		});



		// get all CSV file data from database
		app.get("/campaigns", verifyJWT, async (req, res) => {
			const cursor = campaignCollection.find({});
			const campaignDataList = await cursor.toArray();
			res.send(campaignDataList);
		});

		// get all CSV file data from database
		app.get("/subscriptions", verifyJWT, async (req, res) => {
			const cursor = subscriptionListCollection.find({});
			const campaignDataList = await cursor.toArray();
			res.send(campaignDataList);
		});

		// post campaign file
		app.post("/campaigns", async (req, res) => {
			const data = req.body;
			const campaignListData = await campaignCollection.insertOne(data);
			res.json(campaignListData);
		});

		// delete uploaded excel file
		app.delete("/campaigns/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await campaignCollection.deleteOne(query);
			res.json(result);
		});
		/* ***********************************************************
		* ****************** End Campaigns Route *******************
		* *********************************************************** */

		/* ***********************************************************
		* ****************** Start Subscription Route *******************
		* *********************************************************** */
		// suscription list
		app.post("/subscriptions", verifyJWT, async (req, res) => {
			const data = req.body;
			const campaignListData = await subscriptionListCollection.insertOne(data);
			res.json(campaignListData);
		});

		app.delete("/subscriptions/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await subscriptionListCollection.deleteOne(query);
			res.json(result);
		});
		/* ***********************************************************
		* ****************** End Subscription Route *******************
		* *********************************************************** */

		/* ***********************************************************
		* ****************** Start Users Route *******************
		* *********************************************************** */

		// get users from database
		app.get("/users", verifyJWT, async (req, res) => {
			const cursor = usersDataCollections.find({});
			const usersDataList = await cursor.toArray();
			res.send(usersDataList);
		});

		// get inactive users from database (isActiveUser === "no")
		app.get("/users/inactive", verifyJWT, async (req, res) => {
			const cursor = usersDataCollections.find({ isActiveUser: "no" });
			const usersDataList = await cursor.toArray();
			res.send(usersDataList);
		}
		);

		// get number of active and inactive users
		app.get("/users/count", verifyJWT, async (req, res) => {
			const cursor = usersDataCollections.find({});
			const usersDataList = await cursor.toArray();
			const activeUsers = usersDataList.filter(
				(user) => user.isActiveUser === "yes" // filter active users
			);
			const inactiveUsers = usersDataList.filter(
				(user) => user.isActiveUser === "no" // filter inactive users
			);
			activeUsersCount = activeUsers.length;
			inactiveUsersCount = inactiveUsers.length;
			res.send({ activeUsersCount, inactiveUsersCount });
		});

		// get single user from database by id
		app.get("/users/:id", verifyJWT, async (req, res) => {
			const id = req.params.id;
			const query = { id: id };
			const cursor = usersDataCollections.find(query);
			const result = await cursor.toArray();
			res.send(result);
		});

		// get single user from database by email
		app.get("/users/email/:email", verifyJWT, async (req, res) => {
			const email = req.params.email;
			const query = { email: email };
			const cursor = usersDataCollections.find(query);
			const result = await cursor.toArray();
			res.send(result);
		});


		// post user to database using email
		app.post("/users/complete", async (req, res) => {
			const data = req.body;
			// if (!data.imageUrl) {
			// 	data["imageUrl"] = "https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?s=200"; // add default image to user object
			// }
			if (!data.id) {
				data["id"] = uuidv4().slice(0, 6); // generate unique id  and splice uuidv4() to get only first 6 characters
			}
			const email = data.email;
			const query = { email: email }; // query to find user by email
			const options = { upsert: true }; // if user not found then create new user
			const updateDoc = {
				$set: {
					...data,
				},
			};
			const result = await usersDataCollections.updateOne(
				query,
				updateDoc,
				options
			);
			res.json(result);
		});

		// add users to database
		app.post("/users", async (req, res) => {
			const user = req.body;
			const d = new Date();
			user["accountCreated"] = d.toDateString();
			// add current date to user object	
			user["imageUrl"] = "https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?s=200"; // add default image to user object
			user["id"] = uuidv4().slice(0, 6); // generate unique id  and splice uuidv4() to get only first 6 characters
			// console.log(user);
			const usersData = await usersDataCollections.insertOne(user);
			res.json(usersData);
		});

		// update user to database
		// app.put("/users", async (req, res) => {
		// 	const user = req.body;
		// 	const filter = { email: user.email };
		// 	const options = { upsert: true };
		// 	const updateDoc = { $set: user };
		// 	// console.log(updateDoc);
		// 	const updatedUserData = await usersDataCollections.updateOne(
		// 		filter,
		// 		updateDoc,
		// 		options
		// 	);
		// 	res.json(updatedUserData);
		// });

		// put user data to database
		app.put("/users/:id", async (req, res) => {
			const id = req.params.id;
			const updateUserData = req.body;
			// delete updateUserData._id;
			const filter = { _id: ObjectId(id) };
			const options = { upsert: true };
			const updateDoc = {
				$set: {
					...updateUserData,
				},
			};
			const result = await usersDataCollections.updateOne(
				filter,
				updateDoc,
				options
			);
			if (result) {
				const cursor = usersDataCollections.find({});
				const latestUsersData = await cursor.toArray();
				res.json({ ...result, data: latestUsersData });
			}
		});

		// delete user from database
		app.delete("/users/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await usersDataCollections.deleteOne(query);
			res.json(result);
		});

		/* ***********************************************************
		* ****************** End Users Route *******************
		* *********************************************************** */

		/* ***********************************************************
		* ****************** Start Admin Route *******************
		* *********************************************************** */
		// add admin to database
		app.post("/admins", async (req, res) => {
			const data = req.body;
			const result = await adminDataCollection.insertOne(data);
			res.json(result);
		});

		// get all admin data data from database
		app.get("/admins", async (req, res) => {
			const cursor = adminDataCollection.find({});
			const result = await cursor.toArray();
			res.send(result);
		});

		// update admin to database
		app.put("/admins/:id", async (req, res) => {
			const id = req.params.id;
			const updatedEmail = req.body;
			const filter = { _id: ObjectId(id) };
			const options = { upsert: true };
			const updateDoc = {
				$set: {
					email: updatedEmail.email,
				},
			};
			const result = await adminDataCollection.updateOne(
				filter,
				updateDoc,
				options
			);
			if (result) {
				const cursor = adminDataCollection.find({});
				const adminData = await cursor.toArray();
				res.json({ ...result, data: adminData });
			}
		});

		// delete admin from database
		app.delete("/admins/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await adminDataCollection.deleteOne(query);
			res.json(result);
		});
		/* ***********************************************************
		* ****************** End Admin Route *******************
		* *********************************************************** */


		// post CSV File from client site
		app.post("/csvList", async (req, res) => {
			const data = req.body;

			const response = [];
			for (let index = 0; index < data.length; index++) {
				const element = data[index];
				const csvList = {
					id: element.id,
					name: element.name,
					number: element.number,
					reference: element.reference,
				};
				const csvListData = await csvFileDataCollection.insertOne(csvList);
				response.push(csvListData);
			}

			res.json(response);
		});

		// get all CSV file data from database
		app.get("/csvList", verifyJWT, async (req, res) => {
			const cursor = csvFileDataCollection.find({});
			const csvDataList = await cursor.toArray();
			res.send(csvDataList);
		});

		// console.log("Database connected");
	} finally {
		// await client.close();
	}
}

run().catch(console.dir);
// MongoDB database

app.get("/", (req, res) => {
	res.send("SMS Sender Application Server");
});

app.listen(port, () => {
	// console.log("Server running on port: ", port);
});
