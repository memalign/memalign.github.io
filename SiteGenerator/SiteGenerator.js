// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: laptop-code;

const UNIT_TEST = false


// Utilities

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
    let ogImage = "<meta property=\"og:image\" content=\"" + this.ogImage() + "\" />";
    
    let ogDesc = ""
    let desc = this.ogDescription()
    if (desc) {
      ogDesc = "<meta property=\"og:description\" content=\""+desc+"\" />"
    }
    
    
    let str =
`<!DOCTYPE html>
<html>
<head>
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<title>${this.title}</title>
<meta property="og:title" content="${this.title}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${this.fullURL()}" />
${ogImage}
${ogDesc}
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
</body>
</html>
`
    return str
  }
  
  // TODO: unit test this
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
  
  // TODO: Unit test this: no entry with image, first entry with image, second entry with image, entry off the front page with image
  ogImage() {
    let result = super.ogImage()
    
    this.sortEntries()
    
    for (let i = 0; i < this.entriesOnIndex && i < this.entries.count; ++i) {
      let entry = this.entries[i]
      let entryImageURL = entry.imageURL()
      if (entryImageURL) {
        result = entryImageURL
        break
      }
    }
    
    return result
  }
  
  // TODO: unit test this: no entry desc, first entry desc, second entry desc
  ogDescription() {
    let result = null
    
    for (let i = 0; i < this.entriesOnIndex && i < this.entries.count; ++i) {
      let entry = this.entries[i]
      let entryDesc = entry.ogDescription()
      if (entryDesc) {
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
  
  // TODO: unit test a valid file being generated
  toHTML() {
    let str = ""
    str += this.htmlDocumentPrefix()

    str += "<div id='header'><h1>" + this.title + "</h1></div>\n";
    
    // TODO: unit test that entries are written in the right order; links to every entry but only entriesOnIndex full posts

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
          str += "<br /><br />\nMore:<br />\n"
        }
        str += "<a href='" + this.urlForEntry(entry) + "'>" + entry.title + "</a><br />\n"        
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
  
  // TODO: unit test one specified image, two specified images, zero specified images
  imageURL() {
    let result = null
    let matches = this.contents.match(/\[Image:([^\]]+)\]/)
    if (matches) {
      result = matches[1]
    }
    return result
  }

  // TODO: unit test one specified image, two specified images, zero specified images  
  ogImage() {
    let result = super.ogImage()
    let imageURL = this.imageURL()
    if (imageURL) {
      result = imageURL
    }
    return result
  }
  
  // TODO: unit test with contents containing fewer than N words, exactly N words, truncated result ending with .
  ogDescription() {
    let result = this.contents
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
  
  // TODO: Unit test this
  // TODO: Unit test with an image at the very beginning, at the very end, no image
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
    
  // TODO: unit test this; with and without titleURL
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
    
    // TODO: unit test [Image:/path/img.jpg] rewriting
    // TODO: unit test post date string with a starting image, without a starting image

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
  
  // TODO: unit test this
  // e.g. "this-website.html"
  htmlFilename() {
    return this.postLinkName + ".html"
  }
  
  // TODO: unit test this
  // Relative to the website root
  // e.g. "p/this-website.html"
  relativeURL() {
    return htmlPostsSubdirectory() + "/" + this.htmlFilename()
  }
}



// runScript

function runScript() {
  console.log("=> Backing up script")
  copyCurrentScriptToRepo()
  console.log("=> done")
  
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
}

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
  } 



// Unit test harness
            
  run() {
    let methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this))
    
    for (let method of methods) {
      if (method.startsWith("test")) {
        console.log("=== Invoking " + method + " ===")
        this[method]();
        console.log("======")
      }
    }
  }
}

function runUnitTests() {
  let ut = new UnitTests()
  ut.run()
}
  
runUnitTests()

