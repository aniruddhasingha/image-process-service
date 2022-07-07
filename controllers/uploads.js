const { v4 } = require('uuid');
const Joi = require('joi');
const lo_ = require('lodash');
const sizeOf = require('image-size')
const Files = require('../models/Files');
const commonLib = require("../utils/commonLib");
const fs = require("fs");
const path = require("path");
const archiveFiles = require('../utils/archiver');
const axiosHandler = require('../utils/axiosHandler');
const uploadImages = async (req, res) => {
    let statusCode;
    let result = {};
    let response = {};
    try {
        let schema = Joi.object().keys({});
        const { error, value } = schema.validate(req.body);
        if (error) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            let err = lo_.head(error.details).message;
            throw new Error(err)
        }
        let files = req.files;
        if (!files) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            throw new Error("Files Should Be Present");
        }
        let fileObjArray = [];
        for (let file of files) {
            let dimensions = sizeOf(file.path);
            let newFileObj = {
                filename: file.filename,
                originalname: file.originalname,
                extension: file.extension_type,
                path: file.path,
                dimension: {
                    width: dimensions.width,
                    height: dimensions.height
                }
            }
            fileObjArray.push(newFileObj);
        }
        await Files.create(fileObjArray).then((data) => {
            result.files = data
        })
            .catch((err) => {
                statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST
                throw new Error(err);
            });
        statusCode = process.env.HTTP_RESPONSE_OK
    }
    catch (err) {
        statusCode = statusCode || process.env.HTTP_RESPONSE_SERVER_ERROR;
        response.error = err.message;
    }
    if (!response.error) {
        response.result = result;
    }
    res.status(Number(statusCode)).json(response);
}
const getUploadedImage = async (req, res) => {
    let statusCode;
    let result = {};
    let response = {};
    try {
        let schema = Joi.object().keys({
            _id: Joi.string().required()
        });
        const { error, value } = schema.validate(req.params);
        if (error) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            let err = lo_.head(error.details).message;
            throw new Error(err)
        }
        let postData = Object.assign({}, value);
        let imageDetails;
        await Files.findById(postData._id).then((data) => {
            if (data.length < 1) {
                statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST
                throw new Error("Image Could Not Be Found");
            }
            imageDetails = data;
        })
            .catch((err) => {
                statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST
                throw new Error(err);
            });
        statusCode = process.env.HTTP_RESPONSE_OK
        res.download(imageDetails.path, imageDetails.original_file_name, (err) => {
            if (err) {
                throw new Error(err)
            }
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
const getUploadedImages = async (req, res) => {
    let statusCode;
    let result = {};
    let response = {};
    try {
        let schema = Joi.object().keys({
            multiple_id: Joi.array().items(Joi.string()).required()
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            let err = lo_.head(error.details).message;
            throw new Error(err)
        }
        let postData = Object.assign({}, value);
        let imageDetails;
        await Files.find({ _id: { $in: postData.multiple_id } }).then((data) => {
            if (data.length < 1) {
                statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST
                throw new Error("Image Could Not Be Found");
            }
            imageDetails = data;
        })
            .catch((err) => {
                statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST
                throw new Error(err);
            });
        const arciveFilePath = archiveFiles(imageDetails);
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
const listAllImagesInRepo = async (req, res) => {
    let statusCode;
    let result = {};
    let response = {};
    try {
        let schema = Joi.object().keys({
            page_size: Joi.number().allow('').default(1),
            page_no: Joi.number().allow('').default(10)
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            let err = lo_.head(error.details).message;
            throw new Error(err)
        }
        let postData = Object.assign({}, value);
        const skip = (postData.page_no - 1) * postData.page_size; // assuming pageNo starts from 1
        const limit = postData.page_size;

        const [listResult, countResult] = await Promise.all([
            Files.find().skip(skip).limit(limit),
            Files.collection.count({})
        ])
        statusCode = process.env.HTTP_RESPONSE_OK
        result = {
            totalCount: countResult,
            list: listResult,
        }
    }
    catch (err) {
        statusCode = statusCode || process.env.HTTP_RESPONSE_SERVER_ERROR;
        response.error = err.message;
    }
    if (!response.error) {
        response.result = result;
    }
    res.status(Number(statusCode)).json(response);
}
const uploadImagesFromUrl = async (req, res) => {
    let statusCode;
    let result = {};
    let response = {};
    try {
        let schema = Joi.object().keys({
            urls: Joi.array().items(Joi.string()).required()
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            let err = lo_.head(error.details).message;
            throw new Error(err)
        }
        let postData = Object.assign({}, value);
        let fileObjArray = [];
        await Promise.all(
            postData.urls.map(async url => {
                let fileBuffer = await axiosHandler.getImageBuffer(url);
                let fileMetaData = await commonLib.getMetaData(fileBuffer);
                let fileName = `${v4()}.${fileMetaData.format}`;
                let filepath = `${process.env.TEMP_FILE_UPLOAD_FOLDER}/${fileName}`;
                await commonLib.writeFileFromUrl(fileBuffer,filepath);
                let newFileObj = {
                    filename: fileName,
                    originalname: fileName,
                    extension: fileMetaData.format,
                    path: filepath,
                    dimension: {
                        width: fileMetaData.width,
                        height: fileMetaData.height
                    }
                }
                fileObjArray.push(newFileObj);
            }));
        await Files.create(fileObjArray).then((data) => {
            result.files = data
        })
            .catch((err) => {
                statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST
                throw new Error(err);
            });
        statusCode = process.env.HTTP_RESPONSE_OK
    }
    catch (err) {
        statusCode = statusCode || process.env.HTTP_RESPONSE_SERVER_ERROR;
        response.error = err.message;
    }
    if (!response.error) {
        response.result = result;
    }
    res.status(Number(statusCode)).json(response);
}
module.exports = { uploadImages, getUploadedImage, getUploadedImages, listAllImagesInRepo, uploadImagesFromUrl }