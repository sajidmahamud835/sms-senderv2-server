const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 4000;
const twilio = require("twilio");
const { MongoClient, ServerApiVersion } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const { response } = require("express");
const objectId = require("mongodb").ObjectId;
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

// MongoDB database
async function run() {
	try {
		await client.connect();
		const database = client.db("smsApiDatabase");
		const smsApiDataCollection = database.collection("smsApi");
		const mobileNumberDataCollection = database.collection("mobileNumberData");
		const csvFileDataCollection = database.collection("csvFileData");
		const uploadExcelFileCollection = database.collection("uploadExcelFile");
		const campaignCollection = database.collection("campaignListData");
		const usersDataCollections = database.collection("users");
		const subscriptionListCollection = database.collection("subscriptionList");
		const adminDataCollection = database.collection("adminList");

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
							console.log(message);
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
				console.log(error);
				res.json({
					status: 400,
					message: "Message Sent Failed!" + " " + error.message,
					code: error.code,
				});
			}
		});

		//campaign corn jobs
		// app.get("/corns/sms", async (req, res) => {
		// 	try {
		// 		//getting campaign data from database [{}]
		// 		const campaigns = await campaignCollection.find({}).toArray();
		// 		// console.log("all campaigns", campaigns);
		// 		const message_lists = [];
		// 		for (campaignData of campaigns) {
		// 			//getting sender, message, and receiver from campaign data {}
		// 			const { number: sender, messageBody: message, contactList } = campaignData;
		// 			// console.log("campaignData", { number: sender, messageBody: message, contactList });
		// 			console.log("contactList", contactList);
		// 			// getting receiver numbers from database { []; }
		// 			const cursor = uploadExcelFileCollection.find({ _id: ObjectId(contactList) });
		// 			const receiver = await cursor.toArray();
		// 			console.log("receiver", receiver);
		// 			//getting api data from database
		// 			const smsApiData = await smsApiDataCollection.find({}).toArray();
		// 			const client = new twilio(
		// 				smsApiData[0].accountSID,
		// 				smsApiData[0].authToken,
		// 			);
		// 			// console.log("smsApiData", smsApiData);
		// 			const message_id = [];
		// 			for (number of receiver.array) {
		// 				await client.messages
		// 					.create({
		// 						body: message,
		// 						to: number,
		// 						from: sender,
		// 					})
		// 					.then((message) => {
		// 						// console.log(message);
		// 						if (message.sid) {
		// 							message_id.push(message.sid);
		// 						}
		// 					});
		// 			}
		// 			message_lists.push(message_id);
		// 		}
		// 		res.json({
		// 			status: 200,
		// 			message: "Message Sent Successfully",
		// 			messageIds: message_id,
		// 		});
		// 		console.log({
		// 			status: 200,
		// 			message: "Message Sent Successfully",
		// 			messageIds: message_id,
		// 		});
		// 	} catch (error) {
		// 		console.log(error);
		// 		res.json({
		// 			status: 400,
		// 			message: "Message Sent Failed!" + " " + error.message,
		// 			code: error.code,
		// 		});
		// 	}
		// });

		app.get("/corns/sms", async (req, res) => {
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
					if (startDate === date) {
						const receiver = await uploadExcelFileCollection
							.find({ _id: ObjectId(contactList) })
							.toArray();
						for (const r of receiver) {
							for (const number of r?.array) {
								console.log("number", number.mobile);
								await client.messages
									.create({
										body: message,
										to: "+" + number.mobile,
										from: sender,
									})
									.then((message) => {
										console.log(message);
										if (message.sid) {
											message_id.push(message.sid);
										}
									});
							}
						}
					} else {
						console.log("not toady", startDate, date);
					}
				}
				res.json({
					status: 200,
					message: "Message Sent Successfully",
					messageIds: message_id,
				});
			} catch (error) {
				console.log(error);
				res.json({
					status: 400,
					message: "Message Sent Failed!" + " " + error.message,
					code: error.code,
				});
			}
		});

		// get all mobile number data
		app.get("/smsApi/numbers", async (req, res) => {
			const log = {
				rawHeaders: req.rawHeaders,
				method: req.method,
				url: req.url,
				statusCode: req.statusCode,
				statusMessage: req.statusMessage,
			};
			// console.log("/smsApi/numbers - request", log);

			const cursor = mobileNumberDataCollection.find({});
			const mobileNumberData = await cursor.toArray();
			res.send(mobileNumberData);

			// console.log("/smsApi/numbers - response", mobileNumberData);
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
			// console.log("/smsApi/numbers/:id - request", log);

			const id = req.params.id;
			const updatedNumber = req.body;
			const filter = { _id: objectId(id) };
			const options = { upsert: true };
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

			// console.log("/smsApi/numbers/:id - response", log);
		});

		// delete mobile number data
		app.delete("/smsApi/numbers/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: objectId(id) };
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
		app.get("/smsApi", async (req, res) => {
			const cursor = smsApiDataCollection.find({});
			const smsApiData = await cursor.toArray();
			res.send(smsApiData);
		});

		// put sms api data to database
		app.put("/smsApi/:id", async (req, res) => {
			const id = req.params.id;
			const updatedSmsApiData = req.body;
			delete updatedSmsApiData._id;
			const filter = { _id: objectId(id) };
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

		// post CSV File from client site
		app.post("/csvList", async (req, res) => {
			const data = req.body;
			// console.log(data);
			// const csvData = await csvFileDataCollection.insertOne(data);
			// console.log(csvData)
			// res.json(csvData);
			const response = [];
			for (let index = 0; index < data.length; index++) {
				const element = data[index];
				// console.log(element);
				const csvList = {
					id: element.id,
					name: element.name,
					number: element.number,
					reference: element.reference,
				};
				// console.log(data);
				const csvListData = await csvFileDataCollection.insertOne(csvList);
				response.push(csvListData);
			}

			res.json(response);
			// console.log(response);
		});

		// get all CSV file data from database
		app.get("/csvList", async (req, res) => {
			const cursor = csvFileDataCollection.find({});
			const csvDataList = await cursor.toArray();
			res.send(csvDataList);
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

				// console.log(data);

				const numberData = await mobileNumberDataCollection.insertOne(data);
				response.push(numberData);
			}

			res.json(response);
			// console.log(response);
		});

		// Get Upload Excel File
		app.get("/upload-excel-file", async (req, res) => {
			const email = req.query.email;
			const query = { email: email };
			const cursor = uploadExcelFileCollection.find(query);
			const uploadExcelFileData = await cursor.toArray();
			res.send(uploadExcelFileData);
		});

		// Get Uploaded single Excel File
		app.get("/excel-file/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const cursor = uploadExcelFileCollection.find(query);
			const result = await cursor.toArray();
			res.send(result);
		});

		// Get single campaign details
		app.get("/campaign-details/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			console.log(query);
			const cursor = campaignCollection.find(query);
			const result = await cursor.toArray();
			res.send(result);
		});

		// Update single campaign details
		app.put("/campaign-details/:id", async (req, res) => {
			const id = req.params.id;
			const updateStatus = req.body;
			const filter = { _id: objectId(id) };
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

		// Post Upload Excel File
		app.post("/upload-excel-file", async (req, res) => {
			const data = req.body;
			const uploadExcelFileData = await uploadExcelFileCollection.insertOne(
				data
			);
			res.json(uploadExcelFileData);
		});

		// get all CSV file data from database
		app.get("/campaign-list", async (req, res) => {
			const cursor = campaignCollection.find({});
			const campaignDataList = await cursor.toArray();
			res.send(campaignDataList);
		});

		// get all CSV file data from database
		app.get("/subscription-list", async (req, res) => {
			const cursor = subscriptionListCollection.find({});
			const campaignDataList = await cursor.toArray();
			res.send(campaignDataList);
		});

		// post campaign file
		app.post("/campaign-list", async (req, res) => {
			const data = req.body;
			const campaignListData = await campaignCollection.insertOne(data);
			res.json(campaignListData);
		});

		// post campaign file
		app.post("/subscription-list", async (req, res) => {
			const data = req.body;
			const campaignListData = await subscriptionListCollection.insertOne(data);
			res.json(campaignListData);
		});

		// delete uploaded excel file
		app.delete("/delete-excel-file/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await uploadExcelFileCollection.deleteOne(query);
			res.json(result);
		});

		// delete uploaded excel file
		app.delete("/delete-campaign/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await campaignCollection.deleteOne(query);
			res.json(result);
		});
		// delete uploaded excel file
		app.delete("/delete-subscription/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: ObjectId(id) };
			const result = await subscriptionListCollection.deleteOne(query);
			res.json(result);
		});

		// get users from database
		app.get("/users", async (req, res) => {
			const cursor = usersDataCollections.find({});
			const usersDataList = await cursor.toArray();
			res.send(usersDataList);
		});

		// get single user from database by id
		app.get("/users/:id", async (req, res) => {
			const id = req.params.id;
			const query = { id: id };
			const cursor = usersDataCollections.find(query);
			const result = await cursor.toArray();
			res.send(result);
		});

		// get single user from database by email
		app.get("/users/email/:email", async (req, res) => {
			const email = req.params.email;
			const query = { email: email };
			const cursor = usersDataCollections.find(query);
			const result = await cursor.toArray();
			res.send(result);
		});


		// add users to database
		app.post("/users", async (req, res) => {
			const user = req.body;
			const d = new Date();
			user["accountCreated"] = d.toDateString(); // add current date to user object
			user["imageUrl"] = "https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50?s=200"; // add default image to user object
			user["id"] = uuidv4().slice(0, 6); // generate unique id  and splice uuidv4() to get only first 6 characters
			console.log(user);
			const usersData = await usersDataCollections.insertOne(user);
			res.json(usersData);
		});

		// update user to database
		// app.put("/users", async (req, res) => {
		// 	const user = req.body;
		// 	const filter = { email: user.email };
		// 	const options = { upsert: true };
		// 	const updateDoc = { $set: user };
		// 	console.log(updateDoc);
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
			const query = { _id: objectId(id) };
			const result = await usersDataCollections.deleteOne(query);
			res.json(result);
		});

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
			const filter = { _id: objectId(id) };
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
			const query = { _id: objectId(id) };
			const result = await adminDataCollection.deleteOne(query);
			res.json(result);
		});

		console.log("Database connected");
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
	console.log("Server running on port: ", port);
});
