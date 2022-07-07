const { v4 } = require('uuid');
const Joi = require('joi');
const lo_ = require('lodash');
const sizeOf = require('image-size')
const Files = require('../models/Files');
const commonLib = require("../utils/commonLib");
const fs = require("fs");
const path = require("path");
const archiveFiles = require('../utils/archiver');
const testProcessImage = async (req, res, next) => {
    res.status(200).json("Api for processing image")
}
const resizeImages = async (req, res, next) => {
    let statusCode;
    let result = {};
    let response = {};
    try {
        let schema = Joi.object().keys({
            resize_type: Joi.string().valid('pixel', 'percentage').required(),
            resize_percent: Joi.string().when('resize_type', {
                is: 'percentage',
                then: Joi.string().valid('25', '50', '75').required(),
                otherwise: Joi.string().allow('').default('')
            }),
            resize_height: Joi.string().when('resize_type', {
                is: 'pixel',
                then: Joi.string().required(),
                otherwise: Joi.string().allow('').default('')
            }),
            resize_width: Joi.string().when('resize_type', {
                is: 'pixel',
                then: Joi.string().required(),
                otherwise: Joi.string().allow('').default('')
            })
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            let err = lo_.head(error.details).message;
            throw new Error(err);
        }
        let postData = Object.assign({}, value);
        let files = req.files;
        if (!files) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            throw new Error("Files Should Be Present");
        }
        let toZipFilesArray = [];
        await Promise.all(
            files.map(async file => {
                let dimensions = sizeOf(file.path);
                if (postData.resize_type === "percentage") {
                    let newResizeDimension = commonLib.getResizeDimension(dimensions, Number(postData.resize_percent));
                    postData.resize_height = newResizeDimension.height;
                    postData.resize_width = newResizeDimension.width;
                }
                let newFilename = `new_resized_${file.filename}`;
                let resizeDimension = {
                    width: Math.round(Number(postData.resize_width)),
                    height: Math.round(Number(postData.resize_height))
                }
                await commonLib.resizeImage(file, resizeDimension, newFilename);
                let newFile = {
                    path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
                    filename: newFilename,
                    extension_type: file.extension_type
                }
                toZipFilesArray.push(newFile);
            }));
        const arciveFilePath = archiveFiles(toZipFilesArray);
        statusCode = process.env.HTTP_RESPONSE_OK
        res.download(arciveFilePath.zipFilePath, arciveFilePath.zipfilename, (err) => {
            if (err) {
                throw new Error(err)
            }
            fs.unlink(arciveFilePath.zipFilePath, function () {
                console.log("File was deleted") // Callback
            });
        })
    }
    catch (err) {
        console.log(err);
        statusCode = statusCode || process.env.HTTP_RESPONSE_SERVER_ERROR;
        response.error = err.message;
        res.status(Number(statusCode)).json(response);
    }
    if (!response.error) {
        response.result = result;
    }
}


const createTumbnailImages = async (req, res, next) => {
    let statusCode;
    let result = {};
    let response = {};
    try {
        let schema = Joi.object().keys({});
        const { error, value } = schema.validate(req.body);
        if (error) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            let err = lo_.head(error.details).message;
            throw new Error(err);
        }
        let files = req.files;
        if (!files) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            throw new Error("Files Should Be Present");
        }
        let toZipFilesArray = [];
        await Promise.all(
            files.map(async file => {
                let newFilename = `new_thubnail_${file.filename}`;
                await commonLib.thumbnailImage(file, newFilename);
                let newFile = {
                    path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
                    filename: newFilename
                }
                toZipFilesArray.push(newFile);
            }));
        const arciveFilePath = archiveFiles(toZipFilesArray);
        statusCode = process.env.HTTP_RESPONSE_OK
        res.download(arciveFilePath.zipFilePath, arciveFilePath.zipfilename, (err) => {
            if (err) {
                new Error(err)
            }
            fs.unlink(arciveFilePath.zipFilePath, function () {
                console.log("File was deleted") // Callback
            });
        })
    }
    catch (err) {
        statusCode = statusCode || process.env.HTTP_RESPONSE_SERVER_ERROR;
        response.error = err.message;
        res.status(Number(statusCode)).json(response);
    }
    if (!response.error) {
        response.result = result;
    }
}
const compressImages = async (req, res, next) => {
    let statusCode;
    let result = {};
    let response = {};
    try {
        let schema = Joi.object().keys({
            quality: Joi.number().required()
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            let err = lo_.head(error.details).message;
            throw new Error(err);
        }
        let postData = Object.assign({}, value);
        let quality = Number(postData.quality);
        let files = req.files;
        if (!files) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            throw new Error("Files Should Be Present");
        }
        let toZipFilesArray = [];
        await Promise.all(
            files.map(async file => {
                let newFilename = `new_compressed_${file.filename}`;
                await commonLib.compressImage(file, newFilename, quality);
                let newFile = {
                    path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
                    filename: newFilename
                }
                toZipFilesArray.push(newFile);
            }));
        const arciveFilePath = archiveFiles(toZipFilesArray);
        statusCode = process.env.HTTP_RESPONSE_OK
        res.download(arciveFilePath.zipFilePath, arciveFilePath.zipfilename, (err) => {
            if (err) {
                new Error(err)
            }
            fs.unlink(arciveFilePath.zipFilePath, function () {
                console.log("File was deleted") // Callback
            });
        })
    }
    catch (err) {
        statusCode = statusCode || process.env.HTTP_RESPONSE_SERVER_ERROR;
        response.error = err.message;
        res.status(Number(statusCode)).json(response);
    }
    if (!response.error) {
        response.result = result;
    }
}
const rotateImages = async (req, res, next) => {
    let statusCode;
    let result = {};
    let response = {};
    try {
        let schema = Joi.object().keys({
            rotation_type: Joi.string().valid('direction', 'degree'),
            degree: Joi.string().when('rotation_type', {
                is: 'degree',
                then: Joi.string().required(),
                otherwise: Joi.string().allow('').default('')
            }),
            rotate: Joi.string().when('rotation_type', {
                is: 'direction',
                then: Joi.string().valid('left', 'right', 'flip').required(),
                otherwise: Joi.string().allow('').default('')
            })
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            let err = lo_.head(error.details).message;
            throw new Error(err);
        }
        let postData = Object.assign({}, value);
        let files = req.files;
        if (!files) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            throw new Error("Files Should Be Present");
        }
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
        let toZipFilesArray = [];
        await Promise.all(
            files.map(async file => {
                let newFilename = `new_rotated_${file.filename}`;
                await commonLib.rotateImage(file, newFilename, degree);
                let newFile = {
                    path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
                    filename: newFilename
                }
                toZipFilesArray.push(newFile);
            }));
        const arciveFilePath = archiveFiles(toZipFilesArray);
        statusCode = process.env.HTTP_RESPONSE_OK
        res.download(arciveFilePath.zipFilePath, arciveFilePath.zipfilename, (err) => {
            if (err) {
                new Error(err)
            }
            fs.unlink(arciveFilePath.zipFilePath, function () {
                console.log("File was deleted") // Callback
            });
        });
    }
    catch (err) {
        statusCode = statusCode || process.env.HTTP_RESPONSE_SERVER_ERROR;
        response.error = err.message;
        res.status(Number(statusCode)).json(response);
    }
    if (!response.error) {
        response.result = result;
    }
}

const addWatermarkInImages = async (req, res, next) => {
    let statusCode;
    let result = {};
    let response = {};
    try {
        let schema = Joi.object().keys({
            water_mark_text: Joi.string().default('default text')
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            let err = lo_.head(error.details).message;
            throw new Error(err);
        }
        let postData = Object.assign({}, value);
        let files = req.files;
        if (!files) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            throw new Error("Files Should Be Present");
        }
        let toZipFilesArray = [];

        await Promise.all(
            files.map(async file => {
                let newFilename = `new_modified_${file.filename}`;
                let dimensions = await sizeOf(file.path);
                let textDetails = {
                    waterMarkText: postData.water_mark_text,
                    textWidth: dimensions.width,
                    textHeight: dimensions.height
                };
                await commonLib.addWaterMark(file, newFilename, textDetails);
                let newFile = {
                    path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
                    filename: newFilename
                }
                toZipFilesArray.push(newFile);
            }));
        const arciveFilePath = archiveFiles(toZipFilesArray);
        statusCode = process.env.HTTP_RESPONSE_OK
        res.download(arciveFilePath.zipFilePath, arciveFilePath.zipfilename, (err) => {
            if (err) {
                new Error(err)
            }
            fs.unlink(arciveFilePath.zipFilePath, function () {
                console.log("File was deleted") // Callback
            });
        });
    }
    catch (err) {
        console.log(err)
        statusCode = statusCode || process.env.HTTP_RESPONSE_SERVER_ERROR;
        response.error = err.message;
        res.status(Number(statusCode)).json(response);
    }
    if (!response.error) {
        response.result = result;
    }
}
const maskImages = async (req, res, next) => {
    let statusCode;
    let result = {};
    let response = {};
    try {
        let schema = Joi.object().keys({
            rgba: Joi.string().valid('red', 'green', 'blue')
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            let err = lo_.head(error.details).message;
            throw new Error(err);
        }
        let postData = Object.assign({}, value);
        let files = req.files;
        if (!files) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            throw new Error("Files Should Be Present");
        }
        let rgba = postData.rgba;
        let toZipFilesArray = [];
        await Promise.all(
            files.map(async file => {
                let newFilename = `new_masked_${file.filename}`;
                await commonLib.maskImage(file, newFilename, rgba);
                let newFile = {
                    path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
                    filename: newFilename
                }
                toZipFilesArray.push(newFile);
            }));
        const arciveFilePath = archiveFiles(toZipFilesArray);
        statusCode = process.env.HTTP_RESPONSE_OK
        res.download(arciveFilePath.zipFilePath, arciveFilePath.zipfilename, (err) => {
            if (err) {
                new Error(err)
            }
            fs.unlink(arciveFilePath.zipFilePath, function () {
                console.log("File was deleted") // Callback
            });
        });
    }
    catch (err) {
        statusCode = statusCode || process.env.HTTP_RESPONSE_SERVER_ERROR;
        response.error = err.message;
        res.status(Number(statusCode)).json(response);
    }
    if (!response.error) {
        response.result = result;
    }
}

const changeExtension = async (req, res, next) => {
    let statusCode;
    let result = {};
    let response = {};
    try {
        let schema = Joi.object().keys({
            extension_type: Joi.string().valid('jpeg', 'png').required()
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            let err = lo_.head(error.details).message;
            throw new Error(err);
        }
        let postData = Object.assign({}, value);
        let files = req.files;
        if (!files) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            throw new Error("Files Should Be Present");
        }
        let toZipFilesArray = [];
        let fileType = postData.extension_type;
        await Promise.all(
            files.map(async file => {
                let newFilename = `updt_ext_${path.parse(file.filename).name}.${fileType}`;
                await commonLib.updateExtension(file, newFilename, fileType);
                let newFile = {
                    path: `${path.join(path.resolve('uploads'), '/tempMedia/processed/')}${newFilename}`,
                    filename: newFilename
                }
                toZipFilesArray.push(newFile);
            }));
        const arciveFilePath = archiveFiles(toZipFilesArray);
        statusCode = process.env.HTTP_RESPONSE_OK
        res.download(arciveFilePath.zipFilePath, arciveFilePath.zipfilename, (err) => {
            if (err) {
                new Error(err)
            }
            fs.unlink(arciveFilePath.zipFilePath, function () {
                console.log("File was deleted") // Callback
            });
        });
    }
    catch (err) {
        console.log(err)
        statusCode = statusCode || process.env.HTTP_RESPONSE_SERVER_ERROR;
        response.error = err.message;
        res.status(Number(statusCode)).json(response);
    }
    if (!response.error) {
        response.result = result;
    }
}

const processRepoFiles = async (req, res, next) => {
    let statusCode;
    let result = {};
    let response = {};
    try {
        let schema = Joi.object().keys({
            process_type: Joi.string().valid('resize', 'tumbnail', 'compress', 'rotate', 'masking', 'water_mark', 'change_ext').required(),
            resize_type: Joi.string().when('process_type', {
                is: 'resize',
                then: Joi.string().valid('percentage', 'pixel').required(),
                otherwise: Joi.string().allow('').default('')
            }),
            resize_percent: Joi.string().when('resize_type', {
                is: 'percentage',
                then: Joi.string().valid('25', '50', '75').required(),
                otherwise: Joi.string().allow('').default('')
            }),
            resize_height: Joi.string().when('resize_type', {
                is: 'pixel',
                then: Joi.string().required(),
                otherwise: Joi.string().allow('').default('')
            }),
            resize_width: Joi.string().when('resize_type', {
                is: 'pixel',
                then: Joi.string().required(),
                otherwise: Joi.string().allow('').default('')
            }),
            quality: Joi.string().when('process_type', {
                is: 'compress',
                then: Joi.string().required(),
                otherwise: Joi.string().allow('').default('')
            }),
            rotation_type: Joi.string().when('process_type', {
                is: 'rotate',
                then: Joi.string().valid('direction', 'degree').required(),
                otherwise: Joi.string().allow('').default('')
            }),
            degree: Joi.string().when('rotation_type', {
                is: 'degree',
                then: Joi.string().required(),
                otherwise: Joi.string().allow('').default('')
            }),
            rotate: Joi.string().when('rotation_type', {
                is: 'direction',
                then: Joi.string().valid('left', 'right', 'flip').required(),
                otherwise: Joi.string().allow('').default('')
            }),
            water_mark_text: Joi.string().when('process_type', {
                is: 'water_mark',
                then: Joi.string().default('default text'),
                otherwise: Joi.string().allow('').default('')
            }),
            extension_type: Joi.string().when('process_type', {
                is: 'change_ext',
                then: Joi.string().valid('jpeg', 'png'),
                otherwise: Joi.string().allow('').default('')
            }),
            rgba: Joi.string().when('process_type', {
                is: 'masking',
                then: Joi.string().valid('red', 'green', 'blue'),
                otherwise: Joi.string().allow('').default('')
            }),
            image_ids: Joi.array().items(Joi.string()).required()
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            let err = lo_.head(error.details).message;
            throw new Error(err)
        }
        let postData = Object.assign({}, value);
        let files;
        await Files.find({ _id: { $in: postData.image_ids } }).then((data) => {
            if (data.length < 1) {
                statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST
                throw new Error("Image Could Not Be Found");
            }
            files = data;
        }).catch((err) => {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST
            throw new Error(err);
        });
        let toZipFilesArray = [];
        await Promise.all(
            files.map(async file => {
                let newFile = {};
                if (postData.process_type === 'resize') {
                    newFile = await commonLib.getResizedFile(file, postData);
                }
                else if (postData.process_type === 'compress') {
                    newFile = await commonLib.getCompressedFile(file, postData);
                }
                else if (postData.process_type === 'tumbnail') {
                    newFile = await commonLib.getThumbnailFile(file);
                }
                else if (postData.process_type === 'rotate') {
                    newFile = await commonLib.getRotatedFile(file, postData);
                }
                else if (postData.process_type === 'water_mark') {
                    newFile = await commonLib.getWaterMarkedFile(file, postData);
                }
                else if (postData.process_type === 'masking') {
                    newFile = await commonLib.getMaskedFile(file, postData);
                }
                else {
                    newFile = await commonLib.getUpdatedExtensionFile(file, postData);
                }
                toZipFilesArray.push(newFile);
            }));
        // delete db data of processed file
        await Files.deleteMany({ _id: { $in: postData.image_ids } }).then(() => {
            console.log("Data deleted");
        }).catch((err) => {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST
            throw new Error(err);
        });
        const arciveFilePath = archiveFiles(toZipFilesArray);
        statusCode = process.env.HTTP_RESPONSE_OK
        res.download(arciveFilePath.zipFilePath, arciveFilePath.zipfilename, (err) => {
            if (err) {
                throw new Error(err)
            }
            fs.unlink(arciveFilePath.zipFilePath, function () {
                console.log("File was deleted") // Callback
            });
        })
    }
    catch (err) {
        console.trace(err)
        statusCode = statusCode || process.env.HTTP_RESPONSE_SERVER_ERROR;
        response.error = err.message;
        res.status(Number(statusCode)).json(response);
    }
    if (!response.error) {
        response.result = result;
    }
}
module.exports = {
    testProcessImage,
    resizeImages,
    createTumbnailImages,
    compressImages,
    rotateImages,
    maskImages,
    addWatermarkInImages,
    changeExtension,
    processRepoFiles
}