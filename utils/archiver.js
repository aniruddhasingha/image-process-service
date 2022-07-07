const fs = require('fs');
const path = require("path");
const { v4 } = require('uuid');
const AdmZip = require('adm-zip');
const archiveFiles = (files,zipfilename = null) => {
  const zip = new AdmZip();
  if(!zipfilename){
    zipfilename = v4() + '.zip';
  }
  for (let file of files) {
    zip.addLocalFile(file.path);
    if(!file._id){
      fs.unlinkSync(file.path);
    }
    // perform db operation
  }
  const data = zip.toBuffer();
  const fileType = 'application/zip';
  // save file zip in root directory
  let zipFilePath = `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${zipfilename}`;
  zip.writeZip(zipFilePath);

  return { data, zipfilename, fileType, zipFilePath }
}

module.exports = archiveFiles