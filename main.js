/* Import required modules */
const express = require("express")
const api = express()
const request = require("request")
const cookieParser = require("cookie-parser")
const fs = require("fs")


/* Config */

//USAGE: 
//make a json object with the map's domain that has an array of maps in that domain and where they are
//Example:

//"https://earthmc.net": [
//        "map",
//        "map/factions"
//    ],

//In that JSON object the api will know that there are maps in https://earthmc.net/map and https://earthmc.netmap/factions

//But what if the map does not have /something/something in the url, so it would be just https://earthmc.net
//Just type in NO in caps to tell the api to get the map from https://earthmc.net
const map = {
    "https://earthmc.net": [
        "map",
        "map/factions"
    ],
    "https://dynmap.starlegacy.net": [
        "NO",
    ]
}

//Names for the urls above
const mapNames = {
    servers: {
        "https://earthmc.net": "EarthMC",
        "https://dynmap.starlegacy.net": "Test"
    },
    maps: {
        "https://earthmc.net": {
            "map": "Towny",
            "map/factions": "Factions"
        },
        "https://dynmap.starlegacy.net": {
            "NO": "Test"
        }
    }
}

const port = "8090" //Webserver host of router

//end of user config

const unsupportedfiletypes = [ //Files that do not require a defined MIME type
    "ico", "configuration", "png"
]

const ignorerecognition = [ //Don't send these as files, just redirect them to the actual host
    "ico", "png"
]

/* Data fields */
const fields = { //Data provided to the client
    "availableMaps": map, //All maps to load
    "mapNames": mapNames
}


/* Api */
api.use(cookieParser()); //Get the cookies included with the request

api.get("/", (req, res) => { //Respond to new sessions 
    res.status(200).sendFile(__dirname + "/html/map.html") //Send the client
})

api.get("/none", (req, res) => { //Redirects iframes to this when they are not used
    res.status(200).sendFile(__dirname + "/html/paused.html") //Send a simple blank html file
})

api.get("/asset", (req, res) => {
    if(!req.query.filename){
        res.status(400).send("Bad request, missing filename in query.")
    }else {
        var filename = req.query.filename
        if(fs.existsSync(__dirname + "/html/assets/" + filename)){
            res.status(200).sendFile(__dirname + "/html/assets/" + filename)
        }else {
            res.status(404).send("No file found with the name: " + filename + ".")
        }
    }
})

api.post("/api", async (req, res) => { //Send the backend data to the client
    if(!req.query.field){ //verify the query is there to get the correct JSON object
        res.status(400).send("Bad request, Missing 'field'.") //No query found, give an error.
    }else {
        res.send(fields[req.query.field]) //Send the data with the query as the JSOn object name
    }
})


/* The map data host */

api.use(async (req, res) => { //Forward the local data requests to the map

    var filePath = req.originalUrl //Save the url to a shorter variable
    var mapBase = ""
    var server = ""


    if(req.cookies != undefined && req.cookies["map"] != undefined){ //If the code got to this point the mapname has to be in the request cookies to fetch data, so check that now
        var mp = req.cookies["map"] //Get the cookie

        //Some string handling and a way to use maps in a base domain with no /something/something
        mapBase = mp
        server = mapBase.split("/")
        server = server[0] + "//" + server[2]
        filePath = filePath.replace("NO", "")
        mapBase = mapBase.replace("NO", "")

        if(mapBase.split("/")[4] != undefined){
            filePath = filePath.split("/")
            filePath[1] = ""
            filePath = filePath.join("/").replace("//", "/")
        }

        console.log("using server: " + server + " and base: " + mapBase + " and location: " + filePath)
    }else {
        res.status(500).send("No cookie found. Cookies: " + req.cookies) //No cookie found, the code cannot continue as the url would not be complete
        return;
    }

    //Dynamic map service, host multiple maps dynamically

    if(req.query.worldname){ //If the client is loading an old session the request will include a query of the last position, handle that with special care
        var mapname = req.originalUrl.replace("?", "/?").split("/") //Split the url to parts to get the map name
        if(mapname[3] != undefined){ //If this is true the map name is in two parts, so handle that
            var guess2 = mapname[1] + "/" + mapname[2] + "/" + mapname[3] //Create the url to load the map from
            var loadthis = "/" + guess2 //Same thing as above
            request(mapBase, (err, resC, body) => { //Request the map's code including the position
                if(err != null){ //Something went wrong so we cannot send the code, send an error message to handle it
                    res.status(500).send("Internal server error. Error: " + err) //Send the error message
                }else 
                if(body){ //Everything went great, so send the code
                    res.status(200).send(body)
                    console.log("Loaded map with query: " + mapBase) //Report the result
                }else { //Something went wrong, the request was wrong.
                    res.status(400).send("Bad request. Invalid mapBase in config.") //Report the request error to the client
                }
            })
            return;
        }else { //The map name is in a single part 
            var loadthis = "/" + mapname[1] + "/" + mapname[2] //Create the url to load the map from
            request(mapBase, (err, resC, body) => { //Request the map's code including the position
                if(err != null){ //Something went wrong so we cannot send the code, send an error message to handle it
                    res.status(500).send("Internal server error. Error: " + err) //Send the error message
                }else 
                if(body){ //Everything went great, so send the code
                    res.status(200).send(body)
                    console.log("Loaded map with query: " + mapBase) //Report the result
                }else { //Something went wrong, the request was wrong.
                    res.status(400).send("Bad request. Invalid mapBase in config.") //Report the request error to the client
                }
            })
            return;
        }
        return;
    }

    var mapname = req.originalUrl.split("/") //Split the url to get the map name and location
    if(mapname[3] == "" || mapname[3] == undefined){ //This will be true if the client is actually looking for a map
        var fail = false //Set a variable to know if the map search will be a success 
        mapname.forEach(name => { //Go through the list of maps to know if the map name is correct and the client is actually looking for a map
            if(name.includes(".")){ //The client is looking for a file so return
                fail = true //Set the variable to block the script from sending a map
            }
        })
        if(fail == false){ //Act on the results of above
            if(mapname[2] != undefined){ //If this is true, the map is in two parts so handle tha with special care
                var guess2 = mapname[1] + "/" + mapname[2].split("?")[0] //Create the map location
                if(map[server].includes(guess2)){ //Check if the map name is valid
                    request(mapBase, (err, resC, body) => { //Request the map code
                        if(err != null){ //Something went wrong while making the request
                            res.status(500).send("Internal server error. Error: " + err) //Report the request error to the cliet
                        }else 
                        if(body){ //Got the map code
                            res.status(200).send(body)
                            console.log("Loaded map: " + mapBase) //Report the results
                        }else {
                            res.status(400).send("Bad request. Invalid mapBase in config.") //The domain of the mao is likely invalid so send an error message about that
                        }
                    })
                    return;
                }
            }else
            if(map[server].includes(mapname[1])){ //Check if the map name is valid
                request(mapBase, (err, resC, body) => { //Request the map
                    if(err != null){
                        res.status(500).send("Internal server error. Error: " + err) //Report the request error to the cliet
                    }else 
                    if(body){ //Got the map code
                        res.status(200).send(body)
                        console.log("Loaded map: " + mapBase) //Report the results
                    }else {
                        res.status(400).send("Bad request. Invalid mapBase in config.") //The domain of the mao is likely invalid so send an error message about that
                    }
                })
                return;
            }
        }
    }


    var type = filePath.split("/") //Parse the type the client is expecting the result to be
    //Not going to log this as it's just string handling.
    if (type.length == 1) {
        type = type[0]
    } else {
        var nro = type.length - 1
        type = type[nro]
    }
    type = type.split("?")[0].split(".")
    var nro2 = type.length - 1
    type = type[nro2] //Here we have the type!

    console.log("Type: " + type + ". Input: " + mapBase + filePath) //Report that the client is requesting data.

    if(filePath.includes("tiles/_markers_/marker_earth.json")){ //Handle the markers with special care so the customizations can be added.
        request(mapBase + filePath, (err, resC, body) =>{  //Request the markers
            if(err != null){ //There was an error while fetching the markers from the server
                res.status(500).send("Internal server error while fetching markers. Error: " + err) //Send the error to the client
            }
            else if(body){ //The markers were loaded 
                res.setHeader("Content-Type", "text/json") //Set the response MIME type
             
                //parse the markerfile name from the url to get the correct one
                var markerFile = req.cookies["map"].replace(/\//g, "-") + ".json" //Get the custom markers filename
                fs.readFile(__dirname + "/markers/" + markerFile, 'utf8', async function(err, data){ //Get the marker data
                    if(err != null){ //There was an error while reading the markerfile
                        res.status(500).send("Internal server error, could not find: " + markerFile + ". ERR: " + err) //Report that error to the client
                    }else {
                        if(data){ //The custom markers were loaded successfully
                            var new_body = body.replace("\"markers\": {\"hide\": false,\"circles\": {},\"areas\": {},\"label\": \"Markers\",\"markers\": {},\"lines\": {},\"layerprio\": 0}", data) //Add in the custom markers, this can cause issues in other servers. As the markers are unique.
                            res.status(200).send(new_body) //Send the markers with the custom markers to the client
                        }else { //Something went wrong while loading the markers
                            res.status(500).send("No markers found. Backend connection error.") //Send the error to the client
                        }
                    }
                })
            }else { //The markers were not found
                res.status(500).send("Internal server error, This should not happen. Likely a config error in the backend.") //Send the error to the client
            }
        })

    }
    //I'm not going to bother explaining this in much detail as it's pretty much the same stuff
    else if(filePath.includes("up/configuration")){ //map configuration handler
        request(mapBase + filePath, (err, resC, body) =>{ 
            if(err != null){
                res.status(500).send("Internal server error.")
            }else if(body != undefined){
                res.setHeader("Content-Type", "text/html")


                //TODO add a custom config for lots of other cool things


                res.status(200).send(body)
            }else {
                res.status(404).send("File not found.")
            }
        })
    }else if(filePath.includes("up/world")){ //Map live data (like players) handler
        request(mapBase + filePath, (err, resC, body) =>{ 
            if(err != null){
                res.status(500).send("Internal server error.")
            }else if(body){
                res.setHeader("Content-Type", "text/html")
                res.status(200).send(body)
            }else {
                res.status(404).send("File not found.")
            }
        })
    }else if(!filePath.includes(".")){ //Handle JSON documents or documents without encoding
        request(mapBase + filePath, (err, resC, body) =>{ 
            if(err != null){
                res.status(500).send("Internal server error.")
            }else if(body){
                res.setHeader("Content-Type", "text/json")
                res.send(body)
            }else {
                res.status(404).send("File not found.")
            }
        })
    }else if(unsupportedfiletypes.includes(type) && !ignorerecognition.includes(type)){ //Handle unsupported but usable file types
        request(mapBase + filePath, (err, resC, body) =>{ 
            if(err != null){
                res.status(500).send("Internal server error.")
            }else if(body){
                res.setHeader("Content-Type", "text/plain")
                res.send(body)
            }else {
                res.status(404).send("File not found.")
            }
        })
    }else if(ignorerecognition.includes(type)){ //Handle unsupported and unuseable filetypes
        res.status(200).redirect(mapBase + filePath)
        type = null
    } else { //Handle the request with the desired type and data normally
        request(mapBase + filePath, (err, resC, body) =>{ 
            if(err != null){
                res.status(500).send("Internal server error.")
            }else if(body){
                res.setHeader("Content-Type", "text/" + type)

                //TODO edit stuff here to add cool custom stuff

                res.send(body)
            }else {
                res.status(404).send("File not found.")
            }
        })
    }
});

/* Listen to a port */
api.listen(port, console.log("Map service online."))