// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: laptop-code;

const UNIT_TEST = false


// Utilities

function uuidv4() {
  // From https://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function currentScriptFilename() {
  return Script.name() + ".js"
}

function currentScriptPath() {
  return FileManager.iCloud().documentsDirectory() + "/" + currentScriptFilename()
}

function repoPath() {
  return FileManager.local().bookmarkedPath("memalign.github.io")
}

function entriesPath() {
  return repoPath() + "/entries"
}

function htmlPostsSubdirectory() {
  return "p"
}

function htmlPostsPath() {
  return repoPath() + "/" + htmlPostsSubdirectory()
}

function repoSiteGeneratorPath() {
   return repoPath() + "/SiteGenerator"
}

function copyCurrentScriptToRepo() {
  let fm = FileManager.local()
  let destPath = repoSiteGeneratorPath() + "/" + currentScriptFilename()
  if (fm.fileExists(destPath)) {
    fm.remove(destPath)
  }
  fm.copy(currentScriptPath(), destPath)
}


// HTMLDocument abstract class

class HTMLDocument {
  baseURL() {
    return "https://memalign.github.io"
  }
  
  fullURL() {
    return this.baseURL() + "/" + this.relativeURL();
  }
  
  ogImage() {
    return "/m/shiba.jpg"
  }
  
  ogDescription() {
    return null
  }
  
  htmlDocumentPrefix() {
    let ogImage = "\n<meta property=\"og:image\" content=\"" + this.ogImage() + "\" />";
    
    let ogDesc = ""
    let desc = this.ogDescription()
    if (desc && desc.length) {
      ogDesc = "\n<meta property=\"og:description\" content=\""+desc+"\" />"
    }
    
    
    let str =
`<!DOCTYPE html>
<html>
<head>
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/json" href="/feed.json" />
<title>${this.title}</title>
<meta property="og:title" content="${this.title}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${this.fullURL()}" />${ogImage}${ogDesc}
<link rel="stylesheet" href="/style.css">
<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes'>
</head>
<body>
<div id="body">
`
    
    return str
  }
  
  htmlDocumentSuffix() {  
    let str =
`
</div>
<div id="footer"></div>
</body>
</html>
`
    return str
  }

  writeHTMLDocument(directory) {
    let filename = directory + "/" + this.htmlFilename()
    FileManager.local().writeString(filename, this.toHTML())
    console.log("Wrote html document " + filename)
  }
}


// Index class

class Index extends HTMLDocument {
  constructor(entries) {
    super()
    
    this.entries = entries
    this.title = "memalign.github.io"
    
    this.entriesOnIndex = 5
  }
  
  ogImage() {
    let result = super.ogImage()
    
    this.sortEntries()
    
    for (let i = 0; i < this.entriesOnIndex && i < this.entries.length; ++i) {
      let entry = this.entries[i]
      let entryImageURL = entry.imageURL()
      if (entryImageURL) {
        result = entryImageURL
        break
      }
    }
    
    return result
  }
  
  ogDescription() {
    let result = null
    
    this.sortEntries()
    
    for (let i = 0; i < this.entriesOnIndex && i < this.entries.length; ++i) {
      let entry = this.entries[i]
      let entryDesc = entry.ogDescription()
      if (entryDesc && entryDesc.length) {
        result = entryDesc
        break
      }
    }
    return result
  }
  
  sortEntries() {
    // Sort entries by postNumber, highest (newest) to lowest (oldest)
    this.entries.sort(function (a, b) { return b.postNumber - a.postNumber })
  }
  
  toHTML() {
    let str = ""
    str += this.htmlDocumentPrefix()

    str += "<div id='header'><h1>" + this.title + "</h1></div>\n";


    this.sortEntries()
        
    
    // Links to every post
    
    str += "<b>All posts:</b><br />\n"
    
    for (let entry of this.entries) {
      str += "<a href='" + entry.relativeURL() + "'>" + entry.title + "</a><br />\n"
    }
    
    str += "\n"
     
     
    // Include the most recent this.entriesOnIndex posts
    let c = 0
    for (let entry of this.entries) {
      if (c < this.entriesOnIndex) {
        str += entry.htmlBody(entry.relativeURL())
        str += "\n"
      } else {
        if (c == this.entriesOnIndex) {
          str += "<br /><br />\nMore posts:<br />\n"
        }
        str += "<a href='" + entry.relativeURL() + "'>" + entry.title + "</a><br />\n"        
      }
            
      c++
    }
    
    str += this.htmlDocumentSuffix()
    
    return str
  }
  
  htmlFilename() {
    return "index.html"
  }
  
  // Relative to the website root
  relativeURL() {  
    return this.htmlFilename()
  }
}


// Entry class

class Entry extends HTMLDocument {
   constructor(filename, fileContents /* optional */) {
    super()
    
    this.filename = filename
    
    if (/DRAFT-(.+).txt/.test(filename)) {
      this.isDraft = true
      return this
    }
    
    let matches = this.filename.match(/\/(\d+)-(.+).txt/)
    
    this.postNumber = parseInt(matches[1])
    this.postLinkName = matches[2] // e.g. "this-website"
    
    let contents = fileContents ? fileContents : this.fileContents()
    
    let contentsMatches = contents.match(/^Title: ([^\r\n]+)[\r\n]+Date: (\d+\/\d+\/\d+)[\r\n]+(.+)$/ms)
    
    this.title = contentsMatches[1]
    this.dateString = contentsMatches[2]
    this.contents = contentsMatches[3]
  }
  
  fileContents() {
    return FileManager.local().readString(this.filename)
  }
  
  imageURL() {
    let result = null
    if (!this.contents) {
      return result
    }
    
    let matches = this.contents.match(/\[Image:([^\]]+)\]/)
    if (matches) {
      result = matches[1]
    }
    return result
  }

  ogImage() {
    let result = super.ogImage()
    let imageURL = this.imageURL()
    if (imageURL) {
      result = imageURL
    }
    return result
  }
  
  ogDescription() {
    let result = this.contents
    if (!result) {
      return null
    }
    result = result.replace(/\[Image:([^\]]+)\]/g, "")
    result = result.replace(/^\n+/, "")
    let origResult = result
    result = result.split(/[\s\n]+/).slice(0, 30).join(" ")
    
    if (origResult != result) {
      if (result.endsWith(".")) {
        result += " "
      }
      result += "…"
    }
    
    return result
  }
  
  toHTML() {
    let str = this.htmlDocumentPrefix()
    str += this.htmlBody()    
    str += this.htmlDocumentSuffix()
    
    return str
  }
  
  htmlDocumentPrefix() {
    let str = super.htmlDocumentPrefix()
    
    str += "<a href='/index.html'>Home</a>"
    
    return str
  }


  htmlBody(titleURL) {
    let str = ""

    // If there's no title url, this post is on its own page    
    if (!titleURL) {
      str +=
`
<div id='header'>
<h1>
${this.title}
</h1>
</div>
`
    } else {
      str +=
`
<div id='header'>
<h2>
<a href='${titleURL}'>${this.title}</a>
</h2>
</div>
`
    }
    
    
    let htmlContents = this.contents
    htmlContents = htmlContents.replace(/\n/g, "<br />\n")
    htmlContents = htmlContents.replace(/\[Image:([^\]]+)\]/g, '<img src="$1"></img>')

    let postDateStr = "<div id='postdate'>Posted on " + this.dateString + "</div>\n"
    
    // If the post starts with an image, put the "Posted on" string after the image so it's not too isolated from the post text
    // Note that this doesn't intelligently handle consecutive images at the top of a post
    if (htmlContents.startsWith("<img")) {
      htmlContents = htmlContents.replace("</img>", "</img>\n"+postDateStr)
    } else {
      str += postDateStr
    }
    
    // Remove any linebreaks after </div> to fully control margins with CSS
    htmlContents = htmlContents.replace(/<\/div>(\n*<br \/>)*/g, "</div>")
    
    str += htmlContents
    return str
  }
  
  // e.g. "this-website.html"
  htmlFilename() {
    return this.postLinkName + ".html"
  }
  
  // Relative to the website root
  // e.g. "p/this-website.html"
  relativeURL() {
    return htmlPostsSubdirectory() + "/" + this.htmlFilename()
  }
  
  // e.g. "2019-12-24T14:00:00-08:00
  // TODO: unit test this
  dateRFC3339() {
    let matches = this.dateString.match(/(\d+)\/(\d+)\/(\d+)/)
    let month = matches[1]
    let day = matches[2]
    let year = matches[3]
    return year + "-" + month + "-" + day + "T00:00:00-08:00"
  }
}


// JSONFeed class
// This class generates a JSON feed as described by https://jsonfeed.org/version/1

class JSONFeed {
  constructor(index) {
    this.index = index

    this.entriesInFeed = 40
  }
  
  feedFilename() {
    return "feed.json"
  }
  
  // e.g. "https://memalign.github.io/feed.json"
  feedURL() {
    return this.index.baseURL() + "/" + this.feedFilename()
  }
  
  // TODO: Unit test that this escapes double quotes, replaces newlines with "\n"
  escapeContent(content) {
    content = content.replace(/"/g, "\\\"")
    content = content.replace(/\n/g, "\\n")
    return content
  }
  
  // TODO: unit test: with image, without image; just an image; unit test that the image becomes a full HTTP url
  entryToItem(entry) {
// TODO: add image URL
    let imageStr = ""
    let imageURL = entry.imageURL()

    if (imageURL) {
      if (imageURL.startsWith("/")) {
        imageURL = this.index.baseURL() + imageURL
      }
      imageStr = "\n         \"image\" : \""+imageURL+"\","
    }

    let str = `    {
         "title" : "${entry.title}",
         "date_published" : "${entry.dateRFC3339()}",
         "id" : "${entry.fullURL()}",
         "url" : "${entry.fullURL()}",${imageStr}
         "author" : {
            "name" : "memalign"
         },
         "content_html" : "${this.escapeContent(entry.htmlBody(entry.fullURL()))}"
    }`
        
    return str
  }
  
  // TODO: unit test: generating a feed, enforcing entriesInFeed limit
  toJSON() {
    let jsonHeader = `{
   "version" : "https://jsonfeed.org/version/1",
   "title" : "${this.index.title}",
   "home_page_url" : "${this.index.fullURL()}",
   "feed_url" : "${this.feedURL()}",
   "author" : {
      "url" : "https://twitter.com/memalign",
      "name" : "memalign"
   },
   "icon" : "${this.index.baseURL()}/apple-touch-icon.png",
   "favicon" : "${this.index.baseURL()}/favicon.ico",
`

    let items = "   \"items\" : [\n"
    
    this.index.sortEntries()
    
    let entryStrs = this.index.entries.slice(0, this.entriesInFeed+1).map(x => this.entryToItem(x))

    items += entryStrs.join(",\n")
    
    items += "\n  ]\n"

    let jsonFooter = "}\n"
    
    return jsonHeader + items + jsonFooter
  }
  
  // TODO: unit test this
  writeFeedFile(directory) {
    let filename = directory + "/" + this.feedFilename()
    FileManager.local().writeString(filename, this.toJSON())
    console.log("Wrote feed json " + filename)
  }
}


// runScript

function runScript() {  
  let fm = FileManager.local()

  let index = new Index([])

  let entryFilenames = fm.listContents(entriesPath())
  for (entryFilename of entryFilenames) {
    console.log("Entry filename: " + entryFilename)
    let entry = new Entry(entriesPath() + "/" + entryFilename)
    if (entry.isDraft) {
      continue
    }
    console.log("=== Post #" + entry.postNumber + " (" + entry.postLinkName + ") ===")
    console.log(entry.toHTML())
    
    entry.writeHTMLDocument(htmlPostsPath())
    
    console.log("===")
    
    index.entries.push(entry)
  }
  
  index.writeHTMLDocument(repoPath())
  
  let jsonFeed = new JSONFeed(index)
  jsonFeed.writeFeedFile(repoPath())
}

console.log("=> Backing up script")
copyCurrentScriptToRepo()
console.log("=> done")

if (!UNIT_TEST) {
  runScript()
  return
}



// Unit tests

function assertTrue(condition, str) {
    if (!condition) {
      throw "Failed assertion: " + str
    }
}

class UnitTests {


// HTMLDocument class

  test_HTMLDocument_writeHTMLDocument() {
    let entry1 = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\ntest text")
    
    let fm = FileManager.local()
    let tempDir = fm.temporaryDirectory() + "/" + uuidv4()
    fm.createDirectory(tempDir)
    
    let entryFilename = tempDir + "/" + entry1.htmlFilename()

    assertTrue(!fm.fileExists(entryFilename), "file doesn't exist")    
    
    entry1.writeHTMLDocument(tempDir)

    assertTrue(fm.fileExists(entryFilename), "file exists")
    
    let fileContents = fm.readString(entryFilename)
    
    assertTrue(fileContents == entry1.toHTML(), "contents match")
    
    
    // Clean up
    fm.remove(entryFilename)
    fm.remove(tempDir)
    
    assertTrue(!fm.fileExists(entryFilename), "file doesn't exist")    
    assertTrue(!fm.fileExists(tempDir), "dir doesn't exist")
  }


// Index class

  test_Index_sortEntries() {
    let entry1 = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\ntest text")
    let entry2 = new Entry("/path/0002-some-title2.txt", "Title: This title2\nDate: 12/27/19\ntest text2")
    let entry3 = new Entry("/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/19\ntest text3")
    
    let index = new Index([entry2, entry1, entry3])
    index.sortEntries()  
    assertTrue(index.entries.map(x => x.postNumber), [3, 2, 1])
  }

  test_Index_ogDescription() {
    let entry1 = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\ntest text")
    let entry2 = new Entry("/path/0002-some-title2.txt", "Title: This title2\nDate: 12/27/19\ntest text2")
    let entry3 = new Entry("/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/19\ntest text3")
    
    let index = new Index([entry2, entry1, entry3])
    
    assertTrue(index.ogDescription() == "test text3", "most recent description")
    
    // Most recent lacks description
    entry3.contents = null
    assertTrue(index.ogDescription() == "test text2", "second description")
    
    // Next best has an empty description
    entry2.contents = "[Image:/m/test.jpg]"  
    assertTrue(entry2.ogDescription() == "", "only image yields empty desc")
    assertTrue(index.ogDescription() == "test text", "first description")
    
    // If only two entries fit on the Index page, we won't have a description
    index.entriesOnIndex = 2
    assertTrue(index.ogDescription() == null, "no desc")
  }
  
  test_Index_ogImage() {
    let entry1 = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\n[Image:/m/test1.jpg]")
    let entry2 = new Entry("/path/0002-some-title2.txt", "Title: This title2\nDate: 12/27/19\n[Image:/m/test2.jpg]")
    let entry3 = new Entry("/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/19\n[Image:/m/test3.jpg]")
    
    let index = new Index([entry2, entry1, entry3])
    
    assertTrue(index.ogImage() == "/m/test3.jpg", "most recent post image")
    
    entry3.contents = null
    
    assertTrue(index.ogImage() == "/m/test2.jpg", "second post image")
    
    entry2.contents = "just text"
    
    assertTrue(index.ogImage() == "/m/test1.jpg", "first post image")
    
    index.entriesOnIndex = 2
    
    assertTrue(index.ogImage() == "/m/shiba.jpg", "default image")
  }

  test_Index_toHTML() {
    let entry1 = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\n[Image:/m/test1.jpg]\ntext1 text1")
    let entry2 = new Entry("/path/0002-some-title2.txt", "Title: This title2\nDate: 12/27/19\ntext2 text2")
    let entry3 = new Entry("/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/19\n[Image:/m/test3.jpg]\ntext3 text3")
    
    let index = new Index([entry2, entry1, entry3])  
    
    index.entriesOnIndex = 2
    
    let expectation = `<!DOCTYPE html>
<html>
<head>
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/json" href="/feed.json" />
<title>memalign.github.io</title>
<meta property="og:title" content="memalign.github.io" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://memalign.github.io/index.html" />
<meta property="og:image" content="/m/test3.jpg" />
<meta property="og:description" content="text3 text3" />
<link rel="stylesheet" href="/style.css">
<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes'>
</head>
<body>
<div id="body">
<div id='header'><h1>memalign.github.io</h1></div>
<b>All posts:</b><br />
<a href='p/some-title3.html'>This title3</a><br />
<a href='p/some-title2.html'>This title2</a><br />
<a href='p/some-title.html'>This title</a><br />


<div id='header'>
<h2>
<a href='p/some-title3.html'>This title3</a>
</h2>
</div>
<img src="/m/test3.jpg"></img>
<div id='postdate'>Posted on 12/28/19</div>
text3 text3

<div id='header'>
<h2>
<a href='p/some-title2.html'>This title2</a>
</h2>
</div>
<div id='postdate'>Posted on 12/27/19</div>
text2 text2
<br /><br />
More posts:<br />
<a href='p/some-title.html'>This title</a><br />

</div>
<div id="footer"></div>
</body>
</html>
`
    assertTrue(index.toHTML() == expectation, "index html")
  }


// Entry class
    
  test_draftEntry() {
    let entry = new Entry("/path/DRAFT-some-title.txt", "test text")
    
    assertTrue(entry.isDraft, "Entry is draft")
  }
  
  test_regularEntry() {
    let entry = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\ntest text")  
    assertTrue(!entry.isDraft, "Entry isn't draft")
    assertTrue(entry.title == "This title", "entry title")
    assertTrue(entry.postLinkName == "some-title", "postLinkName")
    assertTrue(entry.postNumber == 1, "postNumber")
    assertTrue(entry.dateString == "12/26/19", "dateString")
    assertTrue(entry.contents == "test text", "contents")
    assertTrue(entry.htmlFilename() == "some-title.html", "Entry.htmlFilename")
    assertTrue(entry.relativeURL() == "p/some-title.html", "Entry.relativeURL")
  }
  
  test_imageURL_noImages() {
    let entry = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\ntest text")  
    assertTrue(entry.imageURL() == null, "no imageURL")
  }
  
  test_imageURL_oneImage() {
    let entry = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\n[Image:/m/test.jpg]\ntest text")  
    assertTrue(entry.imageURL() == "/m/test.jpg", "one imageURL")
  }

  test_imageURL_twoImages() {
    let entry = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\n[Image:/m/test.jpg]\n[Image:/m/test2.jpg]\ntest text")  
    assertTrue(entry.imageURL() == "/m/test.jpg", "two imageURLs")
  }

  test_htmlBody_imageRewriting() {
    let entry = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\n[Image:/m/test.jpg]\ntest text")  
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("<img src=\"/m/test.jpg\"></img>"), "Has img tag")
    assertTrue(!htmlBody.includes("[Image:/m/test.jpg]"), "Lacks Image brackets")
  }

  test_htmlBody_title_withTitleURL() {
    let entry = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\n[Image:/m/test.jpg]\ntest text")  
    let htmlBody = entry.htmlBody("p/some-title.html")
    
    assertTrue(htmlBody.includes("<div id='header'>\n<h2>\n<a href='p/some-title.html'>This title</a>"), "Has title URL")
  }

  test_htmlBody_title_withoutTitleURL() {
    let entry = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\n[Image:/m/test.jpg]\ntest text")  
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("<div id='header'>\n<h1>\nThis title\n</h1>"), "Has h1 title")
  }
  
  test_htmlBody_startsWithImage() {
    let entry = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\n[Image:/m/test.jpg]\ntest text")  
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("<img src=\"/m/test.jpg\"></img>\n<div id='postdate'>Posted on 12/26/19</div>"), "Date follows image")
    
    let toHTML = entry.toHTML()
    
    let expectation = `<!DOCTYPE html>
<html>
<head>
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/json" href="/feed.json" />
<title>This title</title>
<meta property="og:title" content="This title" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://memalign.github.io/p/some-title.html" />
<meta property="og:image" content="/m/test.jpg" />
<meta property="og:description" content="test text" />
<link rel="stylesheet" href="/style.css">
<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes'>
</head>
<body>
<div id="body">
<a href='/index.html'>Home</a>
<div id='header'>
<h1>
This title
</h1>
</div>
<img src="/m/test.jpg"></img>
<div id='postdate'>Posted on 12/26/19</div>
test text
</div>
<div id="footer"></div>
</body>
</html>
`
    assertTrue(toHTML == expectation, "toHTML matches expectation")
  }

  test_htmlBody_startsWithText() {
    let entry = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\nTest text\n[Image:/m/test.jpg]\nmore text")  
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("<div id='postdate'>Posted on 12/26/19</div>\nTest text<br />\n<img src=\"/m/test.jpg\"></img>"), "Date precedes text")
    
    let toHTML = entry.toHTML()
    let expectation = `<!DOCTYPE html>
<html>
<head>
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/json" href="/feed.json" />
<title>This title</title>
<meta property="og:title" content="This title" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://memalign.github.io/p/some-title.html" />
<meta property="og:image" content="/m/test.jpg" />
<meta property="og:description" content="Test text more text…" />
<link rel="stylesheet" href="/style.css">
<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes'>
</head>
<body>
<div id="body">
<a href='/index.html'>Home</a>
<div id='header'>
<h1>
This title
</h1>
</div>
<div id='postdate'>Posted on 12/26/19</div>
Test text<br />
<img src="/m/test.jpg"></img><br />
more text
</div>
<div id="footer"></div>
</body>
</html>
`
    assertTrue(toHTML == expectation, "toHTML equals expectation")
  }
  
  test_toHTML_noImages() {
    let entry = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\ntest text")
    let entry2 = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\n\ntest text")
    
    assertTrue(entry.toHTML() == entry2.toHTML(), "Preceding newlines ignored")  

    let expectation = `<body>
<div id="body">
<a href='/index.html'>Home</a>
<div id='header'>
<h1>
This title
</h1>
</div>
<div id='postdate'>Posted on 12/26/19</div>
test text
</div>
<div id="footer"></div>
</body>
</html>
`
    assertTrue(entry.toHTML().endsWith(expectation), "no-image entry has correct html")
  }
    
  test_htmlBody_startsWithTwoImages() {
    let entry = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\n[Image:/m/test.jpg]\n[Image:/m/test2.jpg]\ntest text")  
    let htmlBody = entry.htmlBody()
    
    // This behavior isn't good. I'm writing this test to document the existing limitation. We probably want the postdate to follow all leading images in a post instead.
    assertTrue(htmlBody.includes("<img src=\"/m/test.jpg\"></img>\n<div id='postdate'>Posted on 12/26/19</div>\n<img src=\"/m/test2.jpg\"></img>"), "Date follows first image")
  }
  
  test_ogDescription() {
    let entry = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\none two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty thirtyone")
    
    let entryWithLinebreak = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\none two three four five six seven eight nine ten eleven twelve thirteen.\nfourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty thirtyone")

    let entryWithImage = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\n[Image:/m/test.jpg]one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty thirtyone")


    let expectation = "one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty…"
    
    assertTrue(entry.ogDescription() == expectation, "Description truncated in correct place")
    assertTrue(entryWithLinebreak.ogDescription() == expectation, "Entry with linebreak truncated in correct place")
    assertTrue(entryWithImage.ogDescription() == expectation, "Description truncated in correct place")
    
    let entrySentence = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\none two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty. thirtyone")

    let expectation2 = "one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty. …"
    assertTrue(entrySentence.ogDescription() == expectation2, "Description ending with period gets correct ellipses behavior")
    
    let entryFits = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\none two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty")
    
    let expectationFits = "one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty"
    assertTrue(entryFits.ogDescription() == expectationFits, "Whole entry fits")
    
    let entryJustImage = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\n[Image:/m/test.jpg]")
    assertTrue(entryJustImage.ogDescription() == "", "empty desc")
  }
  
  test_Entry_ogImage() {
    let entryNoImages = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\ntest text")
    assertTrue(entryNoImages.ogImage() == "/m/shiba.jpg", "default ogImage")
    
    let entryOneImage = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\n[Image:/m/test.jpg]\ntest text")
    assertTrue(entryOneImage.ogImage() == "/m/test.jpg", "picks image")

    let entryTwoImages = new Entry("/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\n[Image:/m/test.jpg]\n[Image:/m/test2.jpg]\ntest text")
    assertTrue(entryTwoImages.ogImage() == "/m/test.jpg", "picks first image")
  }

// Unit test harness
            
  run() {
    let methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
    
    let passCount = 0
    for (let method of methods) {
      if (method.startsWith("test")) {
        console.log("=== Invoking " + method + " ===")
        this[method]();
        passCount++
      }
    }
    console.log(passCount + " tests passed successfully!")
  }
}

function runUnitTests() {
  let ut = new UnitTests()
  ut.run()
}
  
runUnitTests()

