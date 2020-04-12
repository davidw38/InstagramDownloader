// Importing
require("colors")
const Instagram = require('instagram-web-api')
const fs = require("fs")
const https = require("https")

const config = JSON.parse(fs.readFileSync("config.json", "utf8")) // Load Config-File  

// Define global variables
const client = new Instagram({ username: process.argv.slice(2)[0], password: process.argv.slice(3).join(" ")})
var imageLinks = new Array()
var linkCode = new Map()
var lastEnd = new String
var downloadCount = 0
var pageCount = 0
var postCount = 0 

/*
VARIABLE EXPLANATION:
This function uses different variables to structure the files.
downloadCount = Counter for downloaded files
downloadCode = Used if multiple images that were in one post are combined
imageLinks = List of all links
linkCode = Map that connects the link to an image if the post it belongs to, again useful in cases where posts contain multiple images
lastEnd = Contains JSON-Cursor for pagination
pageCount = Counter for pagination
postCount = Counter for posts
*/

// Define download function
download = () => {
    console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Starting download of `.magenta + `${imageLinks.length} `.cyan + `Images!`.magenta) // Console log
    imageLinks.forEach((link, i) => { // Get each link out of list
        setTimeout(() => { // Wait 0.5 seconds between downloads
            let downloadCode = 1 // Define download code
            downloadCount++ // Increase download code by one
            console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Downloading Image `.yellow + `(${downloadCount} / ${imageLinks.length})`.cyan) // Console log

            if(config.structure == "folder") { // Check for structure config [Case: In folders]
                if(!fs.existsSync(`./downloads/${linkCode.get(link)}`)) { // Check if the folder for the post exists
                    fs.mkdirSync(`./downloads/${linkCode.get(link)}`) // Create folder for post
                }
                while(fs.existsSync(`./downloads/${linkCode.get(link)}/${downloadCode}.jpg`)) { // Get next file name
                    downloadCode++
                }
                var file = fs.createWriteStream(`./downloads/${linkCode.get(link)}/${downloadCode}.jpg`) // Create new file
            } else if(config.structure == "files") { // Check for structure config [Case: Via filenames]
                while(fs.existsSync(`./downloads/${linkCode.get(link)} - ${downloadCode}.jpg`)) { // Get next file name
                    downloadCode++
                }
                var file = fs.createWriteStream(`./downloads/${linkCode.get(link)} - ${downloadCode}.jpg`) // Create new file
            } else { // Check for structure config [Case: no mode selected]
                var file = fs.createWriteStream(`./downloads/${downloadCount}.jpg`) // Create new file
            }
            
            // Download handling
            try {
                https.get(link, response => {response.pipe(file)})
            } catch(error) {
                if(config.mode == "all") {
                    console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` There was an error with the download! (error.txt)`.red)
                    console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Exiting now!`.yellow)
                    fs.writeFileSync("./error.txt", error.toString())
                    process.exit()
                } else {
                    console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Please check links.json! (error.txt)`.red)
                    console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Exiting now!`.yellow)
                    fs.writeFileSync("./error.txt", error.toString())
                    process.exit()
                }
            } 
            
            downloadCode = 1 // Reset downloadCode
            if(downloadCount == imageLinks.length) { // Check if download process has finished [Case:true -> log]
                console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Download completed!`.green)
                console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Exiting now!`.yellow)
            }
        }, i * 500)
    }) 
}

// Define run function (mode: all, links)
run = async() => {
    // Define loop function for link fetching
    loop = () => {
        // Wait 5 seconds before making the API request because of rate limit
        setTimeout(async() => {
            // Make the API request and handle errors
            try {
                var photos = await client.getPhotosByUsername({username: config.username, after: lastEnd})
            } catch(error) {
                if(error.toString().includes("404")) {
                    console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` There was a problem with the API, the user was not found!`.red)
                } else {
                    console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` There was a problem with the API, try again later!`.red)
                }
                console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Exiting now!`.yellow)
                process.exit()
            }

            let edges = photos.user.edge_owner_to_timeline_media.edges // API data processing

            if(edges.length == 0) { // Check if account has posts or is not private [Case:false -> error log]
                console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Account has no posts or is inaccessible by the account!`.red)
                console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Exiting now!`.yellow)
                process.exit()
            }
            
            pageCount++ // Increase page count by one
            console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Current page: `.yellow + `${pageCount}`.cyan) // Console log

            edges.forEach(edge => {
                postCount++ // Increase post count by one
                console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Scanning Post `.yellow + `${postCount}`.cyan) // Console log
                if(edge.node.edge_sidecar_to_children) { // Check if post has multiple images [Case: true]
                    let sctt = edge.node.edge_sidecar_to_children.edges // Get images
                    sctt.forEach(sc => {
                        imageLinks.push(sc.node.display_url) // Add url to links
                        linkCode.set(sc.node.display_url, postCount) // Combine link and post in a map
                    })
                } else { // Check if post has multiple images [Case: false]
                    imageLinks.push(edge.node.display_url) // Add url to links
                    linkCode.set(edge.node.display_url, postCount) // Combine link and post in a map
                }
            })

            if(config.pages == 0) {
                if(photos.user.edge_owner_to_timeline_media.page_info.has_next_page) { // Check if there is a new page
                    lastEnd = photos.user.edge_owner_to_timeline_media.page_info.end_cursor // Get JSON cursor for next page
                    console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Waiting for next page...`.magenta) // Console log
                    loop() // Restart the process with new page
                } else {
                    fs.writeFileSync("links.json", JSON.stringify(imageLinks, null, 2)) // Write link list
                    console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Got `.yellow + `${imageLinks.length}`.cyan + ` Images out of `.yellow + `${postCount}`.cyan + ` Posts`.yellow) // Console log
                    if(config.mode != "links") { // Check if link mode is selected [Case:false]
                        download() // Start download
                    } else { // Check if link mode is selected [Case:true -> end program]
                        console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Links saved to config.json!`.green)
                        console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Exiting now!`.yellow)
                        process.exit()
                    }
                }
            } else if(pageCount < config.pages && photos.user.edge_owner_to_timeline_media.page_info.has_next_page) { // Check if a new page should be indexed [Case:true]
                lastEnd = photos.user.edge_owner_to_timeline_media.page_info.end_cursor // Get JSON cursor for next page
                console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Waiting for next page...`.magenta) // Console log
                loop() // Restart the process with new page
            } else { // Check if a new page should be indexed [Case:false]
                fs.writeFileSync("links.json", JSON.stringify(imageLinks, null, 2)) // Write link list
                console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Got `.yellow + `${imageLinks.length}`.cyan + ` Images out of `.yellow + `${postCount}`.cyan + ` Posts`.yellow) // Console log
                if(config.mode != "links") { // Check if link mode is selected [Case:false]
                    download() // Start download
                } else { // Check if link mode is selected [Case:true -> end program]
                    console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Links saved to config.json!`.green)
                    console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Exiting now!`.yellow)
                    process.exit()
                }
            }
        }, 5000)
    }

    var login = await client.login() // Login to account

    if(!login.authenticated) { // Check if authentication succeeded [Case: false]
        if(client.credentials.username) { // Check if the user provided login data [Case:true]
            console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Client login failed!`.red) // Console log
        } else { // Check if the user provided login data [Case:false]
            console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` No login provided!`.red) // Console log
        }
    } else if(!login.status == "ok") { // Check if API status is ok [Case: false]
        console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` There was a problem with the API, try again later!`.red + console.error) // Console log
        process.exit() // End program
    } else { // Check if authentication succeeded [Case: true]
        console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Client login successful!`.green) // Console log
    }
    console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Fetching links, please wait this may take a while...`.magenta) // Console log

    loop() // Start link fetching
}

if(config.mode == "full" || config.mode == "links") { // Check for selected mode [Case: full or links]
    if(Number.isInteger(config.pages) && config.pages >= 0) {
        run() // Start program
    } else {
        console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Please check config.json! (Pages)`.red)
        console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Exiting now!`.yellow)
        process.exit()
    }
} else if(config.mode == "download") { // Check for selected mode [Case: download]
    // Try common json errors and start download function
    try {
        imageLinks = JSON.parse(fs.readFileSync("links.json", "utf8"))
        if(typeof imageLinks.length === "undefined") {
            console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Please add at least one link!`.red)
            console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Exiting now!`.yellow)
            process.exit()
        }
        download()
    } catch(error) {
        console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Please check links.json! (error.txt)`.red)
        console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Exiting now!`.yellow)
        fs.writeFileSync("./error.txt", error.toString())
        setTimeout(() => {process.exit()}, 1000)
    }
    
} else { // Check for selected mode [Case: unknown mode -> Error log]
    console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Unknown mode, please check config.json!`.red)
    console.log(new Date().toISOString().replace(/T/, " ").replace(/\..+/, "") + ` Exiting now!`.yellow)
    process.exit()
}