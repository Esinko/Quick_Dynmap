# Quick_Dynmap
Use many Minecraft dynmaps with this basic data router and client host. Customize your experience with easier ways to add custom markers and locations to your map.

# NOTE: This is a personal project of mine and is not to be meant to be sold or being widely used. I just want others to be able to enjoy the features it has. All the code got from the Dynmap plugin IS THEIR CODE and I do not own any of it or claim to own it.

# Setup
To setup the map, download this github repostory and follow the following tutorial

1. Open a port or if you already have an open port skip this step
2. Open main.js and look for: /* Config */.
3. In it you will see something like this:
```
const map = {
    
}

//Names for the urls above
const mapNames = {
    servers: {

    },
    maps: {

    }
}

const port = "8090" //Webserver host of router
```

Here you find everything you will need to setup the router, The port and list of maps and servers.

But how do I add servers?

4. In the map section add your server and map like this:
```"domain, like "https://google.com": ["map, "map/two"]```
Now the router will know that there is a map in: https://google.com/map/ and https://google.com/map/two
(You can have max /two/parts/ after the domain)
5. Adding names, To make the names look better go to the mapNames section and add details like this:
In the server section, define your server's name with: ```"server domain, like https://google.com": "Google, or some other name"```
In the maps section add in details like this: ```"server domain, like https://google.com": {"map": "Towny"}```
Now the router will know that the map in https://google.com/map has a name, Towny.

5. Adding custom marker files. When you add a new domain to the map section, go into the markers folder and create a file that has a name like this: https://google.com/map BUT the / is replaced with - . So: https:--google.com-map
Now tha api will apply the json object in that file to the markers in the map while loading it.

The file will contain a JSON object, not a complete JSON file. Example:
```
"suomi": {
    "hide": false,
    "circles": {
    },
    "areas": {},
    "label": "Raja",
    "markers": {},
    "lines": {
        "Pääraja": {
            "fillcolor": "#003366",
            "ytop": 64.0,
            "color": "#ffffff",
            "markup": false,
            "x": [
                
            ],
            "z": [
                
            ],
            "y": [
                
            ],
            "weight": 9.0,
            "bottom": 64.0,
            "label": "Suomen raja.",
            "opacity": 0.8,
            "fillopacity": 0.0
        }
    },
    "layerprio": 0
}
```

Documentation of the object contents can be found in the dynmap documentation

6. That's it, Run the main.js file and go to the port you put in and the map menu will be there :D

# Assets
You can host assets for markers and other stuff in the assets folder, the files can be found in POST /api?filename=[filename_here]

# Usage
I suggest you have a basic knowledge of Javascript and JSON. So you can edit stuff I put in myself as this is repostory for and in use service.
