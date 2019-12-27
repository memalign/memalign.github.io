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


// HTMLDocument class

class HTMLDocument {
  htmlDocumentPrefix() {
    let str =
`<html>
<head>
<title>${this.title}</title>
</head>
<body>
`
    
    return str
  }
  
  htmlDocumentSuffix() {
    return "\n</body>\n</html>";
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
  
  toHTML() {
    let str = ""
    str += this.htmlDocumentPrefix()

    str += "<h1>" + this.title + "</h1>\n";
    
    // TODO: unit test that entries are written in the right order; links to every entry but only entriesOnIndex full posts

    // Sort entries by postNumber, highest (newest) to lowest (oldest)
    this.entries.sort(function (a, b) { return b.postNumber - a.postNumber })
    
    
    
    // Links to every post
    
    str += "<b>All posts:</b><br />\n"
    
    for (let entry of this.entries) {
      str += "<a href='" + htmlPostsSubdirectory() + "/" + entry.htmlFilename() + "'>" + entry.title + "</a>\n"
    }
    
    str += "\n"
     
     
    // Include the most recent this.entriesOnIndex posts
    let c = 0
    for (let entry of this.entries) {
      str += entry.htmlBody()
      str += "\n"
      
      c++
      if (c >= this.entriesOnIndex) {
        break
      }
    }

    // TODO: write links to subsequent posts? "Want to keep reading?"

    
    str += this.htmlDocumentSuffix()
    
    return str
  }
  
  htmlFilename() {
    return "index.html"
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
  
  // TODO: Unit test this
  toHTML() {
    let str = this.htmlDocumentPrefix()
    str += this.htmlBody()    
    str += this.htmlDocumentSuffix()
    
    return str
  }
  
  // TODO: unit test this
  htmlBody() {
    let str = ""
    str += "<h2>"+this.title+"</h2>\n";
    str += "Posted on " + this.dateString + "<br /><br />\n"
    
    let htmlContents = this.contents
    htmlContents = htmlContents.replace(/\n/g, "<br />\n")
    
    str += htmlContents
    return str
  }
  
  // TODO: unit test this
  // e.g. "this-website.html"
  htmlFilename() {
    return this.postLinkName + ".html"
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

