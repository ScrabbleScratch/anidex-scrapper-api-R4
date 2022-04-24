require("dotenv").config();
const express = require("express");
const bodyparser = require("body-parser");
const {MongoClient} = require("mongodb");
const axios = require("axios").default;

const app = express();
app.use(bodyparser.urlencoded({extended: true}));

const Jikan = axios.create({
    baseURL: process.env.JIKAN_URL
});

const dbUri = process.env.DB_HOST;
const client = new MongoClient(dbUri);

async function dbQuery(category, doc) {
    try {
        await client.connect();
        const database = client.db(process.env.DB_NAME);
        const collection = database.collection(category);

        const filter = {"data.mal_id": doc.data.mal_id}

        let response = {
            success: false,
            operation: null,
            id: null
        };

        const existing = await collection.findOne(filter);
        if (existing) {
            const queryResult = await collection.findOneAndReplace(filter, doc);
            response = {
                success: queryResult.lastErrorObject.updatedExisting,
                operation: "update",
                id: queryResult.value._id
            };
        } else {
            const queryResult = await collection.insertOne(doc);
            response = {
                success: queryResult.acknowledged,
                operation: "insert",
                id: queryResult.insertedId
            };
        }
        return response;
    } finally {
        await client.close();
    }
}

app.get("/:category/:id", (req, res) => {
    const category = req.params.category.toLowerCase();
    if (availableCategories.includes(category)) {
        const current = category.toUpperCase() + ": " + req.params.id + ": ";
        Jikan.get(category + "/" + req.params.id).then(async ({status, data}) => {
            if ("data" in data) {
                console.log(current + status);
                const response = await dbQuery(category, data.data).catch(console.dir);
                res.status(status);
                res.send(response);
            } else {
                if ("status" in data) {
                    console.log(current + data.status);
                    res.status(data.status);
                    res.send(data);
                } else {
                    console.log(current + 501);
                    res.status(501);
                    res.send(data);
                }
            }
            
        }).catch((err) => {
            if (err.response) {
                console.log(current + err.response.status);
                res.status(err.response.status);
                res.send(err.response.data);
            } else {
                console.log(err);
                res.status(400);
                res.send(err);
            }
        });
    } else {
        console.log("Unknown category");
        response = {
            status_code: 400,
            error: "Unknown category!"
        };
        res.status(400);
        res.send(response);
    }
});

app.get("/character/:id", (req, res) => {
    const current = "CHARACTER: " + req.params.id + ": ";
    Jikan.get("characters/" + req.params.id).then(async ({status, data}) => {
        if ("data" in data) {
            console.log(current + status);
            const response = await dbQuery("characters", data).catch(console.dir);
            res.status(status);
            res.send(response);
        } else {
            if ("status" in data) {
                console.log(current + data.status);
                res.status(data.status);
                res.send(data);
            } else {
                console.log(current + 501);
                res.status(501);
                res.send(data);
            }
        }
        
    }).catch((err) => {
        if (err.response) {
            console.log(current + err.response.status);
            res.status(err.response.status);
            res.send(err.response.data);
        } else {
            console.log(err);
            res.status(400);
            res.send(err);
        }
    });
});

app.get("/manga/:id", (req, res) => {
    const current = "MANGA: " + req.params.id + ": ";
    Jikan.get("manga/" + req.params.id).then(async ({status, data}) => {
        if ("data" in data) {
            console.log(current + status);
            const response = await dbQuery("mangas", data).catch(console.dir);
            res.status(status);
            res.send(response);
        } else {
            if ("status" in data) {
                console.log(current + data.status);
                res.status(data.status);
                res.send(data);
            } else {
                console.log(current + 501);
                res.status(501);
                res.send(data);
            }
        }
        
    }).catch((err) => {
        if (err.response) {
            console.log(current + err.response.status);
            res.status(err.response.status);
            res.send(err.response.data);
        } else {
            console.log(err);
            res.status(400);
            res.send(err);
        }
    });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, () => {console.log("Server running!")});