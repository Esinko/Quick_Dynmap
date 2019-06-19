
//NOTE: DO NOT RUN THIS! THIS IS FOR REFRENCE ONLY!!!


/* Import required modules */
const express = require("express")
const api = express()
const request = require("request")
const fs = require("fs")

/* Cache */
const cache = {

}

/* Config */
const map = [
    "map",
    "map/factions"
]
const mapBase = "https://earthmc.net"
const port = "3000"

const unsupportedfiletypes = [
    "ico", "configuration", "png"
]

const ignorerecognition = [
    "ico", "png"
]

/* Data fields */
const fields = {
    "availableMaps": map,
    "mapAlias": {
        "map": "Towny",
        "map/factions": "Factions"
    }
}


/* Api */
api.get("/map", (req, res) => {
    res.sendFile(__dirname + "/map.html")
})

api.get("/api", (req, res) => {
    if(!req.query.map){ //Check if the map query properity is present
        res.status(400).send("Bad request. No query.")
    }else { 
        //check if the map query properity is correct
        if(map.includes(req.query.map)){
            request(mapBase + "/" +req.query.map, (err, resC, body) => {
                if(err != null){
                    res.status(500).send("Internal server error. Error: " + err)
                }else 
                if(body){
                    body = body.replace(/href="/g, "href=\"" + req.query.map + "/")
                    body = body.replace(/src="/g, "src=\"" + req.query.map + "/")
                    res.status(200).send(body)
                }else {
                    res.status(400).send("Bad request. Invalid mapBase in config.")
                }
            })
        }else {
            res.status(400).send("Bad request. Invalid query.").edn
        }
    }
})

api.post("/api", async (req, res) => {
    if(!req.query.field){
        res.status(400).send("Bad request, Missing 'field'.")
    }else {
        res.send(fields[req.query.field])
    }
})

api.get("/map/css/dynmap_style.css", (req, res) => {
    var filePath = req.originalUrl
    request(mapBase + filePath, (err, resC, body) =>{ 
        res.setHeader("Content-Type", "text/css")
        res.send(body)
    })
})
api.get("/map/css/standalone.css", (req, res) => {
    var filePath = req.originalUrl
    request(mapBase + filePath, (err, resC, body) =>{ 
        res.setHeader("Content-Type", "text/css")
        res.send(body)
    })
})
api.get("/map/css/leaflet.css", (req, res) => {
    var filePath = req.originalUrl
    request(mapBase + filePath, (err, resC, body) =>{ 
        res.setHeader("Content-Type", "text/css")
        res.send(body)
    })
})


api.use(async (req, res) => { //Forward the local data requests to the map 
    var filePath = req.originalUrl

    //parse the response type
    var type = filePath.split("/")
    if(type.length == 1){
        type = type[0]
    }else {
        var nro = type.length - 1
        type = type[nro]
    }
    type = type.split("?")[0].split(".")
    var nro2 = type.length - 1
    type = type[nro2]

    console.log("Type: " + type + " Input: " + mapBase + filePath)

    //forward to the correct path

    if(filePath.includes("tiles/_markers_/marker_earth.json")){

        //test

        request(mapBase + filePath, (err, resC, body) =>{ 
            res.setHeader("Content-Type", "text/json")
             //parse the markerfile name from the url to get the correct one
            var markerFile = filePath.split("/tiles/_markers_/marker_earth")[0]
            markerFile = markerFile.split(".")
            if(markerFile.length == 1){
                markerFile = markerFile[0]
            }else {
                markerFile = markerFile[markerFile.lenght-1]
            }
            markerFile = markerFile.split("")
            markerFile[0] = ""
            markerFile = markerFile.join("")
            markerFile = markerFile.replace("/", "-")
            fs.readFile(__dirname + "/" + markerFile, 'utf8', async function(err, data){
                if(err != null){
                    res.status(500).send("Internal server error, could not find: " + markerFile + ".")
                }else {
                    var new_body = body.replace("\"markers\": {\"hide\": false,\"circles\": {},\"areas\": {},\"label\": \"Markers\",\"markers\": {},\"lines\": {},\"layerprio\": 0}", data)
                    res.status(200).send(new_body)
                }
            })
        })

        //parse the markerfile name from the url to get the correct one
        var markerFile = filePath.split("/tiles/_markers_/marker_earth")[0]
        markerFile = markerFile.split(".")
        if(markerFile.length == 1){
            markerFile = markerFile[0]
        }else {
            markerFile = markerFile[markerFile.lenght-1]
        }
        markerFile = markerFile.split("")
        markerFile[0] = ""
        markerFile = markerFile.join("")
        markerFile = markerFile.replace("/", "-")
        //now send the file 
        res.sendFile(__dirname + "/markers/" + markerFile + ".json")
    }else if(filePath.includes("up/configuration")){
        res.status(200).sendFile(__dirname + "/map_config.json")
    }else if(filePath.includes("up/world")){
        var filePath = req.originalUrl
        request(mapBase + "/map/" + filePath, (err, resC, body) =>{ 
            res.setHeader("Content-Type", "text/")
            res.send(body)
        })
    }else if(!filePath.includes(".")){
        res.status(200).redirect(mapBase + "/map/" +filePath)
    }else {
        request(mapBase + filePath, (err, resC, body) =>{
            if(err != null){
                res.status(500).send("Internal server error.")
            }else 
            if(body){

                //bug?

                if(unsupportedfiletypes.includes(type) && !ignorerecognition.includes(type)){
                    type = "plain"
                    res.status(200).header("Content-Type", "text/" + type).send(body)
                }else if(ignorerecognition.includes(type)){
                    res.status(200).redirect(mapBase + "/map/" + filePath)
                    type = null
                }else {
                    console.log("Sent with: " + type)

                    res.status(200).header("Content-Type", "text/" + type).send(body)
                }

                console.log("Sent with type: " + "text/" + type)
            }else {
                res.status(400).send("Bad request. Invalid mapBase in config.")
            }
        })
    }

})

/* Listen to a port */
api.listen(port, console.log("Map service online."))