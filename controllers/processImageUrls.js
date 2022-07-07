const Joi = require('joi');
const lo_ = require('lodash');
const sizeOf = require('image-size')
const Files = require('../models/Files');
const commonLib = require("../utils/commonLib");
const fs = require("fs");
const path = require("path");
const archiveFiles = require('../utils/archiver');
const axiosHandler = require('../utils/axiosHandler')
const processUrlFiles = async (req, res, next) => {
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
                then: Joi.string().valid('left', 'right', 'upsidedown').required(),
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
            urls: Joi.array().items(Joi.string()).required(),
        });
        const { error, value } = schema.validate(req.body);
        if (error) {
            statusCode = process.env.HTTP_RESPONSE_BAD_REQUEST;
            let err = lo_.head(error.details).message;
            throw new Error(err)
        }
        let postData = Object.assign({}, value);
        let toZipFilesArray = [];
        await Promise.all(
            postData.urls.map(async url => {
                let fileBuffer = await axiosHandler.getImageBuffer(url);
                let fileMetaData = await commonLib.getMetaData(fileBuffer);
                let newFile = {};
                if (postData.process_type === 'resize') {
                    newFile = await commonLib.getResizedUrlFile(fileBuffer,postData,fileMetaData);
                }
                else if (postData.process_type === 'compress') {
                    newFile = await commonLib.getCompressedUrlFile(fileBuffer,postData,fileMetaData);
                }
                else if (postData.process_type === 'tumbnail') {
                    newFile = await commonLib.getThumbnailUrlFile(fileBuffer,fileMetaData);
                }
                else if (postData.process_type === 'rotate') {
                    newFile = await commonLib.getRotatedUrlFile(fileBuffer,postData,fileMetaData);
                }
                else if (postData.process_type === 'water_mark') {
                    newFile = await commonLib.getWaterMarkedUrlFile(fileBuffer, postData,fileMetaData);
                }
                else if (postData.process_type === 'masking') {
                    newFile = await commonLib.getMaskedUrlFile(fileBuffer,postData,fileMetaData);
                }
                else {
                    newFile = await commonLib.getUpdatedExtensionUrlFile(fileBuffer,postData);
                }
                toZipFilesArray.push(newFile);
            }));
        const arciveFilePath = archiveFiles(toZipFilesArray);
        if(arciveFilePath){
            statusCode = process.env.HTTP_RESPONSE_OK
            res.download(arciveFilePath.zipFilePath, arciveFilePath.zipfilename, (err) => {
                if (err) {
                    throw new Error(err)
                }
                fs.unlink(arciveFilePath.zipFilePath, function () {
                    console.log("File was deleted") // Callback
                });
            });
        }
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


module.exports ={
    processUrlFiles
}