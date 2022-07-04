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

const uri = `mongodb+srv://smsApiUser:$W.i23h-RQ_j2NA@cluster0.i1abc.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	serverApi: ServerApiVersion.v1,
});
//Send SMS
app.post("/sms/send", async (req, res) => {
	try {
		const { sender, receiver, message } = req.body;
		const client = new twilio(
			process.env.ACCOUNT_SID,
			process.env.AUTH_TOKEN,
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

		// Get Uploaded single Excel File
		app.get("/campaign-details/:id", async (req, res) => {
			const id = req.params.id;

			const query = { _id: ObjectId(id) };
			console.log(query)
			const cursor = campaignCollection.find(query);
			const result = await cursor.toArray();
			res.send(result);
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

		// add users to database
		app.post("/users", async (req, res) => {
			const user = req.body;
			const usersData = await usersDataCollections.insertOne(user);
			res.json(usersData);
		});

		// update user to database
		app.put("/users", async (req, res) => {
			const user = req.body;
			const filter = { email: user.email };
			const options = { upsert: true };
			const updateDoc = { $set: user };
			console.log(updateDoc);
			const updatedUserData = await usersDataCollections.updateOne(
				filter,
				updateDoc,
				options
			);
			res.json(updatedUserData);
		});

		// delete user to database
		app.delete("/users/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: objectId(id) };
			const result = await usersDataCollections.deleteOne(query);
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
