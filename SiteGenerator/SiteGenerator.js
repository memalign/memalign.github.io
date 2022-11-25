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

function supportedRepoPaths() {
  let ret = []
  ret.push(FileManager.local().bookmarkedPath("memalign.github.io"))
  return ret
}

function entriesPath(repoPath) {
  return repoPath + "/entries"
}

function htmlPostsSubdirectory() {
  return "p"
}

function htmlPostsPath(repoPath) {
  return repoPath + "/" + htmlPostsSubdirectory()
}

function repoSiteGeneratorPath(repoPath) {
   return repoPath + "/SiteGenerator"
}

function copyCurrentScriptToRepo(repoPath) {
  let fm = FileManager.local()
  let destPath = repoSiteGeneratorPath(repoPath) + "/" + currentScriptFilename()
  if (fm.fileExists(destPath)) {
    fm.remove(destPath)
  }
  fm.copy(currentScriptPath(), destPath)
}

function copyCurrentScriptToRepos() {
  let repoPaths = supportedRepoPaths()
  for (let repoPath of repoPaths) {
    copyCurrentScriptToRepo(repoPath)
  }
}


// SiteConfig class

class SiteConfig {
  constructor(repoPath, siteConfigFileContents /* optional */) {
    this.repoPath = repoPath
    this.filename = repoPath + "/" + "SITECONFIG.json"
    
    let contents = siteConfigFileContents ? siteConfigFileContents : this.fileContents()
    let json = JSON.parse(contents)

    this.title = json.title
    this.baseURL = json.baseURL
    this.entriesOnIndex = json.entriesOnIndex
    this.authorName = json.authorName
    this.authorURL = json.authorURL
  }
  
  fileContents() {
    return FileManager.local().readString(this.filename)
  }
}


// HTMLDocument abstract class

class HTMLDocument {
  constructor(siteConfig) {
    this.siteConfig = siteConfig
  }
  
  baseURL() {
    return this.siteConfig.baseURL
  }
  
  fullURL() {
    return this.baseURL() + "/" + this.relativeURL();
  }
  
  makeFullURLFromURL(url) {
    if (!url.includes("://")) {
      let separator = url.startsWith("/") ? "" : "/"
      url = this.baseURL() + separator + url
    }
    return url
  }
  
  ogImage() {
    return this.makeFullURLFromURL("/m/shiba.jpg")
  }
  
  ogDescription() {
    return null
  }
  
  jsonFeedURL() {
    return "/feed.json"
  }
  
  atomFeedURL() {
    return "/feed.xml"
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
<meta charset="UTF-8">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/json" href="${this.jsonFeedURL()}" />
<link rel="alternate" type="application/atom+xml" href="${this.atomFeedURL()}" />
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
  constructor(siteConfig, entries, featured) {
    super(siteConfig)
    
    this.entries = entries
    this.featured = featured
    this.title = this.siteConfig.title
    
    this.entriesOnIndex = this.siteConfig.entriesOnIndex
    // Treat -1 as effectively infinite
    if (this.entriesOnIndex < 0) {
      this.entriesOnIndex = Number.MAX_SAFE_INTEGER
    }
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
    
    return this.makeFullURLFromURL(result)
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


    // Links to feeds
    str += "<div id='feeds'>\n"
    str += "<a href='"+this.atomFeedURL()+"'>RSS</a>"
    str += " | "
    str += "<a href='"+this.jsonFeedURL()+"'>JSON Feed</a>"
    str += "\n</div>"

    str += "<div id='header'><h1>" + this.title + "</h1></div>\n";

  
    // Show featured projects
  
    let showFeaturedProjects = this.featured && this.featured.items.length > 0    
    if (showFeaturedProjects) {
      str += "<div id='top-header'><h3>( ( ( featured projects ) ) )</h3></div>\n"
  
      str += "<div id='projects-grid'>\n"
      
      for (let featuredItem of this.featured.items) {
        str += "  <div id='projects-grid-entry'>\n"
        str += "    <a href='" + featuredItem.url + "'>\n"
        str += "    <div id='projects-grid-title'>" + featuredItem.title + "</div>\n"
        str += "    <div class='rect-img-container'><img src='" + featuredItem.imageURL + "'></div>\n"
        str += "    </a>\n"
        str += "  </div>\n" // projects-grid-entry
      }
      
      str += "</div>\n" // projects-grid
    }

  
    // List all entries
    
    this.sortEntries()

    if (this.entries.length < 15) {
      
      // Links to every post in one column
  
      str += "<div id='allposts'>\n"
      str += "<b>All posts:</b><br />\n"
      
      for (let entry of this.entries) {
        str += "<a href='" + entry.relativeURL() + "'>" + entry.title + "</a><br />\n"
      }
      
      str += "</div>\n"  

    } else {
     
      if (showFeaturedProjects) {
        str += "<div id='top-header'><h3>( ( ( posts ) ) )</h3></div>\n"
      }
    
      // Links to every post, in columns
      
      str += "<div id='allposts'>\n"
    
      let numCols = 3
      let colLength = Math.ceil(this.entries.length / numCols)
      let entryI = 0
      str += "<div id='grid'>\n"
      str += "<div id='grid-entry'>\n"
      for (let entry of this.entries) {
        if (entryI+1 > colLength) {  
          str += "</div>"
          str += "<div id='grid-entry'>\n"
          entryI = 0
        }
        
        str += "<a href='" + entry.relativeURL() + "'>" + entry.title + "</a><br />\n"
        
        entryI++
      }
      str += "</div>\n" // grid-entry
      str += "</div>\n" // grid
      str += "</div>\n" // allposts
    }

  
    // Include the most recent this.entriesOnIndex posts
    
    let c = 0
    for (let entry of this.entries) {
      if (c < this.entriesOnIndex) {
        // Add a visual separator between posts
        str += "<hr />\n"
        
        str += entry.htmlBody(entry.relativeURL())
        str += "\n"
      } else {
        if (c == this.entriesOnIndex) {
          str += "<hr />\nMore posts:<br />\n"
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


// TagsIndex class

class TagsIndex extends HTMLDocument {
  constructor(siteConfig, entries) {
    super(siteConfig)
    
    this.entries = entries
    this.title = `${this.siteConfig.title} tags`
  }
  
  ogImage() {
    let result = super.ogImage()
    
    this.sortEntries()
    
    for (let i = 0; i < this.entries.length; ++i) {
      let entry = this.entries[i]
      let entryImageURL = entry.imageURL()
      if (entryImageURL) {
        result = entryImageURL
        break
      }
    }
    
    return this.makeFullURLFromURL(result)
  }
  
  ogDescription() {
    return `${this.siteConfig.title} posts organized by tag`
  }
  
  sortEntries() {
    // Sort entries by postNumber, highest (newest) to lowest (oldest)
    this.entries.sort(function (a, b) { return b.postNumber - a.postNumber })
  }
  
  htmlDocumentPrefix() {
    let str = super.htmlDocumentPrefix()
    
    str += "<a href='/index.html'>Home</a>"
    
    return str
  }

  
  toHTML() {
    let str = ""
    str += this.htmlDocumentPrefix()

    str += `<div id='header'><h1>${this.title}</h1></div>\n`;

    this.sortEntries()

    // List every tag and its entries

    let allTags = new Set()
    for (let entry of this.entries) {
       entry.tags.forEach(t => allTags.add(t))
    }
    let sortedTags = Array.from(allTags).sort()

    str += "<div id='allposts'>\n"
    
    str += "<div id='grid'>\n"
    for (let tag of sortedTags) {
      str += "<div id='grid-entry'>\n"
      str += `<h4>${tag}</h4><br />` 
      
      for (let entry of this.entries) {
        if (entry.tags.includes(tag)) {  
          str += "<a href='" + entry.relativeURL() + "'>" + entry.title + "</a><br />\n"
        }
      }
      
      str += "</div>\n"
    }
    str += "</div>\n"
    
    str += "</div>\n" // allposts
    
    str += this.htmlDocumentSuffix()
    
    return str
  }
  
  htmlFilename() {
    return "tags.html"
  }
  
  // Relative to the website root
  relativeURL() {  
    return this.htmlFilename()
  }
}

// FeaturedItem class

class FeaturedItem {
  // Properties:
  // - title
  // - url
  // - imageURL
  constructor(str) {
    let lines = str.split("\n")
    this.title = lines[0]  
    this.imageURL = lines[1].match(/- Image: (.+)/)[1]
    this.url = lines[2].match(/- (.+)/)[1]
  }
}

// Featured class

class Featured {
  constructor(filename, fileContents /* optional */) {
    this.filename = filename
    
    let contents = fileContents ? fileContents : this.fileContents()
    
    this.items = contents.trim().split("\n\n").map(str => new FeaturedItem(str))
  }
  
  fileContents() {
    return FileManager.local().readString(this.filename)
  }
}

// Entry class

class Entry extends HTMLDocument {
   constructor(siteConfig, filename, fileContents /* optional */) {
    super(siteConfig)
    
    this.filename = filename
    
    if (/DRAFT-(.+).txt/.test(filename)) {
      this.isDraft = true
      return this
    }
    
    let matches = this.filename.match(/\/(\d+)-(.+).txt/)
    
    this.postNumber = parseInt(matches[1])
    this.postLinkName = matches[2] // e.g. "this-website"
    
    let contents = fileContents ? fileContents : this.fileContents()
    
    let contentsMatches = contents.match(/^Title: ([^\r\n]+)[\r\n]+Date: (\d+\/\d+\/\d{4})[\r\n]+Tags:(| ([^\r\n]+))[\r\n]+(.+)$/ms)
    
    if (!contentsMatches) {
      console.log("Entry header doesn't match required format. Make sure to use a 4-digit year.")
      throw "Entry header doesn't match requirement: " + contents
    }
    
    this.title = contentsMatches[1]
    this.dateString = contentsMatches[2]
    
    if (contentsMatches[3].length > 0) {
      this.tags = contentsMatches[4].split(/, */).filter(x => x.length > 0)
    } else {
      this.tags = []
    }
    
    this.contents = contentsMatches[5]
  }
  
  fileContents() {
    return FileManager.local().readString(this.filename)
  }
  
  imageURL() {
    let result = null
    if (!this.contents) {
      return result
    }
    
    // Exclude mp4 since it's technically a video
    let matches = this.contents.match(/\[Image:([^\]]+[^4])\]/)
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
    return this.makeFullURLFromURL(result)
  }
  
  ogDescription() {
    let result = this.contents
    if (!result) {
      return null
    }
    

    // Strip tags for this simple page summary
    result = result.replace(/\[Image:([^\]]+)\]/g, "")
    result = result.replace(/\[\/?Code\]/g, "")
    result = result.replace(/\[\/?Quote\]/g, "")
    result = result.replace(/\[Link:([^\]]+)\]/g, "")
    result = result.replace(/\[Link\]([^\[]+)/g, '$1')
    result = result.replace(/\[\/Link\]/g, "")
    result = result.replace(/\[SectionTitle:([^\]]+)\]/g, '$1')
    result = result.replace(/\[ParagraphTitle:([^\]]+)\]/g, '$1')
    result = result.replace(/\[ContinueReadingWithURLTitle:([^\]]+)\]/g, "")    
    
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
  
    str += "<div id='post'>"

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
    
    
    var htmlContents = this.contents
    
    // [ContinueReadingWithURLTitle:] support
    if (titleURL) {
      let matches = htmlContents.match(/\[ContinueReadingWithURLTitle:([^\]]+)\]/)  
      if (matches) {
        let continueReadingURLTitle = matches[1]
        htmlContents = htmlContents.split("[ContinueReadingWithURLTitle")[0]  
        htmlContents += `[ParagraphTitle:[Link:${titleURL}]${continueReadingURLTitle}[/Link]]`
      }
    } else {  
      // This is the post's dedicated page. Omit the Continue Reading link.
      htmlContents = htmlContents.replace(/\[ContinueReadingWithURLTitle:([^\]]+)\]\n/g, '')
    }
    

    // [Code] support
    
    // Escape HTML code
    var htmlContentsWithEscapedCode = ""
    var lineBreak = ""
    var inCodeBlock = false
    for (let line of htmlContents.split("\n")) {  
      if (inCodeBlock) {
        htmlContentsWithEscapedCode += lineBreak + this.escapeHTML(line)
      } else {
        htmlContentsWithEscapedCode += lineBreak + line
      }
      lineBreak = "\n"
        
      if (line.includes("[Code]")) {
        inCodeBlock = true
      } else if (line.includes("[/Code]")) {
        inCodeBlock = false
      }
    }
    
    htmlContents = htmlContentsWithEscapedCode
    
    htmlContents = htmlContents.replace(/\[Code\]\n*/g, "<div id='code'>")
    htmlContents = htmlContents.replace(/\n*\[\/Code\]/g, "</div>")
  
    // [Quote] support
    htmlContents = htmlContents.replace(/\[Quote\]\n*/g, "<blockquote>")
    htmlContents = htmlContents.replace(/\n*\[\/Quote\]/g, "</blockquote>")


    // [Image] support: mp4
    htmlContents = htmlContents.replace(/\[Image:([^\]]+[mM][pP]4)\]/g, '<video muted loop autoplay playsinline disablepictureinpicture="" src="$1" type="video/mp4"></video>')

    // [Image] support
    htmlContents = htmlContents.replace(/\[Image:([^\]]+)\]/g, '<img src="$1"></img>')
    
    // [Link] support
    htmlContents = htmlContents.replace(/\[Link:([^\]]+)\]/g, '<a href="$1">')
    htmlContents = htmlContents.replace(/\[Link\]([^\[]+)/g, '<a href="$1">$1')
    htmlContents = htmlContents.replace(/\[\/Link\]/g, '</a>')
    
    // Handle Titles after other tags so that tags (such as Link) can be used within titles. For example:    
    // [ParagraphTitle:[Link:https://www.lexaloffle.com/bbs/?pid=mb_advent2019]Snowfight[/Link]]  
    // Since this isn't a real parser, the inner-most tag's text replacement needs to happen first
    
    // [SectionTitle:] support
    htmlContents = htmlContents.replace(/\[SectionTitle:([^\]]+)\]/g, '<h3>$1</h3>')

    // [ParagraphTitle:] support
    htmlContents = htmlContents.replace(/\[ParagraphTitle:([^\]]+)\]/g, '<h4>$1</h4>')

    
    // Indentation support
    htmlContents = htmlContents.replace(/^( +)/gm, (match) => '&nbsp;'.repeat(match.length))

    htmlContents = htmlContents.replace(/\n/g, "<br />\n")


    let tagsStr = ""
    if (this.tags.length > 0) {
      tagsStr = "<br />\nTags: "
      let comma = ""
      for (let tag of this.tags) {
        tagsStr += `${comma}<a href='/tags.html'>${tag}</a>`
        comma = ", "
      } 
    }

    let postDateStr = "<div id='postdate'>Posted on " + this.dateString + tagsStr + "</div>\n"
    
    // If the post starts with an image, put the "Posted on" string after the image so it's not too isolated from the post text
    // Note that this doesn't intelligently handle consecutive images at the top of a post
    if (htmlContents.startsWith("<img")) {
      htmlContents = htmlContents.replace("</img>", "</img>\n"+postDateStr)
    } else {
      str += postDateStr
    }
    
    // The </img> tags helped us format the post but it's not valid HTML, remove them
    // https://stackoverflow.com/questions/14860492/how-to-close-img-tag-properly
    htmlContents = htmlContents.replace(new RegExp('</img>', 'g'), "")
    
    // Remove any linebreaks after </div> to fully control margins with CSS
    htmlContents = htmlContents.replace(/<\/div>(\n*<br \/>)*/g, "</div>")
    // Same for blockquote
    htmlContents = htmlContents.replace(/<\/blockquote>(\n*<br \/>)*/g, "</blockquote>")
    
    str += htmlContents
    
    str += "\n</div>\n"
    
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
  
  // e.g. "https://memalign.github.io/p/"
  fullBaseURL() {
    return this.baseURL() + "/" + htmlPostsSubdirectory() + "/"
  }
  
  // https://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
  escapeHTML(line) {
    return line
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
  }
  
  // e.g. "2019-12-24T14:00:00-08:00
  dateRFC3339() {
    let matches = this.dateString.match(/(\d+)\/(\d+)\/(\d+)/)
    var month = matches[1]
    if (month.length == 1) {
      month = "0" + month
    }
    
    var day = matches[2]
    if (day.length == 1) {
      day = "0" + day
    }
    
    let year = matches[3]
    return year + "-" + month + "-" + day + "T00:00:00-08:00"
  }
}


// Feed abstract class

class Feed {
  constructor(index) {
    this.index = index
    this.entriesInFeed = 40
  }
  
  // e.g. "https://memalign.github.io/feed.json"
  feedURL() {
    return this.index.baseURL() + "/" + this.feedFilename()
  }
  
  writeFeedFile(directory) {
    let filename = directory + "/" + this.feedFilename()
    FileManager.local().writeString(filename, this.toText())
    console.log("Wrote feed " + filename)
  }
}

// JSONFeed class
// This class generates a JSON feed as described by https://jsonfeed.org/version/1

class JSONFeed extends Feed {
  feedFilename() {
    return "feed.json"
  }
  
  escapeContent(content) {
    content = content.replace(/\\/g, "\\\\")
    content = content.replace(/"/g, "\\\"")
    content = content.replace(/\n/g, "\\n")
    content = content.replace(/\t/g, "\\t")
    return content
  }
  
  entryToItem(entry) {
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
            "name" : "${this.index.siteConfig.authorName}"
         },
         "content_html" : "${this.escapeContent(entry.htmlBody(entry.fullURL()))}"
    }`
        
    return str
  }
  
  toText() {
    let jsonHeader = `{
   "version" : "https://jsonfeed.org/version/1",
   "title" : "${this.index.title}",
   "home_page_url" : "${this.index.fullURL()}",
   "feed_url" : "${this.feedURL()}",
   "author" : {
      "url" : "${this.index.siteConfig.authorURL}",
      "name" : "${this.index.siteConfig.authorName}"
   },
   "icon" : "${this.index.baseURL()}/apple-touch-icon.png",
   "favicon" : "${this.index.baseURL()}/favicon.ico",
`

    let items = "   \"items\" : [\n"
    
    this.index.sortEntries()
    
    let entryStrs = this.index.entries.slice(0, this.entriesInFeed).map(x => this.entryToItem(x))

    items += entryStrs.join(",\n")
    
    items += "\n  ]\n"

    let jsonFooter = "}\n"
    
    return jsonHeader + items + jsonFooter
  }
}

// AtomFeed class
// This class generates an Atom feed as described by http://www.w3.org/2005/Atom and https://tools.ietf.org/html/rfc4287

class AtomFeed extends Feed {
  feedFilename() {
    return "feed.xml"
  }
  
  entryToItem(entry) {
    let str = `<entry>
<title>${entry.title}</title>
<link rel="alternate" type="text/html" href="${entry.fullURL()}" />
<link rel="related" type="text/html" href="${entry.fullURL()}" />
<id>${entry.fullURL()}</id>
<published>${entry.dateRFC3339()}</published>
<updated>${entry.dateRFC3339()}</updated>
<author>
<name>${this.index.siteConfig.authorName}</name>
<uri>${this.index.fullURL()}</uri>
</author>
<content type="html" xml:base="${entry.fullBaseURL()}" xml:lang="en"><![CDATA[
${entry.htmlBody(entry.fullURL())}
]]>
</content>
</entry>
`        
    return str
  }
  
  toText() {
    this.index.sortEntries()
    let lastUpdated = this.index.entries[0].dateRFC3339()
    let updatedYear = lastUpdated.substring(0, 4)
    
    let atomHeader = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<title>${this.index.title}</title>
<subtitle>By ${this.index.siteConfig.authorName}</subtitle>
<link rel="alternate" type="text/html" href="${this.index.fullURL()}" />
<link rel="self" type="application/atom+xml" href="${this.feedURL()}" />
<id>${this.feedURL()}</id>
<updated>${lastUpdated}</updated>
<rights>Copyright © ${updatedYear}, ${this.index.siteConfig.authorName}</rights>
<icon>${this.index.baseURL()}/apple-touch-icon.png</icon>
<logo>${this.index.baseURL()}/apple-touch-icon.png</logo>
`

    let entryStrs = this.index.entries.slice(0, this.entriesInFeed).map(x => this.entryToItem(x))

    let items = entryStrs.join("\n")

    let atomFooter = "</feed><!-- THE END -->\n"
    
    return atomHeader + items + atomFooter
  }
}


// runScript

function generateSiteInRepo(repoPath) {
  let fm = FileManager.local()
  
  let siteConfig = new SiteConfig(repoPath)

  let entries = []
  let featured = null

  let entryFilenames = fm.listContents(entriesPath(repoPath))
  for (entryFilename of entryFilenames) {
    console.log("Entry filename: " + entryFilename)
    let entryFullPath = entriesPath(repoPath) + "/" + entryFilename
    
    if (entryFilename == "FEATURED.txt") {
      featured = new Featured(entryFullPath)
      continue
    }
    
    let entry = new Entry(siteConfig, entryFullPath)
    if (entry.isDraft) {
      continue
    }
    console.log("=== Post #" + entry.postNumber + " (" + entry.postLinkName + ") ===")
    console.log(entry.toHTML())
    
    entry.writeHTMLDocument(htmlPostsPath(repoPath))
    
    console.log("===")
    
    entries.push(entry)
  }
    
  let index = new Index(siteConfig, entries, featured)
  
  index.writeHTMLDocument(repoPath)
  
  let tagsIndex = new TagsIndex(siteConfig, index.entries)
  tagsIndex.writeHTMLDocument(repoPath)
  
  let jsonFeed = new JSONFeed(index)
  jsonFeed.writeFeedFile(repoPath)
  
  let atomFeed = new AtomFeed(index)
  atomFeed.writeFeedFile(repoPath)
}

function runScript() {
  let repoPaths = supportedRepoPaths()
  for (let repoPath of repoPaths) {  
    generateSiteInRepo(repoPath)  
  }
}

console.log("=> Backing up script")
copyCurrentScriptToRepos()
console.log("=> done")

if (!UNIT_TEST) {
  runScript()
  return
}



// Unit tests

function assertTrue(condition, str) {
    if (!condition) {
      throw "Failed assertion: " + str + "\n" + (new Error()).stack  
    }
}

function assertEqual(str1, str2) {  
  if (str1 != str2) {  
    let str = "Failed assertion: \"" + str1 + "\" does not equal \"" + str2  + "\""  
    console.log(str)  
    throw str + "\n" + (new Error()).stack
  }
}

class UnitTests {
  
  siteConfig() {
    return new SiteConfig("/path/to/repo", `{
  "title":"memalign.github.io",
  "baseURL":"https://memalign.github.io",
  "entriesOnIndex":15,
  "authorName":"memalign",
  "authorURL":"https://twitter.com/memalign"
}
`)
  }

// HTMLDocument class

  test_HTMLDocument_writeHTMLDocument() {
    let entry1 = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\ntest text")
    
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

  test_HTMLDocument_writeHTMLDocument_missingTagsLine() {
    let caughtException = false
    try {
      let entry1 = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\ntest text")  
    } catch (e) {
      caughtException = true
    }
    
    assertTrue(caughtException, "Missing tags line causes exception")
  }
  
  test_HTMLDocument_makeFullURLFromURL() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\ntest text")
  
    assertTrue(entry.makeFullURLFromURL("https://example.com/m/image.jpg") == "https://example.com/m/image.jpg", "already full url")
    assertTrue(entry.makeFullURLFromURL("/m/image.jpg") == "https://memalign.github.io/m/image.jpg", "absolute url")
    assertTrue(entry.makeFullURLFromURL("m/image.jpg") == "https://memalign.github.io/m/image.jpg", "relative url")
  }

// Index class

  test_Index_sortEntries() {
    let entry1 = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\ntest text")
    let entry2 = new Entry(this.siteConfig(), "/path/0002-some-title2.txt", "Title: This title2\nDate: 12/27/2019\nTags: Tag1, Tag2\ntest text2")
    let entry3 = new Entry(this.siteConfig(), "/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/2019\nTags:\ntest text3")
    
    let index = new Index(this.siteConfig(), [entry2, entry1, entry3])
    index.sortEntries()  
    assertTrue(index.entries.map(x => x.postNumber), [3, 2, 1])
  }

  test_Index_ogDescription() {
    let entry1 = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\ntest text")
    let entry2 = new Entry(this.siteConfig(), "/path/0002-some-title2.txt", "Title: This title2\nDate: 12/27/2019\nTags: Tag1, Tag2\ntest text2")
    let entry3 = new Entry(this.siteConfig(), "/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/2019\nTags: Tag with spaces,Tag2\ntest text3")
    
    let index = new Index(this.siteConfig(), [entry2, entry1, entry3])
    
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
    let entry1 = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags:\n[Image:/m/test1.jpg]")
    let entry2 = new Entry(this.siteConfig(), "/path/0002-some-title2.txt", "Title: This title2\nDate: 12/27/2019\nTags: Tag1\n[Image:/m/test2.jpg]")
    let entry3 = new Entry(this.siteConfig(), "/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/2019\nTags: Tag1,Tag2\n[Image:/m/test3.jpg]")
    
    let index = new Index(this.siteConfig(), [entry2, entry1, entry3])
    
    assertTrue(index.ogImage() == "https://memalign.github.io/m/test3.jpg", "most recent post image")
    
    entry3.contents = null
    
    assertTrue(index.ogImage() == "https://memalign.github.io/m/test2.jpg", "second post image")
    
    entry2.contents = "just text"
    
    assertTrue(index.ogImage() == "https://memalign.github.io/m/test1.jpg", "first post image")
    
    index.entriesOnIndex = 2
    
    assertTrue(index.ogImage() == "https://memalign.github.io/m/shiba.jpg", "default image")
  }

  test_Index_toHTML() {
    let entry1 = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Image:/m/test1.jpg]\ntext1 text1")
    let entry2 = new Entry(this.siteConfig(), "/path/0002-some-title2.txt", "Title: This title2\nDate: 12/27/2019\nTags: Tag2\ntext2 text2")
    let entry3 = new Entry(this.siteConfig(), "/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    
    let index = new Index(this.siteConfig(), [entry2, entry1, entry3])  
    
    index.entriesOnIndex = 2
    
    let expectation = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/json" href="/feed.json" />
<link rel="alternate" type="application/atom+xml" href="/feed.xml" />
<title>memalign.github.io</title>
<meta property="og:title" content="memalign.github.io" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://memalign.github.io/index.html" />
<meta property="og:image" content="https://memalign.github.io/m/test3.jpg" />
<meta property="og:description" content="text3 text3" />
<link rel="stylesheet" href="/style.css">
<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes'>
</head>
<body>
<div id="body">
<div id='feeds'>
<a href='/feed.xml'>RSS</a> | <a href='/feed.json'>JSON Feed</a>
</div><div id='header'><h1>memalign.github.io</h1></div>
<div id='allposts'>
<b>All posts:</b><br />
<a href='p/some-title3.html'>This title3</a><br />
<a href='p/some-title2.html'>This title2</a><br />
<a href='p/some-title.html'>This title</a><br />
</div>
<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title3.html'>This title3</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>iTag</a>, <a href='/tags.html'>iTag2</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title2.html'>This title2</a>
</h2>
</div>
<div id='postdate'>Posted on 12/27/2019<br />
Tags: <a href='/tags.html'>Tag2</a></div>
text2 text2
</div>

<hr />
More posts:<br />
<a href='p/some-title.html'>This title</a><br />

</div>
<div id="footer"></div>
</body>
</html>
`
  
    assertEqual(index.toHTML(), expectation)
  }
  
  test_Index_toHTML_oneEntryIncludesContinueReading() {
    let entry1 = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Image:/m/test1.jpg]\ntext1 text1")
    let entry2 = new Entry(this.siteConfig(), "/path/0002-some-title2.txt", "Title: This title2\nDate: 12/27/2019\nTags: Tag2\ntext2 text2")
    let entry3 = new Entry(this.siteConfig(), "/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3\nMy nice entry.\n\n[ContinueReadingWithURLTitle:Continue reading]\n\nNext line goes here.")
    
    let index = new Index(this.siteConfig(), [entry2, entry1, entry3])  
    
    index.entriesOnIndex = 2
    
    let expectation = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/json" href="/feed.json" />
<link rel="alternate" type="application/atom+xml" href="/feed.xml" />
<title>memalign.github.io</title>
<meta property="og:title" content="memalign.github.io" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://memalign.github.io/index.html" />
<meta property="og:image" content="https://memalign.github.io/m/test3.jpg" />
<meta property="og:description" content="text3 text3 My nice entry. Next line goes here. …" />
<link rel="stylesheet" href="/style.css">
<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes'>
</head>
<body>
<div id="body">
<div id='feeds'>
<a href='/feed.xml'>RSS</a> | <a href='/feed.json'>JSON Feed</a>
</div><div id='header'><h1>memalign.github.io</h1></div>
<div id='allposts'>
<b>All posts:</b><br />
<a href='p/some-title3.html'>This title3</a><br />
<a href='p/some-title2.html'>This title2</a><br />
<a href='p/some-title.html'>This title</a><br />
</div>
<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title3.html'>This title3</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>iTag</a>, <a href='/tags.html'>iTag2</a></div>
text3 text3<br />
My nice entry.<br />
<br />
<h4><a href="p/some-title3.html">Continue reading</a></h4>
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title2.html'>This title2</a>
</h2>
</div>
<div id='postdate'>Posted on 12/27/2019<br />
Tags: <a href='/tags.html'>Tag2</a></div>
text2 text2
</div>

<hr />
More posts:<br />
<a href='p/some-title.html'>This title</a><br />

</div>
<div id="footer"></div>
</body>
</html>
`
  
    assertEqual(index.toHTML(), expectation)
  }

  test_Index_toHTML_enoughPostsToListInColumns() {
    let siteConfig = new SiteConfig("/path/to/repo", `{
  "title":"memalign.github.io",
  "baseURL":"https://memalign.github.io",
  "entriesOnIndex":2,
  "authorName":"memalign",
  "authorURL":"https://twitter.com/memalign"
}    
`)
    
    let entry1 = new Entry(siteConfig, "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Image:/m/test1.jpg]\ntext1 text1")
    let entry2 = new Entry(siteConfig, "/path/0002-some-title2.txt", "Title: This title2\nDate: 12/27/2019\nTags: Tag2\ntext2 text2")
    let entry3 = new Entry(siteConfig, "/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry4 = new Entry(siteConfig, "/path/0004-some-title4.txt", "Title: This title4\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry5 = new Entry(siteConfig, "/path/0005-some-title5.txt", "Title: This title5\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry6 = new Entry(siteConfig, "/path/0006-some-title6.txt", "Title: This title6\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry7 = new Entry(siteConfig, "/path/0007-some-title7.txt", "Title: This title7\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry8 = new Entry(siteConfig, "/path/0008-some-title8.txt", "Title: This title8\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry9 = new Entry(siteConfig, "/path/0009-some-title9.txt", "Title: This title9\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry10 = new Entry(siteConfig, "/path/0010-some-title10.txt", "Title: This title10\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry11 = new Entry(siteConfig, "/path/0011-some-title11.txt", "Title: This title11\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry12 = new Entry(siteConfig, "/path/0012-some-title12.txt", "Title: This title12P\nDate: 12/28/2019\nTags: iTag, iTag2, Programming\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry13 = new Entry(siteConfig, "/path/0013-some-title13.txt", "Title: This title13L\nDate: 12/28/2019\nTags: iTag, iTag2, Leisure\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry14 = new Entry(siteConfig, "/path/0014-some-title14.txt", "Title: This title14IF\nDate: 12/28/2019\nTags: iTag, iTag2, Interactive Fiction\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry15 = new Entry(siteConfig, "/path/0015-some-title15.txt", "Title: This title15IF\nDate: 12/28/2019\nTags: Interactive Fiction\n[Image:/m/test3.jpg]\ntext3 text3")

    
    let index = new Index(siteConfig, [entry2, entry1, entry3, entry4, entry5, entry6, entry7, entry8, entry9, entry10, entry11, entry12, entry13, entry14, entry15])  
    
    let expectation = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/json" href="/feed.json" />
<link rel="alternate" type="application/atom+xml" href="/feed.xml" />
<title>memalign.github.io</title>
<meta property="og:title" content="memalign.github.io" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://memalign.github.io/index.html" />
<meta property="og:image" content="https://memalign.github.io/m/test3.jpg" />
<meta property="og:description" content="text3 text3" />
<link rel="stylesheet" href="/style.css">
<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes'>
</head>
<body>
<div id="body">
<div id='feeds'>
<a href='/feed.xml'>RSS</a> | <a href='/feed.json'>JSON Feed</a>
</div><div id='header'><h1>memalign.github.io</h1></div>
<div id='allposts'>
<div id='grid'>
<div id='grid-entry'>
<a href='p/some-title15.html'>This title15IF</a><br />
<a href='p/some-title14.html'>This title14IF</a><br />
<a href='p/some-title13.html'>This title13L</a><br />
<a href='p/some-title12.html'>This title12P</a><br />
<a href='p/some-title11.html'>This title11</a><br />
</div><div id='grid-entry'>
<a href='p/some-title10.html'>This title10</a><br />
<a href='p/some-title9.html'>This title9</a><br />
<a href='p/some-title8.html'>This title8</a><br />
<a href='p/some-title7.html'>This title7</a><br />
<a href='p/some-title6.html'>This title6</a><br />
</div><div id='grid-entry'>
<a href='p/some-title5.html'>This title5</a><br />
<a href='p/some-title4.html'>This title4</a><br />
<a href='p/some-title3.html'>This title3</a><br />
<a href='p/some-title2.html'>This title2</a><br />
<a href='p/some-title.html'>This title</a><br />
</div>
</div>
</div>
<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title15.html'>This title15IF</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>Interactive Fiction</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title14.html'>This title14IF</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>iTag</a>, <a href='/tags.html'>iTag2</a>, <a href='/tags.html'>Interactive Fiction</a></div>
text3 text3
</div>

<hr />
More posts:<br />
<a href='p/some-title13.html'>This title13L</a><br />
<a href='p/some-title12.html'>This title12P</a><br />
<a href='p/some-title11.html'>This title11</a><br />
<a href='p/some-title10.html'>This title10</a><br />
<a href='p/some-title9.html'>This title9</a><br />
<a href='p/some-title8.html'>This title8</a><br />
<a href='p/some-title7.html'>This title7</a><br />
<a href='p/some-title6.html'>This title6</a><br />
<a href='p/some-title5.html'>This title5</a><br />
<a href='p/some-title4.html'>This title4</a><br />
<a href='p/some-title3.html'>This title3</a><br />
<a href='p/some-title2.html'>This title2</a><br />
<a href='p/some-title.html'>This title</a><br />

</div>
<div id="footer"></div>
</body>
</html>
`

    assertTrue(index.toHTML() == expectation, "index html")
  }
  
  test_Index_toHTML_negativeEntriesOnIndex() {
    let siteConfig = new SiteConfig("/path/to/repo", `{
  "title":"memalign.github.io",
  "baseURL":"https://memalign.github.io",
  "entriesOnIndex":-1,
  "authorName":"memalign",
  "authorURL":"https://twitter.com/memalign"
}    
`)
    
    let entry1 = new Entry(siteConfig, "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Image:/m/test1.jpg]\ntext1 text1")
    let entry2 = new Entry(siteConfig, "/path/0002-some-title2.txt", "Title: This title2\nDate: 12/27/2019\nTags: Tag2\ntext2 text2")
    let entry3 = new Entry(siteConfig, "/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry4 = new Entry(siteConfig, "/path/0004-some-title4.txt", "Title: This title4\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry5 = new Entry(siteConfig, "/path/0005-some-title5.txt", "Title: This title5\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry6 = new Entry(siteConfig, "/path/0006-some-title6.txt", "Title: This title6\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry7 = new Entry(siteConfig, "/path/0007-some-title7.txt", "Title: This title7\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry8 = new Entry(siteConfig, "/path/0008-some-title8.txt", "Title: This title8\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry9 = new Entry(siteConfig, "/path/0009-some-title9.txt", "Title: This title9\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry10 = new Entry(siteConfig, "/path/0010-some-title10.txt", "Title: This title10\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry11 = new Entry(siteConfig, "/path/0011-some-title11.txt", "Title: This title11\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry12 = new Entry(siteConfig, "/path/0012-some-title12.txt", "Title: This title12P\nDate: 12/28/2019\nTags: iTag, iTag2, Programming\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry13 = new Entry(siteConfig, "/path/0013-some-title13.txt", "Title: This title13L\nDate: 12/28/2019\nTags: iTag, iTag2, Leisure\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry14 = new Entry(siteConfig, "/path/0014-some-title14.txt", "Title: This title14IF\nDate: 12/28/2019\nTags: iTag, iTag2, Interactive Fiction\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry15 = new Entry(siteConfig, "/path/0015-some-title15.txt", "Title: This title15IF\nDate: 12/28/2019\nTags: Interactive Fiction\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry16 = new Entry(siteConfig, "/path/0016-some-title16.txt", "Title: This title16IF\nDate: 11/24/2022\nTags: Interactive Fiction\n[Image:/m/test3.jpg]\ntext3 text3")

    
    let index = new Index(siteConfig, [entry2, entry1, entry3, entry4, entry5, entry6, entry7, entry8, entry9, entry10, entry11, entry12, entry13, entry14, entry15, entry16])  
    
    let expectation = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/json" href="/feed.json" />
<link rel="alternate" type="application/atom+xml" href="/feed.xml" />
<title>memalign.github.io</title>
<meta property="og:title" content="memalign.github.io" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://memalign.github.io/index.html" />
<meta property="og:image" content="https://memalign.github.io/m/test3.jpg" />
<meta property="og:description" content="text3 text3" />
<link rel="stylesheet" href="/style.css">
<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes'>
</head>
<body>
<div id="body">
<div id='feeds'>
<a href='/feed.xml'>RSS</a> | <a href='/feed.json'>JSON Feed</a>
</div><div id='header'><h1>memalign.github.io</h1></div>
<div id='allposts'>
<div id='grid'>
<div id='grid-entry'>
<a href='p/some-title16.html'>This title16IF</a><br />
<a href='p/some-title15.html'>This title15IF</a><br />
<a href='p/some-title14.html'>This title14IF</a><br />
<a href='p/some-title13.html'>This title13L</a><br />
<a href='p/some-title12.html'>This title12P</a><br />
<a href='p/some-title11.html'>This title11</a><br />
</div><div id='grid-entry'>
<a href='p/some-title10.html'>This title10</a><br />
<a href='p/some-title9.html'>This title9</a><br />
<a href='p/some-title8.html'>This title8</a><br />
<a href='p/some-title7.html'>This title7</a><br />
<a href='p/some-title6.html'>This title6</a><br />
<a href='p/some-title5.html'>This title5</a><br />
</div><div id='grid-entry'>
<a href='p/some-title4.html'>This title4</a><br />
<a href='p/some-title3.html'>This title3</a><br />
<a href='p/some-title2.html'>This title2</a><br />
<a href='p/some-title.html'>This title</a><br />
</div>
</div>
</div>
<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title16.html'>This title16IF</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 11/24/2022<br />
Tags: <a href='/tags.html'>Interactive Fiction</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title15.html'>This title15IF</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>Interactive Fiction</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title14.html'>This title14IF</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>iTag</a>, <a href='/tags.html'>iTag2</a>, <a href='/tags.html'>Interactive Fiction</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title13.html'>This title13L</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>iTag</a>, <a href='/tags.html'>iTag2</a>, <a href='/tags.html'>Leisure</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title12.html'>This title12P</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>iTag</a>, <a href='/tags.html'>iTag2</a>, <a href='/tags.html'>Programming</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title11.html'>This title11</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>iTag</a>, <a href='/tags.html'>iTag2</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title10.html'>This title10</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>iTag</a>, <a href='/tags.html'>iTag2</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title9.html'>This title9</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>iTag</a>, <a href='/tags.html'>iTag2</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title8.html'>This title8</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>iTag</a>, <a href='/tags.html'>iTag2</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title7.html'>This title7</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>iTag</a>, <a href='/tags.html'>iTag2</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title6.html'>This title6</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>iTag</a>, <a href='/tags.html'>iTag2</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title5.html'>This title5</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>iTag</a>, <a href='/tags.html'>iTag2</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title4.html'>This title4</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>iTag</a>, <a href='/tags.html'>iTag2</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title3.html'>This title3</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>iTag</a>, <a href='/tags.html'>iTag2</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title2.html'>This title2</a>
</h2>
</div>
<div id='postdate'>Posted on 12/27/2019<br />
Tags: <a href='/tags.html'>Tag2</a></div>
text2 text2
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title.html'>This title</a>
</h2>
</div>
<img src="/m/test1.jpg">
<div id='postdate'>Posted on 12/26/2019<br />
Tags: <a href='/tags.html'>Tag1</a></div>
text1 text1
</div>


</div>
<div id="footer"></div>
</body>
</html>
`

    assertEqual(index.toHTML(), expectation)
  }
  
  test_Index_toHTML_enoughPostsToListInColumns_featured() {
    let siteConfig = new SiteConfig("/path/to/repo", `{
  "title":"memalign.github.io",
  "baseURL":"https://memalign.github.io",
  "entriesOnIndex":2,
  "authorName":"memalign",
  "authorURL":"https://twitter.com/memalign"
}    
`)

    let entry1 = new Entry(siteConfig, "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Image:/m/test1.jpg]\ntext1 text1")
    let entry2 = new Entry(siteConfig, "/path/0002-some-title2.txt", "Title: This title2\nDate: 12/27/2019\nTags: Tag2\ntext2 text2")
    let entry3 = new Entry(siteConfig, "/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry4 = new Entry(siteConfig, "/path/0004-some-title4.txt", "Title: This title4\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry5 = new Entry(siteConfig, "/path/0005-some-title5.txt", "Title: This title5\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry6 = new Entry(siteConfig, "/path/0006-some-title6.txt", "Title: This title6\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry7 = new Entry(siteConfig, "/path/0007-some-title7.txt", "Title: This title7\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry8 = new Entry(siteConfig, "/path/0008-some-title8.txt", "Title: This title8\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry9 = new Entry(siteConfig, "/path/0009-some-title9.txt", "Title: This title9\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry10 = new Entry(siteConfig, "/path/0010-some-title10.txt", "Title: This title10\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry11 = new Entry(siteConfig, "/path/0011-some-title11.txt", "Title: This title11\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry12 = new Entry(siteConfig, "/path/0012-some-title12.txt", "Title: This title12P\nDate: 12/28/2019\nTags: iTag, iTag2, Programming\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry13 = new Entry(siteConfig, "/path/0013-some-title13.txt", "Title: This title13L\nDate: 12/28/2019\nTags: iTag, iTag2, Leisure\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry14 = new Entry(siteConfig, "/path/0014-some-title14.txt", "Title: This title14IF\nDate: 12/28/2019\nTags: iTag, iTag2, Interactive Fiction\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry15 = new Entry(siteConfig, "/path/0015-some-title15.txt", "Title: This title15IF\nDate: 12/28/2019\nTags: Interactive Fiction\n[Image:/m/test3.jpg]\ntext3 text3")

        
  let featured = new Featured("/path/FEATURED.txt", `PCEImage Editor
- Image: /m/pceimage/image.png
- /m/pceimage/index.html

FormulaGraph
- Image: /m/formulagraph-stairs.png
- /m/formulagraph/index.html

Pac-Man Dungeon
- Image: https://example.com/m/image.jpg
- https://example.com/m/index.html
`)
    
    let index = new Index(siteConfig, [entry2, entry1, entry3, entry4, entry5, entry6, entry7, entry8, entry9, entry10, entry11, entry12, entry13, entry14, entry15], featured)
    
    let expectation = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/json" href="/feed.json" />
<link rel="alternate" type="application/atom+xml" href="/feed.xml" />
<title>memalign.github.io</title>
<meta property="og:title" content="memalign.github.io" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://memalign.github.io/index.html" />
<meta property="og:image" content="https://memalign.github.io/m/test3.jpg" />
<meta property="og:description" content="text3 text3" />
<link rel="stylesheet" href="/style.css">
<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes'>
</head>
<body>
<div id="body">
<div id='feeds'>
<a href='/feed.xml'>RSS</a> | <a href='/feed.json'>JSON Feed</a>
</div><div id='header'><h1>memalign.github.io</h1></div>
<div id='top-header'><h3>( ( ( featured projects ) ) )</h3></div>
<div id='projects-grid'>
  <div id='projects-grid-entry'>
    <a href='/m/pceimage/index.html'>
    <div id='projects-grid-title'>PCEImage Editor</div>
    <div class='rect-img-container'><img src='/m/pceimage/image.png'></div>
    </a>
  </div>
  <div id='projects-grid-entry'>
    <a href='/m/formulagraph/index.html'>
    <div id='projects-grid-title'>FormulaGraph</div>
    <div class='rect-img-container'><img src='/m/formulagraph-stairs.png'></div>
    </a>
  </div>
  <div id='projects-grid-entry'>
    <a href='https://example.com/m/index.html'>
    <div id='projects-grid-title'>Pac-Man Dungeon</div>
    <div class='rect-img-container'><img src='https://example.com/m/image.jpg'></div>
    </a>
  </div>
</div>
<div id='top-header'><h3>( ( ( posts ) ) )</h3></div>
<div id='allposts'>
<div id='grid'>
<div id='grid-entry'>
<a href='p/some-title15.html'>This title15IF</a><br />
<a href='p/some-title14.html'>This title14IF</a><br />
<a href='p/some-title13.html'>This title13L</a><br />
<a href='p/some-title12.html'>This title12P</a><br />
<a href='p/some-title11.html'>This title11</a><br />
</div><div id='grid-entry'>
<a href='p/some-title10.html'>This title10</a><br />
<a href='p/some-title9.html'>This title9</a><br />
<a href='p/some-title8.html'>This title8</a><br />
<a href='p/some-title7.html'>This title7</a><br />
<a href='p/some-title6.html'>This title6</a><br />
</div><div id='grid-entry'>
<a href='p/some-title5.html'>This title5</a><br />
<a href='p/some-title4.html'>This title4</a><br />
<a href='p/some-title3.html'>This title3</a><br />
<a href='p/some-title2.html'>This title2</a><br />
<a href='p/some-title.html'>This title</a><br />
</div>
</div>
</div>
<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title15.html'>This title15IF</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>Interactive Fiction</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title14.html'>This title14IF</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>iTag</a>, <a href='/tags.html'>iTag2</a>, <a href='/tags.html'>Interactive Fiction</a></div>
text3 text3
</div>

<hr />
More posts:<br />
<a href='p/some-title13.html'>This title13L</a><br />
<a href='p/some-title12.html'>This title12P</a><br />
<a href='p/some-title11.html'>This title11</a><br />
<a href='p/some-title10.html'>This title10</a><br />
<a href='p/some-title9.html'>This title9</a><br />
<a href='p/some-title8.html'>This title8</a><br />
<a href='p/some-title7.html'>This title7</a><br />
<a href='p/some-title6.html'>This title6</a><br />
<a href='p/some-title5.html'>This title5</a><br />
<a href='p/some-title4.html'>This title4</a><br />
<a href='p/some-title3.html'>This title3</a><br />
<a href='p/some-title2.html'>This title2</a><br />
<a href='p/some-title.html'>This title</a><br />

</div>
<div id="footer"></div>
</body>
</html>
`

    assertEqual(index.toHTML(), expectation)
  }
  
  test_Index_toHTML_enoughPostsToListInColumns_featured_differentSiteConfig() {
    let siteConfig = new SiteConfig("/path/to/repo", `{
  "title":"Example Site Title",
  "baseURL":"https://example.com",
  "entriesOnIndex":3,
  "authorName":"ExamplePerson",
  "authorURL":"https://example.com/author"
}    
`)

    let entry1 = new Entry(siteConfig, "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Image:/m/test1.jpg]\ntext1 text1")
    let entry2 = new Entry(siteConfig, "/path/0002-some-title2.txt", "Title: This title2\nDate: 12/27/2019\nTags: Tag2\ntext2 text2")
    let entry3 = new Entry(siteConfig, "/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry4 = new Entry(siteConfig, "/path/0004-some-title4.txt", "Title: This title4\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry5 = new Entry(siteConfig, "/path/0005-some-title5.txt", "Title: This title5\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry6 = new Entry(siteConfig, "/path/0006-some-title6.txt", "Title: This title6\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry7 = new Entry(siteConfig, "/path/0007-some-title7.txt", "Title: This title7\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry8 = new Entry(siteConfig, "/path/0008-some-title8.txt", "Title: This title8\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry9 = new Entry(siteConfig, "/path/0009-some-title9.txt", "Title: This title9\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry10 = new Entry(siteConfig, "/path/0010-some-title10.txt", "Title: This title10\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry11 = new Entry(siteConfig, "/path/0011-some-title11.txt", "Title: This title11\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry12 = new Entry(siteConfig, "/path/0012-some-title12.txt", "Title: This title12P\nDate: 12/28/2019\nTags: iTag, iTag2, Programming\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry13 = new Entry(siteConfig, "/path/0013-some-title13.txt", "Title: This title13L\nDate: 12/28/2019\nTags: iTag, iTag2, Leisure\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry14 = new Entry(siteConfig, "/path/0014-some-title14.txt", "Title: This title14IF\nDate: 12/28/2019\nTags: iTag, iTag2, Interactive Fiction\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry15 = new Entry(siteConfig, "/path/0015-some-title15.txt", "Title: This title15IF\nDate: 12/28/2019\nTags: Interactive Fiction\n[Image:/m/test3.jpg]\ntext3 text3")

        
  let featured = new Featured("/path/FEATURED.txt", `PCEImage Editor
- Image: /m/pceimage/image.png
- /m/pceimage/index.html

FormulaGraph
- Image: /m/formulagraph-stairs.png
- /m/formulagraph/index.html

Pac-Man Dungeon
- Image: https://example.com/m/image.jpg
- https://example.com/m/index.html
`)
    
    let index = new Index(siteConfig, [entry2, entry1, entry3, entry4, entry5, entry6, entry7, entry8, entry9, entry10, entry11, entry12, entry13, entry14, entry15], featured)
    
    let expectation = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/json" href="/feed.json" />
<link rel="alternate" type="application/atom+xml" href="/feed.xml" />
<title>Example Site Title</title>
<meta property="og:title" content="Example Site Title" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://example.com/index.html" />
<meta property="og:image" content="https://example.com/m/test3.jpg" />
<meta property="og:description" content="text3 text3" />
<link rel="stylesheet" href="/style.css">
<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes'>
</head>
<body>
<div id="body">
<div id='feeds'>
<a href='/feed.xml'>RSS</a> | <a href='/feed.json'>JSON Feed</a>
</div><div id='header'><h1>Example Site Title</h1></div>
<div id='top-header'><h3>( ( ( featured projects ) ) )</h3></div>
<div id='projects-grid'>
  <div id='projects-grid-entry'>
    <a href='/m/pceimage/index.html'>
    <div id='projects-grid-title'>PCEImage Editor</div>
    <div class='rect-img-container'><img src='/m/pceimage/image.png'></div>
    </a>
  </div>
  <div id='projects-grid-entry'>
    <a href='/m/formulagraph/index.html'>
    <div id='projects-grid-title'>FormulaGraph</div>
    <div class='rect-img-container'><img src='/m/formulagraph-stairs.png'></div>
    </a>
  </div>
  <div id='projects-grid-entry'>
    <a href='https://example.com/m/index.html'>
    <div id='projects-grid-title'>Pac-Man Dungeon</div>
    <div class='rect-img-container'><img src='https://example.com/m/image.jpg'></div>
    </a>
  </div>
</div>
<div id='top-header'><h3>( ( ( posts ) ) )</h3></div>
<div id='allposts'>
<div id='grid'>
<div id='grid-entry'>
<a href='p/some-title15.html'>This title15IF</a><br />
<a href='p/some-title14.html'>This title14IF</a><br />
<a href='p/some-title13.html'>This title13L</a><br />
<a href='p/some-title12.html'>This title12P</a><br />
<a href='p/some-title11.html'>This title11</a><br />
</div><div id='grid-entry'>
<a href='p/some-title10.html'>This title10</a><br />
<a href='p/some-title9.html'>This title9</a><br />
<a href='p/some-title8.html'>This title8</a><br />
<a href='p/some-title7.html'>This title7</a><br />
<a href='p/some-title6.html'>This title6</a><br />
</div><div id='grid-entry'>
<a href='p/some-title5.html'>This title5</a><br />
<a href='p/some-title4.html'>This title4</a><br />
<a href='p/some-title3.html'>This title3</a><br />
<a href='p/some-title2.html'>This title2</a><br />
<a href='p/some-title.html'>This title</a><br />
</div>
</div>
</div>
<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title15.html'>This title15IF</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>Interactive Fiction</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title14.html'>This title14IF</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>iTag</a>, <a href='/tags.html'>iTag2</a>, <a href='/tags.html'>Interactive Fiction</a></div>
text3 text3
</div>

<hr />
<div id='post'>
<div id='header'>
<h2>
<a href='p/some-title13.html'>This title13L</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>iTag</a>, <a href='/tags.html'>iTag2</a>, <a href='/tags.html'>Leisure</a></div>
text3 text3
</div>

<hr />
More posts:<br />
<a href='p/some-title12.html'>This title12P</a><br />
<a href='p/some-title11.html'>This title11</a><br />
<a href='p/some-title10.html'>This title10</a><br />
<a href='p/some-title9.html'>This title9</a><br />
<a href='p/some-title8.html'>This title8</a><br />
<a href='p/some-title7.html'>This title7</a><br />
<a href='p/some-title6.html'>This title6</a><br />
<a href='p/some-title5.html'>This title5</a><br />
<a href='p/some-title4.html'>This title4</a><br />
<a href='p/some-title3.html'>This title3</a><br />
<a href='p/some-title2.html'>This title2</a><br />
<a href='p/some-title.html'>This title</a><br />

</div>
<div id="footer"></div>
</body>
</html>
`

    assertEqual(index.toHTML(), expectation)
  }

  test_Index_toHTML_always3Columns() {
    let entries = []
    while (entries.length < 100) {
      let entry = new Entry(this.siteConfig(), `/path/${entries.length}-some-title.txt`, "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Image:/m/test1.jpg]\ntext1 text1")  
      entries.push(entry)
      
      if (entries.length < 15) {
        continue 
      }
      
      let index = new Index(this.siteConfig(), entries)
      let html = index.toHTML()  
      let columnCount = html.match(/grid-entry/g).length
      assertTrue(columnCount == 3, `column count is 3 for ${entries.length} entries`)
    }
  }
  
// TagsIndex class

  test_TagsIndex_toHTML() {
    let entry1 = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Image:/m/test1.jpg]\ntext1 text1")
    let entry2 = new Entry(this.siteConfig(), "/path/0002-some-title2.txt", "Title: This title2\nDate: 12/27/2019\nTags: Tag2\ntext2 text2")
    let entry3 = new Entry(this.siteConfig(), "/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry4 = new Entry(this.siteConfig(), "/path/0004-some-title4.txt", "Title: This title4\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry5 = new Entry(this.siteConfig(), "/path/0005-some-title5.txt", "Title: This title5\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry6 = new Entry(this.siteConfig(), "/path/0006-some-title6.txt", "Title: This title6\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry7 = new Entry(this.siteConfig(), "/path/0007-some-title7.txt", "Title: This title7\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry8 = new Entry(this.siteConfig(), "/path/0008-some-title8.txt", "Title: This title8\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry9 = new Entry(this.siteConfig(), "/path/0009-some-title9.txt", "Title: This title9\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry10 = new Entry(this.siteConfig(), "/path/0010-some-title10.txt", "Title: This title10\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry11 = new Entry(this.siteConfig(), "/path/0011-some-title11.txt", "Title: This title11\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry12 = new Entry(this.siteConfig(), "/path/0012-some-title12.txt", "Title: This title12P\nDate: 12/28/2019\nTags: iTag, iTag2, Programming\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry13 = new Entry(this.siteConfig(), "/path/0013-some-title13.txt", "Title: This title13L\nDate: 12/28/2019\nTags: iTag, iTag2, Leisure\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry14 = new Entry(this.siteConfig(), "/path/0014-some-title14.txt", "Title: This title14IF\nDate: 12/28/2019\nTags: iTag, iTag2, Interactive Fiction\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry15 = new Entry(this.siteConfig(), "/path/0015-some-title15.txt", "Title: This title15IF\nDate: 12/28/2019\nTags: Interactive Fiction\n[Image:/m/test3.jpg]\ntext3 text3")

    
    let index = new TagsIndex(this.siteConfig(), [entry2, entry1, entry3, entry4, entry5, entry6, entry7, entry8, entry9, entry10, entry11, entry12, entry13, entry14, entry15])  
    
    let expectation = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/json" href="/feed.json" />
<link rel="alternate" type="application/atom+xml" href="/feed.xml" />
<title>memalign.github.io tags</title>
<meta property="og:title" content="memalign.github.io tags" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://memalign.github.io/tags.html" />
<meta property="og:image" content="https://memalign.github.io/m/test3.jpg" />
<meta property="og:description" content="memalign.github.io posts organized by tag" />
<link rel="stylesheet" href="/style.css">
<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes'>
</head>
<body>
<div id="body">
<a href='/index.html'>Home</a><div id='header'><h1>memalign.github.io tags</h1></div>
<div id='allposts'>
<div id='grid'>
<div id='grid-entry'>
<h4>Interactive Fiction</h4><br /><a href='p/some-title15.html'>This title15IF</a><br />
<a href='p/some-title14.html'>This title14IF</a><br />
</div>
<div id='grid-entry'>
<h4>Leisure</h4><br /><a href='p/some-title13.html'>This title13L</a><br />
</div>
<div id='grid-entry'>
<h4>Programming</h4><br /><a href='p/some-title12.html'>This title12P</a><br />
</div>
<div id='grid-entry'>
<h4>Tag1</h4><br /><a href='p/some-title.html'>This title</a><br />
</div>
<div id='grid-entry'>
<h4>Tag2</h4><br /><a href='p/some-title2.html'>This title2</a><br />
</div>
<div id='grid-entry'>
<h4>iTag</h4><br /><a href='p/some-title14.html'>This title14IF</a><br />
<a href='p/some-title13.html'>This title13L</a><br />
<a href='p/some-title12.html'>This title12P</a><br />
<a href='p/some-title11.html'>This title11</a><br />
<a href='p/some-title10.html'>This title10</a><br />
<a href='p/some-title9.html'>This title9</a><br />
<a href='p/some-title8.html'>This title8</a><br />
<a href='p/some-title7.html'>This title7</a><br />
<a href='p/some-title6.html'>This title6</a><br />
<a href='p/some-title5.html'>This title5</a><br />
<a href='p/some-title4.html'>This title4</a><br />
<a href='p/some-title3.html'>This title3</a><br />
</div>
<div id='grid-entry'>
<h4>iTag2</h4><br /><a href='p/some-title14.html'>This title14IF</a><br />
<a href='p/some-title13.html'>This title13L</a><br />
<a href='p/some-title12.html'>This title12P</a><br />
<a href='p/some-title11.html'>This title11</a><br />
<a href='p/some-title10.html'>This title10</a><br />
<a href='p/some-title9.html'>This title9</a><br />
<a href='p/some-title8.html'>This title8</a><br />
<a href='p/some-title7.html'>This title7</a><br />
<a href='p/some-title6.html'>This title6</a><br />
<a href='p/some-title5.html'>This title5</a><br />
<a href='p/some-title4.html'>This title4</a><br />
<a href='p/some-title3.html'>This title3</a><br />
</div>
</div>
</div>

</div>
<div id="footer"></div>
</body>
</html>
`

    assertTrue(index.toHTML() == expectation, "index html")
  }

  test_TagsIndex_toHTML_differentSiteConfig() {
    let siteConfig = new SiteConfig("/path/to/repo", `{
  "title":"Example Site Title",
  "baseURL":"https://example.com",
  "entriesOnIndex":15,
  "authorName":"ExamplePerson",
  "authorURL":"https://example.com/author"
}
`)

    let entry1 = new Entry(siteConfig, "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Image:/m/test1.jpg]\ntext1 text1")
    let entry2 = new Entry(siteConfig, "/path/0002-some-title2.txt", "Title: This title2\nDate: 12/27/2019\nTags: Tag2\ntext2 text2")
    let entry3 = new Entry(siteConfig, "/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry4 = new Entry(siteConfig, "/path/0004-some-title4.txt", "Title: This title4\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry5 = new Entry(siteConfig, "/path/0005-some-title5.txt", "Title: This title5\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry6 = new Entry(siteConfig, "/path/0006-some-title6.txt", "Title: This title6\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry7 = new Entry(siteConfig, "/path/0007-some-title7.txt", "Title: This title7\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry8 = new Entry(siteConfig, "/path/0008-some-title8.txt", "Title: This title8\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry9 = new Entry(siteConfig, "/path/0009-some-title9.txt", "Title: This title9\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry10 = new Entry(siteConfig, "/path/0010-some-title10.txt", "Title: This title10\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry11 = new Entry(siteConfig, "/path/0011-some-title11.txt", "Title: This title11\nDate: 12/28/2019\nTags: iTag, iTag2\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry12 = new Entry(siteConfig, "/path/0012-some-title12.txt", "Title: This title12P\nDate: 12/28/2019\nTags: iTag, iTag2, Programming\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry13 = new Entry(siteConfig, "/path/0013-some-title13.txt", "Title: This title13L\nDate: 12/28/2019\nTags: iTag, iTag2, Leisure\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry14 = new Entry(siteConfig, "/path/0014-some-title14.txt", "Title: This title14IF\nDate: 12/28/2019\nTags: iTag, iTag2, Interactive Fiction\n[Image:/m/test3.jpg]\ntext3 text3")
    let entry15 = new Entry(siteConfig, "/path/0015-some-title15.txt", "Title: This title15IF\nDate: 12/28/2019\nTags: Interactive Fiction\n[Image:/m/test3.jpg]\ntext3 text3")

    
    let index = new TagsIndex(siteConfig, [entry2, entry1, entry3, entry4, entry5, entry6, entry7, entry8, entry9, entry10, entry11, entry12, entry13, entry14, entry15])  
    
    let expectation = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/json" href="/feed.json" />
<link rel="alternate" type="application/atom+xml" href="/feed.xml" />
<title>Example Site Title tags</title>
<meta property="og:title" content="Example Site Title tags" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://example.com/tags.html" />
<meta property="og:image" content="https://example.com/m/test3.jpg" />
<meta property="og:description" content="Example Site Title posts organized by tag" />
<link rel="stylesheet" href="/style.css">
<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes'>
</head>
<body>
<div id="body">
<a href='/index.html'>Home</a><div id='header'><h1>Example Site Title tags</h1></div>
<div id='allposts'>
<div id='grid'>
<div id='grid-entry'>
<h4>Interactive Fiction</h4><br /><a href='p/some-title15.html'>This title15IF</a><br />
<a href='p/some-title14.html'>This title14IF</a><br />
</div>
<div id='grid-entry'>
<h4>Leisure</h4><br /><a href='p/some-title13.html'>This title13L</a><br />
</div>
<div id='grid-entry'>
<h4>Programming</h4><br /><a href='p/some-title12.html'>This title12P</a><br />
</div>
<div id='grid-entry'>
<h4>Tag1</h4><br /><a href='p/some-title.html'>This title</a><br />
</div>
<div id='grid-entry'>
<h4>Tag2</h4><br /><a href='p/some-title2.html'>This title2</a><br />
</div>
<div id='grid-entry'>
<h4>iTag</h4><br /><a href='p/some-title14.html'>This title14IF</a><br />
<a href='p/some-title13.html'>This title13L</a><br />
<a href='p/some-title12.html'>This title12P</a><br />
<a href='p/some-title11.html'>This title11</a><br />
<a href='p/some-title10.html'>This title10</a><br />
<a href='p/some-title9.html'>This title9</a><br />
<a href='p/some-title8.html'>This title8</a><br />
<a href='p/some-title7.html'>This title7</a><br />
<a href='p/some-title6.html'>This title6</a><br />
<a href='p/some-title5.html'>This title5</a><br />
<a href='p/some-title4.html'>This title4</a><br />
<a href='p/some-title3.html'>This title3</a><br />
</div>
<div id='grid-entry'>
<h4>iTag2</h4><br /><a href='p/some-title14.html'>This title14IF</a><br />
<a href='p/some-title13.html'>This title13L</a><br />
<a href='p/some-title12.html'>This title12P</a><br />
<a href='p/some-title11.html'>This title11</a><br />
<a href='p/some-title10.html'>This title10</a><br />
<a href='p/some-title9.html'>This title9</a><br />
<a href='p/some-title8.html'>This title8</a><br />
<a href='p/some-title7.html'>This title7</a><br />
<a href='p/some-title6.html'>This title6</a><br />
<a href='p/some-title5.html'>This title5</a><br />
<a href='p/some-title4.html'>This title4</a><br />
<a href='p/some-title3.html'>This title3</a><br />
</div>
</div>
</div>

</div>
<div id="footer"></div>
</body>
</html>
`

    assertEqual(index.toHTML(), expectation)
  }


// Entry class
    
  test_Entry_draft() {
    let entry = new Entry(this.siteConfig(), "/path/DRAFT-some-title.txt", "test text")
    
    assertTrue(entry.isDraft, "Entry is draft")
  }

  test_Entry_missingTags() {
    let caughtException = false
    try {  
      let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\ntest text")  
    } catch (e) {
      caughtException = true
    }
    
    assertTrue(caughtException, "missing tags -> throws exception")
  }
  
  test_Entry_regular_noTags() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags:\ntest text")  
    assertTrue(!entry.isDraft, "Entry isn't draft")
    assertTrue(entry.title == "This title", "entry title")
    assertTrue(entry.postLinkName == "some-title", "postLinkName")
    assertTrue(entry.postNumber == 1, "postNumber")
    assertTrue(entry.dateString == "12/26/2019", "dateString")
    assertTrue(entry.contents == "test text", "contents")
    assertTrue(entry.tags.length == 0, "empty tags list")
    assertTrue(entry.htmlFilename() == "some-title.html", "Entry.htmlFilename")
    assertTrue(entry.relativeURL() == "p/some-title.html", "Entry.relativeURL")
  }

  test_Entry_regular_oneTag() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\ntest text")  
    assertTrue(!entry.isDraft, "Entry isn't draft")
    assertTrue(entry.title == "This title", "entry title")
    assertTrue(entry.postLinkName == "some-title", "postLinkName")
    assertTrue(entry.postNumber == 1, "postNumber")
    assertTrue(entry.dateString == "12/26/2019", "dateString")
    assertTrue(entry.contents == "test text", "contents")
    assertTrue(entry.tags.length == 1, "one tag")
    assertTrue(entry.tags[0] == "Tag1", "Tag1")
    assertTrue(entry.htmlFilename() == "some-title.html", "Entry.htmlFilename")
    assertTrue(entry.relativeURL() == "p/some-title.html", "Entry.relativeURL")
  }

  test_Entry_regular_twoTags() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1, Tag2\ntest text")  
    assertTrue(!entry.isDraft, "Entry isn't draft")
    assertTrue(entry.title == "This title", "entry title")
    assertTrue(entry.postLinkName == "some-title", "postLinkName")
    assertTrue(entry.postNumber == 1, "postNumber")
    assertTrue(entry.dateString == "12/26/2019", "dateString")
    assertTrue(entry.contents == "test text", "contents")
    assertTrue(entry.tags.length == 2, "two tags")
    assertTrue(entry.tags[0] == "Tag1", "Tag1")
    assertTrue(entry.tags[1] == "Tag2", "Tag2")
    assertTrue(entry.htmlFilename() == "some-title.html", "Entry.htmlFilename")
    assertTrue(entry.relativeURL() == "p/some-title.html", "Entry.relativeURL")
  }
  
  test_Entry_regular_tagWithSpace() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Interactive Fiction, Tag2\ntest text")  
    assertTrue(!entry.isDraft, "Entry isn't draft")
    assertTrue(entry.title == "This title", "entry title")
    assertTrue(entry.postLinkName == "some-title", "postLinkName")
    assertTrue(entry.postNumber == 1, "postNumber")
    assertTrue(entry.dateString == "12/26/2019", "dateString")
    assertTrue(entry.contents == "test text", "contents")
    assertTrue(entry.tags.length == 2, "two tags")
    assertTrue(entry.tags[0] == "Interactive Fiction", "Interactive Fiction")
    assertTrue(entry.tags[1] == "Tag2", "Tag2")
    assertTrue(entry.htmlFilename() == "some-title.html", "Entry.htmlFilename")
    assertTrue(entry.relativeURL() == "p/some-title.html", "Entry.relativeURL")
  }
  
  test_Entry_requiresFourDigitYear() {
    let caughtException = false
    try {
      let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/19\ntest text")  
    } catch (exception) {
      caughtException = true
    }
    assertTrue(caughtException, "requires four digit year")
  }
  
  test_Entry_imageURL_noImages() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags:\ntest text")  
    assertTrue(entry.imageURL() == null, "no imageURL")
  }
  
  test_Entry_imageURL_oneImage() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Image:/m/test.jpg]\ntest text")  
    assertTrue(entry.imageURL() == "/m/test.jpg", "one imageURL")
  }

  test_Entry_imageURL_twoImages() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1, Tag2 space\n[Image:/m/test.jpg]\n[Image:/m/test2.jpg]\ntest text")  
    assertTrue(entry.imageURL() == "/m/test.jpg", "two imageURLs")
  }

  test_Entry_htmlBody_imageRewriting() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Image:/m/test.jpg]\ntest text")  
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("<img src=\"/m/test.jpg\">"), "Has img tag")
    assertTrue(!htmlBody.includes("</img>"), "Lacks </img> tag")
    assertTrue(!htmlBody.includes("[Image:/m/test.jpg]"), "Lacks Image brackets")
  }
  
  test_Entry_htmlBody_imageRewriting_mp4() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Image:/m/test.mp4]\ntest text")  
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes(`<video muted loop autoplay playsinline disablepictureinpicture="" src="/m/test.mp4" type="video/mp4"></video>`), "Has video tag")
    assertTrue(!htmlBody.includes("<img"), "Lacks <img tag")
    assertTrue(!htmlBody.includes("</img>"), "Lacks </img> tag")
    assertTrue(!htmlBody.includes("[Image:/m/test.jpg]"), "Lacks Image brackets")
  }

  test_Entry_htmlBody_linkRewriting() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Link:/m/test.jpg]here[/Link]\ntest text")  
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("<a href=\"/m/test.jpg\">here</a>"), "Has a href tag")
    assertTrue(!htmlBody.includes("[Link"), "Lacks link brackets")
    assertTrue(!htmlBody.includes("Link]"), "Lacks closing link brackets")
  }

  test_Entry_htmlBody_linkRewriting_noInnerText() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags:\n[Link]/m/test.jpg[/Link]\ntest text")  
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("<a href=\"/m/test.jpg\">/m/test.jpg</a>"), "Has a href tag")
    assertTrue(!htmlBody.includes("[Link"), "Lacks link brackets")
    assertTrue(!htmlBody.includes("Link]"), "Lacks closing link brackets")
  }

  test_Entry_htmlBody_linkRewriting_insideSectionTitle() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[SectionTitle:[Link:/m/test.jpg]here[/Link]]\ntest text")  
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("<h3><a href=\"/m/test.jpg\">here</a></h3>"), "Has a href tag")
    assertTrue(!htmlBody.includes("[Link"), "Lacks link brackets")
    assertTrue(!htmlBody.includes("Link]"), "Lacks closing link brackets")
    assertTrue(!htmlBody.includes("[SectionTitle"), "Lacks SectionTitle")
    assertTrue(!htmlBody.includes("]"), "Lacks closing brackets")
  }

  test_Entry_htmlBody_linkRewriting_insideParagraphTitle() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[ParagraphTitle:[Link:/m/test.jpg]here[/Link]]\ntest text")  
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("<h4><a href=\"/m/test.jpg\">here</a></h4>"), "Has a href tag")
    assertTrue(!htmlBody.includes("[Link"), "Lacks link brackets")
    assertTrue(!htmlBody.includes("Link]"), "Lacks closing link brackets")
    assertTrue(!htmlBody.includes("[ParagraphTitle"), "Lacks ParagraphTitle")
    assertTrue(!htmlBody.includes("]"), "Lacks closing brackets")
  }
  
  test_Entry_htmlBody_ParagraphTitle() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[ParagraphTitle:Nice title]\ntest text")  
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("<h4>Nice title</h4>"), "Has a h4 tag")
    assertTrue(!htmlBody.includes("[ParagraphTitle"), "Lacks ParagraphTitle")
    assertTrue(!htmlBody.includes("]"), "Lacks closing brackets")
  }

  test_Entry_htmlBody_SectionTitle() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[SectionTitle:Nice title]\ntest text")  
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("<h3>Nice title</h3>"), "Has a h3 tag")
    assertTrue(!htmlBody.includes("[SectionTitle"), "Lacks SectionTitle")
    assertTrue(!htmlBody.includes("]"), "Lacks closing brackets")
  }

  test_Entry_htmlBody_ContinueReadingURL() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\ntest text\n\n[ContinueReadingWithURLTitle:Continue reading]\n\nNext line.")  
    let htmlBody = entry.htmlBody()
    
    assertEqual(htmlBody, `<div id='post'>
<div id='header'>
<h1>
This title
</h1>
</div>
<div id='postdate'>Posted on 12/26/2019<br />
Tags: <a href='/tags.html'>Tag1</a></div>
test text<br />
<br />
<br />
Next line.
</div>
`)
  }

  test_Entry_htmlBody_code_oneliner() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Link:/m/test.jpg]here[/Link]\ntest text\n[Code]some code[/Code]")
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("<div id='code'>some code</div>"), "Has code div")
    assertTrue(!htmlBody.includes("[Code"), "Lacks code brackets")
    assertTrue(!htmlBody.includes("Code]"), "Lacks closing code brackets")
  }

  test_Entry_htmlBody_code_oneliner_withHTML() {
    // Right now HTML is only supported in multi-line code blocks
    // This unit test documents this limitation
    // When oneliner HTML support is added, this test needs to be modified
    
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags:\n[Link:/m/test.jpg]here[/Link]\ntest text\n[Code]some <html> code[/Code]")
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("<div id='code'>some <html> code</div>"), "Has code div")
    // With real support, the assert will be:
    // assertTrue(htmlBody.includes("<div id='code'>some &lt;html&gt; code</div>"), "Has code div")
    assertTrue(!htmlBody.includes("[Code"), "Lacks code brackets")
    assertTrue(!htmlBody.includes("Code]"), "Lacks closing code brackets")
  }

  test_Entry_htmlBody_code_multiLine() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags:\n[Link:/m/test.jpg]here[/Link]\ntest text\n[Code]\nsome code\n  line two\n[/Code]\nafter code")
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("test text<br />\n<div id='code'>some code<br />\n&nbsp;&nbsp;line two</div>\nafter code"), "Has code div")
    assertTrue(!htmlBody.includes("[Code"), "Lacks code brackets")
    assertTrue(!htmlBody.includes("Code]"), "Lacks closing code brackets")
  }

  test_Entry_htmlBody_code_multiLine_withHTML() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Link:/m/test.jpg]here[/Link]\ntest text\n[Code]\nsome code\n  line <td> two\n[/Code]\nafter code")
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("test text<br />\n<div id='code'>some code<br />\n&nbsp;&nbsp;line &lt;td&gt; two</div>\nafter code"), "Has code div")
    assertTrue(!htmlBody.includes("[Code"), "Lacks code brackets")
    assertTrue(!htmlBody.includes("Code]"), "Lacks closing code brackets")
  }
  
  test_Entry_htmlBody_quote_oneliner() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Link:/m/test.jpg]here[/Link]\ntest text\n[Quote]some quote[/Quote]")
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("<blockquote>some quote</blockquote>"), "Has quote div")
    assertTrue(!htmlBody.includes("[Quote"), "Lacks quote brackets")
    assertTrue(!htmlBody.includes("Quote]"), "Lacks closing quote brackets")
  }

  test_Entry_htmlBody_quote_multiLine() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags:\n[Link:/m/test.jpg]here[/Link]\ntest text\n[Quote]\nsome quote\n  line two\n[/Quote]\nafter quote")
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("test text<br />\n<blockquote>some quote<br />\n&nbsp;&nbsp;line two</blockquote>\nafter quote"), "Has blockquote")
    assertTrue(!htmlBody.includes("[Quote"), "Lacks quote brackets")
    assertTrue(!htmlBody.includes("Quote]"), "Lacks closing quote brackets")
  }

  test_Entry_htmlBody_title_withTitleURL() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1, Tag2\n[Image:/m/test.jpg]\ntest text")  
    let htmlBody = entry.htmlBody("p/some-title.html")
    
    assertTrue(htmlBody.includes("<div id='header'>\n<h2>\n<a href='p/some-title.html'>This title</a>"), "Has title URL")
  }

  test_Entry_htmlBody_title_withoutTitleURL() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Image:/m/test.jpg]\ntest text")  
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("<div id='header'>\n<h1>\nThis title\n</h1>"), "Has h1 title")
  }
  
  test_Entry_htmlBody_startsWithImage() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Image:/m/test.jpg]\ntest text")  
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("<img src=\"/m/test.jpg\">\n<div id='postdate'>Posted on 12/26/2019<br />"), "Date follows image")
    assertTrue(!htmlBody.includes("</img>"), "Lacks </img> tag")
    let toHTML = entry.toHTML()
    
    let expectation = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/json" href="/feed.json" />
<link rel="alternate" type="application/atom+xml" href="/feed.xml" />
<title>This title</title>
<meta property="og:title" content="This title" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://memalign.github.io/p/some-title.html" />
<meta property="og:image" content="https://memalign.github.io/m/test.jpg" />
<meta property="og:description" content="test text" />
<link rel="stylesheet" href="/style.css">
<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes'>
</head>
<body>
<div id="body">
<a href='/index.html'>Home</a><div id='post'>
<div id='header'>
<h1>
This title
</h1>
</div>
<img src="/m/test.jpg">
<div id='postdate'>Posted on 12/26/2019<br />
Tags: <a href='/tags.html'>Tag1</a></div>
test text
</div>

</div>
<div id="footer"></div>
</body>
</html>
`

    assertTrue(toHTML == expectation, "toHTML matches expectation")
  }
  
  test_Entry_toHTML_differentSiteConfig() {
    let siteConfig = new SiteConfig("/path/to/repo", `{
  "title":"Example Site Title",
  "baseURL":"https://example.com",
  "entriesOnIndex":15,
  "authorName":"ExamplePerson",
  "authorURL":"https://example.com/author"
}
`)

    let entry = new Entry(siteConfig, "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Tag1\n[Image:/m/test.jpg]\ntest text")  
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("<img src=\"/m/test.jpg\">\n<div id='postdate'>Posted on 12/26/2019<br />"), "Date follows image")
    assertTrue(!htmlBody.includes("</img>"), "Lacks </img> tag")
    let toHTML = entry.toHTML()
    
    let expectation = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/json" href="/feed.json" />
<link rel="alternate" type="application/atom+xml" href="/feed.xml" />
<title>This title</title>
<meta property="og:title" content="This title" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://example.com/p/some-title.html" />
<meta property="og:image" content="https://example.com/m/test.jpg" />
<meta property="og:description" content="test text" />
<link rel="stylesheet" href="/style.css">
<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes'>
</head>
<body>
<div id="body">
<a href='/index.html'>Home</a><div id='post'>
<div id='header'>
<h1>
This title
</h1>
</div>
<img src="/m/test.jpg">
<div id='postdate'>Posted on 12/26/2019<br />
Tags: <a href='/tags.html'>Tag1</a></div>
test text
</div>

</div>
<div id="footer"></div>
</body>
</html>
`

    assertEqual(toHTML, expectation)
  }

  test_Entry_htmlBody_startsWithText() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Interactive Fiction, Programming\nTest text\n[Image:/m/test.jpg]\nmore text")  
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("<div id='postdate'>Posted on 12/26/2019<br />\nTags: <a href='/tags.html'>Interactive Fiction</a>, <a href='/tags.html'>Programming</a></div>\nTest text<br />\n<img src=\"/m/test.jpg\">"), "Date precedes text")
    assertTrue(!htmlBody.includes("</img>"), "Lacks </img> tag")
    
    let toHTML = entry.toHTML()
    let expectation = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/json" href="/feed.json" />
<link rel="alternate" type="application/atom+xml" href="/feed.xml" />
<title>This title</title>
<meta property="og:title" content="This title" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://memalign.github.io/p/some-title.html" />
<meta property="og:image" content="https://memalign.github.io/m/test.jpg" />
<meta property="og:description" content="Test text more text…" />
<link rel="stylesheet" href="/style.css">
<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes'>
</head>
<body>
<div id="body">
<a href='/index.html'>Home</a><div id='post'>
<div id='header'>
<h1>
This title
</h1>
</div>
<div id='postdate'>Posted on 12/26/2019<br />
Tags: <a href='/tags.html'>Interactive Fiction</a>, <a href='/tags.html'>Programming</a></div>
Test text<br />
<img src="/m/test.jpg"><br />
more text
</div>

</div>
<div id="footer"></div>
</body>
</html>
`
    assertTrue(toHTML == expectation, "toHTML equals expectation")
  }
  
  test_Entry_toHTML_noImages() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Test\ntest text")
    let entry2 = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Test\n\ntest text")
    
    assertTrue(entry.toHTML() == entry2.toHTML(), "Preceding newlines ignored")  

    let expectation = `<body>
<div id="body">
<a href='/index.html'>Home</a><div id='post'>
<div id='header'>
<h1>
This title
</h1>
</div>
<div id='postdate'>Posted on 12/26/2019<br />
Tags: <a href='/tags.html'>Test</a></div>
test text
</div>

</div>
<div id="footer"></div>
</body>
</html>
`
    assertTrue(entry.toHTML().endsWith(expectation), "no-image entry has correct html")
  }
    
  test_Entry_htmlBody_startsWithTwoImages() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Abc\n[Image:/m/test.jpg]\n[Image:/m/test2.jpg]\ntest text")  
    let htmlBody = entry.htmlBody()
    
    // This behavior isn't good. I'm writing this test to document the existing limitation. We probably want the postdate to follow all leading images in a post instead.
    assertTrue(htmlBody.includes("<img src=\"/m/test.jpg\">\n<div id='postdate'>Posted on 12/26/2019<br />\nTags: <a href='/tags.html'>Abc</a></div>\n<img src=\"/m/test2.jpg\">"), "Date follows first image")
    assertTrue(!htmlBody.includes("</img>"), "Lacks </img> tag")
  }
  
  test_Entry_htmlBody_indentation() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags:\n[Image:/m/test.jpg]\ntest text\n one\n  two\n   three\n    - Four")
    let htmlBody = entry.htmlBody()
    
    assertTrue(htmlBody.includes("test text<br />\n&nbsp;one<br />\n&nbsp;&nbsp;two<br />\n&nbsp;&nbsp;&nbsp;three<br />\n&nbsp;&nbsp;&nbsp;&nbsp;- Four"), "indentation")
  }
  
  test_Entry_ogDescription() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: TestTag\none two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty thirtyone")
    
    let entryWithLinebreak = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Interactive Fiction\none two three four five six seven eight nine ten eleven twelve thirteen.\nfourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty thirtyone")

    let entryWithImage = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: counting\n[Image:/m/test.jpg]one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty thirtyone")


    let expectation = "one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty…"
    
    assertTrue(entry.ogDescription() == expectation, "Description truncated in correct place")
    assertTrue(entryWithLinebreak.ogDescription() == expectation, "Entry with linebreak truncated in correct place")
    assertTrue(entryWithImage.ogDescription() == expectation, "Description truncated in correct place")
    
    let entrySentence = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Sentences\none two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty. thirtyone")

    let expectation2 = "one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty. …"
    assertTrue(entrySentence.ogDescription() == expectation2, "Description ending with period gets correct ellipses behavior")
    
    let entryFits = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Fitting In\none two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty")
    
    let expectationFits = "one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty"
    assertTrue(entryFits.ogDescription() == expectationFits, "Whole entry fits")
    
    let entryJustImage = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Just Image Things\n[Image:/m/test.jpg]")
    assertTrue(entryJustImage.ogDescription() == "", "empty desc")
    
    
    let entryWithLink1 = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Link1\n[Link:/m/test.jpg]here[/Link] one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty thirtyone")
    
    let expectationLink1 = "here one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine…"
    assertTrue(entryWithLink1.ogDescription() == expectationLink1, "ogDescription link1")

    let entryWithLink2 = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Link2\n[Link]/m/test.jpg[/Link] one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty thirtyone")
    
    let expectationLink2 = "/m/test.jpg one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine…"
    assertTrue(entryWithLink2.ogDescription() == expectationLink2, "ogDescription link2")
    
    let entryWithCode = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Programming\n[Code]here[/Code] one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty thirtyone")
    
    let expectationCode = "here one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine…"
    assertTrue(entryWithCode.ogDescription() == expectationCode, "ogDescription code")

    let entryWithQuote = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Programming\n[Quote]here[/Quote] one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty thirtyone")
    
    let expectationQuote = "here one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine…"
    assertTrue(entryWithQuote.ogDescription() == expectationQuote, "ogDescription quote")
  
    let entryWithSectionTitle = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Programming\n[SectionTitle:here] one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty thirtyone")
    
    let expectationSectionTitle = "here one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine…"
    assertTrue(entryWithSectionTitle.ogDescription() == expectationSectionTitle, "ogDescription sectiontitle")

    let entryWithParagraphTitle = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Programming\n[ParagraphTitle:here] one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty thirtyone")
    
    let expectationParagraphTitle = "here one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine…"
    assertTrue(entryWithParagraphTitle.ogDescription() == expectationParagraphTitle, "ogDescription paragraphtitle")

    let entryWithContinueReadingURL = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Programming\none two three four five six seven eight nine ten eleven twelve thirteen.\n\n[ContinueReadingWithURLTitle:Continue reading]\n\nfourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty thirtyone")
    
    let expectationContinueReadingURL = "one two three four five six seven eight nine ten eleven twelve thirteen. fourteen fifteen sixteen seventeen eighteen nineteen twenty twentyone twentytwo twentythree twentyfour twentyfive twentysix twentyseven twentyeight twentynine thirty…"
    assertEqual(entryWithContinueReadingURL.ogDescription(), expectationContinueReadingURL)
  }
  
  test_Entry_ogImage() {
    let entryNoImages = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Images\ntest text")
    assertTrue(entryNoImages.ogImage() == "https://memalign.github.io/m/shiba.jpg", "default ogImage")
    
    let entryOneImage = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Images, Fun\n[Image:/m/test.jpg]\ntest text")
    assertTrue(entryOneImage.ogImage() == "https://memalign.github.io/m/test.jpg", "picks image")

    let entryTwoImages = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Images\n[Image:/m/test.jpg]\n[Image:/m/test2.jpg]\ntest text")
    assertTrue(entryTwoImages.ogImage() == "https://memalign.github.io/m/test.jpg", "picks first image")

  
    // Don't pick MP4 as the ogImage
    
    let entryOnlyMP4 = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Images\n[Image:/m/test.mp4]\ntest text")
    assertTrue(entryOnlyMP4.ogImage() == "https://memalign.github.io/m/shiba.jpg", "default ogImage")

    let entryMP4BeforeJPG = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Images\n[Image:/m/test.mp4]\n[Image:/m/test2.jpg]\ntest text")
    assertTrue(entryMP4BeforeJPG.ogImage() == "https://memalign.github.io/m/test2.jpg", "skips mp4")

    let entryMP4AfterJPG = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Images\n[Image:/m/test.jpg]\n[Image:/m/test2.mp4]\ntest text")
    assertTrue(entryMP4AfterJPG.ogImage() == "https://memalign.github.io/m/test.jpg", "picks first jpg")
  }
  
  test_Entry_fullBaseURL() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: URLs\n[Image:/m/test.jpg]\ntest text")
    assertTrue(entry.fullBaseURL() == "https://memalign.github.io/p/", "fullBaseURL")
  }

  test_Entry_dateRFC3339() {
    let entry = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: URLs\n[Image:/m/test.jpg]\ntest text")
    assertTrue(entry.dateRFC3339() == "2019-12-26T00:00:00-08:00", "dateRFC3339")    
  }
  
  
// Feed class

  test_Feed_writeFeedFile() {
    let entry1 = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Feeds\n[Image:/m/test1.jpg]\ntext1 text1")
    
    let index = new Index(this.siteConfig(), [entry1])
    
    let jsonFeed = new JSONFeed(index)

    
    let fm = FileManager.local()
    let tempDir = fm.temporaryDirectory() + "/" + uuidv4()
    fm.createDirectory(tempDir)
    
    let feedFilename = tempDir + "/" + jsonFeed.feedFilename()

    assertTrue(!fm.fileExists(feedFilename), "file doesn't exist")    
    
    jsonFeed.writeFeedFile(tempDir)

    assertTrue(fm.fileExists(feedFilename), "file exists")
    
    let fileContents = fm.readString(feedFilename)
    
    assertTrue(fileContents == jsonFeed.toText(), "contents match")
    
    
    // Clean up
    fm.remove(feedFilename)
    fm.remove(tempDir)
    
    assertTrue(!fm.fileExists(feedFilename), "file doesn't exist")    
    assertTrue(!fm.fileExists(tempDir), "dir doesn't exist")
  }


  
// JSONFeed class

  test_JSONFeed_escapeContent() {
    let entry1 = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: JavaScript\n[Image:/m/test1.jpg]\ntext1 text1")
    
    let index = new Index(this.siteConfig(), [entry1])
    
    let jsonFeed = new JSONFeed(index)
    
    let escapedContent = jsonFeed.escapeContent('<a href="test.html">Test<br />\n</a>')
    
    assertTrue(escapedContent == "<a href=\\\"test.html\\\">Test<br />\\n</a>", "Escaped content")
  }

  test_JSONFeed_entryToItem() {
    let entryWithImage = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Entries\n[Image:/m/test1.jpg]\ntext1 text1")
    let entryNoImage = new Entry(this.siteConfig(), "/path/0002-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Programming\ntext1 text1")
    let entryJustImage = new Entry(this.siteConfig(), "/path/0003-some-title.txt", "Title: This title\nDate: 12/26/2019\nTags: Feeds\n[Image:/m/test1.jpg]")
    
    let jsonFeed = new JSONFeed(new Index(this.siteConfig(), [entryWithImage, entryNoImage, entryJustImage]))

    let expectationWithImage = `    {
         "title" : "This title",
         "date_published" : "2019-12-26T00:00:00-08:00",
         "id" : "https://memalign.github.io/p/some-title.html",
         "url" : "https://memalign.github.io/p/some-title.html",
         "image" : "https://memalign.github.io/m/test1.jpg",
         "author" : {
            "name" : "memalign"
         },
         "content_html" : "<div id='post'>\\n<div id='header'>\\n<h2>\\n<a href='https://memalign.github.io/p/some-title.html'>This title</a>\\n</h2>\\n</div>\\n<img src=\\"/m/test1.jpg\\">\\n<div id='postdate'>Posted on 12/26/2019<br />\\nTags: <a href='/tags.html'>Entries</a></div>\\ntext1 text1\\n</div>\\n"
    }`
    
    assertTrue(jsonFeed.entryToItem(entryWithImage) == expectationWithImage, "json with image")
    
    let expectationNoImage = `    {
         "title" : "This title",
         "date_published" : "2019-12-26T00:00:00-08:00",
         "id" : "https://memalign.github.io/p/some-title.html",
         "url" : "https://memalign.github.io/p/some-title.html",
         "author" : {
            "name" : "memalign"
         },
         "content_html" : "<div id='post'>\\n<div id='header'>\\n<h2>\\n<a href='https://memalign.github.io/p/some-title.html'>This title</a>\\n</h2>\\n</div>\\n<div id='postdate'>Posted on 12/26/2019<br />\\nTags: <a href='/tags.html'>Programming</a></div>\\ntext1 text1\\n</div>\\n"
    }`
    assertTrue(jsonFeed.entryToItem(entryNoImage) == expectationNoImage, "json no image")
    
    let expectationJustImage = `    {
         "title" : "This title",
         "date_published" : "2019-12-26T00:00:00-08:00",
         "id" : "https://memalign.github.io/p/some-title.html",
         "url" : "https://memalign.github.io/p/some-title.html",
         "image" : "https://memalign.github.io/m/test1.jpg",
         "author" : {
            "name" : "memalign"
         },
         "content_html" : "<div id='post'>\\n<div id='header'>\\n<h2>\\n<a href='https://memalign.github.io/p/some-title.html'>This title</a>\\n</h2>\\n</div>\\n<img src=\\"/m/test1.jpg\\">\\n<div id='postdate'>Posted on 12/26/2019<br />\\nTags: <a href='/tags.html'>Feeds</a></div>\\n\\n</div>\\n"
    }`

    assertTrue(jsonFeed.entryToItem(entryJustImage) == expectationJustImage, "json just image")
  }

  test_JSONFeed_toText() {
    let entry1 = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/1/2019\nTags: JSON\n[Image:/m/test1.jpg]\ntext1 text1")
    let entry2 = new Entry(this.siteConfig(), "/path/0002-some-title2.txt", "Title: This title2\nDate: 12/2/2019\nTags: JSON\ntext2 text2")
    let entry3 = new Entry(this.siteConfig(), "/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/2019\nTags: JSON\n[Image:/m/test3.jpg]\ntext3\ttext3\\'")
    let entry4 = new Entry(this.siteConfig(), "/path/0004-some-title4.txt", "Title: This title4\nDate: 1/1/2020\nTags: JSON\ntext4")
    let entry5 = new Entry(this.siteConfig(), "/path/0005-some-title5.txt", "Title: This title5\nDate: 1/11/2020\nTags: JSON\ntext5")
    let entry6 = new Entry(this.siteConfig(), "/path/0006-some-title6.txt", "Title: This title6\nDate: 11/22/2022\nTags: JSON\ntext6\nThis is my entry.\n\n[ContinueReadingWithURLTitle:Continue reading]\n\nThe next line.")

    
    let index = new Index(this.siteConfig(), [entry2, entry1, entry3, entry4, entry5, entry6])
    
    let jsonFeed = new JSONFeed(index)
    jsonFeed.entriesInFeed = 5
    
    let expectation = `{
   "version" : "https://jsonfeed.org/version/1",
   "title" : "memalign.github.io",
   "home_page_url" : "https://memalign.github.io/index.html",
   "feed_url" : "https://memalign.github.io/feed.json",
   "author" : {
      "url" : "https://twitter.com/memalign",
      "name" : "memalign"
   },
   "icon" : "https://memalign.github.io/apple-touch-icon.png",
   "favicon" : "https://memalign.github.io/favicon.ico",
   "items" : [
    {
         "title" : "This title6",
         "date_published" : "2022-11-22T00:00:00-08:00",
         "id" : "https://memalign.github.io/p/some-title6.html",
         "url" : "https://memalign.github.io/p/some-title6.html",
         "author" : {
            "name" : "memalign"
         },
         "content_html" : "<div id='post'>\\n<div id='header'>\\n<h2>\\n<a href='https://memalign.github.io/p/some-title6.html'>This title6</a>\\n</h2>\\n</div>\\n<div id='postdate'>Posted on 11/22/2022<br />\\nTags: <a href='/tags.html'>JSON</a></div>\\ntext6<br />\\nThis is my entry.<br />\\n<br />\\n<h4><a href=\\"https://memalign.github.io/p/some-title6.html\\">Continue reading</a></h4>\\n</div>\\n"
    },
    {
         "title" : "This title5",
         "date_published" : "2020-01-11T00:00:00-08:00",
         "id" : "https://memalign.github.io/p/some-title5.html",
         "url" : "https://memalign.github.io/p/some-title5.html",
         "author" : {
            "name" : "memalign"
         },
         "content_html" : "<div id='post'>\\n<div id='header'>\\n<h2>\\n<a href='https://memalign.github.io/p/some-title5.html'>This title5</a>\\n</h2>\\n</div>\\n<div id='postdate'>Posted on 1/11/2020<br />\\nTags: <a href='/tags.html'>JSON</a></div>\\ntext5\\n</div>\\n"
    },
    {
         "title" : "This title4",
         "date_published" : "2020-01-01T00:00:00-08:00",
         "id" : "https://memalign.github.io/p/some-title4.html",
         "url" : "https://memalign.github.io/p/some-title4.html",
         "author" : {
            "name" : "memalign"
         },
         "content_html" : "<div id='post'>\\n<div id='header'>\\n<h2>\\n<a href='https://memalign.github.io/p/some-title4.html'>This title4</a>\\n</h2>\\n</div>\\n<div id='postdate'>Posted on 1/1/2020<br />\\nTags: <a href='/tags.html'>JSON</a></div>\\ntext4\\n</div>\\n"
    },
    {
         "title" : "This title3",
         "date_published" : "2019-12-28T00:00:00-08:00",
         "id" : "https://memalign.github.io/p/some-title3.html",
         "url" : "https://memalign.github.io/p/some-title3.html",
         "image" : "https://memalign.github.io/m/test3.jpg",
         "author" : {
            "name" : "memalign"
         },
         "content_html" : "<div id='post'>\\n<div id='header'>\\n<h2>\\n<a href='https://memalign.github.io/p/some-title3.html'>This title3</a>\\n</h2>\\n</div>\\n<img src=\\"/m/test3.jpg\\">\\n<div id='postdate'>Posted on 12/28/2019<br />\\nTags: <a href='/tags.html'>JSON</a></div>\\ntext3\\ttext3\\\\'\\n</div>\\n"
    },
    {
         "title" : "This title2",
         "date_published" : "2019-12-02T00:00:00-08:00",
         "id" : "https://memalign.github.io/p/some-title2.html",
         "url" : "https://memalign.github.io/p/some-title2.html",
         "author" : {
            "name" : "memalign"
         },
         "content_html" : "<div id='post'>\\n<div id='header'>\\n<h2>\\n<a href='https://memalign.github.io/p/some-title2.html'>This title2</a>\\n</h2>\\n</div>\\n<div id='postdate'>Posted on 12/2/2019<br />\\nTags: <a href='/tags.html'>JSON</a></div>\\ntext2 text2\\n</div>\\n"
    }
  ]
}
`
    assertEqual(jsonFeed.toText(), expectation)
  }

  test_JSONFeed_toText_differentSiteConfig() {
    let siteConfig = new SiteConfig("/path/to/repo", `{
  "title":"Example Site Title",
  "baseURL":"https://example.com",
  "entriesOnIndex":15,
  "authorName":"ExamplePerson",
  "authorURL":"https://example.com/author"
}
`)
    
    let entry1 = new Entry(siteConfig, "/path/0001-some-title.txt", "Title: This title\nDate: 12/1/2019\nTags: JSON\n[Image:/m/test1.jpg]\ntext1 text1")
    let entry2 = new Entry(siteConfig, "/path/0002-some-title2.txt", "Title: This title2\nDate: 12/2/2019\nTags: JSON\ntext2 text2")
    let entry3 = new Entry(siteConfig, "/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/2019\nTags: JSON\n[Image:/m/test3.jpg]\ntext3\ttext3\\'")
    let entry4 = new Entry(siteConfig, "/path/0004-some-title4.txt", "Title: This title4\nDate: 1/1/2020\nTags: JSON\ntext4")
    let entry5 = new Entry(siteConfig, "/path/0005-some-title5.txt", "Title: This title5\nDate: 1/11/2020\nTags: JSON\ntext5")
    let entry6 = new Entry(siteConfig, "/path/0006-some-title6.txt", "Title: This title6\nDate: 11/22/2022\nTags: JSON\ntext6\nThis is my entry.\n\n[ContinueReadingWithURLTitle:Continue reading]\n\nThe next line.")

    
    let index = new Index(siteConfig, [entry2, entry1, entry3, entry4, entry5, entry6])
    
    let jsonFeed = new JSONFeed(index)
    jsonFeed.entriesInFeed = 5
    
    let expectation = `{
   "version" : "https://jsonfeed.org/version/1",
   "title" : "Example Site Title",
   "home_page_url" : "https://example.com/index.html",
   "feed_url" : "https://example.com/feed.json",
   "author" : {
      "url" : "https://example.com/author",
      "name" : "ExamplePerson"
   },
   "icon" : "https://example.com/apple-touch-icon.png",
   "favicon" : "https://example.com/favicon.ico",
   "items" : [
    {
         "title" : "This title6",
         "date_published" : "2022-11-22T00:00:00-08:00",
         "id" : "https://example.com/p/some-title6.html",
         "url" : "https://example.com/p/some-title6.html",
         "author" : {
            "name" : "ExamplePerson"
         },
         "content_html" : "<div id='post'>\\n<div id='header'>\\n<h2>\\n<a href='https://example.com/p/some-title6.html'>This title6</a>\\n</h2>\\n</div>\\n<div id='postdate'>Posted on 11/22/2022<br />\\nTags: <a href='/tags.html'>JSON</a></div>\\ntext6<br />\\nThis is my entry.<br />\\n<br />\\n<h4><a href=\\"https://example.com/p/some-title6.html\\">Continue reading</a></h4>\\n</div>\\n"
    },
    {
         "title" : "This title5",
         "date_published" : "2020-01-11T00:00:00-08:00",
         "id" : "https://example.com/p/some-title5.html",
         "url" : "https://example.com/p/some-title5.html",
         "author" : {
            "name" : "ExamplePerson"
         },
         "content_html" : "<div id='post'>\\n<div id='header'>\\n<h2>\\n<a href='https://example.com/p/some-title5.html'>This title5</a>\\n</h2>\\n</div>\\n<div id='postdate'>Posted on 1/11/2020<br />\\nTags: <a href='/tags.html'>JSON</a></div>\\ntext5\\n</div>\\n"
    },
    {
         "title" : "This title4",
         "date_published" : "2020-01-01T00:00:00-08:00",
         "id" : "https://example.com/p/some-title4.html",
         "url" : "https://example.com/p/some-title4.html",
         "author" : {
            "name" : "ExamplePerson"
         },
         "content_html" : "<div id='post'>\\n<div id='header'>\\n<h2>\\n<a href='https://example.com/p/some-title4.html'>This title4</a>\\n</h2>\\n</div>\\n<div id='postdate'>Posted on 1/1/2020<br />\\nTags: <a href='/tags.html'>JSON</a></div>\\ntext4\\n</div>\\n"
    },
    {
         "title" : "This title3",
         "date_published" : "2019-12-28T00:00:00-08:00",
         "id" : "https://example.com/p/some-title3.html",
         "url" : "https://example.com/p/some-title3.html",
         "image" : "https://example.com/m/test3.jpg",
         "author" : {
            "name" : "ExamplePerson"
         },
         "content_html" : "<div id='post'>\\n<div id='header'>\\n<h2>\\n<a href='https://example.com/p/some-title3.html'>This title3</a>\\n</h2>\\n</div>\\n<img src=\\"/m/test3.jpg\\">\\n<div id='postdate'>Posted on 12/28/2019<br />\\nTags: <a href='/tags.html'>JSON</a></div>\\ntext3\\ttext3\\\\'\\n</div>\\n"
    },
    {
         "title" : "This title2",
         "date_published" : "2019-12-02T00:00:00-08:00",
         "id" : "https://example.com/p/some-title2.html",
         "url" : "https://example.com/p/some-title2.html",
         "author" : {
            "name" : "ExamplePerson"
         },
         "content_html" : "<div id='post'>\\n<div id='header'>\\n<h2>\\n<a href='https://example.com/p/some-title2.html'>This title2</a>\\n</h2>\\n</div>\\n<div id='postdate'>Posted on 12/2/2019<br />\\nTags: <a href='/tags.html'>JSON</a></div>\\ntext2 text2\\n</div>\\n"
    }
  ]
}
`
    assertEqual(jsonFeed.toText(), expectation)
  }

  
// AtomFeed class

  test_AtomFeed_toText() {
    let entry1 = new Entry(this.siteConfig(), "/path/0001-some-title.txt", "Title: This title\nDate: 12/1/2019\nTags: JSON\n[Image:/m/test1.jpg]\ntext1 text1")
    let entry2 = new Entry(this.siteConfig(), "/path/0002-some-title2.txt", "Title: This title2\nDate: 12/2/2019\nTags: JSON\ntext2 text2")
    let entry3 = new Entry(this.siteConfig(), "/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/2019\nTags: JSON\n[Image:/m/test3.jpg]\ntext3\ttext3\\'")
    let entry4 = new Entry(this.siteConfig(), "/path/0004-some-title4.txt", "Title: This title4\nDate: 1/1/2020\nTags: JSON\ntext4")
    let entry5 = new Entry(this.siteConfig(), "/path/0005-some-title5.txt", "Title: This title5\nDate: 1/11/2020\nTags: JSON\ntext5")
    let entry6 = new Entry(this.siteConfig(), "/path/0006-some-title6.txt", "Title: This title6\nDate: 11/22/2022\nTags: JSON\ntext6\nThis is my entry.\n\n[ContinueReadingWithURLTitle:Continue reading]\n\nThe next line.")
    
    let index = new Index(this.siteConfig(), [entry2, entry1, entry3, entry4, entry5, entry6])
    
    let atomFeed = new AtomFeed(index)
    atomFeed.entriesInFeed = 5
    
    let expectation = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<title>memalign.github.io</title>
<subtitle>By memalign</subtitle>
<link rel="alternate" type="text/html" href="https://memalign.github.io/index.html" />
<link rel="self" type="application/atom+xml" href="https://memalign.github.io/feed.xml" />
<id>https://memalign.github.io/feed.xml</id>
<updated>2022-11-22T00:00:00-08:00</updated>
<rights>Copyright © 2022, memalign</rights>
<icon>https://memalign.github.io/apple-touch-icon.png</icon>
<logo>https://memalign.github.io/apple-touch-icon.png</logo>
<entry>
<title>This title6</title>
<link rel="alternate" type="text/html" href="https://memalign.github.io/p/some-title6.html" />
<link rel="related" type="text/html" href="https://memalign.github.io/p/some-title6.html" />
<id>https://memalign.github.io/p/some-title6.html</id>
<published>2022-11-22T00:00:00-08:00</published>
<updated>2022-11-22T00:00:00-08:00</updated>
<author>
<name>memalign</name>
<uri>https://memalign.github.io/index.html</uri>
</author>
<content type="html" xml:base="https://memalign.github.io/p/" xml:lang="en"><![CDATA[
<div id='post'>
<div id='header'>
<h2>
<a href='https://memalign.github.io/p/some-title6.html'>This title6</a>
</h2>
</div>
<div id='postdate'>Posted on 11/22/2022<br />
Tags: <a href='/tags.html'>JSON</a></div>
text6<br />
This is my entry.<br />
<br />
<h4><a href="https://memalign.github.io/p/some-title6.html">Continue reading</a></h4>
</div>

]]>
</content>
</entry>

<entry>
<title>This title5</title>
<link rel="alternate" type="text/html" href="https://memalign.github.io/p/some-title5.html" />
<link rel="related" type="text/html" href="https://memalign.github.io/p/some-title5.html" />
<id>https://memalign.github.io/p/some-title5.html</id>
<published>2020-01-11T00:00:00-08:00</published>
<updated>2020-01-11T00:00:00-08:00</updated>
<author>
<name>memalign</name>
<uri>https://memalign.github.io/index.html</uri>
</author>
<content type="html" xml:base="https://memalign.github.io/p/" xml:lang="en"><![CDATA[
<div id='post'>
<div id='header'>
<h2>
<a href='https://memalign.github.io/p/some-title5.html'>This title5</a>
</h2>
</div>
<div id='postdate'>Posted on 1/11/2020<br />
Tags: <a href='/tags.html'>JSON</a></div>
text5
</div>

]]>
</content>
</entry>

<entry>
<title>This title4</title>
<link rel="alternate" type="text/html" href="https://memalign.github.io/p/some-title4.html" />
<link rel="related" type="text/html" href="https://memalign.github.io/p/some-title4.html" />
<id>https://memalign.github.io/p/some-title4.html</id>
<published>2020-01-01T00:00:00-08:00</published>
<updated>2020-01-01T00:00:00-08:00</updated>
<author>
<name>memalign</name>
<uri>https://memalign.github.io/index.html</uri>
</author>
<content type="html" xml:base="https://memalign.github.io/p/" xml:lang="en"><![CDATA[
<div id='post'>
<div id='header'>
<h2>
<a href='https://memalign.github.io/p/some-title4.html'>This title4</a>
</h2>
</div>
<div id='postdate'>Posted on 1/1/2020<br />
Tags: <a href='/tags.html'>JSON</a></div>
text4
</div>

]]>
</content>
</entry>

<entry>
<title>This title3</title>
<link rel="alternate" type="text/html" href="https://memalign.github.io/p/some-title3.html" />
<link rel="related" type="text/html" href="https://memalign.github.io/p/some-title3.html" />
<id>https://memalign.github.io/p/some-title3.html</id>
<published>2019-12-28T00:00:00-08:00</published>
<updated>2019-12-28T00:00:00-08:00</updated>
<author>
<name>memalign</name>
<uri>https://memalign.github.io/index.html</uri>
</author>
<content type="html" xml:base="https://memalign.github.io/p/" xml:lang="en"><![CDATA[
<div id='post'>
<div id='header'>
<h2>
<a href='https://memalign.github.io/p/some-title3.html'>This title3</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>JSON</a></div>
text3\ttext3\\'
</div>

]]>
</content>
</entry>

<entry>
<title>This title2</title>
<link rel="alternate" type="text/html" href="https://memalign.github.io/p/some-title2.html" />
<link rel="related" type="text/html" href="https://memalign.github.io/p/some-title2.html" />
<id>https://memalign.github.io/p/some-title2.html</id>
<published>2019-12-02T00:00:00-08:00</published>
<updated>2019-12-02T00:00:00-08:00</updated>
<author>
<name>memalign</name>
<uri>https://memalign.github.io/index.html</uri>
</author>
<content type="html" xml:base="https://memalign.github.io/p/" xml:lang="en"><![CDATA[
<div id='post'>
<div id='header'>
<h2>
<a href='https://memalign.github.io/p/some-title2.html'>This title2</a>
</h2>
</div>
<div id='postdate'>Posted on 12/2/2019<br />
Tags: <a href='/tags.html'>JSON</a></div>
text2 text2
</div>

]]>
</content>
</entry>
</feed><!-- THE END -->
`

    assertEqual(atomFeed.toText(), expectation)
  }

  test_AtomFeed_toText_differentSiteConfig() {
    let siteConfig = new SiteConfig("/path/to/repo", `{
  "title":"Example Site Title",
  "baseURL":"https://example.com",
  "entriesOnIndex":15,
  "authorName":"ExamplePerson",
  "authorURL":"https://example.com/author"
}
`)

    let entry1 = new Entry(siteConfig, "/path/0001-some-title.txt", "Title: This title\nDate: 12/1/2019\nTags: JSON\n[Image:/m/test1.jpg]\ntext1 text1")
    let entry2 = new Entry(siteConfig, "/path/0002-some-title2.txt", "Title: This title2\nDate: 12/2/2019\nTags: JSON\ntext2 text2")
    let entry3 = new Entry(siteConfig, "/path/0003-some-title3.txt", "Title: This title3\nDate: 12/28/2019\nTags: JSON\n[Image:/m/test3.jpg]\ntext3\ttext3\\'")
    let entry4 = new Entry(siteConfig, "/path/0004-some-title4.txt", "Title: This title4\nDate: 1/1/2020\nTags: JSON\ntext4")
    let entry5 = new Entry(siteConfig, "/path/0005-some-title5.txt", "Title: This title5\nDate: 1/11/2020\nTags: JSON\ntext5")
    let entry6 = new Entry(siteConfig, "/path/0006-some-title6.txt", "Title: This title6\nDate: 11/22/2022\nTags: JSON\ntext6\nThis is my entry.\n\n[ContinueReadingWithURLTitle:Continue reading]\n\nThe next line.")
    
    let index = new Index(siteConfig, [entry2, entry1, entry3, entry4, entry5, entry6])
    
    let atomFeed = new AtomFeed(index)
    atomFeed.entriesInFeed = 5
    
    let expectation = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
<title>Example Site Title</title>
<subtitle>By ExamplePerson</subtitle>
<link rel="alternate" type="text/html" href="https://example.com/index.html" />
<link rel="self" type="application/atom+xml" href="https://example.com/feed.xml" />
<id>https://example.com/feed.xml</id>
<updated>2022-11-22T00:00:00-08:00</updated>
<rights>Copyright © 2022, ExamplePerson</rights>
<icon>https://example.com/apple-touch-icon.png</icon>
<logo>https://example.com/apple-touch-icon.png</logo>
<entry>
<title>This title6</title>
<link rel="alternate" type="text/html" href="https://example.com/p/some-title6.html" />
<link rel="related" type="text/html" href="https://example.com/p/some-title6.html" />
<id>https://example.com/p/some-title6.html</id>
<published>2022-11-22T00:00:00-08:00</published>
<updated>2022-11-22T00:00:00-08:00</updated>
<author>
<name>ExamplePerson</name>
<uri>https://example.com/index.html</uri>
</author>
<content type="html" xml:base="https://example.com/p/" xml:lang="en"><![CDATA[
<div id='post'>
<div id='header'>
<h2>
<a href='https://example.com/p/some-title6.html'>This title6</a>
</h2>
</div>
<div id='postdate'>Posted on 11/22/2022<br />
Tags: <a href='/tags.html'>JSON</a></div>
text6<br />
This is my entry.<br />
<br />
<h4><a href="https://example.com/p/some-title6.html">Continue reading</a></h4>
</div>

]]>
</content>
</entry>

<entry>
<title>This title5</title>
<link rel="alternate" type="text/html" href="https://example.com/p/some-title5.html" />
<link rel="related" type="text/html" href="https://example.com/p/some-title5.html" />
<id>https://example.com/p/some-title5.html</id>
<published>2020-01-11T00:00:00-08:00</published>
<updated>2020-01-11T00:00:00-08:00</updated>
<author>
<name>ExamplePerson</name>
<uri>https://example.com/index.html</uri>
</author>
<content type="html" xml:base="https://example.com/p/" xml:lang="en"><![CDATA[
<div id='post'>
<div id='header'>
<h2>
<a href='https://example.com/p/some-title5.html'>This title5</a>
</h2>
</div>
<div id='postdate'>Posted on 1/11/2020<br />
Tags: <a href='/tags.html'>JSON</a></div>
text5
</div>

]]>
</content>
</entry>

<entry>
<title>This title4</title>
<link rel="alternate" type="text/html" href="https://example.com/p/some-title4.html" />
<link rel="related" type="text/html" href="https://example.com/p/some-title4.html" />
<id>https://example.com/p/some-title4.html</id>
<published>2020-01-01T00:00:00-08:00</published>
<updated>2020-01-01T00:00:00-08:00</updated>
<author>
<name>ExamplePerson</name>
<uri>https://example.com/index.html</uri>
</author>
<content type="html" xml:base="https://example.com/p/" xml:lang="en"><![CDATA[
<div id='post'>
<div id='header'>
<h2>
<a href='https://example.com/p/some-title4.html'>This title4</a>
</h2>
</div>
<div id='postdate'>Posted on 1/1/2020<br />
Tags: <a href='/tags.html'>JSON</a></div>
text4
</div>

]]>
</content>
</entry>

<entry>
<title>This title3</title>
<link rel="alternate" type="text/html" href="https://example.com/p/some-title3.html" />
<link rel="related" type="text/html" href="https://example.com/p/some-title3.html" />
<id>https://example.com/p/some-title3.html</id>
<published>2019-12-28T00:00:00-08:00</published>
<updated>2019-12-28T00:00:00-08:00</updated>
<author>
<name>ExamplePerson</name>
<uri>https://example.com/index.html</uri>
</author>
<content type="html" xml:base="https://example.com/p/" xml:lang="en"><![CDATA[
<div id='post'>
<div id='header'>
<h2>
<a href='https://example.com/p/some-title3.html'>This title3</a>
</h2>
</div>
<img src="/m/test3.jpg">
<div id='postdate'>Posted on 12/28/2019<br />
Tags: <a href='/tags.html'>JSON</a></div>
text3\ttext3\\'
</div>

]]>
</content>
</entry>

<entry>
<title>This title2</title>
<link rel="alternate" type="text/html" href="https://example.com/p/some-title2.html" />
<link rel="related" type="text/html" href="https://example.com/p/some-title2.html" />
<id>https://example.com/p/some-title2.html</id>
<published>2019-12-02T00:00:00-08:00</published>
<updated>2019-12-02T00:00:00-08:00</updated>
<author>
<name>ExamplePerson</name>
<uri>https://example.com/index.html</uri>
</author>
<content type="html" xml:base="https://example.com/p/" xml:lang="en"><![CDATA[
<div id='post'>
<div id='header'>
<h2>
<a href='https://example.com/p/some-title2.html'>This title2</a>
</h2>
</div>
<div id='postdate'>Posted on 12/2/2019<br />
Tags: <a href='/tags.html'>JSON</a></div>
text2 text2
</div>

]]>
</content>
</entry>
</feed><!-- THE END -->
`

    assertEqual(atomFeed.toText(), expectation)
  }

  
// Featured class

  test_Featured_singleItem() {
    let f = new Featured("/path/FEATURED.txt", `PCEImage Editor
- Image: /m/pceimage/image.png
- /m/pceimage/index.html
`)  
    assertEqual(f.items.length, 1)
    
    assertEqual(f.items[0].title, "PCEImage Editor")  
    assertEqual(f.items[0].url, "/m/pceimage/index.html")  
    assertEqual(f.items[0].imageURL, "/m/pceimage/image.png")
  }

  test_Featured_multipleItems() {
    let f = new Featured("/path/FEATURED.txt", `PCEImage Editor
- Image: /m/pceimage/image.png
- /m/pceimage/index.html

FormulaGraph
- Image: /m/formulagraph-stairs.png
- /m/formulagraph/index.html

Pac-Man Dungeon
- Image: https://example.com/m/image.jpg
- https://example.com/m/index.html
`)  
    assertEqual(f.items.length, 3)
    
    assertEqual(f.items[0].title, "PCEImage Editor")  
    assertEqual(f.items[0].url, "/m/pceimage/index.html")  
    assertEqual(f.items[0].imageURL, "/m/pceimage/image.png")

    assertEqual(f.items[1].title, "FormulaGraph")  
    assertEqual(f.items[1].url, "/m/formulagraph/index.html")  
    assertEqual(f.items[1].imageURL, "/m/formulagraph-stairs.png")
    
    assertEqual(f.items[2].title, "Pac-Man Dungeon")
    assertEqual(f.items[2].url, "https://example.com/m/index.html")  
    assertEqual(f.items[2].imageURL, "https://example.com/m/image.jpg")
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

