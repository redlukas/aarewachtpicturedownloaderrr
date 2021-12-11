const axios = require("axios")
const fs = require("fs");
const Path = require("path");


async function getMainPage(url) {
    const {data: page} = await axios.get(url)
    return page
}


async function getImageUrlFromPage(html) {
    const urls = []
    while (html.indexOf("<div id=\"ngg-image-") > 0) {
        html = html.substring(html.indexOf("<div id=\"ngg-image-"))
        html = html.substring(html.indexOf("<a href=\"") + 9)
        const url = html.substring(0, html.indexOf("\""))
        urls.push(url)
    }
    return urls
}

async function downloadImage(url) {
    const folder = url.substring(url.indexOf("gallery/") + 8, url.indexOf("/", url.indexOf("gallery/") + 8))
    const name = decodeURIComponent(url.substring(url.lastIndexOf("/") + 1))
    if(name.substring(0,2)==="tn_"){
        console.log("rejecting", name);
        return
    }
    if (!fs.existsSync(Path.resolve(__dirname, "pictures"))) {
        fs.mkdirSync(Path.resolve(__dirname, "pictures"));
    }
    if (!fs.existsSync(Path.resolve(__dirname, "pictures", folder))) {
        fs.mkdirSync(Path.resolve(__dirname, "pictures", folder));
    }
    const path = Path.resolve(__dirname, "pictures", folder, name)
    //console.log("path is ", path);
    const writer = fs.createWriteStream(path)

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    })

    response.data.pipe(writer)

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve)
        writer.on('error', reject)
    })
}

async function getAlbum(url) {
    console.log("getting images for ", url.substring(url.indexOf("nggallery/" + 10), url.indexOf("?")));
    const page = await getMainPage(url)
    const pictureURLs = await getImageUrlFromPage(page)
    console.log(pictureURLs.length + " pictures");
    for (let picture of pictureURLs) {
        await downloadImage(picture)
    }
    console.log("album done");
}

async function getAllAlbums() {
    let {data: page} = await axios.get("https://www.aarewacht.ch/?page_id=161")
    //console.log("data is", page);
    const albumURLs = []
    while (page.indexOf("<div class=\"ngg-album-compactbox\">") > 0) {
    page = page.substring(page.indexOf("<div class=\"ngg-album-compactbox\">")+34)
        //console.log("page is now",page);
        page = page.substring(page.indexOf("href=\'") + 6)
        const url = page.substring(0, page.indexOf("\'"))
        //console.log("found url", url);
        albumURLs.push(url)
    }
    return albumURLs
}

async function main() {
    const albums = await getAllAlbums()
    for (let album of albums) {
        await getAlbum(album)
    }
    console.log("all done");
}

main()
