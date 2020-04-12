# Download Instagram Profile

## Introduction
This Node.js script can fetch the imageURLs for a specific amount of Instagram posts of a profile (including slideshow-like posts). You also have the ability to download them directly.

## Credits and dependencies

 - [Jlobos](https://github.com/jlobos) great [Instagram WEB-API](https://github.com/jlobos/instagram-web-api#readme)
 - [Marak´s](https://github.com/Marak) project [colors](https://github.com/Marak/colors.js)
 - Instagram account if you want to access a private profile
 - [Node.js and NPM](https://nodejs.org/en/)

## Config explanation

 - `user:`
Username of the account (If the user has a private account you have to login with an account that has the permission to view the posts of the user.
 - `mode:`
full: Get the links and download the images
links: Only get the links to the images
download: Download all images that are in `links.json (project directory)`
Example for `links.json`
`[`
`"https://instagram.com/image1.jpg",`
`"https://instagram.com/image2.jpg",`<--Seperated through commas
`...`
`"https://instagram.com/image999.jpg"`<--No comma at the end
`]`<--Brackets are  important
- `structure:` 
folder: Each post gets its own folder with the images in it
files: Each post gets its own number with the image number added to it 
e.g.: 1-1.jpg, 1-2.jpg, 1-3.jpg, 2-1.jpg, 3-1.jpg, 3-2.jpg ...
none: Each image gets its own number
e.g.: 1.jpg, 2.jpg, 3.jpg, 4.jpg, 5.jpg, ... 
- `pages:`
Instagram seperates posts into pages. One page contains 12 posts, so the posts 1-12 are on page 1, 13-24 are on page two and so on. You have to define how many pages of an account you want to save. If you want to save all enter 0. IMPORTANT: Post 1 is always the most recent post, so if you for example want to save the third post that was ever created you cannot think of this post as post 3.
Examples: 
The account has 36 posts but you only want to get 24: Enter 2 for pages to get the first 24 posts.
The account has 9 posts but you only want to get 4: Enter 1 for pages to get the first 12 posts, delete the 3 unwanted posts afterwards.
The account has 123 posts but you only want to get 78:  78/12 = 6,5 -> Enter 7 to really get all wanted posts, delete the unwanted posts afterwards
The account has 1000 posts and you want them all: Enter 0
    

## Installation

**I.  Install Node.js and NPM:**
[Tutorial](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)

**II. Install dependencies:**
Command line in project directory:

    `# npm i`
    
**III.  Set-Up config (see above)**

**IV. Run script:**

Command line in project directory:

    `# npm start [IG-Username] [IG-Password]`

