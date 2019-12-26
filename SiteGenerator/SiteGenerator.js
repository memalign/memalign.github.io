// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: orange; icon-glyph: laptop-code;
// Utilities

function currentScriptFilename() {
  return Script.name() + ".js";
}

function currentScriptPath() {
  return FileManager.iCloud().documentsDirectory() + "/" + currentScriptFilename();
}

function repoPath() {
  return FileManager.local().bookmarkedPath("memalign.github.io")
}

function repoSiteGeneratorPath() {
   return repoPath() + "/SiteGenerator/"; 
}

function copyCurrentScriptToRepo() {
  let fm = FileManager.local()
  let destPath = repoSiteGeneratorPath() + currentScriptFilename()
  if (fm.fileExists(destPath)) {
    fm.remove(destPath)
  }
  fm.copy(currentScriptPath(), destPath)
}


function runScript() {
  console.log("=> Backing up script")
  copyCurrentScriptToRepo()
  console.log("=> done")
  
  let fm = FileManager.local()

  let entryFilePaths = fm.listContents(repoPath() + "/entries")
        
  console.log("Entry paths: " + entryFilePaths)
        
  let outputPath = repoPath() + "/output.txt"
        
  fm.writeString(outputPath, "test")          
}

runScript()

