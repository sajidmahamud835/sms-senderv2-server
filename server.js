const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 4000;
const twilio = require("twilio");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { response } = require("express");
const objectId = require("mongodb").ObjectId;

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
			"ACd7762d947ec45b73ef8d81af705632d8",
			"1bebc17e27e1c10c8e580a37269cf369"
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

		// get all mobile number data
		app.get("/smsApi/numbers", async (req, res) => {
			const log = {
				rawHeaders: req.rawHeaders,
				method: req.method,
				url: req.url,
				statusCode: req.statusCode,
				statusMessage: req.statusMessage,
			};
			console.log("/smsApi/numbers - request", log);

			const cursor = mobileNumberDataCollection.find({});
			const mobileNumberData = await cursor.toArray();
			res.send(mobileNumberData);

			console.log("/smsApi/numbers - response", mobileNumberData);
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
			console.log("/smsApi/numbers/:id - request", log);

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

			console.log("/smsApi/numbers/:id - response", log);
		});

		// delete mobile number data
		app.delete("/smsApi/numbers/:id", async (req, res) => {
			const id = req.params.id;
			const query = { _id: objectId(id) };
			const result = await mobileNumberDataCollection.deleteOne(query);
			res.json(result);
		});

		// post sms api from client site
		app.post("/smsApi", async (req, res) => {
			const data = req.body;
			const apiData = await smsApiDataCollection.insertOne(data);
			res.json(apiData);
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
			
			const cursor = uploadExcelFileCollection.find({});
			const uploadExcelFileData = await cursor.toArray();
			res.send(uploadExcelFileData);
		});

		// Post Upload Excel File
		app.post("/upload-excel-file", async (req, res) => {
			const data = req.body;
			const uploadExcelFileData = await uploadExcelFileCollection.insertOne(data);
			res.json(uploadExcelFileData);
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
