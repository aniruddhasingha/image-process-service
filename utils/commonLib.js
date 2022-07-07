const sharp = require("sharp");
const { v4 } = require('uuid');
const path = require("path");
const fs = require("fs");
const { promisify } = require('util')
const writeFileAsync = promisify(fs.writeFile)
const getMetaData = async (fileBuffer) => await sharp(fileBuffer).metadata();

const updateExtension = async (file, newFilename, extensionType) => {
    await sharp(file.path)
        .toFormat(extensionType)
        .toFile(`${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`);
    fs.unlinkSync(file.path);
}
const resizeImage = async (file, dimensions, newFilename) => {
    await sharp(file.path)
        .resize(dimensions.width, dimensions.height)
        .toFormat(file.extension_type ? file.extension_type : file.extension, { mozjpeg: true })
        .toFile(`${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`);
    fs.unlinkSync(file.path);
}

const thumbnailImage = async (file, newFilename) => {
    await sharp(file.path)
        .resize({
            width: 720,
            height: 1280,
            fit: sharp.fit.outside
        })
        .sharpen()
        .toFile(`${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`);
    fs.unlinkSync(file.path);
}

const compressImage = async (file, newFilename, quality) => {
    let finalFilePath = `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`;
    await sharp(file.path).jpeg({
        quality: quality,
        chromaSubsampling: '4:4:4'
    }).toFile(finalFilePath);
    fs.unlinkSync(file.path);
}
const rotateImage = async (file, newFilename, degree) => {
    let finalFilePath = `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`;
    await sharp(file.path).rotate(degree).toFile(finalFilePath);
    fs.unlinkSync(file.path);
}
const maskImage = async (file, newFilename, extractChannelValue) => {
    let finalFilePath = `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`;
    await sharp(file.path)
        .extractChannel(extractChannelValue) 
        .toBuffer()
        .then(async (maskBuffer) => {
            await sharp(file.path)
                .ensureAlpha()
                .joinChannel(maskBuffer)
                .toFile(finalFilePath);
        });
    fs.unlinkSync(file.path);
}

const addWaterMark = async (file, newFilename, textDetails) => {
    let finalFilePath = `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`;

    const overlay = `<svg width="${textDetails.textWidth - 20}" height="${textDetails.textHeight - 20}">
    <text x="50%" y="50%" font-family="sans-serif" font-size="200%" fill= "#03fcfc" text-anchor="middle">${textDetails.waterMarkText}</text>
  </svg>`;

    await sharp(file.path)
        .composite([
            {
                input: Buffer.from(overlay),
                gravity: 'southeast'
            },
        ])
        .toFile(finalFilePath);
    fs.unlinkSync(file.path);
}
const getResizeDimension = (dimensions, percentage) => {
    let newdimensions = { ...dimensions };
    let calculatedPercentage = percentage / 100;
    newdimensions.width = dimensions.width - (dimensions.width * calculatedPercentage);
    newdimensions.height = dimensions.height - (dimensions.height * calculatedPercentage);
    return newdimensions
}

const getResizedFile = async (file, postData) => {
    let dimensions = file.dimension;
    if (postData.resize_type === "percentage") {
        let newResizeDimension = getResizeDimension(dimensions, Number(postData.resize_percent));
        postData.resize_height = newResizeDimension.height;
        postData.resize_width = newResizeDimension.width;
    }
    let newFilename = `new_resized_${file.filename}`;
    let resizeDimension = {
        width: Math.round(Number(postData.resize_width)),
        height: Math.round(Number(postData.resize_height))
    }
    await resizeImage(file, resizeDimension, newFilename);
    let newFile = {
        path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
        filename: newFilename,
    }
    return newFile
}

const getCompressedFile = async (file, postData) => {
    let newFilename = `new_compressed_${file.filename}`;
    let quality = Number(postData.quality);
    await compressImage(file, newFilename, quality);
    let newFile = {
        path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
        filename: newFilename
    }
    return newFile
}

const getThumbnailFile = async (file) => {
    let newFilename = `new_thubnail_${file.filename}`;
    await thumbnailImage(file, newFilename);
    let newFile = {
        path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
        filename: newFilename
    }
    return newFile
}

const getRotatedFile = async (file, postData) => {
    if (postData.rotation_type === 'direction') {
        if (postData.rotate === 'left') {
            postData.degree = -90;
        }
        if (postData.rotate === 'right') {
            postData.degree = 90;
        }
        if (postData.rotate === 'flip') {
            postData.degree = 180;
        }
    }
    let degree = Number(postData.degree);
    let newFilename = `new_rotated_${file.filename}`;
    await rotateImage(file, newFilename, degree);
    let newFile = {
        path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
        filename: newFilename
    }
    return newFile
}

const getWaterMarkedFile = async (file, postData) => {
    let newFilename = `new_modified_${file.filename}`;
    let dimensions = file.dimension;
    let textDetails = {
        waterMarkText: postData.water_mark_text,
        textWidth: dimensions.width,
        textHeight: dimensions.height
    };
    await addWaterMark(file, newFilename, textDetails);
    let newFile = {
        path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
        filename: newFilename
    }
    return newFile
}
const getMaskedFile = async (file,postData) => {
    let rgba = postData.rgba;
    let newFilename = `new_masked_${file.filename}`;
    await maskImage(file, newFilename, rgba);
    let newFile = {
        path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
        filename: newFilename
    }
    return newFile
}
const getUpdatedExtensionFile = async (file, postData) => {
    let fileType = postData.extension_type;
    let newFilename = `updt_ext_${path.parse(file.filename).name}.${fileType}`;
    await updateExtension(file, newFilename, fileType);
    let newFile = {
        path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
        filename: newFilename
    }
    return newFile

}
const getResizedUrlFile = async (file, postData,fileMetaData) => {
    if (postData.resize_type === "percentage") {
        let newResizeDimension = getResizeDimension(fileMetaData, Number(postData.resize_percent));
        postData.resize_height = newResizeDimension.height;
        postData.resize_width = newResizeDimension.width;
    }
    let newFilename = `${v4()}.${fileMetaData.format}`;
    let resizeDimension = {
        width: Math.round(Number(postData.resize_width)),
        height: Math.round(Number(postData.resize_height))
    }
    await sharp(file)
    .resize(resizeDimension.width, resizeDimension.height)
    .toFormat(fileMetaData.format, { mozjpeg: true })
    .toFile(`${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`);
    let newFile = {
        path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
        filename: newFilename,
    }
    return newFile
}

const getCompressedUrlFile = async (file, postData,fileMetaData) => {
    let newFilename = `${v4()}.${fileMetaData.format}`;
    let quality = Number(postData.quality);
    let finalFilePath = `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`;
    await sharp(file).jpeg({
        quality: quality,
        chromaSubsampling: '4:4:4'
    }).toFile(finalFilePath);
    let newFile = {
        path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
        filename: newFilename
    }
    return newFile
}

const getThumbnailUrlFile = async (file,fileMetaData) => {
    let newFilename = `${v4()}.${fileMetaData.format}`;
    await sharp(file)
    .resize({
        width: 720,
        height: 1280,
        fit: sharp.fit.outside
    })
    .sharpen()
    .toFile(`${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`);
    let newFile = {
        path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
        filename: newFilename
    }
    return newFile
}

const getRotatedUrlFile = async (file, postData,fileMetaData) => {
    let newFilename = `${v4()}.${fileMetaData.format}`;
    if (postData.rotation_type === 'direction') {
        if (postData.rotate === 'left') {
            postData.degree = -90;
        }
        if (postData.rotate === 'right') {
            postData.degree = 90;
        }
        if (postData.rotate === 'flip') {
            postData.degree = 180;
        }
    }
    let degree = Number(postData.degree);
    let finalFilePath = `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`;
    await sharp(file).rotate(degree).toFile(finalFilePath);
    let newFile = {
        path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
        filename: newFilename
    }
    return newFile
}

const getWaterMarkedUrlFile = async (file, postData,fileMetaData) => {
    let newFilename = `${v4()}.${fileMetaData.format}`;
    let textDetails = {
        waterMarkText: postData.water_mark_text,
        textWidth: fileMetaData.width,
        textHeight: fileMetaData.height
    };
    let finalFilePath = `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`;

    const overlay = `<svg width="${textDetails.textWidth - 20}" height="${textDetails.textHeight - 20}">
    <text x="50%" y="50%" font-family="sans-serif" font-size="200%" fill= "#03fcfc" text-anchor="middle">${textDetails.waterMarkText}</text>
  </svg>`;

    await sharp(file)
        .composite([
            {
                input: Buffer.from(overlay),
                gravity: 'southeast'
            },
        ])
        .toFile(finalFilePath);
    let newFile = {
        path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
        filename: newFilename
    }
    return newFile
}
const getMaskedUrlFile = async (file,postData,fileMetaData) => {
    let rgba = postData.rgba;
    let newFilename = `${v4()}.${fileMetaData.format}`;
    let finalFilePath = `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`;
    await sharp(file)
        .extractChannel(rgba) 
        .toBuffer()
        .then(async (maskBuffer) => {
            await sharp(file)
                .ensureAlpha()
                .joinChannel(maskBuffer)
                .toFile(finalFilePath);
        });
    let newFile = {
        path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
        filename: newFilename
    }
    return newFile
}

const getUpdatedExtensionUrlFile = async (file, postData) => {
    let fileType = postData.extension_type;
    let newFilename = `${v4()}.${fileType}`;
    await sharp(file)
    .toFormat(fileType)
    .toFile(`${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`);
    let newFile = {
        path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
        filename: newFilename
    }
    return newFile
}
const writeFileFromUrl = async(file,filepath)=>{
    await writeFileAsync(filepath,file)
}
module.exports = {
    getResizeDimension, resizeImage, thumbnailImage, getMetaData, compressImage,
    rotateImage, maskImage, addWaterMark, updateExtension, getResizedFile, getCompressedFile,
    getThumbnailFile, getRotatedFile, getWaterMarkedFile, getMaskedFile,getUpdatedExtensionFile,
    getResizedUrlFile, getCompressedUrlFile,getThumbnailUrlFile, getRotatedUrlFile,getWaterMarkedUrlFile,
    getMaskedUrlFile, getUpdatedExtensionUrlFile,writeFileFromUrl
};